// ============================================
// KitchenAlerts — shared live-order watcher:
// polling + new-order sound + browser notification
// ============================================
const KitchenAlerts = {
    timers: {},       // viewKey → interval id
    maxSeenId: {},    // viewKey → highest order id already seen
    POLL_MS: 15000,

    isSoundOn() {
        return localStorage.getItem('kitchen_sound') !== 'off';
    },
    soundLabel() {
        return this.isSoundOn() ? 'Sound: On' : 'Sound: Off';
    },
    soundIcon() {
        return this.isSoundOn() ? Icons.soundOn : Icons.soundOff;
    },
    setSound(on) {
        localStorage.setItem('kitchen_sound', on ? 'on' : 'off');
        document.querySelectorAll('.sound-toggle-btn').forEach(b => {
            b.innerHTML = `${this.soundIcon()} ${this.soundLabel()}`;
        });
    },

    async enableNotifications() {
        if (!('Notification' in window)) {
            toast('Browser notifications are not supported here.', 'error');
            return false;
        }
        if (Notification.permission === 'granted') return true;
        const perm = await Notification.requestPermission();
        return perm === 'granted';
    },

    // Two-tone chime via WebAudio — no audio file needed
    beep() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            if (!this._ctx) this._ctx = new Ctx();
            const ctx = this._ctx;
            if (ctx.state === 'suspended') ctx.resume();
            [523.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const t = ctx.currentTime + i * 0.22;
                gain.gain.setValueAtTime(0.001, t);
                gain.gain.exponentialRampToValueAtTime(0.4, t + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                osc.connect(gain).connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.25);
            });
        } catch { /* audio blocked — skip silently */ }
    },

    notify(order) {
        try {
            if (('Notification' in window) && Notification.permission === 'granted' && document.hidden) {
                const items = Array.isArray(order.items) ? order.items.map(i => `${i.name} × ${i.quantity}`).join(', ') : '';
                new Notification(`New order #${order.id} — $${parseFloat(order.total).toFixed(2)}`, {
                    body: `${order.customer_name} • ${items}`.slice(0, 200),
                    tag: 'order-' + order.id
                });
            }
        } catch { /* ignore */ }
    },

    // fetchFn must resolve to an orders array. onFresh(orders, newOrders) re-renders.
    start(viewKey, fetchFn, onFresh) {
        this.stop(viewKey);
        this.timers[viewKey] = setInterval(async () => {
            if (document.hidden) return;
            const section = viewKey === 'admin'
                ? document.getElementById('adminDashboard')
                : document.getElementById('staffDashboard');
            if (!section || section.classList.contains('hidden')) return;
            try {
                const orders = await fetchFn();
                const prevMax = this.maxSeenId[viewKey] || 0;
                const fresh = orders.filter(o => o.id > prevMax);
                if (orders.length) {
                    this.maxSeenId[viewKey] = Math.max(prevMax, ...orders.map(o => o.id));
                }
                if (fresh.length && prevMax > 0) {
                    if (this.isSoundOn()) this.beep();
                    fresh.forEach(o => this.notify(o));
                    onFresh(orders, fresh.map(o => o.id));
                } else if (fresh.length || orders.length !== undefined) {
                    onFresh(orders, []);
                }
            } catch { /* keep old list on poll failure */ }
        }, this.POLL_MS);
    },

    stop(viewKey) {
        if (this.timers[viewKey]) {
            clearInterval(this.timers[viewKey]);
            delete this.timers[viewKey];
        }
    },

    // Call after the first load so existing orders don't trigger alerts
    prime(viewKey, orders) {
        this.maxSeenId[viewKey] = orders.length ? Math.max(...orders.map(o => o.id)) : 0;
    },

    liveControlsHtml() {
        return `
            <div class="dash-live-controls">
                <span class="live-dot" title="Auto-refreshing every 15s"></span><span class="live-label">Live</span>
                <button class="btn btn-sm btn-secondary sound-toggle-btn" onclick="KitchenAlerts.setSound(!KitchenAlerts.isSoundOn())">${this.soundIcon()} ${this.soundLabel()}</button>
                <button class="btn btn-sm btn-secondary" onclick="KitchenAlerts.enableNotifications().then(ok => { if (ok) toast('Notifications enabled.'); })">${Icons.bell} Notify</button>
            </div>
        `;
    }
};

// ============================================
// KitchenFlow — shared order-status workflow + assignment
// (staff.js loads before admin.js, so both dashboards use this)
// ============================================
const KitchenFlow = {
    ORDER: ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered'],
    NEXT: {
        pending: { to: 'confirmed', cls: 'btn-confirm' },
        confirmed: { to: 'preparing', cls: 'btn-confirm' },
        preparing: { to: 'ready', cls: 'btn-confirm' },
        ready: { to: 'on_way', cls: 'btn-deliver' },
        on_way: { to: 'delivered', cls: 'btn-deliver' }
    },
    staffCache: null,

    label(status) {
        const key = 'st_' + status;
        const v = I18n.t(key);
        return v === key ? status : v;
    },

    async ensureStaff() {
        if (this.staffCache) return this.staffCache;
        try {
            const res = await Auth.authFetch('/api/staff/names');
            const data = await res.json();
            this.staffCache = data.success ? data.data : [];
        } catch {
            this.staffCache = [];
        }
        return this.staffCache;
    },

    assignSelectHtml(order, view) {
        const list = this.staffCache || [];
        if (!list.length) {
            return order.assigned_name ? `<p><strong>${I18n.t('assigned_label')}:</strong> ${escAttr(order.assigned_name)}</p>` : '';
        }
        const opts = [`<option value="">${I18n.t('unassigned')}</option>`].concat(
            list.map(s => `<option value="${s.id}" ${order.assigned_to === s.id ? 'selected' : ''}>${escAttr(s.full_name || s.username)}</option>`)
        ).join('');
        return `<label class="assign-wrap">${I18n.t('assigned_label')}:
            <select class="assign-select" onchange="KitchenFlow.assign(${order.id}, this.value, '${view}')">
                ${opts}
            </select>
        </label>`;
    },

    async assign(orderId, staffId, view) {
        try {
            const res = await Auth.authFetch(`/api/orders/${orderId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId === '' ? null : parseInt(staffId) })
            });
            const data = await res.json();
            if (data.success) {
                toast('Order assigned.');
                if (view === 'admin') AdminDashboard.loadOrders();
                else StaffDashboard.refresh(false);
            } else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') toast('Failed to assign order.', 'error');
        }
    },

    nextButtonHtml(order, view) {
        if (order.status === 'delivered') {
            return `<span class="delivered-label">${Icons.checkCircle} ${this.label('delivered')}</span>`;
        }
        const next = this.NEXT[order.status];
        if (!next) return '';
        const fn = view === 'admin' ? 'AdminDashboard.updateOrderStatus' : 'StaffDashboard.updateStatus';
        return `<button class="btn btn-sm ${next.cls}" onclick="${fn}(${order.id}, '${next.to}')">${Icons.check} → ${this.label(next.to)}</button>`;
    }
};

// ============================================
// Staff Dashboard — order management with filtering + live kitchen alerts
// ============================================
const StaffDashboard = {
    allOrders: [],
    currentFilter: 'all',

    async render() {
        KitchenAlerts.stop('staff');
        const container = document.getElementById('staffDashboardContent');

        // Build the dashboard shell: header + live controls + filter bar + orders list
        container.innerHTML = `
            <div class="dash-header">
                <div>
                    <h3>Welcome, ${Auth.getName()}</h3>
                    <p class="dash-subtitle">Manage incoming orders</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="Auth.logout()">Logout</button>
            </div>
            ${KitchenAlerts.liveControlsHtml()}
            <div class="dash-filters">
                <button class="filter-btn active" data-filter="all" onclick="StaffDashboard.setFilter('all')">All</button>
                <button class="filter-btn" data-filter="pending" onclick="StaffDashboard.setFilter('pending')">${KitchenFlow.label('pending')}</button>
                <button class="filter-btn" data-filter="confirmed" onclick="StaffDashboard.setFilter('confirmed')">✓ ${KitchenFlow.label('confirmed')}</button>
                <button class="filter-btn" data-filter="preparing" onclick="StaffDashboard.setFilter('preparing')">${KitchenFlow.label('preparing')}</button>
                <button class="filter-btn" data-filter="ready" onclick="StaffDashboard.setFilter('ready')">${KitchenFlow.label('ready')}</button>
                <button class="filter-btn" data-filter="on_way" onclick="StaffDashboard.setFilter('on_way')">${KitchenFlow.label('on_way')}</button>
                <button class="filter-btn" data-filter="delivered" onclick="StaffDashboard.setFilter('delivered')">${KitchenFlow.label('delivered')}</button>
            </div>
            <div id="staffOrdersList" class="orders-list"><p class="loading-text">Loading orders...</p></div>
        `;
        await KitchenFlow.ensureStaff();
        await this.refresh(false);
        // Live polling: auto-refresh + chime on new orders
        KitchenAlerts.start('staff',
            async () => {
                const res = await Auth.authFetch('/api/orders');
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                return data.data;
            },
            (orders, newIds) => {
                this.allOrders = orders;
                this.renderOrders(newIds);
            }
        );
    },

    async refresh(alertNew = true) {
        try {
            const res = await Auth.authFetch('/api/orders');
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            const prevMax = KitchenAlerts.maxSeenId['staff'] || 0;
            this.allOrders = data.data;
            KitchenAlerts.prime('staff', this.allOrders);
            const newIds = alertNew && prevMax > 0
                ? this.allOrders.filter(o => o.id > prevMax).map(o => o.id)
                : [];
            this.renderOrders(newIds);
        } catch (err) {
            document.getElementById('staffOrdersList').innerHTML =
                '<p class="empty-text">Failed to load orders.</p>';
        }
    },

    setFilter(filter) {
        this.currentFilter = filter;
        // Update filter button active state
        document.querySelectorAll('.dash-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderOrders();
    },

    renderOrders(newIds = []) {
        const list = document.getElementById('staffOrdersList');
        if (!list) return;
        let orders = this.allOrders;

        if (this.currentFilter !== 'all') {
            orders = orders.filter(o => o.status === this.currentFilter);
        }

        if (!orders.length) {
            list.innerHTML = '<p class="empty-text">No orders found.</p>';
            return;
        }

        list.innerHTML = orders.map(order => {
            const items = Array.isArray(order.items) ? order.items : [];
            const itemsList = items.map(i => {
                const rawOpts = Array.isArray(i.options) ? i.options : [];
                const opts = rawOpts.map(o => escAttr(I18n.pickOptName(o))).join(', ');
                return `${escAttr(i.name)}${opts ? ` (${opts})` : ''} × ${Number(i.quantity) || 0}`;
            }).join(', ');
            const date = new Date(order.created_at).toLocaleString();

            return `
                <div class="order-card ${newIds.includes(order.id) ? 'order-new' : ''}">
                    <div class="order-header">
                        <span class="order-id">#${order.id}</span>
                        <span class="order-date">${date}</span>
                        <span class="status-badge status-${order.status}">${KitchenFlow.label(order.status)}</span>
                        ${newIds.includes(order.id) ? '<span class="new-badge">New</span>' : ''}
                    </div>
                    <div class="order-body">
                        <p><strong>Customer:</strong> ${escAttr(order.customer_name)}</p>
                        <p><strong>Phone:</strong> <button type="button" class="phone-copy" data-phone="${escAttr(order.customer_phone)}" onclick="copyPhone(this.dataset.phone)" title="${escAttr(I18n.t('copy_phone'))}">${Icons.copy} ${escAttr(order.customer_phone)}</button></p>
                        <p><strong>Address:</strong> ${escAttr(order.customer_address)}</p>
                        ${order.zone_name ? `<p><strong>${I18n.t('zone_label')}:</strong> ${escAttr(order.zone_name)}</p>` : ''}
                        <p><strong>Items:</strong> ${itemsList || 'N/A'}</p>
                        ${order.subtotal != null && Number(order.delivery_fee) > 0 ? `<p><strong>${I18n.t('subtotal')}:</strong> $${parseFloat(order.subtotal).toFixed(2)} + <strong>${I18n.t('delivery_fee')}:</strong> $${parseFloat(order.delivery_fee).toFixed(2)}</p>` : ''}
                        <p class="order-total"><strong>${I18n.t('cart_total')}</strong> $${parseFloat(order.total).toFixed(2)}</p>
                        ${KitchenFlow.assignSelectHtml(order, 'staff')}
                    </div>
                    <div class="order-actions">
                        ${this.renderStatusButton(order)}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderStatusButton(order) {
        return KitchenFlow.nextButtonHtml(order, 'staff');
    },

    async updateStatus(id, status) {
        try {
            const res = await Auth.authFetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                toast('Order status updated.');
                this.refresh(false); // silent re-fetch, keeps poller alive
            } else {
                toast('Failed: ' + data.message, 'error');
            }
        } catch (err) {
            toast(err.message || 'Failed to update status.', 'error');
        }
    }
};

// ============================================
// Admin Dashboard — sidebar: Staff, Orders, Menu, Analytics
// ============================================
const AdminDashboard = {
    currentTab: 'staff',
    allOrders: [],
    orderFilter: 'all',
    TAB_KEY: 'admin_tab',

    init() {
        document.querySelectorAll('.admin-dash-tab').forEach(btn => {
            if (btn.dataset.wired) return;
            btn.dataset.wired = '1';
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            // Keep an accessible name/tooltip when mobile shows icons only
            const label = btn.textContent.trim();
            if (label) {
                btn.title = label;
                btn.setAttribute('aria-label', label);
            }
        });
        const burger = document.getElementById('adminHamburger');
        if (burger && !burger.dataset.wired) {
            burger.dataset.wired = '1';
            burger.addEventListener('click', () => this.toggleSidebar());
            document.getElementById('adminOverlay').addEventListener('click', () => this.closeSidebar());
        }
    },

    isMobileSidebar() {
        return window.matchMedia('(max-width: 900px)').matches;
    },

    toggleSidebar() {
        if (this.isMobileSidebar()) {
            document.getElementById('adminSidebar').classList.toggle('open');
            document.getElementById('adminOverlay').classList.toggle('active');
            document.getElementById('adminHamburger').classList.toggle('active');
        } else {
            // Desktop: collapse the sidebar into the hamburger
            document.querySelector('.admin-layout').classList.toggle('collapsed');
            document.body.classList.toggle('admin-nav-collapsed');
        }
    },

    closeSidebar() {
        document.getElementById('adminSidebar').classList.remove('open');
        document.getElementById('adminOverlay').classList.remove('active');
        document.getElementById('adminHamburger').classList.remove('active');
    },

    switchTab(tab) {
        this.currentTab = tab;
        try { localStorage.setItem(this.TAB_KEY, tab); } catch { /* private mode — tab just won't persist */ }
        document.querySelectorAll('.admin-dash-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-dash-panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`.admin-sidebar [data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`adminPanel-${tab}`).classList.add('active');
        // Auto-close the drawer on small screens
        if (window.matchMedia('(max-width: 900px)').matches) this.closeSidebar();

        if (tab === 'staff') this.loadStaff();
        else if (tab === 'orders') this.loadOrders();
        else if (tab === 'menu') this.loadMenuItems();
        else if (tab === 'analytics') this.loadAnalytics();
        else if (tab === 'reviews') this.loadReviews();
        else if (tab === 'zones') this.loadZones();
        else if (tab === 'account') this.loadAccount();
    },

    async render() {
        // Inject dashboard header if not already present
        const headerEl = document.querySelector('#adminDashboard .dash-header');
        if (!headerEl) {
            const dashHeader = document.createElement('div');
            dashHeader.className = 'dash-header';
            dashHeader.innerHTML = `
                <div>
                    <h3>Welcome, ${Auth.getName()}</h3>
                    <p class="dash-subtitle">Full system control</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="Auth.logout()">Logout</button>
            `;
            const container = document.querySelector('#adminDashboard .container');
            container.insertBefore(dashHeader, container.querySelector('.admin-dash-head'));
        }

        this.init();
        // Stay on the same tab after refresh / language switch
        try {
            const saved = localStorage.getItem(this.TAB_KEY);
            if (saved && document.getElementById(`adminPanel-${saved}`)) {
                this.currentTab = saved;
            }
        } catch { /* ignore — fall back to default tab */ }
        this.switchTab(this.currentTab);
    },

    // ---- Staff Tab ----
    async loadStaff() {
        const container = document.getElementById('adminPanel-staff');
        try {
            const res = await Auth.authFetch('/api/staff');
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.staffList = data.data;
            this.renderStaffList(container, data.data);
        } catch {
            container.querySelector('.staff-list').innerHTML = '<p class="empty-text">Failed to load staff.</p>';
        }
    },

    renderStaffList(container, staffList) {
        const list = container.querySelector('.staff-list');
        list.innerHTML = staffList.map(s => `
            <div class="staff-row">
                <div class="staff-info">
                    <strong>${s.username}</strong>
                    <span>${s.full_name}</span>
                    <span class="staff-email">${s.email || 'no email'}</span>
                    <span class="status-badge status-${s.role === 'admin' ? 'confirmed' : 'pending'}">${s.role}</span>
                </div>
                <div class="staff-row-actions">
                    <button class="btn btn-sm btn-secondary" onclick="AdminDashboard.openEditStaff(${s.id})">${Icons.pencil} Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="AdminDashboard.deleteStaff(${s.id}, '${s.username}')">${Icons.trash} Delete</button>
                </div>
            </div>
        `).join('');
    },

    async createStaff(e) {
        e.preventDefault();
        hideFormMsg('staffFormError');
        const form = e.target;
        const body = {
            username: form.username.value.trim(),
            email: form.email.value.trim(),
            password: form.password.value,
            full_name: form.full_name.value.trim(),
            role: form.role.value
        };
        if (!body.username || !body.email || !body.password || !body.full_name) {
            showFormMsg('staffFormError', 'All fields are required.');
            return;
        }
        try {
            const res = await Auth.authFetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                form.reset();
                toast('Staff account created.');
                this.loadStaff();
            } else {
                showFormMsg('staffFormError', 'Failed: ' + data.message);
            }
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                showFormMsg('staffFormError', 'Failed to create staff account.');
            }
        }
    },

    async deleteStaff(id, username) {
        const ok = await askConfirm(`Delete staff account "${username}"?`);
        if (!ok) return;
        try {
            const res = await Auth.authFetch(`/api/staff/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                toast('Staff account deleted.');
                this.loadStaff();
            } else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                toast('Failed to delete staff account.', 'error');
            }
        }
    },

    openEditStaff(id) {
        const s = (this.staffList || []).find(x => x.id === id);
        if (!s) return;
        document.getElementById('editStaffId').value = s.id;
        document.getElementById('editStaffUsername').value = s.username;
        document.getElementById('editStaffEmail').value = s.email || '';
        document.getElementById('editStaffFullName').value = s.full_name;
        document.getElementById('editStaffRole').value = s.role;
        document.getElementById('editStaffPassword').value = '';
        document.getElementById('editStaffModal').classList.add('active');
    },

    hideEditStaff() {
        document.getElementById('editStaffModal').classList.remove('active');
    },

    async saveEditStaff(e) {
        e.preventDefault();
        hideFormMsg('editStaffError');
        const id = document.getElementById('editStaffId').value;
        const body = {
            username: document.getElementById('editStaffUsername').value.trim(),
            email: document.getElementById('editStaffEmail').value.trim(),
            full_name: document.getElementById('editStaffFullName').value.trim(),
            role: document.getElementById('editStaffRole').value,
            password: document.getElementById('editStaffPassword').value
        };
        if (!body.password) delete body.password;
        try {
            const res = await Auth.authFetch(`/api/staff/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                this.hideEditStaff();
                toast('Account updated.');
                this.loadStaff();
            } else {
                showFormMsg('editStaffError', 'Failed: ' + data.message);
            }
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                showFormMsg('editStaffError', 'Failed to update account.');
            }
        }
    },

    // ---- My Account Tab ----
    async loadAccount() {
        try {
            const me = await Auth.fetchMe();
            if (!me) {
                Auth.logout();
                return;
            }
            document.getElementById('profileUsername').value = me.username || '';
            document.getElementById('profileEmail').value = me.email || '';
            document.getElementById('profileFullName').value = me.full_name || '';
        } catch {
            // fields stay empty — user can still type
        }
    },

    async saveProfile(e) {
        e.preventDefault();
        hideFormMsg('profileMsg');
        const body = {
            username: document.getElementById('profileUsername').value.trim(),
            email: document.getElementById('profileEmail').value.trim(),
            full_name: document.getElementById('profileFullName').value.trim()
        };
        try {
            const res = await Auth.authFetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem(Auth.NAME_KEY, body.full_name || body.username);
                Auth.renderFooterAuth();
                showFormMsg('profileMsg', data.message || 'Profile updated.', 'success');
            } else {
                showFormMsg('profileMsg', 'Failed: ' + data.message);
            }
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                showFormMsg('profileMsg', 'Failed to update profile.');
            }
        }
    },

    async changeOwnPassword(e) {
        e.preventDefault();
        hideFormMsg('passMsg');
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirm = document.getElementById('newPasswordConfirm').value;
        if (newPassword !== confirm) {
            showFormMsg('passMsg', 'New passwords do not match.');
            return;
        }
        try {
            const res = await Auth.authFetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                e.target.reset();
                showFormMsg('passMsg', data.message || 'Password changed.', 'success');
            } else {
                showFormMsg('passMsg', 'Failed: ' + data.message);
            }
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                showFormMsg('passMsg', 'Failed to change password.');
            }
        }
    },

    // ---- Orders Tab ----
    async loadOrders() {
        KitchenAlerts.stop('admin');
        const container = document.getElementById('adminPanel-orders');
        await KitchenFlow.ensureStaff();

        // Build filter bar if not present
        if (!container.querySelector('.admin-orders-filters')) {
            const filterBar = document.createElement('div');
            filterBar.className = 'admin-orders-filters dash-filters';
            filterBar.innerHTML = `
                <button class="filter-btn active" data-filter="all" onclick="AdminDashboard.setOrderFilter('all')">All</button>
                <button class="filter-btn" data-filter="pending" onclick="AdminDashboard.setOrderFilter('pending')">${KitchenFlow.label('pending')}</button>
                <button class="filter-btn" data-filter="confirmed" onclick="AdminDashboard.setOrderFilter('confirmed')">✓ ${KitchenFlow.label('confirmed')}</button>
                <button class="filter-btn" data-filter="preparing" onclick="AdminDashboard.setOrderFilter('preparing')">${KitchenFlow.label('preparing')}</button>
                <button class="filter-btn" data-filter="ready" onclick="AdminDashboard.setOrderFilter('ready')">${KitchenFlow.label('ready')}</button>
                <button class="filter-btn" data-filter="on_way" onclick="AdminDashboard.setOrderFilter('on_way')">${KitchenFlow.label('on_way')}</button>
                <button class="filter-btn" data-filter="delivered" onclick="AdminDashboard.setOrderFilter('delivered')">${KitchenFlow.label('delivered')}</button>
            `;
            container.insertBefore(filterBar, container.querySelector('.orders-list'));
        }

        // Live controls (sound toggle + notifications) above the filter bar
        if (!container.querySelector('.dash-live-controls')) {
            const live = document.createElement('div');
            live.innerHTML = KitchenAlerts.liveControlsHtml();
            container.insertBefore(live.firstElementChild, container.firstChild);
        }

        try {
            const res = await Auth.authFetch('/api/orders');
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.allOrders = data.data;
            KitchenAlerts.prime('admin', this.allOrders);
            this.renderAdminOrders();
            KitchenAlerts.start('admin',
                async () => {
                    const r = await Auth.authFetch('/api/orders');
                    const d = await r.json();
                    if (!d.success) throw new Error(d.message);
                    return d.data;
                },
                (orders, newIds) => {
                    this.allOrders = orders;
                    this.renderAdminOrders(newIds);
                }
            );
        } catch {
            container.querySelector('.orders-list').innerHTML = '<p class="empty-text">Failed to load orders.</p>';
        }
    },

    setOrderFilter(filter) {
        this.orderFilter = filter;
        document.querySelectorAll('#adminPanel-orders .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderAdminOrders();
    },

    renderAdminOrders(newIds = []) {
        const container = document.getElementById('adminPanel-orders');
        const list = container.querySelector('.orders-list');
        let orders = this.allOrders;

        if (this.orderFilter !== 'all') {
            orders = orders.filter(o => o.status === this.orderFilter);
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
                        ${KitchenFlow.assignSelectHtml(order, 'admin')}
                    </div>
                    <div class="order-actions">
                        ${this.renderOrderActions(order)}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderOrderActions(order) {
        return KitchenFlow.nextButtonHtml(order, 'admin');
    },

    async updateOrderStatus(id, status) {
        try {
            const res = await Auth.authFetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                toast('Order status updated.');
                this.loadOrders();
            } else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                toast('Failed to update status.', 'error');
            }
        }
    },

    // ---- Analytics Tab ----
    analyticsDays: 14,

    async loadAnalytics() {
        const container = document.getElementById('analyticsContent');
        container.innerHTML = '<p class="loading-text">Loading analytics...</p>';
        try {
            const res = await Auth.authFetch(`/api/analytics?days=${this.analyticsDays}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.renderAnalytics(container, data.data);
        } catch (err) {
            if (err.message === 'Session expired. Please log in again.') return;
            container.innerHTML = '<p class="empty-text">Failed to load analytics.</p>';
        }
    },

    setAnalyticsDays(days) {
        this.analyticsDays = days;
        this.loadAnalytics();
    },

    deltaHtml(cur, prev) {
        if (!prev) return cur > 0 ? '<span class="delta delta-up">▲ new</span>' : '<span class="delta">—</span>';
        const pct = Math.round(((cur - prev) / prev) * 100);
        if (pct === 0) return '<span class="delta">— 0%</span>';
        const cls = pct > 0 ? 'delta-up' : 'delta-down';
        const arrow = pct > 0 ? '▲' : '▼';
        return `<span class="delta ${cls}">${arrow} ${Math.abs(pct)}%</span>`;
    },

    // SVG bar chart: daily revenue, with gridlines + hover values
    revenueChart(days) {
        const W = 640, H = 260, PL = 52, PB = 34, PT = 12;
        const plotW = W - PL - 12, plotH = H - PT - PB;
        const max = Math.max(1, ...days.map(d => Number(d.revenue)));
        const step = plotW / days.length;
        const bw = Math.min(38, step * 0.58);
        const grid = [0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = PT + plotH - f * plotH;
            return `<line x1="${PL}" y1="${y}" x2="${W - 12}" y2="${y}" class="chart-grid"/>
                <text x="${PL - 6}" y="${y + 4}" class="chart-axis" text-anchor="end">$${Math.round(max * f)}</text>`;
        }).join('');
        const skip = Math.ceil(days.length / 8);
        const bars = days.map((d, i) => {
            const h = (Number(d.revenue) / max) * plotH;
            const x = PL + i * step + (step - bw) / 2;
            const y = PT + plotH - h;
            const label = new Date(d.day + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const value = Number(d.revenue) > 0
                ? `<text x="${(x + bw / 2).toFixed(1)}" y="${Math.max(y - 5, PT).toFixed(1)}" class="chart-bar-value" text-anchor="middle">$${Number(d.revenue).toFixed(0)}</text>` : '';
            return `${value}<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="4" class="chart-bar">
                    <title>${label}: $${Number(d.revenue).toFixed(2)} (${d.orders} orders, ${d.delivered} delivered)</title>
                </rect>
                ${i % skip === 0 ? `<text x="${(PL + i * step + step / 2).toFixed(1)}" y="${H - 10}" class="chart-axis" text-anchor="middle">${label}</text>` : ''}`;
        }).join('');
        return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Daily revenue chart">
            <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#e74c3c"/><stop offset="1" stop-color="#e67e22"/>
            </linearGradient></defs>${grid}${bars}</svg>`;
    },

    // SVG line chart: orders per day (solid) + delivered per day (dashed)
    ordersChart(days) {
        const W = 640, H = 240, PL = 34, PB = 34, PT = 14;
        const plotW = W - PL - 12, plotH = H - PT - PB;
        const max = Math.max(2, ...days.map(d => Number(d.orders)));
        const x = i => PL + (days.length === 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
        const y = v => PT + plotH - (Number(v) / max) * plotH;
        const line = key => days.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
        const area = `${line('orders')} L${x(days.length - 1).toFixed(1)},${(PT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PT + plotH).toFixed(1)} Z`;
        const grid = [0, 0.5, 1].map(f => {
            const gy = PT + plotH - f * plotH;
            return `<line x1="${PL}" y1="${gy}" x2="${W - 12}" y2="${gy}" class="chart-grid"/>
                <text x="${PL - 6}" y="${gy + 4}" class="chart-axis" text-anchor="end">${Math.round(max * f)}</text>`;
        }).join('');
        const skip = Math.ceil(days.length / 8);
        const labels = days.map((d, i) => {
            if (i % skip !== 0) return '';
            const label = new Date(d.day + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return `<text x="${x(i).toFixed(1)}" y="${H - 10}" class="chart-axis" text-anchor="middle">${label}</text>`;
        }).join('');
        const dots = days.map((d, i) => {
            const label = new Date(d.day + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const del = Number(d.delivered) > 0
                ? `<circle cx="${x(i).toFixed(1)}" cy="${y(d.delivered).toFixed(1)}" r="4" class="chart-dot-delivered">
                    <title>${label}: ${d.delivered} delivered</title></circle>` : '';
            return `<circle cx="${x(i).toFixed(1)}" cy="${y(d.orders).toFixed(1)}" r="3.5" class="chart-dot">
                <title>${label}: ${d.orders} orders, ${d.delivered} delivered</title></circle>${del}`;
        }).join('');
        return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Daily orders chart">
            ${grid}<path d="${area}" class="chart-area"/><path d="${line('delivered')}" class="chart-line-delivered-bg"/><path d="${line('orders')}" class="chart-line"/>
            <path d="${line('delivered')}" class="chart-line-delivered"/>${dots}${labels}</svg>
            <div class="chart-legend">
                <span><i class="legend-swatch legend-orders"></i>Orders</span>
                <span><i class="legend-swatch legend-delivered"></i>Delivered</span>
            </div>`;
    },

    renderAnalytics(container, a) {
        const t = a.totals || {};
        const days = a.byDay || [];
        const prev = a.prev || { orders: 0, revenue: 0 };
        const winRev = days.reduce((s, d) => s + Number(d.revenue), 0);
        const winOrders = days.reduce((s, d) => s + Number(d.orders), 0);
        const winDelivered = days.reduce((s, d) => s + Number(d.delivered), 0);
        const statusMap = {};
        (a.byStatus || []).forEach(s => { statusMap[s.status] = s; });
        const maxTopQty = Math.max(1, ...(a.topItems || []).map(i => i.qty));
        const rangeBtn = n => `<button class="filter-btn ${this.analyticsDays === n ? 'active' : ''}" onclick="AdminDashboard.setAnalyticsDays(${n})">Last ${n} days</button>`;

        const statusBars = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered'].map(s => {
            const row = statusMap[s] || { count: 0, revenue: 0 };
            return `
                <div class="chart-row">
                    <span class="chart-label"><span class="status-badge status-${s}">${KitchenFlow.label(s)}</span></span>
                    <div class="chart-track"><div class="chart-fill" style="width:${t.orders ? Math.round((row.count / t.orders) * 100) : 0}%"></div></div>
                    <span class="chart-value">${row.count} orders</span>
                </div>`;
        }).join('');

        const topRows = (a.topItems || []).map((i, idx) => `
            <div class="chart-row">
                <span class="chart-label">#${idx + 1} ${i.name}</span>
                <div class="chart-track"><div class="chart-fill" style="width:${Math.round((i.qty / maxTopQty) * 100)}%"></div></div>
                <span class="chart-value">× ${i.qty} — $${Number(i.revenue).toFixed(2)}</span>
            </div>`).join('') || '<p class="empty-text">No item sales yet.</p>';

        container.innerHTML = `
            <div class="analytics-range">${rangeBtn(7)}${rangeBtn(14)}${rangeBtn(30)}</div>
            <div class="stats-grid">
                <div class="stat-card"><span class="stat-value">$${Number(t.revenue).toFixed(2)}</span><span class="stat-label">Total Revenue (all time)</span></div>
                <div class="stat-card"><span class="stat-value">$${Number(t.deliveredRevenue || 0).toFixed(2)}</span><span class="stat-label">Delivered Revenue</span></div>
                <div class="stat-card"><span class="stat-value">${t.orders || 0}</span>
                    <span class="stat-label">Total Orders ${this.deltaHtml(winOrders, Number(prev.orders))}</span></div>
                <div class="stat-card"><span class="stat-value">$${Number(t.avgOrder).toFixed(2)}</span><span class="stat-label">Avg. Order</span></div>
                <div class="stat-card"><span class="stat-value">${t.deliveredOrders || 0}</span><span class="stat-label">Delivered (kept forever)</span></div>
                <div class="stat-card"><span class="stat-value">$${winRev.toFixed(2)}</span>
                    <span class="stat-label">Last ${a.days} days ${this.deltaHtml(winRev, Number(prev.revenue))}</span></div>
            </div>
            <p class="analytics-note">Delivered orders are never deleted — every comparison below is built from the full stored history.</p>
            <div class="analytics-grid charts-2col">
                <div class="analytics-card chart-card">
                    <h4>Revenue per day — last ${a.days} days</h4>
                    ${this.revenueChart(days)}
                </div>
                <div class="analytics-card chart-card">
                    <h4>Orders vs delivered per day</h4>
                    ${this.ordersChart(days)}
                </div>
                <div class="analytics-card">
                    <h4>Orders by status (all time)</h4>
                    ${statusBars}
                </div>
                <div class="analytics-card">
                    <h4>Top selling items</h4>
                    ${topRows}
                </div>
            </div>
        `;
    },

    async exportOrdersCSV() {
        try {
            const res = await Auth.authFetch('/api/orders');
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            const rows = [['id', 'date', 'customer', 'phone', 'address', 'zone', 'items', 'subtotal', 'delivery_fee', 'total', 'status']];
            data.data.forEach(o => {
                const items = (Array.isArray(o.items) ? o.items : []).map(i => `${i.name} x${i.quantity}`).join('; ');
                const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
                rows.push([o.id, o.created_at, o.customer_name, o.customer_phone, o.customer_address, o.zone_name || '', items, o.subtotal != null ? o.subtotal : o.total, o.delivery_fee || 0, o.total, o.status].map(esc).join(','));
            });
            const blob = new Blob([rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast('Orders exported.');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                toast('Failed to export orders.', 'error');
            }
        }
    },

    // ---- Menu Tab ----
    async loadMenuItems() {
        try {
            const result = await API.getItems();
            if (result.success) this.renderMenuList(result.data);
        } catch {
            document.getElementById('adminMenuList').innerHTML = '<p class="empty-text">Failed to load items.</p>';
        }
    },

    renderMenuList(items) {
        const container = document.getElementById('adminMenuList');
        if (!items.length) {
            container.innerHTML = '<p class="empty-text">No items yet.</p>';
            return;
        }
        container.innerHTML = items.map(item => {
            const desc = item.description ? `<p class="admin-item-desc">${item.description}</p>` : '';
            return `
            <div class="admin-item">
                <img src="${item.image_url}" alt="${item.name}" class="admin-item-image" onerror="this.src='/images/placeholder.jpg'">
                <div class="admin-item-info">
                    <h4>${item.name}</h4>
                    ${desc}
                    <p>Price: $${parseFloat(item.price).toFixed(2)}</p>
                    <p>Category: ${item.category}</p>
                    <p>Status: ${item.is_available ? 'Available' : 'Not Available'}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-toggle ${!item.is_available ? 'unavailable' : ''}"
                            onclick="AdminDashboard.toggleAvailability(${item.id}, ${!item.is_available})">
                        ${item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="AdminDashboard.openEditItem(${item.id})">${Icons.pencil} ${I18n.t('edit_btn')}</button>
                    <button class="btn-delete" onclick="AdminDashboard.deleteItem(${item.id})">${Icons.trash} Delete</button>
                </div>
            </div>
        `;
        }).join('');
    },

    async handleAddItem(e) {
        e.preventDefault();
        hideFormMsg('itemFormError');
        const form = e.target;
        const formData = new FormData(form);
        try {
            const res = await Auth.authFetch('/api/items', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                form.reset();
                document.getElementById('adminImagePreview').innerHTML = '';
                toast('Menu item added.');
                await MenuDisplay.loadItems();
                this.loadMenuItems();
            } else {
                showFormMsg('itemFormError', 'Failed: ' + result.message);
            }
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                showFormMsg('itemFormError', 'Failed to add item.');
            }
        }
    },

    // ---- Edit item + options ----
    async openEditItem(id) {
        try {
            const res = await fetch(`/api/items/${id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            const item = data.data;
            document.getElementById('editItemId').value = item.id;
            document.getElementById('editItemName').value = item.name;
            document.getElementById('editItemPrice').value = item.price;
            document.getElementById('editItemCategory').value = item.category;
            document.getElementById('editItemDesc').value = item.description || '';
            document.getElementById('editItemImage').value = '';
            hideFormMsg('editItemError');
            const list = document.getElementById('editOptionsList');
            list.innerHTML = '';
            (item.options || []).forEach(o => this.addOptionRow(o));
            document.getElementById('editItemModal').classList.add('active');
        } catch {
            toast('Failed to load item.', 'error');
        }
    },

    hideEditItem() {
        document.getElementById('editItemModal').classList.remove('active');
    },

    addOptionRow(opt = {}) {
        const list = document.getElementById('editOptionsList');
        const wrap = document.createElement('div');
        wrap.className = 'opt-wrap';
        const esc = v => (v || '').replace(/"/g, '&quot;');
        wrap.innerHTML = `
            <div class="opt-row">
                <input type="text" class="opt-group" placeholder="${I18n.t('opt_group')}" value="${esc(opt.group_name)}" />
                <input type="text" class="opt-name" placeholder="${I18n.t('opt_name')}" value="${esc(opt.name)}" />
                <input type="number" class="opt-price" placeholder="+$" step="0.01" min="0" max="9999" value="${opt.price_delta != null ? opt.price_delta : ''}" />
                <select class="opt-type">
                    <option value="multi">${I18n.t('opt_multi')}</option>
                    <option value="single">${I18n.t('opt_single')}</option>
                </select>
                <button type="button" class="btn-lang-toggle" title="FR / AR">Aa</button>
                <button type="button" class="btn-remove opt-del" title="Remove">✕</button>
            </div>
            <div class="opt-row opt-row-i18n hidden">
                <input type="text" class="opt-group-fr" placeholder="${I18n.t('opt_group')} (FR)" value="${esc(opt.group_fr)}" />
                <input type="text" class="opt-group-ar" placeholder="${I18n.t('opt_group')} (AR)" value="${esc(opt.group_ar)}" />
                <input type="text" class="opt-name-fr" placeholder="${I18n.t('opt_name')} (FR)" value="${esc(opt.name_fr)}" />
                <input type="text" class="opt-name-ar" placeholder="${I18n.t('opt_name')} (AR)" value="${esc(opt.name_ar)}" />
            </div>
        `;
        wrap.querySelector('.opt-type').value = opt.choice === 'single' ? 'single' : 'multi';
        wrap.querySelector('.opt-del').addEventListener('click', () => wrap.remove());
        wrap.querySelector('.btn-lang-toggle').addEventListener('click', (e) => {
            wrap.querySelector('.opt-row-i18n').classList.toggle('hidden');
            e.currentTarget.classList.toggle('active');
        });
        list.appendChild(wrap);
    },

    collectOptions() {
        return [...document.querySelectorAll('#editOptionsList .opt-wrap')]
            .map(wrap => ({
                group_name: wrap.querySelector('.opt-group').value.trim() || 'Extras',
                group_fr: wrap.querySelector('.opt-group-fr').value.trim(),
                group_ar: wrap.querySelector('.opt-group-ar').value.trim(),
                name: wrap.querySelector('.opt-name').value.trim(),
                name_fr: wrap.querySelector('.opt-name-fr').value.trim(),
                name_ar: wrap.querySelector('.opt-name-ar').value.trim(),
                price_delta: parseFloat(wrap.querySelector('.opt-price').value) || 0,
                choice: wrap.querySelector('.opt-type').value
            }))
            .filter(o => o.name.length > 0);
    },

    async saveEditItem(e) {
        e.preventDefault();
        hideFormMsg('editItemError');
        const id = document.getElementById('editItemId').value;
        try {
            const formData = new FormData();
            formData.append('name', document.getElementById('editItemName').value.trim());
            formData.append('price', document.getElementById('editItemPrice').value);
            formData.append('category', document.getElementById('editItemCategory').value);
            formData.append('description', document.getElementById('editItemDesc').value.trim());
            const img = document.getElementById('editItemImage').files[0];
            if (img) formData.append('image', img);
            const res = await Auth.authFetch(`/api/items/${id}`, { method: 'PUT', body: formData });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            const res2 = await Auth.authFetch(`/api/items/${id}/options`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options: this.collectOptions() })
            });
            const data2 = await res2.json();
            if (!data2.success) throw new Error(data2.message);
            this.hideEditItem();
            toast('Item updated.');
            await MenuDisplay.loadItems();
            this.loadMenuItems();
        } catch (err) {
            if (err.message === 'Session expired. Please log in again.') return;
            showFormMsg('editItemError', 'Failed: ' + (err.message || 'Update failed.'));
        }
    },

    async toggleAvailability(id, isAvailable) {
        try {
            const res = await Auth.authFetch(`/api/items/${id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_available: isAvailable })
            });
            const result = await res.json();
            if (result.success) {
                toast(isAvailable ? 'Item marked available.' : 'Item marked unavailable.');
                await MenuDisplay.loadItems();
                this.loadMenuItems();
            }
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                toast('Failed to update availability.', 'error');
            }
        }
    },

    async deleteItem(id) {
        const ok = await askConfirm('Delete this menu item?');
        if (!ok) return;
        try {
            const res = await Auth.authFetch(`/api/items/${id}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (result.success) {
                toast('Item deleted.');
                await MenuDisplay.loadItems();
                this.loadMenuItems();
            } else toast('Failed: ' + (result.message || 'Delete failed.'), 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') {
                toast('Failed to delete item.', 'error');
            }
        }
    },

    // ---- Reviews Tab (moderation) ----
    reviewFilter: 'all',

    setReviewFilter(filter) {
        this.reviewFilter = filter;
        document.querySelectorAll('#reviewsFilters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.loadReviews();
    },

    async loadReviews() {
        const list = document.getElementById('reviewsList');
        if (list) list.innerHTML = '<p class="loading-text">Loading reviews...</p>';
        try {
            const q = this.reviewFilter === 'pending' ? '?pending=1' : '';
            const res = await Auth.authFetch(`/api/reviews${q}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.renderReviews(data.data);
        } catch (err) {
            if (err.message === 'Session expired. Please log in again.') return;
            if (list) list.innerHTML = '<p class="empty-text">Failed to load reviews.</p>';
        }
    },

    renderReviews(reviews) {
        const list = document.getElementById('reviewsList');
        if (!list) return;
        if (!reviews.length) {
            list.innerHTML = '<p class="empty-text">No reviews found.</p>';
            return;
        }
        list.innerHTML = reviews.map(r => `
            <div class="staff-row">
                <div class="staff-info">
                    <strong>${escAttr(r.item_name || ('#' + r.item_id))}</strong>
                    <span class="rating-badge">★ ${r.rating}</span>
                    <span>${escAttr(r.rater_name)}</span>
                    ${r.comment ? `<span>${escAttr(r.comment)}</span>` : ''}
                    <span class="status-badge ${r.is_approved ? 'status-delivered' : 'status-pending'}">${r.is_approved ? 'approved' : 'pending'}</span>
                </div>
                <div class="staff-row-actions">
                    <button class="btn btn-sm btn-secondary" onclick="AdminDashboard.moderateReview(${r.id}, ${r.is_approved ? 0 : 1})">${r.is_approved ? I18n.t('hide_btn') : I18n.t('approve_btn')}</button>
                    <button class="btn btn-sm btn-delete" onclick="AdminDashboard.deleteReview(${r.id})">${Icons.trash} Delete</button>
                </div>
            </div>
        `).join('');
    },

    async moderateReview(id, approve) {
        try {
            const res = await Auth.authFetch(`/api/reviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_approved: approve })
            });
            const data = await res.json();
            if (data.success) {
                toast(data.message || 'Updated.');
                this.loadReviews();
                await MenuDisplay.loadItems();
            } else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') toast('Failed to update review.', 'error');
        }
    },

    async deleteReview(id) {
        const ok = await askConfirm('Delete this review?');
        if (!ok) return;
        try {
            const res = await Auth.authFetch(`/api/reviews/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast('Review deleted.');
                this.loadReviews();
                await MenuDisplay.loadItems();
            } else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') toast('Failed to delete review.', 'error');
        }
    },

    // ---- Zones Tab ----
    async loadZones() {
        const list = document.getElementById('zonesList');
        if (list) list.innerHTML = '<p class="loading-text">Loading zones...</p>';
        try {
            const res = await Auth.authFetch('/api/zones?all=1');
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.renderZones(data.data);
        } catch (err) {
            if (err.message === 'Session expired. Please log in again.') return;
            if (list) list.innerHTML = '<p class="empty-text">Failed to load zones.</p>';
        }
    },

    renderZones(zones) {
        const list = document.getElementById('zonesList');
        if (!list) return;
        if (!zones.length) {
            list.innerHTML = '<p class="empty-text">No zones yet.</p>';
            return;
        }
        list.innerHTML = zones.map(z => `
            <div class="staff-row">
                <div class="staff-info">
                    <strong>${escAttr(z.name)}</strong>
                    <span>${I18n.t('z_fee_label')}: $${Number(z.fee).toFixed(2)}</span>
                    <span>${z.free_over != null ? I18n.t('free_over') + ' $' + Number(z.free_over).toFixed(2) : I18n.t('z_no_free')}</span>
                    <span>${z.eta_min ? '~' + z.eta_min + ' ' + I18n.t('min_unit') : ''}</span>
                    <span class="status-badge ${z.is_active ? 'status-delivered' : 'status-pending'}">${z.is_active ? I18n.t('active_on') : I18n.t('active_off')}</span>
                </div>
                <div class="staff-row-actions">
                    <button class="btn btn-sm btn-secondary" onclick="AdminDashboard.toggleZone(${z.id}, ${z.is_active ? 0 : 1})">${z.is_active ? I18n.t('disable_btn') : I18n.t('enable_btn')}</button>
                    <button class="btn btn-sm btn-delete" onclick="AdminDashboard.deleteZone(${z.id}, '${escAttr(z.name)}')">${Icons.trash} Delete</button>
                </div>
            </div>
        `).join('');
    },

    async createZone(e) {
        e.preventDefault();
        hideFormMsg('zoneFormError');
        const body = {
            name: document.getElementById('zoneName').value.trim(),
            fee: parseFloat(document.getElementById('zoneFee').value),
            free_over: document.getElementById('zoneFreeOver').value === '' ? null : parseFloat(document.getElementById('zoneFreeOver').value),
            eta_min: document.getElementById('zoneEta').value === '' ? null : parseInt(document.getElementById('zoneEta').value),
            is_active: 1
        };
        if (!body.name || !isFinite(body.fee)) {
            showFormMsg('zoneFormError', 'Name and fee are required.');
            return;
        }
        try {
            const res = await Auth.authFetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                e.target.reset();
                toast('Zone added.');
                this.loadZones();
            } else showFormMsg('zoneFormError', 'Failed: ' + data.message);
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') showFormMsg('zoneFormError', 'Failed to add zone.');
        }
    },

    async toggleZone(id, active) {
        try {
            const res = await Auth.authFetch(`/api/zones/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: active })
            });
            const data = await res.json();
            if (data.success) this.loadZones();
            else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') toast('Failed to update zone.', 'error');
        }
    },

    async deleteZone(id, name) {
        const ok = await askConfirm(`Delete zone "${name}"? Old orders keep their totals.`);
        if (!ok) return;
        try {
            const res = await Auth.authFetch(`/api/zones/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast('Zone deleted.');
                this.loadZones();
            } else toast('Failed: ' + data.message, 'error');
        } catch (err) {
            if (err.message !== 'Session expired. Please log in again.') toast('Failed to delete zone.', 'error');
        }
    }
};

// ============================================
// Staff Dashboard — order management with filtering
// ============================================
const StaffDashboard = {
    allOrders: [],
    currentFilter: 'all',

    async render() {
        const container = document.getElementById('staffDashboardContent');

        // Build the dashboard shell: header + filter bar + orders list
        container.innerHTML = `
            <div class="dash-header">
                <div>
                    <h3>Welcome, ${Auth.getName()}</h3>
                    <p class="dash-subtitle">Manage incoming orders</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="Auth.logout()">Logout</button>
            </div>
            <div class="dash-filters">
                <button class="filter-btn active" data-filter="all" onclick="StaffDashboard.setFilter('all')">All</button>
                <button class="filter-btn" data-filter="pending" onclick="StaffDashboard.setFilter('pending')">⏳ Pending</button>
                <button class="filter-btn" data-filter="confirmed" onclick="StaffDashboard.setFilter('confirmed')">✓ Confirmed</button>
                <button class="filter-btn" data-filter="delivered" onclick="StaffDashboard.setFilter('delivered')">📦 Delivered</button>
            </div>
            <div id="staffOrdersList" class="orders-list"><p class="loading-text">Loading orders...</p></div>
        `;

        try {
            const res = await fetch('/api/orders', { headers: Auth.authHeaders() });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.allOrders = data.data;
            this.renderOrders();
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

    renderOrders() {
        const list = document.getElementById('staffOrdersList');
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
            const itemsList = items.map(i => `${i.name} × ${i.quantity}`).join(', ');
            const date = new Date(order.created_at).toLocaleString();

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${order.id}</span>
                        <span class="order-date">${date}</span>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                    <div class="order-body">
                        <p><strong>Customer:</strong> ${order.customer_name}</p>
                        <p><strong>Phone:</strong> ${order.customer_phone}</p>
                        <p><strong>Address:</strong> ${order.customer_address}</p>
                        <p><strong>Items:</strong> ${itemsList || 'N/A'}</p>
                        <p class="order-total"><strong>Total:</strong> $${parseFloat(order.total).toFixed(2)}</p>
                    </div>
                    <div class="order-actions">
                        ${this.renderStatusButton(order)}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderStatusButton(order) {
        if (order.status === 'pending') {
            return `<button class="btn btn-sm btn-confirm" onclick="StaffDashboard.updateStatus(${order.id}, 'confirmed')">✓ Confirm</button>`;
        }
        if (order.status === 'confirmed') {
            return `<button class="btn btn-sm btn-deliver" onclick="StaffDashboard.updateStatus(${order.id}, 'delivered')">📦 Mark Delivered</button>`;
        }
        return '<span class="delivered-label">✅ Delivered</span>';
    },

    async updateStatus(id, status) {
        try {
            const res = await fetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...Auth.authHeaders() },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                this.render(); // re-fetch to stay fresh
            } else {
                alert('Failed: ' + data.message);
            }
        } catch {
            alert('Failed to update status.');
        }
    }
};

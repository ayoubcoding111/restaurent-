// ============================================
// Admin Dashboard — tabbed: Staff, Orders, Menu
// ============================================
const AdminDashboard = {
    currentTab: 'staff',
    allOrders: [],
    orderFilter: 'all',

    init() {
        document.querySelectorAll('.admin-dash-tab').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.admin-dash-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-dash-panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`adminPanel-${tab}`).classList.add('active');

        if (tab === 'staff') this.loadStaff();
        else if (tab === 'orders') this.loadOrders();
        else if (tab === 'menu') this.loadMenuItems();
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
            container.insertBefore(dashHeader, container.querySelector('.admin-dash-tabs'));
        }

        this.init();
        this.switchTab(this.currentTab);
    },

    // ---- Staff Tab ----
    async loadStaff() {
        const container = document.getElementById('adminPanel-staff');
        try {
            const res = await fetch('/api/staff', { headers: Auth.authHeaders() });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
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
                    <span class="status-badge status-${s.role === 'admin' ? 'confirmed' : 'pending'}">${s.role}</span>
                </div>
                <button class="btn btn-sm btn-delete" onclick="AdminDashboard.deleteStaff(${s.id}, '${s.username}')">Delete</button>
            </div>
        `).join('');
    },

    async createStaff(e) {
        e.preventDefault();
        const form = e.target;
        const body = {
            username: form.username.value.trim(),
            password: form.password.value,
            full_name: form.full_name.value.trim(),
            role: form.role.value
        };
        if (!body.username || !body.password || !body.full_name) {
            alert('All fields are required.');
            return;
        }
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...Auth.authHeaders() },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                form.reset();
                this.loadStaff();
            } else {
                alert('Failed: ' + data.message);
            }
        } catch {
            alert('Failed to create staff account.');
        }
    },

    async deleteStaff(id, username) {
        if (!confirm(`Delete staff account "${username}"?`)) return;
        try {
            const res = await fetch(`/api/staff/${id}`, {
                method: 'DELETE',
                headers: Auth.authHeaders()
            });
            const data = await res.json();
            if (data.success) this.loadStaff();
            else alert('Failed: ' + data.message);
        } catch {
            alert('Failed to delete staff account.');
        }
    },

    // ---- Orders Tab ----
    async loadOrders() {
        const container = document.getElementById('adminPanel-orders');

        // Build filter bar if not present
        if (!container.querySelector('.admin-orders-filters')) {
            const filterBar = document.createElement('div');
            filterBar.className = 'admin-orders-filters dash-filters';
            filterBar.innerHTML = `
                <button class="filter-btn active" data-filter="all" onclick="AdminDashboard.setOrderFilter('all')">All</button>
                <button class="filter-btn" data-filter="pending" onclick="AdminDashboard.setOrderFilter('pending')">⏳ Pending</button>
                <button class="filter-btn" data-filter="confirmed" onclick="AdminDashboard.setOrderFilter('confirmed')">✓ Confirmed</button>
                <button class="filter-btn" data-filter="delivered" onclick="AdminDashboard.setOrderFilter('delivered')">📦 Delivered</button>
            `;
            container.insertBefore(filterBar, container.querySelector('.orders-list'));
        }

        try {
            const res = await fetch('/api/orders', { headers: Auth.authHeaders() });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            this.allOrders = data.data;
            this.renderAdminOrders();
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

    renderAdminOrders() {
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
                        ${this.renderOrderActions(order)}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderOrderActions(order) {
        if (order.status === 'pending') {
            return `<button class="btn btn-sm btn-confirm" onclick="AdminDashboard.updateOrderStatus(${order.id}, 'confirmed')">✓ Confirm</button>`;
        }
        if (order.status === 'confirmed') {
            return `<button class="btn btn-sm btn-deliver" onclick="AdminDashboard.updateOrderStatus(${order.id}, 'delivered')">📦 Mark Delivered</button>`;
        }
        return '<span class="delivered-label">✅ Delivered</span>';
    },

    async updateOrderStatus(id, status) {
        try {
            const res = await fetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...Auth.authHeaders() },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) this.loadOrders();
            else alert('Failed: ' + data.message);
        } catch {
            alert('Failed to update status.');
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
        container.innerHTML = items.map(item => `
            <div class="admin-item">
                <img src="${item.image_url}" alt="${item.name}" class="admin-item-image" onerror="this.src='/images/placeholder.jpg'">
                <div class="admin-item-info">
                    <h4>${item.name}</h4>
                    <p>Price: $${parseFloat(item.price).toFixed(2)}</p>
                    <p>Category: ${item.category}</p>
                    <p>Status: ${item.is_available ? 'Available' : 'Not Available'}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-toggle ${!item.is_available ? 'unavailable' : ''}"
                            onclick="AdminDashboard.toggleAvailability(${item.id}, ${!item.is_available})">
                        ${item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button class="btn-delete" onclick="AdminDashboard.deleteItem(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },

    async handleAddItem(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: Auth.authHeaders(),
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                form.reset();
                document.getElementById('adminImagePreview').innerHTML = '';
                await MenuDisplay.loadItems();
                this.loadMenuItems();
            } else {
                alert('Failed: ' + result.message);
            }
        } catch {
            alert('Failed to add item.');
        }
    },

    async toggleAvailability(id, isAvailable) {
        try {
            const res = await fetch(`/api/items/${id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...Auth.authHeaders() },
                body: JSON.stringify({ is_available: isAvailable })
            });
            const result = await res.json();
            if (result.success) {
                await MenuDisplay.loadItems();
                this.loadMenuItems();
            }
        } catch {
            alert('Failed to update availability.');
        }
    },

    async deleteItem(id) {
        if (!confirm('Delete this item?')) return;
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
                headers: Auth.authHeaders()
            });
            const result = await res.json();
            if (result.success) {
                await MenuDisplay.loadItems();
                this.loadMenuItems();
            }
        } catch {
            alert('Failed to delete item.');
        }
    }
};

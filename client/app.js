// ============================================
// App State Management
// ============================================
const AppState = {
    isAdmin: false,
    currentCategory: 'all',
    searchQuery: '',
    allItems: [],
    currentView: 'home'
};

// ============================================
// API Service
// ============================================
const API = {
    baseURL: '/api',

    async login(username, password) {
        const response = await fetch(`${this.baseURL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    },

    async getItems() {
        const response = await fetch(`${this.baseURL}/items`);
        return await response.json();
    },

    async addItem(formData) {
        const response = await fetch(`${this.baseURL}/items`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    },

    async deleteItem(id) {
        const response = await fetch(`${this.baseURL}/items/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },

    async toggleAvailability(id, isAvailable) {
        const response = await fetch(`${this.baseURL}/items/${id}/availability`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: isAvailable })
        });
        return await response.json();
    }
};

// ============================================
// Router — hash-based SPA navigation
// ============================================
const Router = {
    routes: {
        '': 'home',
        'home': 'home',
        'menu': 'menu',
        'contact': 'contact',
        'cart': 'cartPage',
        'thankyou': 'thankYouPage'
    },

    init() {
        window.addEventListener('hashchange', () => this.navigate());
        this.navigate();
    },

    navigate() {
        const hash = location.hash.replace('#', '');
        const viewId = this.routes[hash] || 'home';
        AppState.currentView = viewId;

        // Hide all dedicated page sections first
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));

        // Show/hide the main scrollable sections (hero, about, menu, contact)
        const isMainView = ['home', 'menu', 'contact'].includes(viewId);
        const mainSections = document.querySelectorAll('.hero, .about, .menu, .contact, #mainFooter');
        mainSections.forEach(s => s.classList.toggle('hidden', !isMainView));

        // Show the dedicated page section if needed
        if (!isMainView) {
            const section = document.getElementById(viewId);
            if (section) section.classList.remove('hidden');
        }

        // Render cart if navigating to cart
        if (viewId === 'cartPage') {
            CartPage.render();
        }

        // Scroll to the target section, or top for dedicated pages
        const targetEl = document.getElementById(viewId);
        if (targetEl && isMainView) {
            setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

// ============================================
// Theme Management
// ============================================
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        document.getElementById('themeSwitch').addEventListener('change', (e) => {
            this.setTheme(e.target.checked ? 'dark' : 'light');
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const switchEl = document.getElementById('themeSwitch');
        if (switchEl) switchEl.checked = theme === 'dark';
    }
};

// ============================================
// Cart Badge Controller
// ============================================
const CartBadge = {
    init() {
        this.badge = document.getElementById('cartBadge');
        this.update();
        window.addEventListener('cart-updated', () => this.update());
    },

    update() {
        const count = Cart.getCount();
        if (count > 0) {
            this.badge.textContent = count;
            this.badge.classList.remove('hidden');
        } else {
            this.badge.classList.add('hidden');
        }
    }
};

// ============================================
// Authentication
// ============================================
const Auth = {
    init() {
        const isLoggedIn = sessionStorage.getItem('isAdmin') === 'true';
        if (isLoggedIn) this.setAdminState(true);

        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('adminBtn').addEventListener('click', () => this.showAdminDashboard());
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e);
        });
        document.querySelector('.close').addEventListener('click', () => this.hideLoginModal());
        document.querySelector('.close-admin').addEventListener('click', () => this.hideAdminDashboard());

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    },

    showLoginModal() { document.getElementById('loginModal').classList.add('active'); },
    hideLoginModal() { document.getElementById('loginModal').classList.remove('active'); },
    showAdminDashboard() { document.getElementById('adminModal').classList.add('active'); AdminPanel.loadItems(); },
    hideAdminDashboard() { document.getElementById('adminModal').classList.remove('active'); },

    async handleLogin(e) {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        try {
            const result = await API.login(username, password);
            if (result.success) {
                this.setAdminState(true);
                sessionStorage.setItem('isAdmin', 'true');
                this.hideLoginModal();
                alert('Login successful!');
                e.target.reset();
            } else {
                alert('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    },

    setAdminState(isAdmin) {
        AppState.isAdmin = isAdmin;
        document.getElementById('adminBtn').classList.toggle('hidden', !isAdmin);
        document.getElementById('loginBtn').classList.toggle('hidden', isAdmin);
    }
};

// ============================================
// Menu Display
// ============================================
const MenuDisplay = {
    async init() {
        await this.loadItems();
        this.setupSearch();
        this.setupFilters();
    },

    async loadItems() {
        try {
            const result = await API.getItems();
            if (result.success) {
                AppState.allItems = result.data;
                this.renderItems(result.data);
            }
        } catch (error) {
            console.error('Error loading items:', error);
            document.getElementById('menuGrid').innerHTML =
                '<p style="text-align: center; color: var(--text-secondary);">Failed to load menu items.</p>';
        }
    },

    renderItems(items) {
        const menuGrid = document.getElementById('menuGrid');
        if (items.length === 0) {
            menuGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No items found.</p>';
            return;
        }

        menuGrid.innerHTML = items.map(item => `
            <div class="menu-item" data-category="${item.category}" data-id="${item.id}">
                <img src="${item.image_url}" alt="${item.name}" class="menu-item-image" onerror="this.src='/images/placeholder.jpg'">
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-name">${item.name}</h3>
                        <span class="menu-item-price">$${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                    <span class="menu-item-category">${item.category}</span>
                    <div class="availability-badge ${item.is_available ? 'available' : 'unavailable'}">
                        ${item.is_available ? '✓ Available' : '✗ Not Available'}
                    </div>
                    <div class="menu-item-actions">
                        <button class="btn btn-add-cart" onclick="MenuDisplay.addToCart(${item.id})"
                            ${!item.is_available ? 'disabled title="Item not available"' : ''}>
                            Add to Cart
                        </button>
                        <button class="btn btn-order-now" onclick="MenuDisplay.orderNow(${item.id})"
                            ${!item.is_available ? 'disabled title="Item not available"' : ''}>
                            Order Now
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addToCart(id) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item) return;
        Cart.addItem(item);
    },

    orderNow(id) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item) return;
        Cart.addItem(item);
        location.hash = '#cart';
    },

    setupSearch() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase();
            this.filterItems();
        });
    },

    setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.currentCategory = btn.dataset.category;
                this.filterItems();
            });
        });
    },

    filterItems() {
        let filtered = AppState.allItems;
        if (AppState.currentCategory !== 'all') {
            filtered = filtered.filter(item => item.category === AppState.currentCategory);
        }
        if (AppState.searchQuery) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(AppState.searchQuery));
        }
        this.renderItems(filtered);
    }
};

// ============================================
// Cart Page
// ============================================
const CartPage = {
    render() {
        const items = Cart.getItems();
        const container = document.getElementById('cartItems');
        const footer = document.getElementById('cartFooter');

        if (items.length === 0) {
            container.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="#menu">Browse the menu</a> to add items.</p>';
            footer.classList.add('hidden');
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-image" onerror="this.src='/images/placeholder.jpg'">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="menu-item-category">${item.category}</span>
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="CartPage.changeQty(${item.id}, -1)">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="CartPage.changeQty(${item.id}, 1)">+</button>
                    </div>
                    <p class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="btn-remove" onclick="CartPage.removeItem(${item.id})">✕</button>
                </div>
            </div>
        `).join('');

        document.getElementById('cartTotal').textContent = `$${Cart.getTotal().toFixed(2)}`;
        footer.classList.remove('hidden');
    },

    changeQty(id, delta) {
        const item = Cart.getItems().find(i => i.id === id);
        if (!item) return;
        Cart.updateQuantity(id, item.quantity + delta);
        this.render();
    },

    removeItem(id) {
        Cart.removeItem(id);
        this.render();
    }
};

// ============================================
// Checkout Modal
// ============================================
const Checkout = {
    init() {
        const modal = document.getElementById('checkoutModal');
        document.querySelector('.close-checkout').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit();
        });

        // Cart page "Order Now" button
        document.getElementById('cartOrderBtn').addEventListener('click', () => this.open());
        // Cart page "Clear Cart" button
        document.getElementById('cartClearBtn').addEventListener('click', () => {
            Cart.clear();
            CartPage.render();
        });
    },

    open() {
        if (Cart.getCount() === 0) {
            alert('Your cart is empty!');
            return;
        }
        document.getElementById('checkoutModal').classList.add('active');
    },

    submit() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name || !phone || !address) {
            alert('Please fill in all fields.');
            return;
        }

        const items = Cart.getItems();
        const lines = items.map(item =>
            `• ${item.name} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
        );

        const message = [
            `🍽️ *New Order — Delicious Restaurant*`,
            ``,
            `*Items:*`,
            ...lines,
            ``,
            `💰 *Total: $${Cart.getTotal().toFixed(2)}*`,
            ``,
            `👤 *Name:* ${name}`,
            `📱 *Phone:* ${phone}`,
            `📍 *Address:* ${address}`
        ].join('\n');

        const encoded = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/213776111384?text=${encoded}`;

        // Clear cart and close modal
        Cart.clear();
        document.getElementById('checkoutForm').reset();
        document.getElementById('checkoutModal').classList.remove('active');

        // Navigate to thank-you page
        location.hash = '#thankyou';

        // Open WhatsApp
        window.open(whatsappURL, '_blank');
    }
};

// ============================================
// Admin Panel
// ============================================
const AdminPanel = {
    init() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        document.getElementById('addItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddItem(e);
        });
        document.getElementById('itemImage').addEventListener('change', (e) => this.previewImage(e));
    },

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');
        if (tab === 'manage') this.loadItems();
    },

    previewImage(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`; };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    },

    async handleAddItem(e) {
        const form = e.target;
        const formData = new FormData(form);
        try {
            const result = await API.addItem(formData);
            if (result.success) {
                alert('Item added successfully!');
                form.reset();
                document.getElementById('imagePreview').innerHTML = '';
                await MenuDisplay.loadItems();
                this.loadItems();
            } else {
                alert('Failed to add item: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Failed to add item. Please try again.');
        }
    },

    async loadItems() {
        try {
            const result = await API.getItems();
            if (result.success) this.renderAdminItems(result.data);
        } catch (error) {
            console.error('Error loading admin items:', error);
        }
    },

    renderAdminItems(items) {
        const container = document.getElementById('adminItemsList');
        if (items.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No items yet.</p>';
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
                            onclick="AdminPanel.toggleAvailability(${item.id}, ${!item.is_available})">
                        ${item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button class="btn-delete" onclick="AdminPanel.deleteItem(${item.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    async toggleAvailability(id, isAvailable) {
        try {
            const result = await API.toggleAvailability(id, isAvailable);
            if (result.success) {
                await MenuDisplay.loadItems();
                this.loadItems();
            } else {
                alert('Failed to update availability.');
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
            alert('Failed to update availability.');
        }
    },

    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const result = await API.deleteItem(id);
            if (result.success) {
                alert('Item deleted successfully!');
                await MenuDisplay.loadItems();
                this.loadItems();
            } else {
                alert('Failed to delete item.');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item.');
        }
    }
};

// ============================================
// Navigation Links — trigger router
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        location.hash = this.getAttribute('href');
    });
});

// ============================================
// App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Auth.init();
    CartBadge.init();
    Checkout.init();
    MenuDisplay.init();
    AdminPanel.init();
    Router.init();
});

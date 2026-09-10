// ============================================
// App State
// ============================================
const AppState = {
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

    async getItems() {
        const response = await fetch(`${this.baseURL}/items`);
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
        'thankyou': 'thankYouPage',
        'staff': 'staffDashboard',
        'admin': 'adminDashboard'
    },

    init() {
        window.addEventListener('hashchange', () => this.navigate());
        this.navigate();
    },

    navigate() {
        const hash = location.hash.replace('#', '').replace('/', '');
        const viewId = this.routes[hash] || 'home';
        AppState.currentView = viewId;

        // Auth-protected routes
        if ((viewId === 'staffDashboard' || viewId === 'adminDashboard') && !Auth.isLoggedIn()) {
            location.hash = '#home';
            Auth.showLoginModal();
            return;
        }
        if (viewId === 'staffDashboard' && Auth.getRole() !== 'staff' && Auth.getRole() !== 'admin') {
            location.hash = '#home';
            return;
        }
        if (viewId === 'adminDashboard' && !Auth.isAdmin()) {
            location.hash = '#home';
            return;
        }

        // Hide all dedicated page sections
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));

        // Show/hide main sections
        const isMainView = ['home', 'menu', 'contact'].includes(viewId);
        document.querySelectorAll('.hero, .about, .menu, .contact, #mainFooter')
            .forEach(s => s.classList.toggle('hidden', !isMainView));

        // Show the dedicated page section if needed
        if (!isMainView) {
            const section = document.getElementById(viewId);
            if (section) section.classList.remove('hidden');
        }

        // Render specific views
        if (viewId === 'cartPage') CartPage.render();
        if (viewId === 'staffDashboard') StaffDashboard.render();
        if (viewId === 'adminDashboard') AdminDashboard.render();

        // Scroll
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
        document.getElementById('themeSwitch').checked = theme === 'dark';
    }
};

// ============================================
// Cart Badge
// ============================================
const CartBadge = {
    init() {
        this.badge = document.getElementById('cartBadge');
        this.update();
        window.addEventListener('cart-updated', () => this.update());
    },
    update() {
        const count = Cart.getCount();
        this.badge.textContent = count;
        this.badge.classList.toggle('hidden', count === 0);
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
        if (item) Cart.addItem(item);
    },

    orderNow(id) {
        const item = AppState.allItems.find(i => i.id === id);
        if (item) {
            Cart.addItem(item);
            location.hash = '#cart';
        }
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
        if (item) Cart.updateQuantity(id, item.quantity + delta);
        this.render();
    },

    removeItem(id) {
        Cart.removeItem(id);
        this.render();
    }
};

// ============================================
// Checkout
// ============================================
const Checkout = {
    init() {
        document.querySelector('.close-checkout').addEventListener('click', () => {
            document.getElementById('checkoutModal').classList.remove('active');
        });
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit();
        });
        document.getElementById('cartOrderBtn').addEventListener('click', () => this.open());
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

    async submit() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        if (!name || !phone || !address) {
            alert('Please fill in all fields.');
            return;
        }

        const items = Cart.getItems();
        const total = Cart.getTotal();

        // Save order to server
        try {
            await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: name,
                    customer_phone: phone,
                    customer_address: address,
                    items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
                    total: total
                })
            });
        } catch { /* proceed even if server save fails */ }

        // Build WhatsApp message
        const lines = items.map(i => `• ${i.name} × ${i.quantity} = $${(i.price * i.quantity).toFixed(2)}`);
        const message = [
            `🍽️ *New Order — Delicious Restaurant*`, ``,
            `*Items:*`, ...lines, ``,
            `💰 *Total: $${total.toFixed(2)}*`, ``,
            `👤 *Name:* ${name}`,
            `📱 *Phone:* ${phone}`,
            `📍 *Address:* ${address}`
        ].join('\n');

        const encoded = encodeURIComponent(message);

        // Clear cart and close modal
        Cart.clear();
        document.getElementById('checkoutForm').reset();
        document.getElementById('checkoutModal').classList.remove('active');
        location.hash = '#thankyou';

        // Open WhatsApp
        window.open(`https://wa.me/213776111384?text=${encoded}`, '_blank');
    }
};

// ============================================
// Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        location.hash = this.getAttribute('href');
    });
});

// ============================================
// Login Modal Wiring
// ============================================
function initLoginModal() {
    document.querySelector('.close-login').addEventListener('click', () => Auth.hideLoginModal());
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const result = await Auth.login(username, password);
        if (result.success) {
            Auth.hideLoginModal();
            Auth.renderFooterAuth();
            e.target.reset();
            if (result.role === 'admin') location.hash = '#admin';
            else location.hash = '#staff';
        } else {
            alert(result.message || 'Login failed.');
        }
    });
}

// ============================================
// Admin Form Wiring
// ============================================
function initAdminForms() {
    // Staff creation form
    const staffForm = document.getElementById('adminStaffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', (e) => AdminDashboard.createStaff(e));
    }

    // Add item form
    const itemForm = document.getElementById('adminAddItemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', (e) => AdminDashboard.handleAddItem(e));
    }

    // Item image preview
    const imageInput = document.getElementById('adminItemImage');
    const imagePreview = document.getElementById('adminImagePreview');
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    imagePreview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.innerHTML = '';
            }
        });
    }
}

// ============================================
// App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    CartBadge.init();
    Auth.init();
    initLoginModal();
    initAdminForms();
    MenuDisplay.init();
    Checkout.init();
    Router.init();
});

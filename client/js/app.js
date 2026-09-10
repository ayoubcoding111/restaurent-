// ============================================
// App State Management
// ============================================
const AppState = {
    isAdmin: false,
    currentCategory: 'all',
    searchQuery: '',
    allItems: []
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
// Theme Management
// ============================================
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const icon = document.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
};

// ============================================
// Authentication
// ============================================
const Auth = {
    init() {
        // Check if admin is logged in
        const isLoggedIn = sessionStorage.getItem('isAdmin') === 'true';
        if (isLoggedIn) {
            this.setAdminState(true);
        }

        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // Admin button
        document.getElementById('adminBtn').addEventListener('click', () => {
            this.showAdminDashboard();
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e);
        });

        // Modal close buttons
        document.querySelector('.close').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.querySelector('.close-admin').addEventListener('click', () => {
            this.hideAdminDashboard();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    },

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    },

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    },

    showAdminDashboard() {
        document.getElementById('adminModal').classList.add('active');
        AdminPanel.loadItems();
    },

    hideAdminDashboard() {
        document.getElementById('adminModal').classList.remove('active');
    },

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

        if (isAdmin) {
            document.getElementById('adminBtn').classList.remove('hidden');
            document.getElementById('loginBtn').classList.add('hidden');
        } else {
            document.getElementById('adminBtn').classList.add('hidden');
            document.getElementById('loginBtn').classList.remove('hidden');
        }
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
            <div class="menu-item" data-category="${item.category}">
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
                </div>
            </div>
        `).join('');
    },

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase();
            this.filterItems();
        });
    },

    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.currentCategory = btn.dataset.category;
                this.filterItems();
            });
        });
    },

    filterItems() {
        let filtered = AppState.allItems;

        // Filter by category
        if (AppState.currentCategory !== 'all') {
            filtered = filtered.filter(item => item.category === AppState.currentCategory);
        }

        // Filter by search
        if (AppState.searchQuery) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(AppState.searchQuery)
            );
        }

        this.renderItems(filtered);
    }
};

// ============================================
// Admin Panel
// ============================================
const AdminPanel = {
    init() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Add item form
        document.getElementById('addItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddItem(e);
        });

        // Image preview
        document.getElementById('itemImage').addEventListener('change', (e) => {
            this.previewImage(e);
        });
    },

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');

        if (tab === 'manage') {
            this.loadItems();
        }
    },

    previewImage(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
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
            if (result.success) {
                this.renderAdminItems(result.data);
            }
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
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

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
// Smooth Scroll for Navigation
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Auth.init();
    MenuDisplay.init();
    AdminPanel.init();
});

// ============================================
// Auth Module — token-based, role-aware
// ============================================
const Auth = {
    TOKEN_KEY: 'auth_token',
    ROLE_KEY: 'auth_role',
    NAME_KEY: 'auth_name',

    init() {
        this.renderFooterAuth();
    },

    // ---- Token helpers ----
    getToken() { return localStorage.getItem(this.TOKEN_KEY); },
    getRole() { return localStorage.getItem(this.ROLE_KEY); },
    getName() { return localStorage.getItem(this.NAME_KEY); },
    isLoggedIn() { return !!this.getToken(); },
    isAdmin() { return this.getRole() === 'admin'; },
    isStaff() { return this.getRole() === 'staff'; },

    // ---- API calls ----
    async login(username, password) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.ROLE_KEY, data.role);
            localStorage.setItem(this.NAME_KEY, data.full_name || data.username);
        }
        return data;
    },

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this.getToken() }
            });
        } catch { /* ignore */ }
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ROLE_KEY);
        localStorage.removeItem(this.NAME_KEY);
        this.renderFooterAuth();
        location.hash = '#home';
    },

    authHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    },

    // ---- Footer auth rendering ----
    renderFooterAuth() {
        const container = document.getElementById('footerAuth');
        if (!container) return;

        if (this.isLoggedIn()) {
            const dashLink = this.isAdmin() ? '#admin' : '#staff';
            const dashLabel = this.isAdmin() ? 'Admin Dashboard' : 'Staff Dashboard';
            container.innerHTML = `
                <span class="footer-user">${this.getName()} (${this.getRole()})</span>
                <a href="${dashLink}" class="btn btn-primary btn-sm">${dashLabel}</a>
                <button class="btn btn-secondary btn-sm" id="footerLogoutBtn">Logout</button>
            `;
            document.getElementById('footerLogoutBtn').addEventListener('click', () => this.logout());
        } else {
            container.innerHTML = `
                <button class="btn-login" id="footerLoginBtn">Staff / Admin Login</button>
            `;
            document.getElementById('footerLoginBtn').addEventListener('click', () => this.showLoginModal());
        }
    },

    // ---- Login Modal ----
    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    },

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    }
};

// ============================================
// Admin App — logic for /admin (staff + admin only)
// Client ordering lives in app.js and is NOT loaded here.
// ============================================

// ---- Login / Password-Reset Modal Wiring (moved from app.js) ----
function initLoginModal() {
    document.querySelector('.close-login').addEventListener('click', () => Auth.hideLoginModal());
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormMsg('loginError');
        const identifier = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const result = await Auth.login(identifier, password);
        if (result.success) {
            Auth.hideLoginModal();
            e.target.reset();
            AdminGate.enter();
        } else if (result._status === 429) {
            showFormMsg('loginError', I18n.t('login_rate'));
        } else if (result._status === 403) {
            showFormMsg('loginError', I18n.t('login_banned'));
        } else {
            showFormMsg('loginError', result.message || I18n.t('login_bad'));
        }
    });

    // Forgot password flow
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.showForgotModal();
    });
    document.querySelector('.close-forgot').addEventListener('click', () => Auth.hideForgotModal());
    document.getElementById('backToLoginLink').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.hideForgotModal();
        Auth.showLoginModal();
    });
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormMsg('forgotError');
        hideFormMsg('forgotSuccess');
        const identifier = document.getElementById('forgotEmail').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending...';
        try {
            const result = await Auth.forgotPassword(identifier);
            if (result.success) {
                // Dev mode without SMTP: backend returns the reset link — render it
                // as a clickable link inside the success box.
                if (result.debugResetUrl) {
                    console.log('Dev reset link:', result.debugResetUrl);
                    const box = document.getElementById('forgotSuccess');
                    box.textContent = (result.message || 'Reset link generated.') + ' ';
                    const a = document.createElement('a');
                    a.href = result.debugResetUrl;
                    a.textContent = I18n.t('dev_open');
                    box.appendChild(a);
                    box.classList.remove('hidden', 'form-error', 'shake');
                    box.classList.add('form-success');
                } else {
                    showFormMsg('forgotSuccess', result.message || 'If an account exists, a reset link has been sent.', 'success');
                }
            } else {
                showFormMsg('forgotError', result.message || 'Request failed.');
            }
        } catch {
            showFormMsg('forgotError', 'Request failed. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Reset Link';
        }
    });

    // Reset password flow (token comes from the emailed /admin link)
    document.querySelector('.close-reset').addEventListener('click', () => Auth.hideResetModal());
    document.getElementById('resetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormMsg('resetError');
        hideFormMsg('resetSuccess');
        const password = document.getElementById('resetPassword').value;
        const confirm = document.getElementById('resetPasswordConfirm').value;
        if (password !== confirm) {
            showFormMsg('resetError', 'Passwords do not match.');
            return;
        }
        if (password.length < (window.SharedValidators ? window.SharedValidators.PASSWORD_MIN : 6)) {
            showFormMsg('resetError', 'Password must be at least 6 characters.');
            return;
        }
        const token = Auth.getResetTokenFromHash();
        if (!token) {
            showFormMsg('resetError', 'Missing reset token. Please use the link from your email.');
            return;
        }
        const result = await Auth.resetPassword(token, password);
        if (result.success) {
            showFormMsg('resetSuccess', result.message || 'Password reset. You can now log in.', 'success');
            e.target.reset();
            setTimeout(() => {
                Auth.hideResetModal();
                Auth.showLoginModal();
            }, 1800);
        } else {
            showFormMsg('resetError', result.message || 'Reset failed.');
        }
    });
}

// ---- Admin Form Wiring (moved from app.js) ----
function initAdminForms() {
    // Staff creation form
    const staffForm = document.getElementById('adminStaffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', (e) => AdminDashboard.createStaff(e));
    }

    // Edit item modal
    const editItemClose = document.querySelector('.close-edit-item');
    if (editItemClose) editItemClose.addEventListener('click', () => AdminDashboard.hideEditItem());
    const editItemForm = document.getElementById('editItemForm');
    if (editItemForm) editItemForm.addEventListener('submit', (e) => AdminDashboard.saveEditItem(e));
    const addOptionBtn = document.getElementById('addOptionBtn');
    if (addOptionBtn) addOptionBtn.addEventListener('click', () => AdminDashboard.addOptionRow());

    // Edit staff modal
    const editClose = document.querySelector('.close-edit-staff');
    if (editClose) editClose.addEventListener('click', () => AdminDashboard.hideEditStaff());
    const editForm = document.getElementById('editStaffForm');
    if (editForm) editForm.addEventListener('submit', (e) => AdminDashboard.saveEditStaff(e));

    // My Account forms
    const profileForm = document.getElementById('adminProfileForm');
    if (profileForm) profileForm.addEventListener('submit', (e) => AdminDashboard.saveProfile(e));
    const passForm = document.getElementById('adminPasswordForm');
    if (passForm) passForm.addEventListener('submit', (e) => AdminDashboard.changeOwnPassword(e));

    // Add item form
    const itemForm = document.getElementById('adminAddItemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', (e) => AdminDashboard.handleAddItem(e));
    }

    // Zone form
    const zoneForm = document.getElementById('adminZoneForm');
    if (zoneForm) {
        zoneForm.addEventListener('submit', (e) => AdminDashboard.createZone(e));
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
// AdminGate — Option A: logged-out visitors see the login view.
// Server APIs still enforce auth + admin role, so this gate is UX,
// not the security boundary.
// ============================================
const AdminGate = {
    async enter() {
        // Password-reset links land here: /admin#reset-password?token=…
        const token = Auth.getResetTokenFromHash();
        if (token) {
            this.showLogin(false);
            Auth.showResetModal(token);
            return;
        }
        if (!Auth.isLoggedIn()) {
            this.showLogin(true);
            return;
        }
        // A saved role alone isn't enough: the server forgets sessions on
        // restart, so verify the token before rendering any dashboard.
        const me = await Auth.fetchMe();
        if (!me) {
            await Auth.logout();
            location.reload();
            return;
        }
        this.setHeader(me);
        if (me.role === 'admin') this.showAdmin();
        else this.showStaff();
    },

    showLogin(autoOpen) {
        document.getElementById('loginView')?.classList.remove('hidden');
        document.getElementById('staffDashboard')?.classList.add('hidden');
        document.getElementById('adminDashboard')?.classList.add('hidden');
        document.getElementById('adminHeaderAuth')?.classList.add('hidden');
        if (autoOpen) Auth.showLoginModal();
    },

    showStaff() {
        document.getElementById('loginView')?.classList.add('hidden');
        document.getElementById('staffDashboard')?.classList.remove('hidden');
        document.getElementById('adminDashboard')?.classList.add('hidden');
        document.getElementById('adminHeaderAuth')?.classList.remove('hidden');
        StaffDashboard.render();
    },

    showAdmin() {
        document.getElementById('loginView')?.classList.add('hidden');
        document.getElementById('staffDashboard')?.classList.add('hidden');
        document.getElementById('adminDashboard')?.classList.remove('hidden');
        document.getElementById('adminHeaderAuth')?.classList.remove('hidden');
        AdminDashboard.render();
    },

    setHeader(me) {
        const userEl = document.getElementById('adminUser');
        if (userEl) userEl.textContent = `${me.full_name || me.username} (${me.role})`;
    }
};

// ============================================
// Admin App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    // Apply the saved client theme (no toggle on this page).
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
    initConfirmModal();
    Auth.init();
    // Session death mid-work (server restart, password change) should land
    // back on the login view instead of a broken dashboard.
    const _logout = Auth.logout.bind(Auth);
    Auth.logout = async () => {
        await _logout();
        location.reload();
    };
    initLoginModal();
    initAdminForms();
    document.getElementById('loginViewBtn')?.addEventListener('click', () => Auth.showLoginModal());
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => Auth.logout());
    AdminGate.enter();
});

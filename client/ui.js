// ============================================
// Shared UI helpers
// ============================================
const UI = {
    /**
     * Render the order-status filter bar used by both staff and admin dashboards.
     * @param {string} activeFilter - currently selected filter key ('all', 'pending', …)
     * @param {string} onClickFn - global function name called on click, receives the filter key
     * @returns {string} HTML string
     */
    renderOrderFilterBar(activeFilter, onClickFn) {
        const statuses = ['all', ...KitchenFlow.ORDER];
        return '<div class="dash-filters">' +
            statuses.map(s => {
                const label = s === 'all' ? 'All' : (s === 'confirmed' ? '✓ ' + KitchenFlow.label(s) : KitchenFlow.label(s));
                const cls = s === activeFilter ? 'filter-btn active' : 'filter-btn';
                return `<button class="${cls}" data-filter="${s}" onclick="${onClickFn}('${s}')">${label}</button>`;
            }).join('') +
            '</div>';
    }
};

// ============================================
// Shared UI primitives — used by BOTH the client
// page (via app.js) and the admin page (via admin-app.js).
// Replaces blocking alert()/confirm() popups.
// ============================================
function escAttr(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function showFormMsg(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden', 'form-error', 'form-success', 'shake');
    void el.offsetWidth; // restart shake animation
    el.classList.add(type === 'success' ? 'form-success' : 'form-error', 'shake');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormMsg(id) {
    document.getElementById(id)?.classList.add('hidden');
}

function toast(msg, type = 'success') {
    let wrap = document.getElementById('toastWrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toastWrap';
        document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 320);
    }, 2800);
}

let _confirmResolve = null;
function askConfirm(message, confirmText) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return Promise.resolve(false);
    document.getElementById('confirmMsg').textContent = message;
    document.getElementById('confirmYesBtn').textContent = confirmText || I18n.t('delete_btn');
    modal.classList.add('active');
    return new Promise(resolve => { _confirmResolve = resolve; });
}

function closeConfirm(result) {
    document.getElementById('confirmModal')?.classList.remove('active');
    if (_confirmResolve) {
        _confirmResolve(result);
        _confirmResolve = null;
    }
}

function initConfirmModal() {
    const yes = document.getElementById('confirmYesBtn');
    const no = document.getElementById('confirmNoBtn');
    if (!yes || !no) return;
    yes.addEventListener('click', () => closeConfirm(true));
    no.addEventListener('click', () => closeConfirm(false));
}

// Click a customer phone in staff/admin order cards to copy it to the clipboard.
async function copyPhone(phone) {
    const text = String(phone || '');
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        toast(I18n.t('copied'));
    } catch {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            toast(I18n.t('copied'));
        } catch {
            toast(I18n.t('copy_failed'), 'error');
        }
    }
}

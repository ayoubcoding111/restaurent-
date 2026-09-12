// ============================================
// Track Module — public order tracking (#track)
// Polls GET /api/orders/track?id=&phone= every 30s.
// PII-safe: server returns masked name/address/phone only.
// ============================================
const Track = {
    LAST_KEY: 'last_order',
    pollTimer: null,
    lastQuery: null,

    saveLast(orderId, phone) {
        try {
            localStorage.setItem(this.LAST_KEY, JSON.stringify({ id: orderId, phone }));
        } catch { /* ignore */ }
    },

    loadLast() {
        try {
            const raw = localStorage.getItem(this.LAST_KEY);
            if (!raw) return null;
            const o = JSON.parse(raw);
            if (!o || !o.id || !o.phone) return null;
            return o;
        } catch { return null; }
    },

    init() {
        const form = document.getElementById('trackForm');
        if (form && !form.dataset.wired) {
            form.dataset.wired = '1';
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.lookupFromForm();
            });
        }
    },

    render() {
        // Pre-fill from #track?id=&phone=, thank-you handoff, or last order.
        this.stopPolling();
        const hash = location.hash || '';
        const qIndex = hash.indexOf('?');
        let qId = '', qPhone = '';
        if (qIndex !== -1) {
            const params = new URLSearchParams(hash.slice(qIndex + 1));
            qId = (params.get('id') || '').trim();
            qPhone = (params.get('phone') || '').trim();
        }
        const last = this.loadLast();
        const idEl = document.getElementById('trackOrderId');
        const phoneEl = document.getElementById('trackPhone');
        if (idEl && !idEl.value) idEl.value = qId || (last ? last.id : '');
        if (phoneEl && !phoneEl.value) phoneEl.value = qPhone || (last ? last.phone : '');
        const box = document.getElementById('trackResult');
        if (box && !this.lastQuery) box.classList.add('hidden');
        // Auto-lookup when arriving with a full query (e.g. thank-you button).
        if (idEl?.value && phoneEl?.value && qId) {
            this.lookup(idEl.value.trim(), phoneEl.value.trim());
        } else if (this.lastQuery) {
            this.lookup(this.lastQuery.id, this.lastQuery.phone, true);
        }
    },

    async lookupFromForm() {
        const id = document.getElementById('trackOrderId').value.trim();
        const phone = document.getElementById('trackPhone').value.trim();
        await this.lookup(id, phone);
    },

    async lookup(id, phone, silent) {
        const errEl = document.getElementById('trackError');
        const box = document.getElementById('trackResult');
        const btn = document.getElementById('trackBtn');
        const hideErr = () => errEl?.classList.add('hidden');
        const showErr = (msg) => {
            if (!errEl) return;
            errEl.textContent = msg;
            errEl.classList.remove('hidden');
        };
        hideErr();
        if (!id || !phone) {
            showErr(I18n.t('fill_all'));
            return;
        }
        const norm = window.SharedValidators
            ? window.SharedValidators.normalizeDZPhone(phone)
            : String(phone).replace(/[\s.\-()]/g, '');
        const valid = window.SharedValidators
            ? window.SharedValidators.isValidDZPhone(phone)
            : /^(\+213|0)(5|6|7)\d{8}$/.test(norm);
        if (!valid) {
            showErr(I18n.t('phone_invalid'));
            return;
        }
        if (btn) btn.disabled = true;
        try {
            const res = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(norm)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                if (!silent) showErr(data.message || I18n.t('track_not_found'));
                if (res.status === 404 && box) box.classList.add('hidden');
                return;
            }
            this.lastQuery = { id, phone: norm };
            this.saveLast(data.data.id, norm);
            this.paint(data.data);
            this.startPolling();
        } catch {
            if (!silent) showErr(I18n.t('track_failed'));
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    startPolling() {
        this.stopPolling();
        // 30s matches server trackLimiter (60/15m) with headroom.
        this.pollTimer = setInterval(() => {
            if (document.hidden || !this.lastQuery) return;
            this.lookup(this.lastQuery.id, this.lastQuery.phone, true);
        }, 30000);
    },

    stopPolling() {
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = null;
    },

    paint(d) {
        const box = document.getElementById('trackResult');
        if (!box) return;
        const steps = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered'];
        const idx = steps.indexOf(d.status);
        const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const timeline = steps.map((s, i) => `
            <div class="track-step ${i <= idx ? 'done' : ''} ${s === d.status ? 'current' : ''}">
                <span class="track-dot"></span>
                <span>${esc(I18n.t('st_' + s))}</span>
            </div>`).join('');
        const items = (d.items || []).map(it =>
            `<li>${esc(it.name)} × ${it.quantity} — $${Number(it.price).toFixed(2)}</li>`).join('');
        const eta = d.eta_min != null ? `<p>⏱ ~${esc(d.eta_min)} ${esc(I18n.t('min_unit'))}${d.zone_name ? ' • ' + esc(d.zone_name) : ''}</p>` : '';
        box.innerHTML = `
            <h3>${esc(I18n.t('track_order'))} #${esc(d.id)} — ${esc(I18n.t('st_' + d.status))}</h3>
            <div class="track-timeline">${timeline}</div>
            ${eta}
            <p>${esc(I18n.t('track_for'))}: ${esc(d.customer_name_masked)} • ${esc(d.customer_phone_masked)}</p>
            <p>${esc(I18n.t('co_addr'))}: ${esc(d.customer_address_masked)}</p>
            <p><strong>${esc(I18n.t('cart_total'))}</strong> $${Number(d.total).toFixed(2)}</p>
            ${items ? `<ul class="track-items">${items}</ul>` : ''}
            <p class="form-hint">${esc(I18n.t('track_auto'))}</p>`;
        box.classList.remove('hidden');
    }
};

// ============================================
// App State
// ============================================
const AppState = {
    currentCategory: 'all',
    searchQuery: '',
    allItems: [],
    filteredItems: [],
    currentView: 'home',
    itemsPerPage: 6,
    displayedCount: 0
};

// ============================================
// Scroll Reveal Animation
// ============================================
const ScrollReveal = {
    observer: null,

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: show everything immediately
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        this.observe();
    },

    observe() {
        document.querySelectorAll('.reveal:not(.active)').forEach(el => {
            this.observer.observe(el);
        });
    }
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
        // Scroll to top on fresh page load (prevents browser scroll restoration)
        if (!location.hash || location.hash === '#' || location.hash === '#home') {
            window.scrollTo(0, 0);
        }
        window.addEventListener('hashchange', () => this.navigate());
        this.navigate();
    },

    // Navigate to a hash even when it's already the current one.
    // (Setting location.hash to the same value fires no hashchange event,
    // so a plain assignment would leave the new view unrendered.)
    go(hash) {
        if (location.hash === hash) this.navigate();
        else location.hash = hash;
    },

    async navigate() {
        const rawHash = location.hash.replace('#', '').replace('/', '');
        const [hashPath] = rawHash.split('?');
        const viewId = this.routes[hashPath] || 'home';
        AppState.currentView = viewId;

        // Password-reset link: #reset-password?token=xxx
        if (hashPath === 'reset-password') {
            const token = Auth.getResetTokenFromHash();
            if (token) {
                Auth.showResetModal(token);
            } else {
                Auth.showResetModal(null);
                showFormMsg('resetError', 'Invalid or missing reset link. Please request a new one.');
            }
            return;
        }

        // Auth-protected routes — a saved token alone isn't enough: the server
        // forgets sessions on restart, so verify it before rendering dashboards.
        if (viewId === 'staffDashboard' || viewId === 'adminDashboard') {
            if (!Auth.isLoggedIn()) {
                location.hash = '#home';
                Auth.showLoginModal();
                return;
            }
            const me = await Auth.fetchMe();
            if (!me) {
                await Auth.logout();
                Auth.showLoginModal();
                return;
            }
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

        // Re-observe any newly visible reveal elements
        if (ScrollReveal.observer) ScrollReveal.observe();
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
        this.setupLoadMore();
    },

    async loadItems() {
        try {
            const result = await API.getItems();
            if (result.success) {
                AppState.allItems = result.data;
                this.resetAndRender();
            }
        } catch (error) {
            console.error('Error loading items:', error);
            document.getElementById('menuGrid').innerHTML =
                '<p style="text-align: center; color: var(--text-secondary);">Failed to load menu items.</p>';
        }
    },

    resetAndRender() {
        AppState.filteredItems = this.getFilteredItems();
        AppState.displayedCount = 0;
        document.getElementById('menuGrid').innerHTML = '';
        this.renderNextBatch();
    },

    getFilteredItems() {
        let filtered = AppState.allItems;
        if (AppState.currentCategory !== 'all') {
            filtered = filtered.filter(item => item.category === AppState.currentCategory);
        }
        if (AppState.searchQuery) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(AppState.searchQuery));
        }
        return filtered;
    },

    renderNextBatch() {
        const menuGrid = document.getElementById('menuGrid');
        const filtered = AppState.filteredItems;
        const start = AppState.displayedCount;
        const end = Math.min(start + AppState.itemsPerPage, filtered.length);

        if (filtered.length === 0 && start === 0) {
            menuGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">No items found.</p>';
            this.updateLoadMoreButton(0);
            return;
        }

        const itemsToRender = filtered.slice(start, end);
        const html = itemsToRender.map(item => this.renderItemCard(item)).join('');

        if (start === 0) {
            menuGrid.innerHTML = html;
        } else {
            menuGrid.insertAdjacentHTML('beforeend', html);
        }

        AppState.displayedCount = end;
        this.updateLoadMoreButton(filtered.length);

        // Re-observe newly added reveal elements
        if (ScrollReveal.observer) ScrollReveal.observe();
    },

    renderItemCard(item) {
        const desc = item.description
            ? `<p class="menu-item-desc">${escAttr(item.description)}</p>`
            : '';
        const availLabel = item.is_available ? I18n.t('avail') : I18n.t('unavail');
        const hasOpts = (item.options || []).length > 0;
        return `
            <div class="menu-item reveal" data-category="${escAttr(item.category)}" data-id="${Number(item.id) || 0}"
                ${hasOpts && item.is_available ? `onclick="Customizer.open(${Number(item.id) || 0})" style="cursor:pointer" title="${escAttr(I18n.t('customize'))}"` : ''}>
                <img src="${escAttr(item.image_url)}" alt="${escAttr(item.name)}" class="menu-item-image" onerror="this.src='/images/placeholder.jpg'">
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-name">${escAttr(item.name)}</h3>
                        <span class="menu-item-price">$${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                    <span class="menu-item-category">${escAttr(item.category)}</span>
                    ${(item.rating_count || 0) > 0 ? `<span class="rating-badge" title="${item.rating_count} reviews">★ ${Number(item.rating_avg).toFixed(1)} (${item.rating_count})</span>` : ''}
                    ${desc}
                    <div class="availability-badge ${item.is_available ? 'available' : 'unavailable'}">
                        ${availLabel}
                    </div>
                    <div class="menu-item-actions">
                        <button class="btn btn-add-cart" onclick="event.stopPropagation();MenuDisplay.addToCart(${item.id}, this)"
                            ${!item.is_available ? 'disabled title="Item not available"' : ''}>
                            ${Icons.cart} ${I18n.t('add_cart')}
                        </button>
                        <button class="btn btn-order-now" onclick="event.stopPropagation();MenuDisplay.orderNow(${item.id}, this)"
                            ${!item.is_available ? 'disabled title="Item not available"' : ''}>
                            ${I18n.t('order_now')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    updateLoadMoreButton(totalItems) {
        const wrap = document.getElementById('loadMoreWrap');
        const btn = document.getElementById('loadMoreBtn');
        if (!wrap || !btn) return;

        if (AppState.displayedCount >= totalItems) {
            wrap.classList.add('hidden');
        } else {
            wrap.classList.remove('hidden');
            btn.textContent = `${I18n.t('load_more')} (${totalItems - AppState.displayedCount} ${I18n.t('remaining')})`;
        }
    },

    setupLoadMore() {
        const btn = document.getElementById('loadMoreBtn');
        if (btn) {
            btn.addEventListener('click', () => this.renderNextBatch());
        }
    },

    addToCart(id, el) {
        const item = AppState.allItems.find(i => i.id === id);
        if (item) {
            Cart.addItem(item);
            flyToCart(el);
        }
    },
    orderNow(id, el) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item || !item.is_available) return;
        // Items with options go through the customizer first
        if (item.options && item.options.length) {
            Customizer.open(id, true);
            return;
        }
        Cart.addItem(item);
        flyToCart(el);
        location.hash = '#cart';
    },

    setupSearch() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase();
            this.resetAndRender();
        });
    },

    setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.currentCategory = btn.dataset.category;
                this.resetAndRender();
            });
        });
    },

    filterItems() {
        this.resetAndRender();
    }
};

// ============================================
// Customizer — item details + priced options
// (single-choice groups = radio, multi = checkboxes)
// ============================================
const Customizer = {
    item: null,

    init() {
        document.querySelector('.close-customize').addEventListener('click', () => this.close());
        document.getElementById('custGroups').addEventListener('change', () => this.updateTotal());
        document.getElementById('custAddBtn').addEventListener('click', (e) => this.add(e.currentTarget));
        document.getElementById('custOrderBtn').addEventListener('click', (e) => {
            this.orderNowMode = true;
            this.add(e.currentTarget);
        });
    },

    open(id, orderNow = false) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item || !item.is_available) return;
        if (!item.options || !item.options.length) {
            MenuDisplay.addToCart(id, null);
            return;
        }
        this.item = item;
        this.orderNowMode = orderNow;
        document.getElementById('custOrderBtn').style.display = orderNow ? '' : 'none';
        document.getElementById('custImage').src = item.image_url;
        document.getElementById('custImage').alt = item.name;
        document.getElementById('custName').textContent = item.name;
        document.getElementById('custDesc').textContent = item.description || '';
        document.getElementById('custDesc').style.display = item.description ? '' : 'none';
        document.getElementById('custGroups').innerHTML = this.groups().map((g, gi) => `
            <div class="cust-group">
                <h4>${escAttr(I18n.pickOptGroup(g.opts[0]))}</h4>
                ${g.opts.map((o, oi) => `
                    <label class="cust-opt">
                        <input type="${g.single ? 'radio' : 'checkbox'}" name="cg-${gi}" value="${Number(o.id) || 0}"
                            ${g.single && oi === 0 ? 'checked' : ''} />
                        <span class="cust-opt-name">${escAttr(I18n.pickOptName(o))}</span>
                        <span class="cust-opt-price">${Number(o.price_delta) > 0 ? '+$' + Number(o.price_delta).toFixed(2) : '—'}</span>
                    </label>`).join('')}
            </div>`).join('');
        this.updateTotal();
        this.loadReviews(item.id);
        document.getElementById('customizeModal').classList.add('active');
    },

    close() {
        document.getElementById('customizeModal').classList.remove('active');
        this.item = null;
    },

    groups() {
        const map = new Map();
        (this.item.options || []).forEach(o => {
            if (!map.has(o.group_name)) {
                map.set(o.group_name, { name: o.group_name, single: o.choice === 'single', opts: [] });
            }
            map.get(o.group_name).opts.push(o);
        });
        return [...map.values()];
    },

    selected() {
        if (!this.item) return [];
        const checked = [...document.querySelectorAll('#custGroups input:checked')].map(i => Number(i.value));
        return (this.item.options || []).filter(o => checked.includes(o.id));
    },

    total() {
        if (!this.item) return 0;
        return parseFloat(this.item.price) + this.selected().reduce((s, o) => s + (Number(o.price_delta) || 0), 0);
    },

    updateTotal() {
        document.getElementById('custTotal').textContent = '$' + this.total().toFixed(2);
    },

    async loadReviews(itemId) {
        const box = document.getElementById('custReviews');
        if (!box) return;
        box.innerHTML = `<p class="loading-text">${I18n.t('loading_reviews')}</p>`;
        try {
            const res = await fetch(`/api/items/${itemId}/reviews`);
            const data = await res.json();
            const list = data.success ? data.data : [];
            const rows = list.length
                ? list.map(r => `
                    <div class="review-row">
                        <strong>${escAttr(r.rater_name)}</strong>
                        <span class="rating-badge">★ ${r.rating}</span>
                        ${r.comment ? `<p>${escAttr(r.comment)}</p>` : ''}
                    </div>`).join('')
                : `<p class="empty-text">${I18n.t('no_reviews')}</p>`;
            box.innerHTML = `
                <h4>${I18n.t('reviews_t')}</h4>
                <div class="reviews-list">${rows}</div>
                <form id="custReviewForm" class="inline-form">
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" id="custReviewName" maxlength="100" placeholder="${escAttr(I18n.t('your_name'))}" required />
                        </div>
                        <div class="form-group" style="flex:0 0 110px">
                            <select id="custReviewStars">
                                <option value="5">★★★★★</option>
                                <option value="4">★★★★</option>
                                <option value="3">★★★</option>
                                <option value="2">★★</option>
                                <option value="1">★</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea id="custReviewComment" rows="2" maxlength="500" placeholder="${escAttr(I18n.t('your_comment'))}"></textarea>
                    </div>
                    <button type="submit" class="btn btn-secondary btn-sm">${I18n.t('submit_review')}</button>
                </form>`;
            document.getElementById('custReviewForm').addEventListener('submit', (e) => this.submitReview(e, itemId));
        } catch {
            box.innerHTML = '';
        }
    },

    async submitReview(e, itemId) {
        e.preventDefault();
        const name = document.getElementById('custReviewName').value.trim();
        const rating = parseInt(document.getElementById('custReviewStars').value);
        const comment = document.getElementById('custReviewComment').value.trim();
        if (!name || !(rating >= 1 && rating <= 5)) return;
        try {
            const res = await fetch(`/api/items/${itemId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, comment })
            });
            const data = await res.json();
            if (data.success) {
                toast(I18n.t('review_ok'));
                this.loadReviews(itemId);
            } else {
                toast(data.message || I18n.t('review_bad'), 'error');
            }
        } catch {
            toast(I18n.t('review_bad'), 'error');
        }
    },

    add(btnEl) {
        if (!this.item) return;
        Cart.addItem(this.item, 1, this.selected());
        flyToCart(btnEl);
        const goCart = this.orderNowMode;
        this.orderNowMode = false;
        this.close();
        if (goCart) location.hash = '#cart';
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
            container.innerHTML = `<p class="cart-empty">${I18n.t('cart_empty')} <a href="#menu">${I18n.t('cart_browse')}</a></p>`;
            footer.classList.add('hidden');
            return;
        }

        container.innerHTML = items.map(item => {
            const key = escAttr(item.key || String(item.id));
            const optsLine = escAttr((item.options || []).map(o => I18n.pickOptName(o)).join(', '));
            return `
            <div class="cart-item" data-key="${key}">
                <img src="${escAttr(item.image_url)}" alt="${escAttr(item.name)}" class="cart-item-image" onerror="this.src='/images/placeholder.jpg'">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${escAttr(item.name)}</h4>
                    <span class="menu-item-category">${escAttr(item.category)}</span>
                    ${optsLine ? `<p class="cart-item-opts">${optsLine}</p>` : ''}
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="CartPage.changeQty('${key}', -1)">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="CartPage.changeQty('${key}', 1)">+</button>
                    </div>
                    <p class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="btn-remove" onclick="CartPage.removeItem('${key}')">✕</button>
                </div>
            </div>
        `; }).join('');

        document.getElementById('cartTotal').textContent = `$${Cart.getTotal().toFixed(2)}`;
        footer.classList.remove('hidden');
    },

    changeQty(key, delta) {
        const item = Cart.getItems().find(i => (i.key || String(i.id)) === String(key));
        if (item) Cart.updateQuantity(key, item.quantity + delta);
        this.render();
    },

    removeItem(key) {
        Cart.removeItem(key);
        this.render();
    }
};

// ============================================
// Checkout — direct order, no WhatsApp
// ============================================
// Algerian mobile rule lives in validators.js (shared with the server).
// Thin wrappers keep existing call sites unchanged.
function normalizeDZPhone(phone) {
    return window.SharedValidators
        ? window.SharedValidators.normalizeDZPhone(phone)
        : String(phone || '').replace(/[\s.\-()]/g, '');
}

function isValidDZPhone(phone) {
    return window.SharedValidators
        ? window.SharedValidators.isValidDZPhone(phone)
        : /^(\+213|0)(5|6|7)\d{8}$/.test(normalizeDZPhone(phone));
}

function escAttr(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Click a customer phone in staff/admin to copy it to the clipboard
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

// ============================================
// Delivery zones — cached public list, fee math mirrors server
// ============================================
const Zones = {
    list: [],

    async load() {
        try {
            const res = await fetch('/api/zones');
            const data = await res.json();
            this.list = data.success ? data.data : [];
        } catch {
            this.list = [];
        }
        return this.list;
    },

    nameOf(z) {
        if (!z) return '';
        const lang = I18n.getLang();
        if (lang === 'fr') return z.name_fr || z.name;
        if (lang === 'ar') return z.name_ar || z.name;
        return z.name;
    },

    byId(id) {
        return this.list.find(z => String(z.id) === String(id));
    },

    feeFor(id, subtotal) {
        const z = this.byId(id);
        if (!z) return 0;
        const fee = Number(z.fee) || 0;
        if (z.free_over != null && subtotal >= Number(z.free_over)) return 0;
        return fee;
    }
};

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
            showFormMsg('cartError', I18n.t('cart_empty'));
            return;
        }
        hideFormMsg('cartError');
        document.getElementById('checkoutModal').classList.add('active');
        this.refreshZones();
    },

    async refreshZones() {
        const sel = document.getElementById('zoneSelect');
        if (!sel) return;
        if (!Zones.list.length) await Zones.load();
        const subtotal = Cart.getTotal();
        sel.innerHTML = Zones.list.length
            ? Zones.list.map(z => {
                const fee = Zones.feeFor(z.id, subtotal);
                const eta = z.eta_min ? ` • ~${z.eta_min} ${I18n.t('min_unit')}` : '';
                const free = z.free_over != null ? ` • ${I18n.t('free_over')} $${Number(z.free_over).toFixed(2)}+` : '';
                return `<option value="${z.id}">${escAttr(Zones.nameOf(z))} — $${fee.toFixed(2)}${free}${eta}</option>`;
            }).join('')
            : `<option value="">${escAttr(I18n.t('no_zones'))}</option>`;
        sel.onchange = () => this.updateZonePreview();
        this.updateZonePreview();
    },

    updateZonePreview() {
        const sel = document.getElementById('zoneSelect');
        const hint = document.getElementById('zoneFeeHint');
        const totalEl = document.getElementById('checkoutTotal');
        const subtotal = Cart.getTotal();
        const fee = sel && sel.value ? Zones.feeFor(sel.value, subtotal) : 0;
        if (totalEl) totalEl.textContent = '$' + (subtotal + fee).toFixed(2);
        if (hint) {
            const z = sel && sel.value ? Zones.byId(sel.value) : null;
            if (!z) { hint.textContent = ''; return; }
            hint.textContent = fee === 0
                ? I18n.t('free_delivery')
                : `${I18n.t('delivery_fee')}: $${fee.toFixed(2)} • ${I18n.t('subtotal')}: $${subtotal.toFixed(2)}`;
        }
    },

    async submit() {
        const name = document.getElementById('customerName').value.trim();
        const phoneRaw = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        if (!name || !phoneRaw || !address) {
            showFormMsg('checkoutError', I18n.t('fill_all'));
            return;
        }
        if (!navigator.onLine) {
            showFormMsg('checkoutError', I18n.t('offline_err'));
            return;
        }
        if (!isValidDZPhone(phoneRaw)) {
            showFormMsg('checkoutError', I18n.t('phone_invalid'));
            return;
        }
        hideFormMsg('checkoutError');

        const phone = normalizeDZPhone(phoneRaw);
        const items = Cart.getItems();
        const subtotal = Cart.getTotal();
        const zoneSel = document.getElementById('zoneSelect');
        const zoneId = zoneSel && zoneSel.value ? parseInt(zoneSel.value) : null;
        const fee = zoneId ? Zones.feeFor(zoneId, subtotal) : 0;
        const total = Math.round((subtotal + fee) * 100) / 100;
        const btn = document.getElementById('checkoutSubmitBtn');
        btn.disabled = true;

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: name,
                    customer_phone: phone,
                    customer_address: address,
                    zone_id: zoneId,
                    items: items.map(i => ({
                        id: i.id, name: i.name, price: i.price, quantity: i.quantity,
                        options: (i.options || []).map(o => I18n.pickOptName(o))
                    })),
                    total: total
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                showFormMsg('checkoutError', data.message || I18n.t('order_failed'));
                return;
            }

            // Success — clear cart and show confirmation with order number
            Cart.clear();
            document.getElementById('checkoutForm').reset();
            document.getElementById('checkoutModal').classList.remove('active');
            const orderIdEl = document.getElementById('thankYouOrderId');
            if (orderIdEl && data.orderId) {
                orderIdEl.textContent = `#${data.orderId}`;
                orderIdEl.classList.remove('hidden');
            }
            location.hash = '#thankyou';
        } catch {
            showFormMsg('checkoutError', I18n.t('order_failed'));
        } finally {
            btn.disabled = false;
        }
    }
};

// ============================================
// Fly-to-cart animation — red dot arcs from the
// clicked button to the navbar cart, then bumps it
// ============================================
function flyToCart(fromEl) {
    try {
        const target = document.getElementById('cartLink');
        if (!fromEl || !target || typeof fromEl.getBoundingClientRect !== 'function') return;
        const a = fromEl.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const dot = document.createElement('div');
        dot.className = 'fly-dot';
        dot.style.left = (a.left + a.width / 2) + 'px';
        dot.style.top = (a.top + a.height / 2) + 'px';
        document.body.appendChild(dot);
        const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
        const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
        const anim = dot.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.5}px, ${dy - 60}px) scale(0.85)`, opacity: 1, offset: 0.55 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.9 }
        ], { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' });
        anim.onfinish = () => {
            dot.remove();
            const badge = document.getElementById('cartBadge');
            if (badge) {
                badge.classList.remove('bump');
                void badge.offsetWidth;
                badge.classList.add('bump');
            }
        };
    } catch { /* animation is decorative — never break the cart */ }
}

// ============================================
// Inline messages + toasts + confirm dialog
// (replaces blocking alert()/confirm() popups)
// ============================================
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
    document.getElementById('confirmMsg').textContent = message;
    document.getElementById('confirmYesBtn').textContent = confirmText || I18n.t('delete_btn');
    modal.classList.add('active');
    return new Promise(resolve => { _confirmResolve = resolve; });
}

function closeConfirm(result) {
    document.getElementById('confirmModal').classList.remove('active');
    if (_confirmResolve) {
        _confirmResolve(result);
        _confirmResolve = null;
    }
}

function initConfirmModal() {
    document.getElementById('confirmYesBtn').addEventListener('click', () => closeConfirm(true));
    document.getElementById('confirmNoBtn').addEventListener('click', () => closeConfirm(false));
}

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
// Hamburger Menu Toggle
// ============================================
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('navOverlay');
    if (!hamburger || !navLinks) return;

    function closeMenu() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    function toggleMenu() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    }

    hamburger.addEventListener('click', toggleMenu);

    // Close when overlay is clicked
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            closeMenu();
        }
    });
}

// ============================================
// Login / Password-Reset Modal Wiring
// ============================================
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
            Auth.renderFooterAuth();
            e.target.reset();
            Router.go(result.role === 'admin' ? '#admin' : '#staff');
        } else {
            showFormMsg('loginError', I18n.t('login_bad'));
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

    // Reset password flow (token comes from email link)
    document.querySelector('.close-reset').addEventListener('click', () => {
        Auth.hideResetModal();
        location.hash = '#home';
    });
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
        const token = Auth.resetToken || Auth.getResetTokenFromHash();
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
                location.hash = '#home';
                Auth.showLoginModal();
            }, 1800);
        } else {
            showFormMsg('resetError', result.message || 'Reset failed.');
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
// App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    initConfirmModal();
    Customizer.init();
    ThemeManager.init();
    CartBadge.init();
    Auth.init();
    initLoginModal();
    initAdminForms();
    initHamburger();
    ScrollReveal.init();
    MenuDisplay.init();
    Checkout.init();
    Router.init();
});

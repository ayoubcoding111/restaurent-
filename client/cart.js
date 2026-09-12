// ============================================
// Cart Module — localStorage-backed, event-driven
// ============================================
const Cart = {
  STORAGE_KEY: 'restaurant_cart',

  // ---- Read / Write ----
  _load() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  _save(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this._emit();
  },

  _emit() {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: this.getItems() } }));
  },

  // ---- Public API ----
  getItems() {
    return this._load();
  },

  getCount() {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  },

  getTotal() {
    return this.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  addItem(product, qty = 1, options = []) {
    const opts = (options || [])
      .map(o => ({
        id: o.id,
        name_en: o.name_en || o.name || '',
        name_fr: o.name_fr || null,
        name_ar: o.name_ar || null,
        group_en: o.group_en || o.group_name || o.group || '',
        group_fr: o.group_fr || null,
        group_ar: o.group_ar || null,
        price_delta: Number(o.price_delta) || 0
      }))
      .sort((a, b) => a.id - b.id);
    const key = `${product.id}|${opts.map(o => o.id).join(',')}`;
    const unit = parseFloat(product.price) + opts.reduce((s, o) => s + o.price_delta, 0);
    const items = this._load();
    const existing = items.find(i => (i.key || String(i.id)) === key);
    if (existing) {
      existing.quantity += qty;
      existing.key = key;
      existing.options = opts;
      existing.price = unit;
    } else {
      items.push({
        key,
        id: product.id,
        name: product.name,
        price: unit,
        image_url: product.image_url,
        category: product.category,
        options: opts,
        quantity: qty
      });
    }
    this._save(items);
  },

  removeItem(key) {
    const items = this._load().filter(i => (i.key || String(i.id)) !== String(key));
    this._save(items);
  },

  updateQuantity(key, qty) {
    const items = this._load();
    const item = items.find(i => (i.key || String(i.id)) === String(key));
    if (!item) return;
    if (qty <= 0) {
      this.removeItem(key);
      return;
    }
    item.quantity = qty;
    this._save(items);
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._emit();
  }
};

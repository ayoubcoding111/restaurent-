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

  addItem(product, qty = 1) {
    const items = this._load();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url,
        category: product.category,
        quantity: qty
      });
    }
    this._save(items);
  },

  removeItem(id) {
    const items = this._load().filter(i => i.id !== id);
    this._save(items);
  },

  updateQuantity(id, qty) {
    const items = this._load();
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) {
      this.removeItem(id);
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

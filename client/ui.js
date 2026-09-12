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

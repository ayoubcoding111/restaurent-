// ============================================
// Shared validators — single source of truth for
// rules enforced in BOTH frontend and backend.
// Plain script (no modules): browser loads it via
// <script src="validators.js">, server via require().
// Changing a rule here changes it everywhere.
// ============================================
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) module.exports = factory();
    else root.SharedValidators = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    // Minimum password length (server + client + HTML minlength hints).
    const PASSWORD_MIN = 6;

    // Algerian mobile: 05/06/07 (10 digits) or +213 5/6/7 + 8 digits.
    // Spaces, dots, dashes and parens are ignored: "0555 12 34 56" is valid.
    const DZ_PHONE_RE = /^(\+213|0)(5|6|7)\d{8}$/;

    function normalizeDZPhone(phone) {
        return String(phone == null ? '' : phone).replace(/[\s.\-()]/g, '');
    }

    function isValidDZPhone(phone) {
        return DZ_PHONE_RE.test(normalizeDZPhone(phone));
    }

    function isValidEmail(email) {
        return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    return { PASSWORD_MIN, DZ_PHONE_RE, normalizeDZPhone, isValidDZPhone, isValidEmail };
}));

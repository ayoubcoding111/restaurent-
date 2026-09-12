require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('./config/db');
const { sendPasswordResetEmail, isMailConfigured } = require('./config/mailer');

const app = express();
const PORT = process.env.PORT || 3000;
const clientDir = path.join(__dirname, '..', 'client');
const uploadsDir = path.join(__dirname, 'uploads');

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(clientDir));
app.use('/uploads', express.static(uploadsDir));

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ============================================
// Rate limiting — anti-spam / anti-brute-force
// ============================================
const tooManyMsg = { success: false, message: 'Too many requests. Please try again later.' };

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg
});

// Public order creation: generous enough for normal use, blocks spam floods
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg
});

// Login / reset: slow down credential guessing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg
});

const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg
});

app.use('/api/', generalLimiter);

// ============================================
// Multer config
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowedTypes.test(file.mimetype);
        cb(null, extOk && mimeOk);
    }
});

// ============================================
// Auth — in-memory token sessions
// ============================================
const sessions = new Map(); // token → { userId, role, username }

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function authenticateToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = header.split(' ')[1];
    const session = sessions.get(token);
    if (!session) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = session;
    next();
}

function requireAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        next();
    });
}

// ============================================
// Auth Routes
// ============================================
function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Algerian mobile: 05 / 06 / 07 (10 digits) or +213 5/6/7 + 8 digits.
// Spaces, dots and dashes are ignored: "0555 12 34 56" is accepted.
function normalizeDZPhone(phone) {
    if (typeof phone !== 'string') return '';
    return phone.replace(/[\s.\-()]/g, '');
}

function isValidDZPhone(phone) {
    const cleaned = normalizeDZPhone(phone);
    return /^(\+213|0)(5|6|7)\d{8}$/.test(cleaned);
}

// Login accepts username OR email (field: "username" kept for backward
// compat, or "identifier"/"email"). Returns token + role on success.
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const identifier = (req.body.identifier || req.body.username || req.body.email || '').trim();
        const { password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Email/username and password required' });
        }
        const [rows] = await db.query('SELECT * FROM staff WHERE username = ? OR email = ?', [identifier, identifier]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = generateToken();
        sessions.set(token, { userId: user.id, role: user.role, username: user.username, email: user.email, full_name: user.full_name });
        res.json({ success: true, token, role: user.role, username: user.username, full_name: user.full_name });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Request a password reset link. Accepts email OR username, but the link can
// only be emailed — so the account must have an email on file. Unknown
// accounts still get a generic success to avoid revealing which exist.
// Sends a real email when SMTP is configured.
app.post('/api/auth/forgot-password', forgotLimiter, async (req, res) => {
    try {
        const identifier = (req.body.email || req.body.identifier || req.body.username || '').trim();
        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Email or username is required' });
        }
        let rows;
        if (isValidEmail(identifier)) {
            [rows] = await db.query('SELECT id, full_name, email FROM staff WHERE email = ?', [identifier.toLowerCase()]);
        } else {
            [rows] = await db.query('SELECT id, full_name, email FROM staff WHERE username = ?', [identifier]);
        }
        if (rows.length === 0) {
            return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
        }
        const user = rows[0];
        if (!user.email || !isValidEmail(user.email)) {
            return res.status(400).json({ success: false, message: 'This account has no email on file. Ask an admin to set one first.' });
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db.query('UPDATE staff SET reset_token = ?, reset_expires = ? WHERE id = ?', [token, expires, user.id]);

        const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
        const resetUrl = `${appUrl}/#reset-password?token=${token}`;

        try {
            const result = await sendPasswordResetEmail(user.email, user.full_name, resetUrl);
            if (!result.sent) {
                // Dev fallback so the flow is testable without SMTP:
                console.log(`🔑 Reset token for ${user.email}: ${token}`);
                return res.json({
                    success: true,
                    message: 'If an account exists for this email, a reset link has been generated. (SMTP not configured — see server logs.)',
                    ...(process.env.NODE_ENV !== 'production' ? { debugResetUrl: resetUrl } : {})
                });
            }
        } catch (mailError) {
            console.error('Failed to send reset email:', mailError);
            return res.status(502).json({ success: false, message: 'Could not send reset email. Please try again later.' });
        }
        res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot-password error:', error);
        res.status(500).json({ success: false, message: 'Request failed' });
    }
});

// Consume a reset token and set a new password.
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        const [rows] = await db.query('SELECT id, reset_expires FROM staff WHERE reset_token = ?', [token]);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
        }
        const user = rows[0];
        if (!user.reset_expires || new Date(user.reset_expires).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
        }
        const hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE staff SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hash, user.id]);
        // Invalidate any active sessions for this user
        for (const [t, s] of sessions) {
            if (s.userId === user.id) sessions.delete(t);
        }
        res.json({ success: true, message: 'Password has been reset. You can now log in.' });
    } catch (error) {
        console.error('Reset-password error:', error);
        res.status(500).json({ success: false, message: 'Reset failed' });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    sessions.delete(token);
    res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// ============================================
// Staff Routes (admin only)
// ============================================
// Lightweight name list for the order-assignment dropdown (any logged staff).
app.get('/api/staff/names', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, full_name FROM staff ORDER BY full_name, username');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching staff names:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff' });
    }
});

app.get('/api/staff', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, email, full_name, role, created_at FROM staff ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff' });
    }
});

app.post('/api/staff', requireAdmin, async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        if (!username || !password || !full_name || !email) {
            return res.status(400).json({ success: false, message: 'Username, email, password, and full name are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'A valid email address is required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        const hash = await bcrypt.hash(password, 10);
        const staffRole = role === 'admin' ? 'admin' : 'staff';
        const [result] = await db.query(
            'INSERT INTO staff (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username.trim(), email.trim().toLowerCase(), hash, full_name, staffRole]
        );
        res.json({ success: true, message: 'Staff account created', data: { id: result.insertId, username, email, full_name, role: staffRole } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }
        console.error('Error creating staff:', error);
        res.status(500).json({ success: false, message: 'Failed to create staff account' });
    }
});

app.delete('/api/staff/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (id === req.user.userId) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        await db.query('DELETE FROM staff WHERE id = ?', [id]);
        res.json({ success: true, message: 'Staff account deleted' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ success: false, message: 'Failed to delete staff account' });
    }
});

// Admin edits any staff account: infos, role, credentials.
// Password is optional — blank means "keep current".
app.patch('/api/staff/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { username, email, full_name, role, password } = req.body;
        const [existing] = await db.query('SELECT id FROM staff WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        if (!username || !username.trim() || !full_name || !full_name.trim()) {
            return res.status(400).json({ success: false, message: 'Username and full name are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'A valid email address is required' });
        }
        const staffRole = role === 'admin' ? 'admin' : 'staff';
        if (id === req.user.userId && staffRole !== req.user.role) {
            return res.status(400).json({ success: false, message: 'You cannot change your own role' });
        }
        const fields = ['username = ?', 'email = ?', 'full_name = ?', 'role = ?'];
        const values = [username.trim(), email.trim().toLowerCase(), full_name.trim(), staffRole];
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            }
            fields.push('password = ?');
            values.push(await bcrypt.hash(password, 10));
        }
        values.push(id);
        await db.query(`UPDATE staff SET ${fields.join(', ')} WHERE id = ?`, values);
        if (password) {
            // New credentials → drop that user's sessions (they must log in again)
            for (const [t, s] of sessions) {
                if (s.userId === id) sessions.delete(t);
            }
        }
        const [[updated]] = await db.query('SELECT id, username, email, full_name, role, created_at FROM staff WHERE id = ?', [id]);
        res.json({ success: true, message: 'Account updated', data: updated });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }
        console.error('Error updating staff:', error);
        res.status(500).json({ success: false, message: 'Failed to update account' });
    }
});

// ---- Self service: logged-in user edits own profile (no role change) ----
app.patch('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, full_name } = req.body;
        if (!username || !username.trim() || !full_name || !full_name.trim()) {
            return res.status(400).json({ success: false, message: 'Username and full name are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'A valid email address is required' });
        }
        await db.query('UPDATE staff SET username = ?, email = ?, full_name = ? WHERE id = ?',
            [username.trim(), email.trim().toLowerCase(), full_name.trim(), req.user.userId]);
        // Refresh live sessions so the UI shows the new name immediately
        for (const s of sessions.values()) {
            if (s.userId === req.user.userId) {
                s.username = username.trim();
                s.email = email.trim().toLowerCase();
                s.full_name = full_name.trim();
            }
        }
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username or email already taken' });
        }
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// ---- Self service: change own password (must prove current one) ----
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        const [[row]] = await db.query('SELECT password FROM staff WHERE id = ?', [req.user.userId]);
        if (!row || !(await bcrypt.compare(currentPassword, row.password))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        await db.query('UPDATE staff SET password = ? WHERE id = ?', [await bcrypt.hash(newPassword, 10), req.user.userId]);
        // Keep this session, drop any others (e.g. other devices)
        const currentToken = req.headers.authorization.split(' ')[1];
        for (const [t, s] of sessions) {
            if (s.userId === req.user.userId && t !== currentToken) sessions.delete(t);
        }
        res.json({ success: true, message: 'Password changed' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

// ============================================
// Orders Routes
// ============================================
app.post('/api/orders', orderLimiter, async (req, res) => {
    try {
        const { customer_name, customer_phone, customer_address, items, total, zone_id } = req.body;
        if (!customer_name || !customer_phone || !customer_address || !items || total == null) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (!isValidDZPhone(customer_phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number. Use 05/06/07 (10 digits) or +213…' });
        }
        const cleanPhone = normalizeDZPhone(customer_phone);
        const itemsArr = Array.isArray(items) ? items : null;
        if (!itemsArr || itemsArr.length === 0 || itemsArr.length > 50) {
            return res.status(400).json({ success: false, message: 'Order must contain between 1 and 50 items' });
        }
        // Server-side subtotal from the posted lines (price × quantity)
        let subtotal = 0;
        for (const it of itemsArr) {
            const p = Number(it.price);
            const q = Number(it.quantity);
            if (isFinite(p) && isFinite(q) && p >= 0 && q > 0) subtotal += p * q;
        }
        subtotal = Math.round(subtotal * 100) / 100;

        // Delivery zone → server-side fee (prevents client tampering)
        let zoneId = zone_id != null && zone_id !== '' ? parseInt(zone_id) : null;
        if (zoneId != null && !Number.isInteger(zoneId)) {
            return res.status(400).json({ success: false, message: 'Invalid delivery zone' });
        }
        let deliveryFee = 0;
        if (zoneId != null) {
            try {
                const [[zone]] = await db.query('SELECT * FROM delivery_zones WHERE id = ?', [zoneId]);
                if (!zone) return res.status(400).json({ success: false, message: 'Invalid delivery zone' });
                if (!zone.is_active) return res.status(400).json({ success: false, message: 'Delivery zone is not available' });
                const baseFee = Number(zone.fee) || 0;
                const freeOver = zone.free_over != null ? Number(zone.free_over) : null;
                deliveryFee = (freeOver != null && subtotal >= freeOver) ? 0 : baseFee;
            } catch {
                // zones table missing (very old DB) → treat as no-fee order
                zoneId = null;
                deliveryFee = 0;
            }
        }
        const serverTotal = Math.round((subtotal + deliveryFee) * 100) / 100;
        const [result] = await db.query(
            'INSERT INTO orders (customer_name, customer_phone, customer_address, items, total, zone_id, subtotal, delivery_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [String(customer_name).trim().slice(0, 255), cleanPhone, String(customer_address).trim().slice(0, 1000), JSON.stringify(itemsArr), serverTotal, zoneId, subtotal, deliveryFee]
        );
        res.json({ success: true, message: 'Order placed', orderId: result.insertId, total: serverTotal, subtotal, delivery_fee: deliveryFee });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        let rows;
        try {
            [rows] = await db.query(
                `SELECT o.*, dz.name AS zone_name, s.full_name AS assigned_name
                 FROM orders o
                 LEFT JOIN delivery_zones dz ON dz.id = o.zone_id
                 LEFT JOIN staff s ON s.id = o.assigned_to
                 ORDER BY o.created_at DESC`
            );
        } catch {
            // Fallback for DBs where the zone/assign migration hasn't run yet
            [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        }
        // Parse items JSON
        rows.forEach(row => {
            try { row.items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items; }
            catch { row.items = []; }
        });
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

app.patch('/api/orders/:id/assign', authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        if (!Number.isInteger(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order id' });
        }
        const raw = req.body.staff_id;
        const staffId = raw == null || raw === '' ? null : parseInt(raw);
        if (staffId !== null && !Number.isInteger(staffId)) {
            return res.status(400).json({ success: false, message: 'Invalid staff id' });
        }
        if (staffId !== null) {
            const [exists] = await db.query('SELECT id FROM staff WHERE id = ?', [staffId]);
            if (exists.length === 0) {
                return res.status(404).json({ success: false, message: 'Staff account not found' });
            }
        }
        await db.query('UPDATE orders SET assigned_to = ? WHERE id = ?', [staffId, orderId]);
        res.json({ success: true, message: staffId == null ? 'Order unassigned' : 'Order assigned' });
    } catch (error) {
        console.error('Error assigning order:', error);
        res.status(500).json({ success: false, message: 'Failed to assign order' });
    }
});

// ============================================
// Delivery zones — public list + admin CRUD
// (fees are always recomputed server-side at order time)
// ============================================
app.get('/api/zones', async (req, res) => {
    try {
        if (req.query.all === '1') {
            // Admin view: needs a valid session, then admin role
            const header = req.headers.authorization;
            if (!header || !header.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const session = sessions.get(header.split(' ')[1]);
            if (!session) return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            if (session.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
            const [rows] = await db.query('SELECT * FROM delivery_zones ORDER BY sort_order, id');
            return res.json({ success: true, data: rows });
        }
        const [rows] = await db.query(
            'SELECT id, name, name_fr, name_ar, fee, free_over, eta_min, sort_order FROM delivery_zones WHERE is_active = 1 ORDER BY sort_order, id'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching zones:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch zones' });
    }
});

app.post('/api/zones', requireAdmin, async (req, res) => {
    try {
        const { name, name_fr, name_ar, fee, free_over, eta_min, is_active, sort_order } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'Zone name is required' });
        }
        const feeNum = Number(fee);
        if (!isFinite(feeNum) || feeNum < 0 || feeNum > 9999) {
            return res.status(400).json({ success: false, message: 'Fee must be a number between 0 and 9999' });
        }
        const freeNum = free_over == null || free_over === '' ? null : Number(free_over);
        if (freeNum !== null && (!isFinite(freeNum) || freeNum < 0)) {
            return res.status(400).json({ success: false, message: 'free_over must be a positive number or empty' });
        }
        const etaNum = eta_min == null || eta_min === '' ? null : parseInt(eta_min);
        if (etaNum !== null && (!Number.isInteger(etaNum) || etaNum < 0 || etaNum > 1440)) {
            return res.status(400).json({ success: false, message: 'eta_min must be 0–1440 or empty' });
        }
        const clean = v => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null);
        const activeFlag = (is_active === 0 || is_active === false || is_active === '0') ? 0 : 1;
        const [result] = await db.query(
            `INSERT INTO delivery_zones (name, name_fr, name_ar, fee, free_over, eta_min, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [String(name).trim().slice(0, 100), clean(name_fr), clean(name_ar), feeNum,
             freeNum, etaNum, activeFlag, Number.isInteger(parseInt(sort_order)) ? parseInt(sort_order) : 0]
        );
        const [[created]] = await db.query('SELECT * FROM delivery_zones WHERE id = ?', [result.insertId]);
        res.json({ success: true, message: 'Zone added', data: created });
    } catch (error) {
        console.error('Error creating zone:', error);
        res.status(500).json({ success: false, message: 'Failed to add zone' });
    }
});

app.patch('/api/zones/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid zone id' });
        const [existing] = await db.query('SELECT * FROM delivery_zones WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Zone not found' });
        const fields = [];
        const values = [];
        const clean100 = v => String(v).trim().slice(0, 100);
        if (req.body.name !== undefined) {
            if (!String(req.body.name).trim()) return res.status(400).json({ success: false, message: 'Zone name cannot be empty' });
            fields.push('name = ?'); values.push(clean100(req.body.name));
        }
        for (const key of ['name_fr', 'name_ar']) {
            if (req.body[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(req.body[key] == null || req.body[key] === '' ? null : clean100(req.body[key]));
            }
        }
        if (req.body.fee !== undefined) {
            const f = Number(req.body.fee);
            if (!isFinite(f) || f < 0 || f > 9999) return res.status(400).json({ success: false, message: 'Invalid fee' });
            fields.push('fee = ?'); values.push(f);
        }
        if (req.body.free_over !== undefined) {
            const v = req.body.free_over == null || req.body.free_over === '' ? null : Number(req.body.free_over);
            if (v !== null && (!isFinite(v) || v < 0)) return res.status(400).json({ success: false, message: 'Invalid free_over' });
            fields.push('free_over = ?'); values.push(v);
        }
        if (req.body.eta_min !== undefined) {
            const v = req.body.eta_min == null || req.body.eta_min === '' ? null : parseInt(req.body.eta_min);
            if (v !== null && (!Number.isInteger(v) || v < 0 || v > 1440)) return res.status(400).json({ success: false, message: 'Invalid eta_min' });
            fields.push('eta_min = ?'); values.push(v);
        }
        if (req.body.is_active !== undefined) {
            fields.push('is_active = ?'); values.push(req.body.is_active ? 1 : 0);
        }
        if (req.body.sort_order !== undefined) {
            const s = parseInt(req.body.sort_order);
            if (Number.isInteger(s)) { fields.push('sort_order = ?'); values.push(s); }
        }
        if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
        values.push(id);
        await db.query(`UPDATE delivery_zones SET ${fields.join(', ')} WHERE id = ?`, values);
        const [[updated]] = await db.query('SELECT * FROM delivery_zones WHERE id = ?', [id]);
        res.json({ success: true, message: 'Zone updated', data: updated });
    } catch (error) {
        console.error('Error updating zone:', error);
        res.status(500).json({ success: false, message: 'Failed to update zone' });
    }
});

app.delete('/api/zones/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid zone id' });
        await db.query('DELETE FROM delivery_zones WHERE id = ?', [id]);
        // Old orders keep their stored totals — zone_id on orders is nullable with no FK.
        res.json({ success: true, message: 'Zone deleted' });
    } catch (error) {
        console.error('Error deleting zone:', error);
        res.status(500).json({ success: false, message: 'Failed to delete zone' });
    }
});

// ============================================
// Analytics (admin only)
// NOTE: orders are never deleted — delivered history accumulates forever,
// which is what powers the day-by-day comparisons below.
// GET /api/analytics?days=14 (7..90)
// ============================================
app.get('/api/analytics', requireAdmin, async (req, res) => {
    try {
        let days = parseInt(req.query.days, 10);
        if (!Number.isFinite(days)) days = 14;
        days = Math.min(90, Math.max(7, days));

        const [[totals]] = await db.query(
            `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue,
                    COALESCE(AVG(total), 0) AS avgOrder,
                    SUM(status = 'delivered') AS deliveredOrders,
                    COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS deliveredRevenue
             FROM orders`
        );
        const [byStatus] = await db.query(
            'SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue FROM orders GROUP BY status'
        );
        // Current window, per day (fills only days that have orders)
        const [byDay] = await db.query(
            `SELECT DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue,
                    SUM(status = 'delivered') AS delivered
             FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at) ORDER BY day ASC`,
            [days - 1]
        );
        // Previous window of equal length, for comparison
        const [[prev]] = await db.query(
            `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
             FROM orders
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
               AND created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            [days * 2 - 1, days]
        );
        const [allItems] = await db.query('SELECT items FROM orders');
        const map = new Map();
        allItems.forEach(row => {
            let items = [];
            try { items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []); }
            catch { items = []; }
            (Array.isArray(items) ? items : []).forEach(i => {
                const key = i.name || 'Unknown item';
                const entry = map.get(key) || { name: key, qty: 0, revenue: 0 };
                const qty = Number(i.quantity) || 0;
                entry.qty += qty;
                entry.revenue += (Number(i.price) || 0) * qty;
                map.set(key, entry);
            });
        });
        const topItems = [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
        // Fill calendar days that had no orders so charts stay continuous
        const byDayMap = new Map(byDay.map(d => [new Date(d.day).toISOString().slice(0, 10), d]));
        const filledDays = [];
        for (let i = days - 1; i >= 0; i--) {
            const dt = new Date();
            dt.setDate(dt.getDate() - i);
            const key = dt.toISOString().slice(0, 10);
            const row = byDayMap.get(key);
            filledDays.push({
                day: key,
                orders: row ? Number(row.orders) : 0,
                revenue: row ? Number(row.revenue) : 0,
                delivered: row ? Number(row.delivered) : 0
            });
        }
        res.json({ success: true, data: { totals, byStatus, byDay: filledDays, prev, days, topItems } });
    } catch (error) {
        console.error('Error building analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to load analytics' });
    }
});

// ============================================
// Item Routes
// ============================================
async function attachOptions(items) {
    if (!items.length) return items;
    const ids = items.map(i => i.id);
    const [opts] = await db.query(
        `SELECT * FROM item_options WHERE item_id IN (?) ORDER BY item_id, sort_order, id`, [ids]
    );
    const map = {};
    opts.forEach(o => { (map[o.item_id] = map[o.item_id] || []).push(o); });
    items.forEach(i => { i.options = map[i.id] || []; });
    return items;
}

// Approved rating summary: { itemId: { avg, count } }
async function attachRatings(items) {
    if (!items.length) return items;
    const ids = items.map(i => i.id);
    try {
        const [rows] = await db.query(
            `SELECT item_id, COUNT(*) AS count, AVG(rating) AS avg
             FROM reviews WHERE item_id IN (?) AND is_approved = 1 GROUP BY item_id`, [ids]
        );
        const map = {};
        rows.forEach(r => { map[r.item_id] = { avg: Number(r.avg), count: Number(r.count) }; });
        items.forEach(i => {
            const s = map[i.id] || { avg: 0, count: 0 };
            i.rating_avg = Math.round(s.avg * 10) / 10;
            i.rating_count = s.count;
        });
    } catch {
        items.forEach(i => { i.rating_avg = 0; i.rating_count = 0; });
    }
    return items;
}

app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY created_at DESC');
        await attachOptions(rows);
        await attachRatings(rows);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
});

app.get('/api/items/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        await attachOptions(rows);
        await attachRatings(rows);
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch item' });
    }
});

app.post('/api/items', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        if (!name || !price || !category) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }
        const image_url = '/uploads/' + req.file.filename;
        const desc = description || null;
        const [result] = await db.query(
            'INSERT INTO items (name, price, category, description, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, parseFloat(price), category, desc, image_url]
        );
        res.json({ success: true, message: 'Item added', data: { id: result.insertId, name, price, category, description: desc, image_url } });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, message: 'Failed to add item' });
    }
});

app.patch('/api/items/:id/availability', requireAdmin, async (req, res) => {
    try {
        const { is_available } = req.body;
        await db.query('UPDATE items SET is_available = ? WHERE id = ?', [is_available ? 1 : 0, req.params.id]);
        res.json({ success: true, message: 'Availability updated' });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ success: false, message: 'Failed to update availability' });
    }
});

// Edit a menu item (image optional — kept when no new file is uploaded)
app.put('/api/items/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        if (!name || !price || !category) {
            return res.status(400).json({ success: false, message: 'Name, price and category are required' });
        }
        const [existing] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        let image_url = existing[0].image_url;
        if (req.file) {
            const oldPath = path.join(__dirname, existing[0].image_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            image_url = '/uploads/' + req.file.filename;
        }
        await db.query(
            'UPDATE items SET name = ?, price = ?, category = ?, description = ?, image_url = ? WHERE id = ?',
            [name, parseFloat(price), category, description || null, image_url, req.params.id]
        );
        const [[updated]] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        await attachOptions([updated]);
        res.json({ success: true, message: 'Item updated', data: updated });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ success: false, message: 'Failed to update item' });
    }
});

// Replace all customization options of an item in one shot
app.put('/api/items/:id/options', requireAdmin, async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const options = Array.isArray(req.body.options) ? req.body.options : null;
        if (!options) return res.status(400).json({ success: false, message: 'options array is required' });
        const [existing] = await db.query('SELECT id FROM items WHERE id = ?', [itemId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        for (const o of options) {
            if (!o.name || typeof o.name !== 'string' || o.name.trim().length === 0 || o.name.length > 255) {
                return res.status(400).json({ success: false, message: 'Each option needs a name (max 255 chars)' });
            }
            if (!isFinite(Number(o.price_delta)) || Number(o.price_delta) < 0 || Number(o.price_delta) > 9999) {
                return res.status(400).json({ success: false, message: `Invalid extra price for "${o.name}"` });
            }
        }
        await db.query('DELETE FROM item_options WHERE item_id = ?', [itemId]);
        let sort = 0;
        const clean = v => (typeof v === 'string' ? v.trim().slice(0, 255) : null);
        const cleanGroup = v => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : 'Extras');
        for (const o of options) {
            sort += 1;
            await db.query(
                `INSERT INTO item_options
                 (item_id, group_name, group_fr, group_ar, name, name_fr, name_ar, price_delta, choice, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemId, cleanGroup(o.group_name), clean(o.group_fr), clean(o.group_ar),
                 o.name.trim(), clean(o.name_fr), clean(o.name_ar),
                 Number(o.price_delta) || 0, o.choice === 'single' ? 'single' : 'multi', sort]
            );
        }
        const [rows] = await db.query('SELECT * FROM item_options WHERE item_id = ? ORDER BY sort_order, id', [itemId]);
        res.json({ success: true, message: 'Options saved', data: rows });
    } catch (error) {
        console.error('Error saving options:', error);
        res.status(500).json({ success: false, message: 'Failed to save options' });
    }
});

app.delete('/api/items/:id', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT image_url FROM items WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            const imagePath = path.join(__dirname, rows[0].image_url);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, message: 'Failed to delete item' });
    }
});

// ============================================
// Reviews — public list/submit, admin moderation
// ============================================
app.get('/api/items/:id/reviews', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, rater_name, rating, comment, created_at FROM reviews WHERE item_id = ? AND is_approved = 1 ORDER BY created_at DESC LIMIT 50',
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

app.post('/api/items/:id/reviews', orderLimiter, async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const { name, rating, comment } = req.body;
        const stars = parseInt(rating);
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be 1–5' });
        }
        const [existing] = await db.query('SELECT id FROM items WHERE id = ?', [itemId]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 500) : null;
        await db.query(
            'INSERT INTO reviews (item_id, rater_name, rating, comment, is_approved) VALUES (?, ?, ?, ?, 0)',
            [itemId, String(name).trim().slice(0, 100), stars, cleanComment || null]
        );
        res.json({ success: true, message: 'Review submitted for moderation' });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
});

app.get('/api/reviews', requireAdmin, async (req, res) => {
    try {
        let sql = `SELECT r.*, i.name AS item_name FROM reviews r
                   LEFT JOIN items i ON i.id = r.item_id`;
        const params = [];
        if (req.query.pending === '1') sql += ' WHERE r.is_approved = 0';
        sql += ' ORDER BY r.created_at DESC LIMIT 200';
        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

app.patch('/api/reviews/:id', requireAdmin, async (req, res) => {
    try {
        const approved = req.body.is_approved ? 1 : 0;
        await db.query('UPDATE reviews SET is_approved = ? WHERE id = ?', [approved, req.params.id]);
        res.json({ success: true, message: approved ? 'Review approved' : 'Review hidden' });
    } catch (error) {
        console.error('Error moderating review:', error);
        res.status(500).json({ success: false, message: 'Failed to update review' });
    }
});

app.delete('/api/reviews/:id', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
});

// ============================================
// SPA Fallback
// ============================================
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
});

// ============================================
// Admin Bootstrap & Start
// ============================================
// ============================================
// Migration: add description column if missing
// ============================================
async function migrateDB() {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM items LIKE 'description'");
        if (cols.length === 0) {
            await db.query('ALTER TABLE items ADD COLUMN description TEXT DEFAULT NULL AFTER category');
            console.log('✅ Added description column to items table');
        }
        // Staff: real email login + password reset
        const [emailCols] = await db.query("SHOW COLUMNS FROM staff LIKE 'email'");
        if (emailCols.length === 0) {
            await db.query('ALTER TABLE staff ADD COLUMN email VARCHAR(255) UNIQUE NULL AFTER username');
            console.log('✅ Added email column to staff table');
        }
        const [tokenCols] = await db.query("SHOW COLUMNS FROM staff LIKE 'reset_token'");
        if (tokenCols.length === 0) {
            await db.query('ALTER TABLE staff ADD COLUMN reset_token VARCHAR(128) DEFAULT NULL AFTER role');
            console.log('✅ Added reset_token column to staff table');
        }
        const [expCols] = await db.query("SHOW COLUMNS FROM staff LIKE 'reset_expires'");
        if (expCols.length === 0) {
            await db.query('ALTER TABLE staff ADD COLUMN reset_expires DATETIME DEFAULT NULL AFTER reset_token');
            console.log('✅ Added reset_expires column to staff table');
        }
        // Item customization options (ingredients, sizes…)
        await db.query(`CREATE TABLE IF NOT EXISTS item_options (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id INT NOT NULL,
            group_name VARCHAR(100) NOT NULL DEFAULT 'Extras',
            name VARCHAR(255) NOT NULL,
            price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0,
            choice ENUM('single', 'multi') NOT NULL DEFAULT 'multi',
            sort_order INT NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        )`);
        for (const col of ['group_fr VARCHAR(100) DEFAULT NULL', 'group_ar VARCHAR(100) DEFAULT NULL',
                           'name_fr VARCHAR(255) DEFAULT NULL', 'name_ar VARCHAR(255) DEFAULT NULL']) {
            const colName = col.split(' ')[0];
            const [has] = await db.query('SHOW COLUMNS FROM item_options LIKE ?', [colName]);
            if (has.length === 0) {
                await db.query(`ALTER TABLE item_options ADD COLUMN ${col}`);
                console.log(`✅ Added ${colName} column to item_options`);
            }
        }
        const [[optCount]] = await db.query('SELECT COUNT(*) AS c FROM item_options');
        if (Number(optCount.c) === 0) {
            // Attached by CATEGORY so samples work whatever the dishes are named
            await db.query(`INSERT INTO item_options (item_id, group_name, name, price_delta, choice, sort_order)
                SELECT id, 'Extra ingredients', 'Extra Cheese', 2.50, 'multi', 1 FROM items WHERE category = 'pizzas'
                UNION ALL SELECT id, 'Extra ingredients', 'Mushrooms', 1.50, 'multi', 2 FROM items WHERE category = 'pizzas'
                UNION ALL SELECT id, 'Extra ingredients', 'Olives', 1.00, 'multi', 3 FROM items WHERE category = 'pizzas'
                UNION ALL SELECT id, 'Extra ingredients', 'Extra Meat', 3.00, 'multi', 1 FROM items WHERE category = 'tacos'
                UNION ALL SELECT id, 'Extra ingredients', 'Cheese', 1.50, 'multi', 2 FROM items WHERE category = 'tacos'
                UNION ALL SELECT id, 'Extra ingredients', 'Guacamole', 2.00, 'multi', 3 FROM items WHERE category = 'tacos'
                UNION ALL SELECT id, 'Size', '30cl', 0.00, 'single', 1 FROM items WHERE category = 'drinks'
                UNION ALL SELECT id, 'Size', '1L', 2.00, 'single', 2 FROM items WHERE category = 'drinks'
                UNION ALL SELECT id, 'Size', '2L', 4.00, 'single', 3 FROM items WHERE category = 'drinks'
                UNION ALL SELECT id, 'Extras', 'Extra Wings', 5.00, 'multi', 1 FROM items WHERE category = 'familypack'
                UNION ALL SELECT id, 'Extras', 'Extra Drink', 2.00, 'multi', 2 FROM items WHERE category = 'familypack'`);
            console.log('✅ Seeded sample item options');
        }
        // Backfill French/Arabic names for the built-in option sets
        const optTranslations = [
            ['Extra Cheese', 'Fromage supplémentaire', 'جبن إضافي', 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية'],
            ['Mushrooms', 'Champignons', 'فطر', 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية'],
            ['Olives', 'Olives', 'زيتون', 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية'],
            ['Extra Meat', 'Viande supplémentaire', 'لحم إضافي', 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية'],
            ['Cheese', 'Fromage', 'جبن', 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية'],
            ['Guacamole', 'Guacamole', 'غواكامولي', 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية'],
            ['30cl', '30cl', '30سل', 'Size', 'Taille', 'الحجم'],
            ['1L', '1L', '1ل', 'Size', 'Taille', 'الحجم'],
            ['2L', '2L', '2ل', 'Size', 'Taille', 'الحجم'],
            ['Extra Wings', 'Ailes supplémentaires', 'أجنحة إضافية', 'Extras', 'Extras', 'إضافات'],
            ['Extra Drink', 'Boisson supplémentaire', 'مشروب إضافي', 'Extras', 'Extras', 'إضافات']
        ];
        for (const [en, fr, ar, g, gfr, gar] of optTranslations) {
            await db.query(
                `UPDATE item_options SET name_fr = ?, name_ar = ?, group_fr = ?, group_ar = ?
                 WHERE name = ? AND name_fr IS NULL`, [fr, ar, gfr, gar, en]
            );
        }
        // Reviews (item ratings, admin-moderated)
        await db.query(`CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id INT NOT NULL,
            rater_name VARCHAR(100) NOT NULL,
            rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT DEFAULT NULL,
            is_approved TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        )`);
        // Delivery zones (fees computed server-side at order time)
        await db.query(`CREATE TABLE IF NOT EXISTS delivery_zones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            name_fr VARCHAR(100) DEFAULT NULL,
            name_ar VARCHAR(100) DEFAULT NULL,
            fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
            free_over DECIMAL(10, 2) DEFAULT NULL,
            eta_min INT DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            sort_order INT NOT NULL DEFAULT 0
        )`);
        const [[zoneCount]] = await db.query('SELECT COUNT(*) AS c FROM delivery_zones');
        if (Number(zoneCount.c) === 0) {
            await db.query(`INSERT INTO delivery_zones (name, name_fr, name_ar, fee, free_over, eta_min, is_active, sort_order) VALUES
                ('City Center', 'Centre-ville', 'وسط المدينة', 2.00, 30.00, 30, 1, 1),
                ('Suburbs', 'Banlieue', 'الضواحي', 4.00, 50.00, 45, 1, 2),
                ('Outskirts', 'Périphérie', 'الأطراف', 6.00, NULL, 60, 1, 3)`);
            console.log('✅ Seeded delivery zones');
        }
        // Orders: zone + fee breakdown (nullable so old rows keep working)
        for (const col of ['zone_id INT DEFAULT NULL', 'subtotal DECIMAL(10, 2) DEFAULT NULL', 'delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0']) {
            const colName = col.split(' ')[0];
            const [has] = await db.query('SHOW COLUMNS FROM orders LIKE ?', [colName]);
            if (has.length === 0) {
                await db.query(`ALTER TABLE orders ADD COLUMN ${col}`);
                console.log(`✅ Added ${colName} column to orders`);
            }
        }
        // Orders: full kitchen workflow + assignment
        await db.query(`ALTER TABLE orders MODIFY status ENUM('pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered') NOT NULL DEFAULT 'pending'`);
        const [assCol] = await db.query("SHOW COLUMNS FROM orders LIKE 'assigned_to'");
        if (assCol.length === 0) {
            await db.query('ALTER TABLE orders ADD COLUMN assigned_to INT DEFAULT NULL');
            console.log('✅ Added assigned_to column to orders');
        }
        try {
            const [fk] = await db.query(
                `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'assigned_to'
                 AND REFERENCED_TABLE_NAME = 'staff'`
            );
            if (fk.length === 0) {
                await db.query('ALTER TABLE orders ADD CONSTRAINT fk_orders_assigned FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL');
                console.log('✅ Added assigned_to foreign key');
            }
        } catch (e) {
            console.warn('⚠️  assigned_to FK note:', e.message);
        }
    } catch (error) {
        // Non-fatal — table might not exist yet on fresh DB
        console.warn('⚠️  Migration note:', error.message);
    }
}

async function bootstrapAdmin() {
    try {
        // Admin seeding only — never overwrites an existing password.
        // Set ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD in server/.env
        // for first-time setup. Existing accounts in the database are left untouched.
        const [rows] = await db.query("SELECT id, email FROM staff WHERE role = 'admin' LIMIT 1");
        if (rows.length === 0) {
            const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
            const adminEmail = (process.env.ADMIN_EMAIL || 'admin@delicious-restaurant.com').trim().toLowerCase();
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hash = await bcrypt.hash(adminPassword, 10);
            await db.query(
                'INSERT INTO staff (username, email, password, full_name, role) VALUES (?, ?, ?, ?, \'admin\')',
                [adminUsername, adminEmail, hash, 'Administrator']
            );
            console.log(`✅ Default admin account created (${adminUsername})`);
        } else if (!rows[0].email && process.env.ADMIN_EMAIL) {
            await db.query('UPDATE staff SET email = ? WHERE id = ?', [process.env.ADMIN_EMAIL.trim().toLowerCase(), rows[0].id]);
            console.log('✅ Backfilled admin email');
        }
    } catch (error) {
        console.error('⚠️  Could not bootstrap admin:', error.message);
    }
}

async function start() {
    await migrateDB();
    await bootstrapAdmin();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

start();

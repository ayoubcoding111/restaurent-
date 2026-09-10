require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

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
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        const [rows] = await db.query('SELECT * FROM staff WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = generateToken();
        sessions.set(token, { userId: user.id, role: user.role, username: user.username, full_name: user.full_name });
        res.json({ success: true, token, role: user.role, username: user.username, full_name: user.full_name });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
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
app.get('/api/staff', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, full_name, role, created_at FROM staff ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff' });
    }
});

app.post('/api/staff', requireAdmin, async (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;
        if (!username || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Username, password, and full name are required' });
        }
        const hash = await bcrypt.hash(password, 10);
        const staffRole = role === 'admin' ? 'admin' : 'staff';
        const [result] = await db.query(
            'INSERT INTO staff (username, password, full_name, role) VALUES (?, ?, ?, ?)',
            [username, hash, full_name, staffRole]
        );
        res.json({ success: true, message: 'Staff account created', data: { id: result.insertId, username, full_name, role: staffRole } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username already exists' });
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

// ============================================
// Orders Routes
// ============================================
app.post('/api/orders', async (req, res) => {
    try {
        const { customer_name, customer_phone, customer_address, items, total } = req.body;
        if (!customer_name || !customer_phone || !customer_address || !items || !total) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const [result] = await db.query(
            'INSERT INTO orders (customer_name, customer_phone, customer_address, items, total) VALUES (?, ?, ?, ?, ?)',
            [customer_name, customer_phone, customer_address, JSON.stringify(items), parseFloat(total)]
        );
        res.json({ success: true, message: 'Order placed', orderId: result.insertId });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
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
        const validStatuses = ['pending', 'confirmed', 'delivered'];
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

// ============================================
// Item Routes
// ============================================
app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY created_at DESC');
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
    } catch (error) {
        // Non-fatal — table might not exist yet on fresh DB
        console.warn('⚠️  Migration note:', error.message);
    }
}

async function bootstrapAdmin() {
    try {
        const [rows] = await db.query("SELECT id FROM staff WHERE role = 'admin' LIMIT 1");
        if (rows.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await db.query(
                "INSERT INTO staff (username, password, full_name, role) VALUES (?, ?, ?, 'admin')",
                ['admin', hash, 'Administrator']
            );
            console.log('✅ Default admin account created (admin / admin123)');
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

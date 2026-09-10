require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to client folder (sibling of server)
const clientDir = path.join(__dirname, '..', 'client');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from ../client
app.use(express.static(clientDir));

// Serve uploaded images from server/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// HARDCODED ADMIN CREDENTIALS
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// ============================================
// API Routes
// ============================================

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
});

// Get single item
app.get('/api/items/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch item' });
    }
});

// Add new item (Admin only)
app.post('/api/items', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const image_url = '/uploads/' + req.file.filename;

        const [result] = await db.query(
            'INSERT INTO items (name, price, category, image_url) VALUES (?, ?, ?, ?)',
            [name, parseFloat(price), category, image_url]
        );

        res.json({
            success: true,
            message: 'Item added successfully',
            data: { id: result.insertId, name, price, category, image_url }
        });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, message: 'Failed to add item' });
    }
});

// Update item availability (Admin only)
app.patch('/api/items/:id/availability', async (req, res) => {
    try {
        const { is_available } = req.body;

        await db.query(
            'UPDATE items SET is_available = ? WHERE id = ?',
            [is_available ? 1 : 0, req.params.id]
        );

        res.json({ success: true, message: 'Availability updated' });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ success: false, message: 'Failed to update availability' });
    }
});

// Delete item (Admin only)
app.delete('/api/items/:id', async (req, res) => {
    try {
        // Get item to delete its image file
        const [rows] = await db.query('SELECT image_url FROM items WHERE id = ?', [req.params.id]);

        if (rows.length > 0) {
            const imagePath = path.join(__dirname, rows[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);

        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, message: 'Failed to delete item' });
    }
});

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

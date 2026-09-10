# Restaurant Web Application - Setup Guide

## Quick Start Guide

Follow these steps to get your restaurant application running:

### Step 1: Install MySQL Database

1. Download and install MySQL Server from: https://dev.mysql.com/downloads/mysql/
2. During installation, set a root password (remember this!)
3. Start the MySQL service

### Step 2: Create the Database

Open MySQL command line or MySQL Workbench and run:

```bash
mysql -u root -p < database.sql
```

Or manually execute the SQL commands from `database.sql`

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update with your MySQL password:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=restaurant_db
   PORT=3000
   ```

### Step 4: Add Sample Images

Place your images in the following locations:

1. **Hero Background Image**:
   - File: `public/images/frontpic.png`
   - Recommended size: 1920x1080px
   - This is the main banner image

2. **Sample Menu Images** (for the 3 pre-populated items):
   - `public/uploads/pizza1.jpg` - Pizza image
   - `public/uploads/taco1.jpg` - Taco image
   - `public/uploads/drink1.jpg` - Drink image
   - Recommended size: 800x800px or similar square ratio

**Note**: If you don't have images yet, the app will show a placeholder for missing images.

### Step 5: Start the Application

```bash
npm start
```

Or for development mode with auto-restart:
```bash
npm run dev
```

### Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

### Step 7: Admin Login

Click "Admin Login" in the top navigation and use:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in `server.js` before deploying to production!

## Features to Test

### As a Customer:
1. ✅ Browse the menu
2. ✅ Search for items by name
3. ✅ Filter by category (Pizzas, Tacos, Drinks, Family Pack)
4. ✅ Toggle between Dark and Light themes
5. ✅ See item availability status
6. ✅ View restaurant phone number to call and order

### As an Admin (after login):
1. ✅ Click "Admin Dashboard" button (appears after login)
2. ✅ Add new menu items with image upload
3. ✅ Toggle item availability (Available/Not Available)
4. ✅ Delete menu items
5. ✅ Changes reflect immediately on the customer menu

## Troubleshooting

### "Cannot connect to database"
- Make sure MySQL is running
- Check your `.env` credentials
- Verify the database `restaurant_db` exists

### "Port 3000 already in use"
- Change PORT in `.env` to another port (e.g., 3001)
- Or stop the process using port 3000

### Images not showing
- Check that the `uploads/` and `public/images/` directories exist
- Verify image file paths match the database entries
- Check file permissions

### Upload errors
- Make sure `uploads/` directory is writable
- Check file size (max 5MB)
- Verify file format (jpg, jpeg, png, gif, webp only)

## Production Deployment Checklist

Before deploying to production:

- [ ] Change admin credentials in `server.js`
- [ ] Set strong database password
- [ ] Enable HTTPS
- [ ] Configure CORS for your domain
- [ ] Set up proper error logging
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Set NODE_ENV=production
- [ ] Use a process manager (PM2)
- [ ] Set up database backups

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **File Upload**: Multer

## Project Structure

```
server/
├── config/
│   └── db.js                 # Database connection
├── public/
│   ├── css/
│   │   └── styles.css        # All styles with theme support
│   ├── js/
│   │   └── app.js            # Frontend logic
│   ├── images/               # Static images
│   │   └── frontpic.png      # Hero background (ADD THIS)
│   └── index.html            # Main page
├── uploads/                  # Uploaded menu images
│   ├── pizza1.jpg           # Sample (ADD THIS)
│   ├── taco1.jpg            # Sample (ADD THIS)
│   └── drink1.jpg           # Sample (ADD THIS)
├── database.sql              # Database setup
├── server.js                 # Express server
├── package.json
├── .env                      # Your config (CREATE THIS)
└── README.md
```

## Need Help?

Check the main README.md for detailed API documentation and additional information.

Enjoy your restaurant web application! 🍕🌮🍹

# Restaurant Web Application

A complete, production-ready full-stack restaurant web application with menu management, admin dashboard, and dark/light theme support.

## 🚀 Features

### Customer Features
- **Modern Landing Page** with hero section and restaurant info
- **Menu Display** with category filtering (Pizzas, Tacos, Drinks, Family Pack)
- **Search Functionality** to find menu items by name
- **Dark/Light Theme Toggle** with persistent preference
- **Call to Order Section** with restaurant phone number
- **Opening Hours** and contact information
- **Responsive Design** for all device sizes

### Admin Features
- **Secure Admin Login** (hardcoded credentials)
- **Add Menu Items** with image upload
- **Delete Menu Items**
- **Toggle Item Availability** (Available/Not Available)
- **Real-time Menu Updates**
- **Admin Dashboard** accessible only when logged in

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **File Uploads**: Multer
- **Styling**: Custom CSS with CSS Variables for theming

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn package manager

## ⚙️ Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup MySQL Database

Create the database and tables by running the SQL script:

```bash
mysql -u root -p < database.sql
```

Or manually execute the `database.sql` file in your MySQL client.

### 3. Configure Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_db
PORT=3000
```

### 4. Setup Sample Images

Create the following directories and add sample images:

```bash
mkdir -p public/images
mkdir -p public/uploads
```

Place your sample images:
- `public/images/frontpic.png` - Hero background image
- `public/uploads/pizza1.jpg` - Sample pizza image
- `public/uploads/taco1.jpg` - Sample taco image
- `public/uploads/drink1.jpg` - Sample drink image

### 5. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## 🔐 Admin Access

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

**Important**: Change these credentials in `server.js` for production use.

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                 # Database configuration
├── public/
│   ├── css/
│   │   └── styles.css        # Main stylesheet with theming
│   ├── js/
│   │   └── app.js            # Frontend JavaScript
│   ├── images/               # Static images
│   │   └── frontpic.png
│   └── index.html            # Main HTML file
├── uploads/                  # Uploaded menu item images
├── database.sql              # Database setup script
├── server.js                 # Express server
├── package.json              # Dependencies
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🎨 Theme Colors

The application uses a **Red** accent color scheme:
- Primary: `#dc2626`
- Primary Dark: `#b91c1c`
- Primary Light: `#ef4444`

Supports both light and dark modes with automatic theme persistence.

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/items` - Get all menu items

### Admin Endpoints
- `POST /api/admin/login` - Admin login
- `POST /api/items` - Add new menu item (with image upload)
- `PATCH /api/items/:id/availability` - Toggle item availability
- `DELETE /api/items/:id` - Delete menu item

## 📱 Responsive Breakpoints

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env` file
- Ensure database `restaurant_db` exists

### Image Upload Issues
- Verify `uploads/` directory exists and is writable
- Check file size (max 5MB)
- Ensure allowed image formats (jpg, jpeg, png, gif, webp)

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000

## 🚀 Production Deployment

1. Change admin credentials in `server.js`
2. Set strong database password
3. Configure proper CORS settings
4. Enable HTTPS
5. Use environment variables for all sensitive data
6. Implement rate limiting
7. Add input validation and sanitization
8. Setup proper error logging

## 📄 License

This project is open source and available for modification and distribution.

## 👨‍💻 Support

For issues or questions, please refer to the documentation or contact the development team.

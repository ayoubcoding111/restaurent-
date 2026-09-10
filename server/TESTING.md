# Testing Guide for Restaurant Application

## Pre-Testing Checklist

Before running tests, ensure:
- ✅ MySQL is installed and running
- ✅ Database created using `database.sql`
- ✅ `.env` file configured with correct MySQL credentials
- ✅ Dependencies installed (`npm install`)
- ✅ Sample images added (or use placeholders)

## Starting the Application

```bash
npm start
```

Expected output:
```
✅ Database connected successfully
🚀 Server running on http://localhost:3000
```

## Test Scenarios

### 1. Customer Interface Tests

#### Test 1.1: Landing Page
- [ ] Navigate to `http://localhost:3000`
- [ ] Verify hero section loads with background image
- [ ] Check "Welcome to Delicious Restaurant" heading displays
- [ ] Verify navigation bar is visible and fixed at top
- [ ] Check all nav links work (Home, Menu, Contact)

#### Test 1.2: Theme Toggle
- [ ] Click the theme toggle button (moon/sun icon)
- [ ] Verify page switches between dark and light modes
- [ ] Reload page and confirm theme preference persists
- [ ] Check all colors update correctly in both modes

#### Test 1.3: About Section
- [ ] Scroll to "About" section below hero
- [ ] Verify opening hours display correctly
- [ ] Check phone number shows: (555) 123-4567
- [ ] Verify location information is visible

#### Test 1.4: Menu Display
- [ ] Scroll to Menu section
- [ ] Verify 3 initial items display (Pizza, Taco, Drink)
- [ ] Check each item shows:
  - [ ] Image (or placeholder)
  - [ ] Name
  - [ ] Price with $ symbol
  - [ ] Category badge
  - [ ] Availability status

#### Test 1.5: Search Functionality
- [ ] Type "pizza" in search box
- [ ] Verify only pizza items show
- [ ] Type "taco" in search box
- [ ] Verify only taco items show
- [ ] Clear search and verify all items return

#### Test 1.6: Category Filtering
- [ ] Click "All" button - verify all items show
- [ ] Click "Pizzas" - verify only pizza items show
- [ ] Click "Tacos" - verify only taco items show
- [ ] Click "Drinks" - verify only drink items show
- [ ] Click "Family Pack" - verify family pack items show
- [ ] Verify active filter has red background

#### Test 1.7: Contact Section
- [ ] Scroll to Contact section
- [ ] Verify email, phone, and address display
- [ ] Check footer displays copyright

### 2. Admin Authentication Tests

#### Test 2.1: Admin Login Button
- [ ] Verify "Admin Login" button visible in navbar
- [ ] Click "Admin Login"
- [ ] Verify modal opens with login form

#### Test 2.2: Invalid Login
- [ ] Enter username: "wrong"
- [ ] Enter password: "wrong"
- [ ] Click Login
- [ ] Verify error message: "Invalid credentials"

#### Test 2.3: Valid Login
- [ ] Enter username: "admin"
- [ ] Enter password: "admin123"
- [ ] Click Login
- [ ] Verify "Login successful!" alert
- [ ] Verify "Admin Login" button changes to "Admin Dashboard"
- [ ] Verify login persists after page reload

#### Test 2.4: Modal Closing
- [ ] Click X button on modal
- [ ] Verify modal closes
- [ ] Click outside modal
- [ ] Verify modal closes

### 3. Admin Dashboard Tests

#### Test 3.1: Dashboard Access
- [ ] Login as admin
- [ ] Click "Admin Dashboard" button
- [ ] Verify admin modal opens
- [ ] Check two tabs visible: "Add Item" and "Manage Items"

#### Test 3.2: Add New Item - Validation
- [ ] Click "Add Item" tab
- [ ] Click "Add Item" button without filling form
- [ ] Verify browser validation errors appear

#### Test 3.3: Add New Item - Success
- [ ] Fill in Name: "Pepperoni Pizza"
- [ ] Fill in Price: "14.99"
- [ ] Select Category: "pizzas"
- [ ] Upload an image file (jpg/png)
- [ ] Verify image preview appears
- [ ] Click "Add Item"
- [ ] Verify success message
- [ ] Check form clears after submission
- [ ] Go to customer menu and verify new item appears

#### Test 3.4: Image Upload Validation
- [ ] Try uploading a non-image file (e.g., .txt, .pdf)
- [ ] Verify error message about file type
- [ ] Try uploading very large file (>5MB)
- [ ] Verify size limit error

#### Test 3.5: Manage Items Tab
- [ ] Click "Manage Items" tab
- [ ] Verify all menu items display
- [ ] Check each item shows:
  - [ ] Thumbnail image
  - [ ] Name, price, category, status
  - [ ] "Mark Unavailable" / "Mark Available" button
  - [ ] "Delete" button

#### Test 3.6: Toggle Availability
- [ ] Find an available item
- [ ] Click "Mark Unavailable"
- [ ] Verify button changes to "Mark Available"
- [ ] Check customer menu shows item as "Not Available"
- [ ] Click "Mark Available"
- [ ] Verify item returns to available status
- [ ] Check customer menu updates immediately

#### Test 3.7: Delete Item
- [ ] Click "Delete" on any item
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" and verify nothing happens
- [ ] Click "Delete" again
- [ ] Confirm deletion
- [ ] Verify success message
- [ ] Check item removed from both admin and customer views
- [ ] Verify image file deleted from uploads folder

### 4. API Endpoint Tests (Optional - using curl or Postman)

#### Test 4.1: Get All Items
```bash
curl http://localhost:3000/api/items
```
Expected: JSON with success: true and data array

#### Test 4.2: Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
Expected: {"success":true,"message":"Login successful"}

#### Test 4.3: Add Item (multipart form-data)
```bash
curl -X POST http://localhost:3000/api/items \
  -F "name=Test Pizza" \
  -F "price=12.99" \
  -F "category=pizzas" \
  -F "image=@/path/to/image.jpg"
```
Expected: {"success":true,"message":"Item added successfully"}

### 5. Responsive Design Tests

#### Test 5.1: Desktop View (1920x1080)
- [ ] Open browser at full screen
- [ ] Verify layout looks good
- [ ] Check menu grid shows 3-4 items per row

#### Test 5.2: Tablet View (768px)
- [ ] Resize browser to ~768px width
- [ ] Verify menu grid adapts (2 items per row)
- [ ] Check navigation remains functional
- [ ] Verify admin dashboard is usable

#### Test 5.3: Mobile View (375px)
- [ ] Resize browser to ~375px width
- [ ] Verify single column layout
- [ ] Check all text is readable
- [ ] Verify buttons are touchable
- [ ] Test modals fit on screen

### 6. Edge Cases & Error Handling

#### Test 6.1: Empty Search
- [ ] Search for "zzzzzzz" (non-existent item)
- [ ] Verify "No items found" message displays

#### Test 6.2: No Items in Category
- [ ] Select a category with no items
- [ ] Verify "No items found" message displays

#### Test 6.3: Missing Images
- [ ] Add item with invalid image path
- [ ] Verify placeholder image shows

#### Test 6.4: Database Disconnection
- [ ] Stop MySQL service
- [ ] Try to load menu
- [ ] Verify error handling (error message shown)

#### Test 6.5: Concurrent Admin Actions
- [ ] Open two browser tabs as admin
- [ ] Add item in tab 1
- [ ] Verify it appears in tab 2 after refresh
- [ ] Delete item in tab 2
- [ ] Verify it disappears in tab 1 after refresh

### 7. Performance Tests

#### Test 7.1: Load Time
- [ ] Clear browser cache
- [ ] Reload page
- [ ] Verify page loads in under 3 seconds

#### Test 7.2: Image Loading
- [ ] Check images load progressively
- [ ] Verify no broken image icons

#### Test 7.3: Large Dataset
- [ ] Add 50+ menu items
- [ ] Test search performance
- [ ] Test filtering performance
- [ ] Verify scrolling is smooth

### 8. Security Tests

#### Test 8.1: SQL Injection
- [ ] Try searching for: `' OR '1'='1`
- [ ] Verify no SQL errors or data leaks

#### Test 8.2: XSS Prevention
- [ ] Add item with name: `<script>alert('XSS')</script>`
- [ ] Verify script doesn't execute on page

#### Test 8.3: File Upload Security
- [ ] Try uploading: .exe, .php, .js files
- [ ] Verify only images are accepted

## Test Results Template

```
Date: ___________
Tester: ___________

Customer Tests: ___ / 7 Passed
Admin Tests: ___ / 7 Passed
API Tests: ___ / 3 Passed
Responsive Tests: ___ / 3 Passed
Edge Cases: ___ / 5 Passed
Performance: ___ / 3 Passed
Security: ___ / 3 Passed

Total: ___ / 31 Passed

Issues Found:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

Notes:
_______________________________________________
_______________________________________________
```

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution**: Check MySQL is running and .env credentials are correct

### Issue: "Port 3000 already in use"
**Solution**: Change PORT in .env or kill process on port 3000

### Issue: Images not uploading
**Solution**: Check uploads/ directory permissions

### Issue: Theme not persisting
**Solution**: Clear localStorage and test again

### Issue: Admin button not showing after login
**Solution**: Clear sessionStorage and login again

## Automated Testing (Future Enhancement)

Consider adding:
- Jest for unit tests
- Supertest for API testing
- Selenium/Puppeteer for E2E testing
- Load testing with Apache Bench or k6

---

**Happy Testing! 🧪**

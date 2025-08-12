# Test Guide for Fixed Issues

## Backend Testing

### 1. Start the Backend Server
```bash
cd backend
npm install
node server.js
```
Expected: Server should start on port 5000 with database initialization.

### 2. Test Authentication Endpoints
```bash
# Register a new user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass","email":"test@example.com"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### 3. Test Protected Endpoints (use token from login)
```bash
# Get current user
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users/me

# Get admin users (should fail without admin role)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/admin/users
```

## Frontend Testing

### 1. Start the Frontend
```bash
cd frontend
npm install
npm start
```

### 2. Test Authentication Flow
1. **Onboard Screen**: Should show when not authenticated
2. **Login**: Navigate to login, enter credentials
3. **Main App**: Should redirect to MainTabs after successful login
4. **Logout**: Go to Profile → Logout → Should return to Onboard

### 3. Test Role-Based Access
1. **Regular User**: No admin dashboard access
2. **Admin User**: Admin dashboard button visible in profile
3. **Admin Dashboard**: Only accessible to admin users

### 4. Test Protected Features
1. **Post Screen**: Should require login
2. **Cart Screen**: Should work when authenticated
3. **Profile Screen**: Should show login prompt when not authenticated

## Key Features to Verify

### ✅ Backend Fixes
- [x] All missing endpoints implemented
- [x] Role-based authorization middleware
- [x] Environment variables configuration
- [x] Proper error handling and validation
- [x] Token refresh and 401 handling

### ✅ Frontend Fixes
- [x] Enhanced UserContext with proper auth state
- [x] Conditional navigation based on auth
- [x] Login screen passes token correctly
- [x] Standardized API URLs
- [x] Auth protection on sensitive screens
- [x] Admin role checking

### ✅ User Experience
- [x] Smooth auth flow without forced logouts
- [x] Proper loading states
- [x] Error messages and validation
- [x] Role-appropriate UI elements

## Database Schema
The application now includes:
- **users**: id, username, password, email, phone, role, image_uri
- **products**: id, title, description, price, category, size, color, stock, image_uri, user_id, created_at
- **categories**: id, name, image_uri  
- **orders**: id, user_id, product_id, quantity, shipping_address, payment_method, status, created_at

## API Endpoints Available
### Authentication
- POST /api/register
- POST /api/login
- GET /api/users/me
- PUT /api/users/me

### Products
- GET /api/products (with filters)
- GET /api/products/:id
- POST /api/products (auth required)
- PUT /api/products/:id (owner/admin)
- DELETE /api/products/:id (owner/admin)

### Categories
- GET /api/categories
- POST /api/categories (auth required)

### Orders
- POST /api/orders (auth required)
- GET /api/orders (auth required)
- PUT /api/orders/:id/status (owner/admin)

### Admin (admin role required)
- GET /api/admin/users
- GET /api/admin/orders  
- PUT /api/admin/users/:id/role

## Environment Variables
Create `/backend/.env`:
```
PORT=5000
JWT_SECRET=your-secret-key
DB_PATH=./database.sqlite3
UPLOAD_PATH=./uploads/
```

All critical issues have been resolved!

# 🔐 Authentication System Documentation

## Overview

The EventHub platform has a complete authentication system with:
- ✅ User Registration with password hashing
- ✅ User Login with JWT tokens
- ✅ MongoDB storage for all user data
- ✅ Protected routes with authentication middleware
- ✅ Session management with localStorage

---

## 📊 How It Works

### 1️⃣ User Registration Flow

**Customer registers on the portal:**

```
┌─────────────────────────────────────────┐
│  Customer fills registration form       │
│  - Name, Email, Mobile, Password        │
│  - Role (customer/venue_owner/provider) │
│  - Location                             │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Frontend sends to Backend API          │
│  POST /api/auth/register                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Backend validates input                │
│  - Check if email already exists        │
│  - Validate all required fields         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Password is HASHED using bcryptjs      │
│  - Salt rounds: 10                      │
│  - Original password never stored       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  User data SAVED to MongoDB             │
│  Collection: "users"                    │
│  Fields stored:                         │
│  - name, email, mobile, hashed_password │
│  - role, location, profileImage         │
│  - isApproved, createdAt                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  JWT Token generated (7-day expiry)     │
│  Contains: userId, role                 │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Response sent to Frontend with:        │
│  - JWT Token                            │
│  - User details (without password)      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Frontend stores in localStorage:       │
│  - token                                │
│  - userId, userRole, userName, userEmail│
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  User redirected to Dashboard           │
│  Logged in ✅                           │
└─────────────────────────────────────────┘
```

**MongoDB User Document Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "$2a$10$encrypted_hash_here...",
  "role": "customer",
  "location": "Mumbai",
  "profileImage": null,
  "isApproved": false,
  "createdAt": "2026-02-10T10:30:00.000Z"
}
```

### 2️⃣ User Login Flow

**Customer logs in:**

```
┌─────────────────────────────────────────┐
│  Customer enters Email & Password       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Frontend sends to Backend API          │
│  POST /api/auth/login                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Backend searches MongoDB for user      │
│  Query: { email: user_email }           │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ✅ Found              ❌ Not Found
         │                   │
         ▼                   ▼
    Verify Password     Return Error:
    using bcryptjs      "Invalid credentials"
         │
    ✅ Match             ❌ No Match
         │                   │
         ▼                   ▼
    Generate JWT         Return Error:
    token (7d)           "Invalid credentials"
         │
         ▼
    Send Response:
    - JWT Token
    - User details
         │
         ▼
    Frontend stores:
    - Token in localStorage
    - User info
         │
         ▼
    Dashboard Access ✅
```

### 3️⃣ Protected Routes Flow

**When accessing protected pages (Dashboard, Venues, Services):**

```
┌─────────────────────────────────────────┐
│  User clicks on protected page          │
│  Example: /dashboard                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Frontend checks localStorage           │
│  for token                              │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ✅ Token Found        ❌ No Token
        │                     │
        ▼                     ▼
    Include in request   Redirect to /login
    Header:
    Authorization: Bearer <token>
        │
        ▼
    Backend middleware
    verifies JWT token
        │
    ✅ Valid           ❌ Invalid/Expired
        │                     │
        ▼                     ▼
    Access granted     Return 403 Error
    Execute request    Frontend redirects to login
```

---

## 🔑 API Endpoints

### 1. Register User
```
POST /api/auth/register

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "SecurePass123",
  "role": "customer",
  "location": "Mumbai"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer",
    "location": "Mumbai"
  }
}
```

### 2. Login User
```
POST /api/auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "location": "Mumbai"
  }
}
```

### 3. Get Current User (Protected)
```
GET /api/auth/me

Headers:
{
  "Authorization": "Bearer <token>"
}

Response:
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer",
    "location": "Mumbai",
    "createdAt": "2026-02-10T10:30:00.000Z"
  }
}
```

### 4. Verify Token (Protected)
```
POST /api/auth/verify-token

Headers:
{
  "Authorization": "Bearer <token>"
}

Response:
{
  "success": true,
  "message": "Token is valid"
}
```

---

## 📱 Frontend Storage

### localStorage Keys:
```javascript
localStorage.setItem('token', 'JWT_TOKEN_HERE');           // Auth token
localStorage.setItem('userId', 'USER_ID_HERE');           // User MongoDB ID
localStorage.setItem('userRole', 'customer');              // customer/venue_owner/service_provider
localStorage.setItem('userName', 'John Doe');             // User's full name
localStorage.setItem('userEmail', 'john@example.com');    // User's email
```

### Retrieving User Data:
```javascript
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const userRole = localStorage.getItem('userRole');
const userName = localStorage.getItem('userName');
```

### Logging Out:
```javascript
localStorage.removeItem('token');
localStorage.removeItem('userId');
localStorage.removeItem('userRole');
localStorage.removeItem('userName');
localStorage.removeItem('userEmail');
```

---

## 🛡️ Security Features

### 1. Password Hashing
- **Algorithm**: bcryptjs
- **Salt Rounds**: 10
- **Original password never stored** in database
- Password hashed before saving to MongoDB

### 2. JWT Tokens
- **Algorithm**: HS256
- **Expiration**: 7 days
- **Secret**: Stored in .env file
- **Contains**: userId, role

### 3. Authentication Middleware
- Validates JWT token on every protected request
- Returns 401 error if token not found
- Returns 403 error if token invalid/expired

### 4. MongoDB Validation
- Email must be unique (prevents duplicate accounts)
- Password minimum 6 characters (frontend validation)
- All required fields validated

---

## ✅ Testing Authentication

### 1. Register a New User

**Using Postman or curl:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "mobile": "9999999999",
    "password": "TestPass123",
    "role": "customer",
    "location": "Delhi"
  }'
```

**Expected Response:**
- Status: 201 Created
- Returns token and user data
- User created in MongoDB

### 2. Verify User in MongoDB

```bash
# Using mongosh
mongosh

# In MongoDB shell
use event-planning
db.users.find({ email: "test@example.com" })

# Output:
{
  "_id": ObjectId("..."),
  "name": "Test User",
  "email": "test@example.com",
  "mobile": "9999999999",
  "password": "$2a$10$...",
  "role": "customer",
  "location": "Delhi",
  "createdAt": ISODate("2026-02-10T10:30:00.000Z")
}
```

### 3. Login with Credentials

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Expected Response:**
- Status: 200 OK
- Returns token and user data

### 4. Access Protected Route

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

**Expected Response:**
- Status: 200 OK
- Returns authenticated user data

---

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas cluster set up and connection string in .env
- [ ] JWT_SECRET changed to strong random value in .env
- [ ] Frontend CORS configured for production domain
- [ ] Backend CORS configured for production domain
- [ ] Password minimum length enforced (6+ characters)
- [ ] Rate limiting added for login attempts
- [ ] HTTPS enabled
- [ ] Tokens refresh mechanism implemented
- [ ] User session timeout configured
- [ ] Email verification added (optional)
- [ ] Two-factor authentication (optional)

---

## 🔧 Common Issues & Solutions

### Issue: "User already exists"
**Solution**: Email already registered. Use different email or reset password.

### Issue: "Invalid credentials"
**Solution**: Wrong email/password combination. Check spelling and case sensitivity.

### Issue: "No token provided"
**Solution**: Token missing from Authorization header. Add: `Authorization: Bearer <token>`

### Issue: "Invalid or expired token"
**Solution**: Token expired (7 days) or corrupted. User needs to login again.

### Issue: "MongoDB connection error"
**Solution**: MongoDB not running or connection string wrong. Check MONGODB_URI in .env

---

## 📚 User Roles

### 1. Customer
- Browse venues
- Search services
- Make bookings
- View booking history
- Leave reviews

### 2. Venue Owner
- Upload venue details
- View bookings
- Manage availability
- See analytics

### 3. Service Provider
- Create service profile
- Manage pricing
- Accept/reject bookings
- Track performance

### 4. Admin (Future)
- Approve registrations
- Manage users
- Monitor bookings
- Handle disputes

---

Your EventHub platform is now fully authenticated! 🎉

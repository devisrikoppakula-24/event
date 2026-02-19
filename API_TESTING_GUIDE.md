# 🧪 API Testing Guide - Authentication Endpoints

## Quick Test with cURL

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "password": "SecurePassword123",
    "role": "customer",
    "location": "Mumbai"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzU2ZTcxZDI3YTk5YzAwMDEyMzQ1NjciLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE2NjY2Njc3MDAsImV4cCI6MTY2NzI3MjUwMH0.xyz...",
  "user": {
    "_id": "6356e71d27a99c0001234567",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer",
    "location": "Mumbai"
  }
}
```

### 2. Login with Email & Password

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6356e71d27a99c0001234567",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer",
    "location": "Mumbai"
  }
}
```

### 3. Get Current User Info (Protected Route)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": "6356e71d27a99c0001234567",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer",
    "location": "Mumbai",
    "createdAt": "2026-02-10T10:30:00.000Z"
  }
}
```

### 4. Verify Token (Protected Route)

```bash
curl -X POST http://localhost:5000/api/auth/verify-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Token is valid"
}
```

---

## Postman Collection

### Import to Postman:

1. Open Postman
2. Create new Collection: "EventHub Auth"
3. Add following requests:

### Request 1: Register

```
Method: POST
URL: http://localhost:5000/api/auth/register

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "mobile": "9876543211",
  "password": "JanePass123",
  "role": "venue_owner",
  "location": "Delhi"
}
```

### Request 2: Login

```
Method: POST
URL: http://localhost:5000/api/auth/login

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "email": "jane@example.com",
  "password": "JanePass123"
}
```

### Request 3: Get User (Protected)

```
Method: GET
URL: http://localhost:5000/api/auth/me

Headers:
Authorization: Bearer {{token}}

Note: Replace {{token}} with actual token from login response
```

### Request 4: Verify Token

```
Method: POST
URL: http://localhost:5000/api/auth/verify-token

Headers:
Authorization: Bearer {{token}}
```

---

## Test Scenarios

### Scenario 1: Successful Registration

**Steps:**
1. Register with new email
2. Verify response has token
3. Check MongoDB for new user

**Expected Result:** ✅
- Status: 201 Created
- Token returned
- User in MongoDB with hashed password

---

### Scenario 2: Duplicate Email Registration

**Steps:**
1. Register user 1: "test1@example.com"
2. Try to register user 2: "test1@example.com"

**Expected Result:** ✅
- First registration: 201 Created, Success
- Second registration: 400 Bad Request, "Email already registered"

---

### Scenario 3: Successful Login

**Steps:**
1. Register: "user@example.com" / "Pass123"
2. Login with same credentials
3. Token returned

**Expected Result:** ✅
- Login: 200 OK
- Token returned
- User data returned

---

### Scenario 4: Wrong Password

**Steps:**
1. Register: "user@example.com" / "CorrectPass123"
2. Login with: "user@example.com" / "WrongPass456"

**Expected Result:** ✅
- Status: 401 Unauthorized
- Error: "Invalid email or password"

---

### Scenario 5: Nonexistent User

**Steps:**
1. Try to login: "nonexistent@example.com" / "SomePass123"

**Expected Result:** ✅
- Status: 401 Unauthorized
- Error: "Invalid email or password"

---

### Scenario 6: Protected Route Without Token

**Steps:**
1. GET /api/auth/me without Authorization header

**Expected Result:** ✅
- Status: 401 Unauthorized
- Error: "No token provided"

---

### Scenario 7: Protected Route With Invalid Token

**Steps:**
1. GET /api/auth/me with Authorization: Bearer invalid_token_xyz

**Expected Result:** ✅
- Status: 403 Forbidden
- Error: "Invalid or expired token"

---

### Scenario 8: Missing Required Fields

**Steps:**
1. Register with missing "name" field

**Expected Result:** ✅
- Status: 400 Bad Request
- Error: "All fields are required"

---

## Sample Test Data

### Test User 1 (Customer)
```json
{
  "name": "Amit Kumar",
  "email": "amit@test.com",
  "mobile": "9876543210",
  "password": "AmitPass123",
  "role": "customer",
  "location": "Mumbai"
}
```

### Test User 2 (Venue Owner)
```json
{
  "name": "Priya Sharma",
  "email": "priya@test.com",
  "mobile": "9876543211",
  "password": "PriyaPass123",
  "role": "venue_owner",
  "location": "Delhi"
}
```

### Test User 3 (Service Provider)
```json
{
  "name": "Raj Patel",
  "email": "raj@test.com",
  "mobile": "9876543212",
  "password": "RajPass123",
  "role": "service_provider",
  "location": "Bangalore"
}
```

---

## Error Codes & Messages

| Code | Message | Meaning |
|------|---------|---------|
| 201 | User registered successfully | Registration successful, user created |
| 200 | Login successful | Login successful, token provided |
| 400 | All fields are required | Missing required field in request |
| 400 | Email already registered | Email already exists in system |
| 401 | Invalid email or password | Wrong credentials |
| 401 | No token provided | Authorization header missing |
| 403 | Invalid or expired token | Token invalid or expired (7 days) |
| 404 | User not found | User ID not found |
| 500 | Registration failed | Server error during registration |
| 500 | Login failed | Server error during login |

---

## Verification Queries for MongoDB

### Check if User Exists
```javascript
db.users.findOne({ email: "amit@test.com" })
```

### View All Registered Users
```javascript
db.users.find().pretty()
```

### Count Total Users
```javascript
db.users.countDocuments()
```

### Find User by Name
```javascript
db.users.findOne({ name: "Amit Kumar" })
```

### Find All Customers
```javascript
db.users.find({ role: "customer" })
```

### Find All Venue Owners
```javascript
db.users.find({ role: "venue_owner" })
```

### Find Users by Location
```javascript
db.users.find({ location: "Mumbai" })
```

### View Password Hash (Encrypted)
```javascript
db.users.findOne({ email: "amit@test.com" }, { password: 1 })

// Output shows encrypted password like:
// { password: "$2a$10$dXJ0hT4S8k..." }
```

---

## JWT Token Decoder

To see what's inside a JWT token:

1. Go to https://jwt.io
2. Paste your token in the "Encoded" section
3. See decoded payload:

**Example Decoded Token:**
```json
{
  "userId": "6356e71d27a99c0001234567",
  "role": "customer",
  "iat": 1666667700,
  "exp": 1667272500
}
```

- `userId`: MongoDB user ID
- `role`: User's role (customer/venue_owner/service_provider)
- `iat`: Issued at (timestamp)
- `exp`: Expires at (timestamp)

---

## Testing with Frontend

### Register Flow:
1. Navigate to http://localhost:3000/register
2. Fill form with test data
3. Click "Create Account"
4. Check browser localStorage (DevTools → Application → Storage)
5. Verify token, userId, userRole stored

### Login Flow:
1. Logout first (clear localStorage)
2. Navigate to http://localhost:3000/login
3. Use registered email/password
4. Click "Login"
5. Should see dashboard

### Protected Routes:
1. Clear localStorage (DevTools → Application → Storage)
2. Try accessing http://localhost:3000/dashboard
3. Should redirect to http://localhost:3000/login

---

## Troubleshooting

### Error: "Cannot POST /api/auth/register"
- Check backend is running on port 5000
- Verify correct API URL in frontend

### Error: "Invalid email or password"
- Verify email is registered first
- Check password spelling (case-sensitive)
- Ensure no extra spaces in credentials

### Error: "MongoDB connection error"
- Check MongoDB is running
- Verify MONGODB_URI in .env file
- Test with: `mongosh` command

### Token not persisting:
- Check localStorage not disabled in browser
- Clear browser cache and cookies
- Verify JavaScript enabled

---

**Status: ✅ ALL AUTHENTICATION TESTS READY TO PERFORM**

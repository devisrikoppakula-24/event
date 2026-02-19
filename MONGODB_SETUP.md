# MongoDB Setup Guide for EventHub

## Option 1: Local MongoDB Installation

### Windows (Using MongoDB Community Edition)

1. **Download & Install MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Download MongoDB Community Server for Windows
   - Run the installer and follow the setup wizard
   - Choose "Install MongoDB as a Service" (recommended)

2. **Start MongoDB Service**
   - MongoDB runs automatically as a Windows Service
   - To verify: Open PowerShell and run:
     ```powershell
     mongosh
     ```
   - You should see the MongoDB shell prompt

3. **Verify Installation**
   ```powershell
   # In PowerShell
   mongosh
   
   # In the MongoDB shell
   show databases
   ```

### macOS (Using Homebrew)

1. **Install MongoDB**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB**
   ```bash
   brew services start mongodb-community
   ```

3. **Verify**
   ```bash
   mongosh
   ```

### Linux (Ubuntu/Debian)

1. **Install MongoDB**
   ```bash
   curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Start MongoDB**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Verify**
   ```bash
   mongosh
   ```

---

## Option 2: MongoDB Atlas (Cloud - Recommended)

### Setup MongoDB Atlas (Free Tier Available)

1. **Create Account**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Click "Sign Up" and create a free account
   - Complete email verification

2. **Create a Cluster**
   - Click "Create" button
   - Choose "Shared" (free tier)
   - Select region (choose closest to you)
   - Click "Create Cluster"

3. **Configure Security**
   - Go to "Database Access" → Add a new user
   - Set username and password (save these!)
   - Choose "Password" as authentication method
   
   - Go to "Network Access" → Add IP Address
   - Click "Add My Current IP Address" or Allow "0.0.0.0/0" for development

4. **Get Connection String**
   - Go to "Databases" → Click "Connect" on your cluster
   - Choose "Drivers" option
   - Select "Node.js" driver
   - Copy the connection string

5. **Update .env**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/event-planning?retryWrites=true&w=majority
   ```
   Replace `username`, `password`, and cluster details with your credentials

---

## Connecting the Backend

### 1. Install MongoDB Package
```bash
cd backend
npm install mongoose
```

### 2. Verify .env Configuration
Make sure your `.env` file has:
```
MONGODB_URI=mongodb://localhost:27017/event-planning
```

### 3. Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
Server running on port 5000
```

---

## Testing MongoDB Connection

### Using Node REPL

```bash
node

# Then in the Node shell:
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/event-planning');

// Should connect successfully
```

### Using MongoDB Shell

```bash
mongosh

# In MongoDB shell:
show databases
use event-planning
show collections
```

### Using Compass (GUI Client)

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Install it
3. Connect to `mongodb://localhost:27017`
4. Browse databases and collections visually

---

## Common Connection Issues & Solutions

### ❌ "Connection refused on 127.0.0.1:27017"
**Solution:** MongoDB is not running
- **Windows**: Check Services → "MongoDB Server" should be running
- **macOS**: Run `brew services start mongodb-community`
- **Linux**: Run `sudo systemctl start mongod`

### ❌ "MongooseError: Cannot connect to MongoDB"
**Solution:** Incorrect connection string in .env
- Verify MONGODB_URI format
- Check username/password for Atlas
- Ensure IP whitelist includes your IP (if using Atlas)

### ❌ "ECONNREFUSED" Error
**Solution:** MongoDB service not started
- Restart MongoDB service
- Check MongoDB is installed correctly
- Try connecting with `mongosh` to verify

### ❌ Authentication Failed on MongoDB Atlas
**Solution:** Wrong credentials
- Double-check username and password
- Make sure password is URL-encoded (special chars like @, #, etc.)
- Example: Password `test@123` becomes `test%40123` in URL

---

## Database Initialization

After connecting, the following collections will be created automatically:
- `users` - Customers, venue owners, service providers
- `venues` - Event venues
- `services` - Catering, decoration, makeup, etc.
- `bookings` - Event bookings and reservations

### Sample Data Query

```javascript
// In the Node backend:
const User = require('./models/User');

// Find all users
const users = await User.find();

// Create a test user
const newUser = new User({
  name: 'John Doe',
  email: 'john@example.com',
  mobile: '9876543210',
  password: 'hashedpassword',
  role: 'customer',
  location: 'Mumbai'
});

await newUser.save();
```

---

## Backup & Restore

### MongoDB Backup (Local)

```bash
# Backup
mongodump --out=./backup

# Restore
mongorestore ./backup
```

### MongoDB Atlas Backup

- Atlas automatically backs up daily
- Go to "Backup" tab in cluster settings to restore

---

## Next Steps

1. ✅ Start MongoDB service
2. ✅ Update `.env` with correct MONGODB_URI
3. ✅ Run `npm install` in backend folder
4. ✅ Run `npm run dev` to start server
5. ✅ Test API endpoints with Postman or curl

Your EventHub platform is now connected to MongoDB! 🎉

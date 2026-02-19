const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ REGISTER - Create new user and save to MongoDB
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, role, location } = req.body;
    
    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user (password will be hashed automatically via pre-save hook)
    user = new User({
      name,
      email,
      mobile,
      password, // Will be hashed by mongoose pre-hook
      role: role || 'customer',
      location
    });

    // Save user to MongoDB
    await user.save();
    console.log(`✅ New user registered: ${email}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Return token and user data (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      location: user.location
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Registration failed: ' + err.message });
  }
});

// ✅ LOGIN - Verify credentials and return JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    // Return token and user data (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      location: user.location
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed: ' + err.message });
  }
});

// ✅ GET CURRENT USER - Verify token and return user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ VERIFY TOKEN - Check if token is valid
router.post('/verify-token', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Token is valid' });
});

module.exports = router;

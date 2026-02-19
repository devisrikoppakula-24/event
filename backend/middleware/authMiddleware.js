const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    
    // Fetch user to get role information
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.user.id = user._id;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized: Invalid role for this action' });
    }
    
    next();
  };
};

module.exports = { authMiddleware, authorize };

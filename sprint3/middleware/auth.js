const User = require('../model/User');

// Authentication middleware
exports.requireAuth = async (req, res, next) => {
  try {
    // Check if user is logged in via session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive
        };
        return next();
      }
    }
    
    // If no valid session, return unauthorized
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Error verifying authentication'
    });
  }
};

// Optional authentication middleware (for routes that work with or without auth)
exports.optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive
        };
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

// Admin role check middleware
exports.requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authorization error' 
    });
  }
};

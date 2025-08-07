const express = require('express');
const User = require('../model/User');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  next();
};

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.session.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { email, bio, location, goals } = req.body;
    
    const user = await User.findOneAndUpdate(
      { userId: req.session.userId },
      {
        $set: {
          email: email || '',
          'profile.bio': bio || '',
          'profile.location': location || '',
          'goals.dailyActions': goals?.dailyActions || 3,
          'goals.weeklyTarget': goals?.weeklyTarget || 21,
          'goals.preferredActions': goals?.preferredActions || []
        }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;

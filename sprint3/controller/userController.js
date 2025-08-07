const express = require('express');
const User = require('../model/User');
const Notification = require('../model/Notification');

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
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get unread notification count
    let unreadCount = 0;
    try {
      unreadCount = await Notification.getUnreadCount(user._id);
    } catch (notificationError) {
      console.warn('Error getting notification count:', notificationError);
    }
    
    // Return user data with proper structure
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.username, // Add name field for frontend compatibility
      level: user.gamification?.level || 1,
      experience: user.gamification?.experience || 0,
      badges: user.gamification?.badges || [],
      achievements: user.gamification?.achievements || [],
      stats: user.stats || {},
      social: user.social || {},
      settings: user.settings || {},
      unreadNotifications: unreadCount
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, email, settings, privacySettings } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      {
        $set: {
          username: username || user.username,
          email: email || user.email,
          settings: settings || user.settings,
          privacySettings: privacySettings || user.privacySettings
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

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      level: user.level,
      experience: user.experience,
      badges: user.badges,
      achievements: user.achievements,
      stats: user.stats,
      friends: user.friends.filter(f => f.status === 'accepted').length,
      followers: user.followers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;

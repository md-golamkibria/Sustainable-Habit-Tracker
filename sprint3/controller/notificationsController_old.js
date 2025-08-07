const express = require('express');
const Notification = require('../model/Notification');
const User = require('../model/User');
const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /notifications - Get a user's notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ recipient: currentUserId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalUnread = await Notification.countDocuments({ 
      recipient: currentUserId, 
      read: false 
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: totalUnread,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: notifications.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
});

// PATCH /notifications/mark-read - Mark notifications as read
router.patch('/mark-read', requireAuth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const currentUserId = req.session.userId;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No notification IDs provided' });
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: currentUserId },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

// DELETE /notifications/delete - Delete notifications
router.delete('/delete', requireAuth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const currentUserId = req.session.userId;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No notification IDs provided' });
    }

    await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: currentUserId
    });

    res.json({
      success: true,
      message: 'Notifications deleted successfully'
    });

  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notifications' });
  }
});

// POST /notifications/subscribe - Subscribe to notifications
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const currentUserId = req.session.userId;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.settings.notifications = true;
    await user.save();

    res.json({
      success: true,
      message: 'Subscribed to notifications'
    });

  } catch (error) {
    console.error('Subscribe to notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe to notifications' });
  }
});

module.exports = router;


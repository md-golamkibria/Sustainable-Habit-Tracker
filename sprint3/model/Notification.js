const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'friend_request',
      'friend_accepted',
      'challenge_invite',
      'challenge_completed',
      'achievement_earned',
      'level_up',
      'daily_reminder',
      'weekly_report',
      'leaderboard_update',
      'community_milestone',
      'goal_reminder',
      'streak_milestone'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    // Additional data specific to notification type
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    achievementId: String,
    badgeId: String,
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
    actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action' },
    level: Number,
    points: Number,
    streak: Number
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String // URL to navigate when notification is clicked
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    
    // Populate sender information if exists
    if (notification.sender) {
      await notification.populate('sender', 'username avatar');
    }
    
    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(recipientId, notificationIds) {
  const result = await this.updateMany(
    { 
      recipient: recipientId,
      _id: { $in: notificationIds }
    },
    { 
      read: true, 
      readAt: new Date() 
    }
  );
  return result;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return await this.countDocuments({ 
    recipient: recipientId, 
    read: false 
  });
};

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

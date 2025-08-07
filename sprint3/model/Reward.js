const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['badge', 'achievement', 'milestone', 'challenge_reward', 'streak_bonus', 'level_reward'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'environmental_impact',
      'social_engagement',
      'consistency',
      'milestones',
      'challenges',
      'community',
      'special_events'
    ],
    required: true
  },
  criteria: {
    // Conditions to earn this reward
    actionCount: Number,
    co2Saved: Number,
    waterSaved: Number,
    streakDays: Number,
    level: Number,
    challengesCompleted: Number,
    friendsReferred: Number,
    specificActions: [String], // Specific action types required
    timeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time']
    }
  },
  rewards: {
    points: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    title: String, // Special title user can display
    avatar: String, // Special avatar or frame
    benefits: [String] // List of special benefits or perks
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#6B73FF'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSecret: {
    type: Boolean,
    default: false // Hidden rewards that users discover
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date // Optional expiry date for limited-time rewards
  },
  maxRecipients: {
    type: Number // Limit how many users can earn this reward
  },
  currentRecipients: {
    type: Number,
    default: 0
  },
  earnedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    earnedDate: { type: Date, default: Date.now },
    progress: { type: Number, default: 100 } // Percentage progress when earned
  }]
}, {
  timestamps: true
});

// Index for efficient queries
rewardSchema.index({ type: 1, category: 1, isActive: 1 });
rewardSchema.index({ rarity: 1, isActive: 1 });
rewardSchema.index({ 'earnedBy.user': 1 });

// Virtual for completion rate
rewardSchema.virtual('completionRate').get(function() {
  if (!this.maxRecipients) return null;
  return (this.currentRecipients / this.maxRecipients) * 100;
});

// Method to check if user qualifies for this reward
rewardSchema.methods.checkUserQualification = async function(user) {
  const criteria = this.criteria;
  
  // Check if user already has this reward
  if (this.earnedBy.some(e => e.user.toString() === user._id.toString())) {
    return { qualified: false, reason: 'Already earned' };
  }
  
  // Check if reward is still available
  if (!this.isActive) {
    return { qualified: false, reason: 'Reward not active' };
  }
  
  if (this.availableUntil && new Date() > this.availableUntil) {
    return { qualified: false, reason: 'Reward expired' };
  }
  
  if (this.maxRecipients && this.currentRecipients >= this.maxRecipients) {
    return { qualified: false, reason: 'Maximum recipients reached' };
  }
  
  // Check criteria
  const checks = [];
  
  if (criteria.actionCount) {
    checks.push({
      met: user.stats.totalActions >= criteria.actionCount,
      requirement: `${criteria.actionCount} total actions`,
      current: user.stats.totalActions
    });
  }
  
  if (criteria.co2Saved) {
    checks.push({
      met: user.stats.totalCO2Saved >= criteria.co2Saved,
      requirement: `${criteria.co2Saved}kg CO2 saved`,
      current: user.stats.totalCO2Saved
    });
  }
  
  if (criteria.streakDays) {
    checks.push({
      met: user.stats.currentStreak >= criteria.streakDays,
      requirement: `${criteria.streakDays} day streak`,
      current: user.stats.currentStreak
    });
  }
  
  if (criteria.level) {
    checks.push({
      met: user.gamification.level >= criteria.level,
      requirement: `Level ${criteria.level}`,
      current: user.gamification.level
    });
  }
  
  const allMet = checks.every(check => check.met);
  
  return {
    qualified: allMet,
    checks: checks,
    progress: allMet ? 100 : Math.min(...checks.map(c => (c.current / c.requirement.split(' ')[0]) * 100))
  };
};

// Method to award this reward to a user
rewardSchema.methods.awardToUser = async function(userId, progress = 100) {
  // Add user to earnedBy array
  this.earnedBy.push({
    user: userId,
    earnedDate: new Date(),
    progress: progress
  });
  
  this.currentRecipients += 1;
  await this.save();
  
  // Update user's rewards
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (user) {
    // Add badge/achievement to user
    if (this.type === 'badge') {
      user.gamification.badges.push({
        badgeId: this._id.toString(),
        name: this.name,
        description: this.description,
        icon: this.icon,
        category: this.category,
        earnedDate: new Date()
      });
    } else if (this.type === 'achievement') {
      user.gamification.achievements.push({
        achievementId: this._id.toString(),
        name: this.name,
        description: this.description,
        progress: 100,
        target: 100,
        completed: true,
        completedDate: new Date()
      });
    }
    
    // Award points and experience
    if (this.rewards.points) {
      user.gamification.points += this.rewards.points;
    }
    
    if (this.rewards.experience) {
      user.addExperience(this.rewards.experience);
    }
    
    await user.save();
    
    // Create notification
    const Notification = mongoose.model('Notification');
    await Notification.createNotification({
      recipient: userId,
      type: this.type === 'badge' ? 'achievement_earned' : 'level_up',
      title: `🎉 ${this.name} Earned!`,
      message: this.description,
      data: {
        badgeId: this._id.toString(),
        points: this.rewards.points,
        experience: this.rewards.experience
      },
      priority: 'high'
    });
  }
  
  return this;
};

// Static method to check all rewards for a user
rewardSchema.statics.checkUserRewards = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) return [];
  
  const availableRewards = await this.find({
    isActive: true,
    $or: [
      { availableUntil: { $exists: false } },
      { availableUntil: { $gt: new Date() } }
    ],
    'earnedBy.user': { $ne: userId }
  });
  
  const qualifiedRewards = [];
  
  for (const reward of availableRewards) {
    const qualification = await reward.checkUserQualification(user);
    if (qualification.qualified) {
      qualifiedRewards.push(reward);
    }
  }
  
  return qualifiedRewards;
};

module.exports = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);

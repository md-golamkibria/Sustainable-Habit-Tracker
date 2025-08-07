const mongoose = require('mongoose');

// Ensure buffering is disabled for this model
mongoose.set('bufferCommands', false);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Optional field
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  // Sprint 3: Social Features
  social: {
    friends: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
      addedDate: { type: Date, default: Date.now }
    }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: true },
    allowFriendRequests: { type: Boolean, default: true }
  },
  // Sprint 3: Gamification
  gamification: {
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    badges: [{
      badgeId: String,
      name: String,
      description: String,
      icon: String,
      earnedDate: { type: Date, default: Date.now },
      category: String
    }],
    achievements: [{
      achievementId: String,
      name: String,
      description: String,
      progress: { type: Number, default: 0 },
      target: Number,
      completed: { type: Boolean, default: false },
      completedDate: Date
    }]
  },
  // Sprint 3: Enhanced Settings
  settings: {
    notifications: {
      dailyReminders: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      challengeInvites: { type: Boolean, default: true },
      friendActivity: { type: Boolean, default: true },
      leaderboardUpdates: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true }
    },
    privacy: {
      showOnLeaderboard: { type: Boolean, default: true },
      shareGoals: { type: Boolean, default: true },
      shareActions: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true }
    },
    display: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' }
    }
  },
  goals: {
    dailyActions: {
      type: Number,
      default: 3
    },
    weeklyActions: {
      type: Number,
      default: 15
    },
    monthlyCO2Goal: {
      type: Number,
      default: 50
    }
  },
  preferences: {
    actionTypes: [{
      type: String,
      enum: ['biking', 'walking', 'recycling', 'composting', 'energy_saving', 'water_conservation', 'public_transport', 'reusable_items']
    }],
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'never'],
        default: 'daily'
      }
    }
  },
  stats: {
    totalActions: {
      type: Number,
      default: 0
    },
    totalCO2Saved: {
      type: Number,
      default: 0
    },
    totalWaterSaved: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActionDate: {
      type: Date,
      default: null
    },
    // Sprint 3: Enhanced Stats
    weeklyStats: {
      actionsThisWeek: { type: Number, default: 0 },
      co2SavedThisWeek: { type: Number, default: 0 },
      waterSavedThisWeek: { type: Number, default: 0 }
    },
    monthlyStats: {
      actionsThisMonth: { type: Number, default: 0 },
      co2SavedThisMonth: { type: Number, default: 0 },
      waterSavedThisMonth: { type: Number, default: 0 }
    },
    yearlyStats: {
      actionsThisYear: { type: Number, default: 0 },
      co2SavedThisYear: { type: Number, default: 0 },
      waterSavedThisYear: { type: Number, default: 0 }
    },
    ranking: {
      global: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 }
    },
    challengesCreated: {
      type: Number,
      default: 0
    },
    experiencePoints: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    badges: [{
      name: String,
      description: String,
      icon: String,
      earnedDate: { type: Date, default: Date.now }
    }]
  },
  // Keep the original challenges structure for compatibility
  challenges: {
    active: [{
      challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge'
      },
      progress: {
        type: Number,
        default: 0
      },
      completed: {
        type: Boolean,
        default: false
      },
      joinedDate: {
        type: Date,
        default: Date.now
      }
    }],
    completed: [{
      challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge'
      },
      progress: {
        type: Number,
        default: 0
      },
      completedDate: {
        type: Date,
        default: Date.now
      },
      joinedDate: Date
    }]
  },
  // Sprint 3: Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  activity: {
    lastActive: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for formatted stats
userSchema.virtual('formattedStats').get(function() {
  return {
    totalActions: this.stats.totalActions,
    totalCO2Saved: Math.round(this.stats.totalCO2Saved * 100) / 100,
    totalWaterSaved: Math.round(this.stats.totalWaterSaved * 100) / 100,
    currentStreak: this.stats.currentStreak,
    longestStreak: this.stats.longestStreak,
    level: this.gamification.level,
    experience: this.gamification.experience,
    points: this.gamification.points
  };
});

// Virtual for friend count
userSchema.virtual('friendCount').get(function() {
  return this.social.friends.filter(friend => friend.status === 'accepted').length;
});

// Virtual for badge count
userSchema.virtual('badgeCount').get(function() {
  return this.gamification.badges.length;
});

// Method to calculate level from experience
userSchema.methods.calculateLevel = function() {
  // Simple leveling formula: level = floor(sqrt(experience / 100)) + 1
  const newLevel = Math.floor(Math.sqrt(this.gamification.experience / 100)) + 1;
  if (newLevel > this.gamification.level) {
    this.gamification.level = newLevel;
    return true; // Level up occurred
  }
  return false;
};

// Method to add experience points
userSchema.methods.addExperience = function(points) {
  this.gamification.experience += points;
  this.gamification.points += points;
  return this.calculateLevel();
};

// Method to check if users are friends
userSchema.methods.isFriendWith = function(userId) {
  return this.social.friends.some(friend => 
    friend.user.toString() === userId.toString() && friend.status === 'accepted'
  );
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

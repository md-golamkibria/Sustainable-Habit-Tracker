const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  goals: {
    dailyActions: {
      type: Number,
      default: 3
    },
    weeklyTarget: {
      type: Number,
      default: 21
    },
    preferredActions: [{
      type: String,
      enum: ['biking', 'recycling', 'walking', 'public_transport', 'reusable_bag', 'energy_saving', 'water_conservation']
    }]
  },
  profile: {
    bio: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  stats: {
    totalActions: {
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
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

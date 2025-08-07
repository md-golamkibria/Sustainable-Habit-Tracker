const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  category: {
    type: String,
    enum: ['actions', 'co2_reduction', 'water_saving', 'streak', 'specific_action'],
    required: true
  },
  target: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    actionType: String // For specific action goals
  },
  timeframe: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: Number // in days
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'paused'],
    default: 'active'
  },
  milestones: [{
    value: Number,
    percentage: Number,
    reached: {
      type: Boolean,
      default: false
    },
    reachedDate: Date,
    description: String
  }],
  rewards: {
    onCompletion: {
      points: {
        type: Number,
        default: 0
      },
      badge: {
        name: String,
        icon: String
      },
      title: String
    },
    milestoneRewards: [{
      milestone: Number,
      points: Number,
      badge: String,
      claimed: {
        type: Boolean,
        default: false
      }
    }]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily'
    },
    customDays: [Number], // 0-6 for Sunday-Saturday
    time: String // HH:MM format
  },
  completedDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ type: 1, status: 1 });
goalSchema.index({ 'timeframe.endDate': 1 });

// Update progress percentage before saving
goalSchema.pre('save', function(next) {
  if (this.target.value > 0) {
    this.progress.percentage = Math.min((this.progress.current / this.target.value) * 100, 100);
    
    // Update status based on progress and timeframe
    if (this.progress.percentage >= 100) {
      this.status = 'completed';
      if (!this.completedDate) {
        this.completedDate = new Date();
      }
    } else if (this.timeframe.endDate < new Date() && this.status === 'active') {
      this.status = 'failed';
    }
  }
  
  this.progress.lastUpdated = new Date();
  next();
});

// Check and update milestone achievements
goalSchema.methods.updateMilestones = function() {
  this.milestones.forEach(milestone => {
    if (!milestone.reached && this.progress.current >= milestone.value) {
      milestone.reached = true;
      milestone.reachedDate = new Date();
    }
  });
};

module.exports = mongoose.model('Goal', goalSchema);

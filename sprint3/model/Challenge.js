const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'milestone'],
    required: true
  },
  category: {
    type: String,
    enum: ['biking', 'recycling', 'walking', 'public_transport', 'reusable_bag', 'energy_saving', 'water_conservation', 'general', 'waste_reduction'],
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
    description: String
  },
  reward: {
    points: {
      type: Number,
      default: 0
    },
    badge: {
      name: String,
      icon: String,
      description: String
    },
    title: String
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'extreme'],
    default: 'medium'
  },
  duration: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
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
    },
    completedDate: Date
  }],
  requirements: {
    minLevel: {
      type: Number,
      default: 1
    },
    prerequisiteBadges: [String],
    actionTypes: [String]
  },
  stats: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    completedCount: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  isGlobal: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Index for efficient queries
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ category: 1 });
challengeSchema.index({ 'duration.endDate': 1 });

// Update completion rate when participants change
challengeSchema.pre('save', function(next) {
  if (this.stats.totalParticipants > 0) {
    this.stats.completionRate = (this.stats.completedCount / this.stats.totalParticipants) * 100;
  }
  next();
});

module.exports = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);

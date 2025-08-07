const mongoose = require('mongoose');

const openChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['energy', 'water', 'waste', 'transport', 'food', 'lifestyle', 'community', 'other']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  duration: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: null // null means unlimited
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  requirements: [{
    action: {
      type: String,
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    }
  }],
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      type: String
    }],
    title: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String // URL to challenge image
  },
  completionCriteria: {
    type: String,
    required: true,
    trim: true
  },
  leaderboard: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Indexes
openChallengeSchema.index({ creator: 1 });
openChallengeSchema.index({ category: 1 });
openChallengeSchema.index({ status: 1 });
openChallengeSchema.index({ startDate: 1, endDate: 1 });
openChallengeSchema.index({ 'participants.user': 1 });

// Virtual for participant count
openChallengeSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to check if user can join
openChallengeSchema.methods.canUserJoin = function(userId) {
  const isAlreadyParticipant = this.participants.some(p => p.user.toString() === userId.toString());
  const isNotFull = !this.maxParticipants || this.participants.length < this.maxParticipants;
  const isActive = this.status === 'active';
  const hasNotStarted = new Date() < this.startDate;
  
  return !isAlreadyParticipant && isNotFull && isActive && hasNotStarted;
};

module.exports = mongoose.models.OpenChallenge || mongoose.model('OpenChallenge', openChallengeSchema);

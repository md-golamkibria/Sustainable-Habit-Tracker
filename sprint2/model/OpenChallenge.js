const mongoose = require('mongoose');

const openChallengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'failed'],
    default: 'in-progress'
  },
  progress: {
    type: Number,
    default: 0
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
openChallengeSchema.index({ userId: 1, challengeId: 1 });
openChallengeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.models.OpenChallenge || mongoose.model('OpenChallenge', openChallengeSchema);

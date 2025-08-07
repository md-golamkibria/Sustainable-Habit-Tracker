const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalGoalsCompleted: {
    type: Number,
    default: 0
  },
  totalActionsCompleted: {
    type: Number,
    default: 0
  },
  sustainabilityScore: {
    type: Number,
    default: 0
  },
  carbonFootprintReduced: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  challengesCompleted: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  previousRank: {
    type: Number,
    default: 0
  },
  rankChange: {
    type: String,
    enum: ['up', 'down', 'same', 'new'],
    default: 'new'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['overall', 'goals', 'actions', 'sustainability', 'streaks'],
    default: 'overall'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
rankingSchema.index({ user: 1, category: 1 });
rankingSchema.index({ rank: 1, category: 1 });
rankingSchema.index({ sustainabilityScore: -1 });
rankingSchema.index({ totalGoalsCompleted: -1 });

module.exports = mongoose.models.Ranking || mongoose.model('Ranking', rankingSchema);

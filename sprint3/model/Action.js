const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  actionType: {
    type: String,
    required: true,
    enum: ['biking', 'recycling', 'walking', 'public_transport', 'reusable_bag', 'energy_saving', 'water_conservation']
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    default: 'times'
  },
  date: {
    type: Date,
    default: Date.now
  },
  impact: {
    co2Saved: {
      type: Number,
      default: 0
    },
    waterSaved: {
      type: Number,
      default: 0
    }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
actionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.models.Action || mongoose.model('Action', actionSchema);

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'tree-planting',
      'beach-cleanup',
      'recycling-drive',
      'sustainability-workshop',
      'nature-walk',
      'environmental-conference',
      'green-energy-seminar',
      'permaculture-course',
      'wildlife-conservation',
      'personal-development',
      'mindfulness-session',
      'eco-friendly-cooking',
      'gardening-workshop',
      'climate-action',
      'other'
    ]
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerInfo: {
    name: {
      type: String,
      required: true
    },
    contact: {
      email: String,
      phone: String,
      website: String
    }
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'USA'
    },
    zipCode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    }
  },
  dateTime: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  capacity: {
    type: Number,
    default: null // null means unlimited
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    },
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date
  }],
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    caption: String
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  whatToBring: [{
    type: String,
    trim: true
  }],
  agenda: [{
    time: String,
    activity: String,
    duration: String
  }],
  pricing: {
    isFree: {
      type: Boolean,
      default: true
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'friends-only'],
    default: 'public'
  },
  sustainabilityImpact: {
    carbonReduction: {
      type: Number,
      default: 0
    },
    treesPlanted: {
      type: Number,
      default: 0
    },
    wasteCollected: {
      type: Number,
      default: 0
    },
    peopleEducated: {
      type: Number,
      default: 0
    }
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badge: String,
    certificate: {
      type: Boolean,
      default: false
    }
  },
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ organizer: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'dateTime.start': 1 });
eventSchema.index({ 'location.city': 1, 'location.state': 1 });
eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ 'attendees.user': 1 });
eventSchema.index({ tags: 1 });

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.filter(a => a.status === 'registered').length;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  if (!this.capacity) return null;
  return this.capacity - this.attendeeCount;
});

// Method to check if user can register
eventSchema.methods.canUserRegister = function(userId) {
  const isAlreadyRegistered = this.attendees.some(a => 
    a.user.toString() === userId.toString() && a.status === 'registered'
  );
  const hasCapacity = !this.capacity || this.attendeeCount < this.capacity;
  const isPublished = this.status === 'published';
  const hasNotStarted = new Date() < this.dateTime.start;
  
  return !isAlreadyRegistered && hasCapacity && isPublished && hasNotStarted;
};

// Method to calculate average rating
eventSchema.methods.getAverageRating = function() {
  if (this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return Math.round((sum / this.feedback.length) * 10) / 10;
};

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);

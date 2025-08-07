const mongoose = require('mongoose');

const educationalContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['article', 'tip', 'guide', 'video', 'infographic'],
    required: true
  },
  category: {
    type: String,
    enum: ['energy', 'water', 'waste', 'transport', 'food', 'lifestyle', 'general'],
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedReadTime: {
    type: Number, // in minutes
    default: 5
  },
  interactions: {
    views: {
      type: Number,
      default: 0
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    bookmarks: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      bookmarkedAt: {
        type: Date,
        default: Date.now
      }
    }],
    shares: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  images: [{
    url: String,
    caption: String,
    alt: String
  }],
  video: {
    url: String,
    duration: Number, // in seconds
    thumbnail: String
  },
  externalLinks: [{
    title: String,
    url: String,
    description: String
  }],
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EducationalContent'
  }]
}, {
  timestamps: true
});

// Indexes
educationalContentSchema.index({ title: 'text', summary: 'text', content: 'text' });
educationalContentSchema.index({ category: 1, status: 1 });
educationalContentSchema.index({ tags: 1 });
educationalContentSchema.index({ featured: 1, status: 1 });
educationalContentSchema.index({ publishedAt: -1 });

// Virtual for like count
educationalContentSchema.virtual('likeCount').get(function() {
  return this.interactions.likes.length;
});

// Virtual for bookmark count
educationalContentSchema.virtual('bookmarkCount').get(function() {
  return this.interactions.bookmarks.length;
});

// Virtual for share count
educationalContentSchema.virtual('shareCount').get(function() {
  return this.interactions.shares.length;
});

// Method to check if user liked the content
educationalContentSchema.methods.isLikedBy = function(userId) {
  return this.interactions.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// Method to check if user bookmarked the content
educationalContentSchema.methods.isBookmarkedBy = function(userId) {
  return this.interactions.bookmarks.some(bookmark => 
    bookmark.user.toString() === userId.toString()
  );
};

// Method to add a view
educationalContentSchema.methods.addView = async function() {
  this.interactions.views += 1;
  await this.save();
  return this;
};

// Static methods for fetching content
educationalContentSchema.statics.getFeaturedContent = async function() {
  return this.find({ 
    status: 'published', 
    featured: true 
  })
  .populate('author', 'name username')
  .sort({ publishedAt: -1 })
  .limit(6)
  .lean();
};

educationalContentSchema.statics.getPopularContent = async function() {
  return this.find({ status: 'published' })
    .populate('author', 'name username')
    .sort({ 'interactions.views': -1, publishedAt: -1 })
    .limit(12)
    .lean();
};

educationalContentSchema.statics.getContentByCategory = async function(category) {
  return this.find({ 
    status: 'published',
    category: category.toLowerCase()
  })
  .populate('author', 'name username')
  .sort({ publishedAt: -1 })
  .lean();
};

// Instance methods for interactions
educationalContentSchema.methods.incrementView = async function() {
  this.interactions.views += 1;
  await this.save();
  return this;
};

educationalContentSchema.methods.toggleLike = async function(userId) {
  const likeIndex = this.interactions.likes.findIndex(
    like => like.user.toString() === userId.toString()
  );
  
  if (likeIndex > -1) {
    this.interactions.likes.splice(likeIndex, 1);
  } else {
    this.interactions.likes.push({ user: userId });
  }
  
  await this.save();
  return this;
};

educationalContentSchema.methods.toggleBookmark = async function(userId) {
  const bookmarkIndex = this.interactions.bookmarks.findIndex(
    bookmark => bookmark.user.toString() === userId.toString()
  );
  
  if (bookmarkIndex > -1) {
    this.interactions.bookmarks.splice(bookmarkIndex, 1);
  } else {
    this.interactions.bookmarks.push({ user: userId });
  }
  
  await this.save();
  return this;
};

// Pre-save middleware to set publishedAt date
educationalContentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.models.EducationalContent || mongoose.model('EducationalContent', educationalContentSchema);

const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['action_share', 'achievement', 'tip', 'question', 'challenge_invite', 'milestone'],
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Related data based on post type
  relatedData: {
    actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action' },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    achievementId: String,
    badgeId: String,
    co2Saved: Number,
    waterSaved: Number,
    photos: [String] // Array of photo URLs
  },
  // Engagement metrics
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true, maxlength: 500 },
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    editedAt: Date
  }],
  shares: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sharedAt: { type: Date, default: Date.now },
    comment: String
  }],
  // Visibility and moderation
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'fake_content', 'other']
    },
    description: String,
    reportedAt: { type: Date, default: Date.now }
  }],
  isHidden: {
    type: Boolean,
    default: false
  },
  // Tags and categorization
  tags: [String],
  location: {
    city: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  // Engagement stats (computed fields)
  engagementScore: {
    type: Number,
    default: 0
  },
  trending: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ type: 1, createdAt: -1 });
communityPostSchema.index({ visibility: 1, isHidden: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ engagementScore: -1, createdAt: -1 });
communityPostSchema.index({ trending: 1, createdAt: -1 });

// Virtual for like count
communityPostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
communityPostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
communityPostSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Virtual for total engagement
communityPostSchema.virtual('totalEngagement').get(function() {
  return this.likes.length + this.comments.length + this.shares.length;
});

// Method to check if user liked the post
communityPostSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to add a like
communityPostSchema.methods.addLike = async function(userId) {
  if (this.isLikedBy(userId)) {
    throw new Error('User already liked this post');
  }
  
  this.likes.push({ user: userId });
  await this.calculateEngagementScore();
  await this.save();
  
  // Create notification for post author (if not self-like)
  if (this.author.toString() !== userId.toString()) {
    const Notification = mongoose.model('Notification');
    const User = mongoose.model('User');
    const liker = await User.findById(userId).select('username');
    
    await Notification.createNotification({
      recipient: this.author,
      sender: userId,
      type: 'community_milestone',
      title: '👍 New Like!',
      message: `${liker.username} liked your post`,
      data: {
        postId: this._id
      },
      priority: 'low'
    });
  }
  
  return this;
};

// Method to remove a like
communityPostSchema.methods.removeLike = async function(userId) {
  const initialLength = this.likes.length;
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  
  if (this.likes.length === initialLength) {
    throw new Error('User has not liked this post');
  }
  
  await this.calculateEngagementScore();
  await this.save();
  return this;
};

// Method to add a comment
communityPostSchema.methods.addComment = async function(userId, content) {
  const comment = {
    user: userId,
    content: content,
    createdAt: new Date()
  };
  
  this.comments.push(comment);
  await this.calculateEngagementScore();
  await this.save();
  
  // Create notification for post author (if not self-comment)
  if (this.author.toString() !== userId.toString()) {
    const Notification = mongoose.model('Notification');
    const User = mongoose.model('User');
    const commenter = await User.findById(userId).select('username');
    
    await Notification.createNotification({
      recipient: this.author,
      sender: userId,
      type: 'community_milestone',
      title: '💬 New Comment!',
      message: `${commenter.username} commented on your post`,
      data: {
        postId: this._id
      },
      priority: 'low'
    });
  }
  
  return comment;
};

// Method to calculate engagement score
communityPostSchema.methods.calculateEngagementScore = async function() {
  const now = new Date();
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);
  
  // Base engagement score
  let score = 0;
  score += this.likes.length * 1;
  score += this.comments.length * 3;
  score += this.shares.length * 5;
  
  // Time decay factor (content gets less relevant over time)
  const decayFactor = Math.max(0.1, 1 / (1 + ageInHours / 24));
  score = score * decayFactor;
  
  this.engagementScore = Math.round(score * 100) / 100;
  
  // Mark as trending if score is high enough
  this.trending = score > 10 && ageInHours < 48;
  
  return this.engagementScore;
};

// Static method to get trending posts
communityPostSchema.statics.getTrendingPosts = async function(limit = 10) {
  return await this.find({
    visibility: 'public',
    isHidden: false,
    trending: true
  })
  .populate('author', 'username avatar gamification.level')
  .sort({ engagementScore: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to get posts for user feed
communityPostSchema.statics.getFeedForUser = async function(userId, page = 1, limit = 20) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) throw new Error('User not found');
  
  // Get posts from friends and followed users, plus public posts
  const friendIds = user.social.friends
    .filter(friend => friend.status === 'accepted')
    .map(friend => friend.user);
  
  const relevantUserIds = [
    ...friendIds,
    ...user.social.following,
    userId // Include user's own posts
  ];
  
  const skip = (page - 1) * limit;
  
  return await this.find({
    $or: [
      { author: { $in: relevantUserIds } },
      { visibility: 'public', isHidden: false }
    ],
    isHidden: false
  })
  .populate('author', 'username avatar gamification.level bio')
  .populate('comments.user', 'username avatar')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to search posts
communityPostSchema.statics.searchPosts = async function(query, filters = {}) {
  const searchQuery = {
    visibility: 'public',
    isHidden: false,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (filters.type) {
    searchQuery.type = filters.type;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    searchQuery.tags = { $in: filters.tags };
  }
  
  return await this.find(searchQuery)
    .populate('author', 'username avatar gamification.level')
    .sort({ engagementScore: -1, createdAt: -1 })
    .limit(filters.limit || 50);
};

module.exports = mongoose.models.Community || mongoose.model('Community', communityPostSchema);

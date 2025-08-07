const express = require('express');
const User = require('../model/User');
const CommunityPost = require('../model/Community');
const Notification = require('../model/Notification');
const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /community/feed - Get personalized community feed
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    // Get current user to access their following list
    const currentUser = await User.findById(currentUserId);
    
    // Get posts from people the user follows + their own posts + public posts
    const followingIds = [...currentUser.social.following, currentUserId];
    
    const posts = await CommunityPost.getUserFeed(currentUserId, followingIds, parseInt(limit), skip);
    
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get community feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to get community feed' });
  }
});

// GET /community/trending - Get trending posts
router.get('/trending', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, timeframe = '24h' } = req.query;
    const skip = (page - 1) * limit;
    
    const posts = await CommunityPost.getTrendingPosts(timeframe, parseInt(limit), skip);
    
    res.json({
      success: true,
      data: {
        posts,
        timeframe,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trending posts' });
  }
});

// GET /community/search - Search community posts
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { query, type, tags, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const searchCriteria = {
      visibility: 'public'
    };
    
    // Text search
    if (query) {
      searchCriteria.content = new RegExp(query.trim(), 'i');
    }
    
    // Filter by post type
    if (type && type !== 'all') {
      searchCriteria.type = type;
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      searchCriteria.tags = { $in: tagArray };
    }
    
    const posts = await CommunityPost.searchPosts(query, searchCriteria, parseInt(limit), skip);
    
    res.json({
      success: true,
      data: {
        posts,
        query,
        filters: { type, tags },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Search community posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to search posts' });
  }
});

// POST /community/posts - Create a new community post
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const {
      type,
      content,
      relatedData,
      tags,
      visibility = 'public',
      location
    } = req.body;
    
    const currentUserId = req.session.userId;
    
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Post type and content are required'
      });
    }
    
    // Validate post type
    const validTypes = ['action_share', 'achievement', 'tip', 'question', 'challenge'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post type'
      });
    }
    
    const postData = {
      author: currentUserId,
      type,
      content,
      visibility,
      tags: tags || [],
      location: location || null
    };
    
    // Add related data based on post type
    if (relatedData) {
      postData.relatedData = relatedData;
    }
    
    const post = new CommunityPost(postData);
    await post.save();
    
    // Populate author info for response
    await post.populate('author', 'username avatar gamification.level');
    
    res.json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
    
  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// GET /community/posts/:postId - Get a single post
router.get('/posts/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.session.userId;
    
    const post = await CommunityPost.findById(postId)
      .populate('author', 'username avatar bio gamification.level')
      .populate('comments.author', 'username avatar gamification.level')
      .populate('likes', 'username avatar');
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Check if user can view this post
    if (post.visibility === 'private' && post.author._id.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: 'You cannot view this post' });
    }
    
    if (post.visibility === 'friends') {
      const postAuthor = await User.findById(post.author._id);
      const isFriend = postAuthor.social.friends.some(f => 
        f.user.toString() === currentUserId && f.status === 'accepted'
      );
      
      if (!isFriend && post.author._id.toString() !== currentUserId) {
        return res.status(403).json({ success: false, message: 'You cannot view this post' });
      }
    }
    
    res.json({
      success: true,
      data: post
    });
    
  } catch (error) {
    console.error('Get community post error:', error);
    res.status(500).json({ success: false, message: 'Failed to get post' });
  }
});

// POST /community/posts/:postId/like - Like a post
router.post('/posts/:postId/like', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.session.userId;
    
    const post = await CommunityPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const result = await post.addLike(currentUserId);
    
    // Create notification for post author if not liking own post
    if (post.author.toString() !== currentUserId && result.added) {
      const currentUser = await User.findById(currentUserId);
      
      await Notification.createNotification({
        recipient: post.author,
        sender: currentUserId,
        type: 'post_liked',
        title: '👍 Someone liked your post!',
        message: `${currentUser.username} liked your post`,
        priority: 'low',
        actionUrl: `/community/posts/${postId}`,
        metadata: {
          postId: post._id,
          postType: post.type
        }
      });
      
      // Real-time notification
      if (req.io) {
        req.io.to(`user-${post.author}`).emit('notification', {
          type: 'post_liked',
          title: 'Post Liked!',
          message: `${currentUser.username} liked your post`,
          sender: {
            id: currentUserId,
            username: currentUser.username,
            avatar: currentUser.avatar
          }
        });
      }
    }
    
    res.json({
      success: true,
      message: result.added ? 'Post liked' : 'Post unliked',
      data: {
        liked: result.added,
        likeCount: post.engagement.likes
      }
    });
    
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
});

// POST /community/posts/:postId/comment - Add comment to post
router.post('/posts/:postId/comment', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const currentUserId = req.session.userId;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    
    const post = await CommunityPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const comment = await post.addComment(currentUserId, content.trim());
    
    // Create notification for post author if not commenting on own post
    if (post.author.toString() !== currentUserId) {
      const currentUser = await User.findById(currentUserId);
      
      await Notification.createNotification({
        recipient: post.author,
        sender: currentUserId,
        type: 'post_commented',
        title: '💬 New comment on your post!',
        message: `${currentUser.username} commented on your post`,
        priority: 'medium',
        actionUrl: `/community/posts/${postId}`,
        metadata: {
          postId: post._id,
          commentId: comment._id,
          postType: post.type
        }
      });
      
      // Real-time notification
      if (req.io) {
        req.io.to(`user-${post.author}`).emit('notification', {
          type: 'post_commented',
          title: 'New Comment!',
          message: `${currentUser.username} commented on your post`,
          sender: {
            id: currentUserId,
            username: currentUser.username,
            avatar: currentUser.avatar
          }
        });
      }
    }
    
    // Populate comment author info
    await post.populate('comments.author', 'username avatar gamification.level');
    const newComment = post.comments.id(comment._id);
    
    res.json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// DELETE /community/posts/:postId - Delete a post
router.delete('/posts/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.session.userId;
    
    const post = await CommunityPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.author.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }
    
    await CommunityPost.findByIdAndDelete(postId);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// GET /community/posts/user/:userId - Get posts by specific user
router.get('/posts/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    // Check if user can view this profile's posts
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let visibilityFilter = { author: userId };
    
    if (userId !== currentUserId) {
      // If viewing another user's posts, check privacy settings
      if (!targetUser.social.isPublic) {
        // Check if they're friends
        const currentUser = await User.findById(currentUserId);
        const isFriend = currentUser.social.friends.some(f => 
          f.user.toString() === userId && f.status === 'accepted'
        );
        
        if (!isFriend) {
          return res.status(403).json({ 
            success: false, 
            message: 'You cannot view this user\'s posts' 
          });
        }
        
        visibilityFilter.visibility = { $in: ['public', 'friends'] };
      } else {
        visibilityFilter.visibility = 'public';
      }
    }
    
    const posts = await CommunityPost.find(visibilityFilter)
      .populate('author', 'username avatar gamification.level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    res.json({
      success: true,
      data: {
        posts,
        user: {
          _id: targetUser._id,
          username: targetUser.username,
          avatar: targetUser.avatar,
          level: targetUser.gamification.level
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user posts' });
  }
});

// POST /community/posts/:postId/share - Share a post
router.post('/posts/:postId/share', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body;
    const currentUserId = req.session.userId;
    
    const originalPost = await CommunityPost.findById(postId)
      .populate('author', 'username avatar');
    
    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Update share count
    originalPost.engagement.shares += 1;
    await originalPost.save();
    
    // Create a new post as a share
    const sharePost = new CommunityPost({
      author: currentUserId,
      type: 'share',
      content: message || `Shared a post from ${originalPost.author.username}`,
      relatedData: {
        sharedPost: postId
      },
      visibility: 'public'
    });
    
    await sharePost.save();
    await sharePost.populate('author', 'username avatar gamification.level');
    
    // Notify original author
    if (originalPost.author._id.toString() !== currentUserId) {
      const currentUser = await User.findById(currentUserId);
      
      await Notification.createNotification({
        recipient: originalPost.author._id,
        sender: currentUserId,
        type: 'post_shared',
        title: '🔄 Your post was shared!',
        message: `${currentUser.username} shared your post`,
        priority: 'medium',
        actionUrl: `/community/posts/${sharePost._id}`,
        metadata: {
          originalPostId: postId,
          sharePostId: sharePost._id
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Post shared successfully',
      data: sharePost
    });
    
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ success: false, message: 'Failed to share post' });
  }
});

// GET /community/stats - Get community statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    
    // Get overall community stats
    const [
      totalPosts,
      postsToday,
      activeUsers,
      currentUserStats
    ] = await Promise.all([
      CommunityPost.countDocuments({ visibility: 'public' }),
      CommunityPost.countDocuments({
        visibility: 'public',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({
        'social.isPublic': true,
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      CommunityPost.aggregate([
        {
          $match: { author: currentUserId }
        },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            totalLikes: { $sum: '$engagement.likes' },
            totalComments: { $sum: '$engagement.comments' },
            totalShares: { $sum: '$engagement.shares' }
          }
        }
      ])
    ]);
    
    const userStats = currentUserStats[0] || {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0
    };
    
    res.json({
      success: true,
      data: {
        community: {
          totalPosts,
          postsToday,
          activeUsers
        },
        userStats: {
          totalPosts: userStats.totalPosts,
          totalLikes: userStats.totalLikes,
          totalComments: userStats.totalComments,
          totalShares: userStats.totalShares,
          totalEngagement: userStats.totalLikes + userStats.totalComments + userStats.totalShares
        }
      }
    });
    
  } catch (error) {
    console.error('Get community stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get community stats' });
  }
});

module.exports = router;

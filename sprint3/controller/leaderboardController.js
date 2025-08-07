const express = require('express');
const User = require('../model/User');
const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /leaderboard/global - Get global leaderboard
router.get('/global', requireAuth, async (req, res) => {
  try {
    const { 
      category = 'totalActions', 
      timeframe = 'all', 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const currentUserId = req.session.userId;
    
    // Build match criteria based on timeframe
    let matchCriteria = { 'social.isPublic': true };
    let sortField = {};
    
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    switch (category) {
      case 'totalActions':
        if (timeframe === 'week') {
          sortField = { 'stats.weeklyActions': -1 };
        } else if (timeframe === 'month') {
          sortField = { 'stats.monthlyActions': -1 };
        } else {
          sortField = { 'stats.totalActions': -1 };
        }
        break;
      case 'currentStreak':
        sortField = { 'stats.currentStreak': -1 };
        break;
      case 'longestStreak':
        sortField = { 'stats.longestStreak': -1 };
        break;
      case 'level':
        sortField = { 'gamification.level': -1, 'gamification.experience': -1 };
        break;
      case 'points':
        sortField = { 'gamification.points': -1 };
        break;
      default:
        sortField = { 'stats.totalActions': -1 };
    }
    
    // Get leaderboard data
    const leaderboardUsers = await User.find(matchCriteria)
      .select('username avatar bio location gamification stats lastActive')
      .sort(sortField)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get current user's rank
    const currentUserRank = await User.countDocuments({
      ...matchCriteria,
      [`${category === 'level' ? 'gamification.level' : category === 'points' ? 'gamification.points' : `stats.${category}`}`]: {
        $gt: await User.findById(currentUserId).then(user => {
          if (category === 'level') return user.gamification.level;
          if (category === 'points') return user.gamification.points;
          return user.stats[category] || 0;
        })
      }
    }) + 1;
    
    // Format leaderboard entries
    const leaderboard = leaderboardUsers.map((user, index) => {
      let value;
      switch (category) {
        case 'level':
          value = user.gamification.level;
          break;
        case 'points':
          value = user.gamification.points;
          break;
        default:
          value = user.stats[category] || 0;
      }
      
      return {
        rank: skip + index + 1,
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        level: user.gamification.level,
        value,
        lastActive: user.lastActive,
        isCurrentUser: user._id.toString() === currentUserId
      };
    });
    
    res.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        category,
        timeframe,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: leaderboard.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard' });
  }
});

// GET /leaderboard/friends - Get friends leaderboard
router.get('/friends', requireAuth, async (req, res) => {
  try {
    const { category = 'totalActions', timeframe = 'all', page = 1, limit = 50 } = req.query;
    const currentUserId = req.session.userId;
    
    // Get current user's friends
    const currentUser = await User.findById(currentUserId)
      .populate('social.friends.user', 'username avatar bio location gamification stats lastActive');
    
    const friendIds = currentUser.social.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user._id);
    
    // Include current user in the leaderboard
    friendIds.push(currentUserId);
    
    let sortField = {};
    switch (category) {
      case 'totalActions':
        if (timeframe === 'week') {
          sortField = { 'stats.weeklyActions': -1 };
        } else if (timeframe === 'month') {
          sortField = { 'stats.monthlyActions': -1 };
        } else {
          sortField = { 'stats.totalActions': -1 };
        }
        break;
      case 'currentStreak':
        sortField = { 'stats.currentStreak': -1 };
        break;
      case 'longestStreak':
        sortField = { 'stats.longestStreak': -1 };
        break;
      case 'level':
        sortField = { 'gamification.level': -1, 'gamification.experience': -1 };
        break;
      case 'points':
        sortField = { 'gamification.points': -1 };
        break;
      default:
        sortField = { 'stats.totalActions': -1 };
    }
    
    const skip = (page - 1) * limit;
    
    const friendsLeaderboard = await User.find({ _id: { $in: friendIds } })
      .select('username avatar bio location gamification stats lastActive')
      .sort(sortField)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Format leaderboard entries
    const leaderboard = friendsLeaderboard.map((user, index) => {
      let value;
      switch (category) {
        case 'level':
          value = user.gamification.level;
          break;
        case 'points':
          value = user.gamification.points;
          break;
        default:
          value = user.stats[category] || 0;
      }
      
      return {
        rank: skip + index + 1,
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        level: user.gamification.level,
        value,
        lastActive: user.lastActive,
        isCurrentUser: user._id.toString() === currentUserId,
        isFriend: user._id.toString() !== currentUserId
      };
    });
    
    res.json({
      success: true,
      data: {
        leaderboard,
        category,
        timeframe,
        totalFriends: friendIds.length - 1, // Exclude current user from count
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: leaderboard.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get friends leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get friends leaderboard' });
  }
});

// GET /leaderboard/local - Get local/regional leaderboard
router.get('/local', requireAuth, async (req, res) => {
  try {
    const { category = 'totalActions', page = 1, limit = 50 } = req.query;
    const currentUserId = req.session.userId;
    
    // Get current user's location
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser.location) {
      return res.status(400).json({
        success: false,
        message: 'Please set your location to view local leaderboard'
      });
    }
    
    const skip = (page - 1) * limit;
    
    // Find users in the same location
    let sortField = {};
    switch (category) {
      case 'currentStreak':
        sortField = { 'stats.currentStreak': -1 };
        break;
      case 'longestStreak':
        sortField = { 'stats.longestStreak': -1 };
        break;
      case 'level':
        sortField = { 'gamification.level': -1, 'gamification.experience': -1 };
        break;
      case 'points':
        sortField = { 'gamification.points': -1 };
        break;
      default:
        sortField = { 'stats.totalActions': -1 };
    }
    
    const localUsers = await User.find({
      location: new RegExp(currentUser.location, 'i'),
      'social.isPublic': true
    })
    .select('username avatar bio location gamification stats lastActive')
    .sort(sortField)
    .limit(parseInt(limit))
    .skip(skip);
    
    // Get current user's local rank
    const currentUserRank = await User.countDocuments({
      location: new RegExp(currentUser.location, 'i'),
      'social.isPublic': true,
      [`${category === 'level' ? 'gamification.level' : category === 'points' ? 'gamification.points' : `stats.${category}`}`]: {
        $gt: category === 'level' ? currentUser.gamification.level :
             category === 'points' ? currentUser.gamification.points :
             currentUser.stats[category] || 0
      }
    }) + 1;
    
    // Format leaderboard entries
    const leaderboard = localUsers.map((user, index) => {
      let value;
      switch (category) {
        case 'level':
          value = user.gamification.level;
          break;
        case 'points':
          value = user.gamification.points;
          break;
        default:
          value = user.stats[category] || 0;
      }
      
      return {
        rank: skip + index + 1,
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        level: user.gamification.level,
        value,
        lastActive: user.lastActive,
        isCurrentUser: user._id.toString() === currentUserId
      };
    });
    
    res.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        category,
        location: currentUser.location,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: leaderboard.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get local leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get local leaderboard' });
  }
});

// GET /leaderboard/achievements - Get achievement leaderboard
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    // Aggregate users by number of completed achievements
    const achievementLeaderboard = await User.aggregate([
      {
        $match: { 'social.isPublic': true }
      },
      {
        $addFields: {
          completedAchievements: {
            $size: {
              $filter: {
                input: '$gamification.achievements',
                cond: { $eq: ['$$this.completed', true] }
              }
            }
          }
        }
      },
      {
        $sort: { 
          completedAchievements: -1,
          'gamification.level': -1 
        }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          username: 1,
          avatar: 1,
          bio: 1,
          location: 1,
          'gamification.level': 1,
          'gamification.badges': 1,
          completedAchievements: 1,
          lastActive: 1
        }
      }
    ]);
    
    // Get current user's rank
    const currentUser = await User.findById(currentUserId);
    const currentUserCompletedCount = currentUser.gamification.achievements
      .filter(a => a.completed).length;
    
    const currentUserRank = await User.countDocuments({
      'social.isPublic': true,
      $expr: {
        $gt: [
          {
            $size: {
              $filter: {
                input: '$gamification.achievements',
                cond: { $eq: ['$$this.completed', true] }
              }
            }
          },
          currentUserCompletedCount
        ]
      }
    }) + 1;
    
    // Format leaderboard entries
    const leaderboard = achievementLeaderboard.map((user, index) => ({
      rank: skip + index + 1,
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      level: user.gamification.level,
      badges: user.gamification.badges,
      completedAchievements: user.completedAchievements,
      lastActive: user.lastActive,
      isCurrentUser: user._id.toString() === currentUserId
    }));
    
    res.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        currentUserAchievements: currentUserCompletedCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: leaderboard.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get achievement leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get achievement leaderboard' });
  }
});

// GET /leaderboard/streaks - Get current streak leaderboard
router.get('/streaks', requireAuth, async (req, res) => {
  try {
    const { type = 'current', page = 1, limit = 50 } = req.query; // type: 'current' or 'longest'
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    const sortField = type === 'current' ? 
      { 'stats.currentStreak': -1 } : 
      { 'stats.longestStreak': -1 };
    
    const streakUsers = await User.find({ 'social.isPublic': true })
      .select('username avatar bio location gamification stats lastActive')
      .sort(sortField)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get current user's rank
    const currentUser = await User.findById(currentUserId);
    const currentUserStreak = type === 'current' ? 
      currentUser.stats.currentStreak : 
      currentUser.stats.longestStreak;
    
    const currentUserRank = await User.countDocuments({
      'social.isPublic': true,
      [`stats.${type}Streak`]: { $gt: currentUserStreak }
    }) + 1;
    
    // Format leaderboard entries
    const leaderboard = streakUsers.map((user, index) => ({
      rank: skip + index + 1,
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      level: user.gamification.level,
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
      streakValue: type === 'current' ? user.stats.currentStreak : user.stats.longestStreak,
      lastActive: user.lastActive,
      isCurrentUser: user._id.toString() === currentUserId
    }));
    
    res.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        currentUserStreak,
        type,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: leaderboard.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get streak leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get streak leaderboard' });
  }
});

// GET /leaderboard/stats - Get leaderboard statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    
    // Get various statistics
    const [
      totalUsers,
      activeThisWeek,
      topPerformer,
      currentUser
    ] = await Promise.all([
      User.countDocuments({ 'social.isPublic': true }),
      User.countDocuments({
        'social.isPublic': true,
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      User.findOne({ 'social.isPublic': true })
        .select('username avatar gamification.level stats.totalActions')
        .sort({ 'stats.totalActions': -1 }),
      User.findById(currentUserId)
    ]);
    
    // Get current user's ranks in different categories
    const [
      totalActionsRank,
      currentStreakRank,
      levelRank,
      pointsRank
    ] = await Promise.all([
      User.countDocuments({
        'social.isPublic': true,
        'stats.totalActions': { $gt: currentUser.stats.totalActions }
      }) + 1,
      User.countDocuments({
        'social.isPublic': true,
        'stats.currentStreak': { $gt: currentUser.stats.currentStreak }
      }) + 1,
      User.countDocuments({
        'social.isPublic': true,
        'gamification.level': { $gt: currentUser.gamification.level }
      }) + 1,
      User.countDocuments({
        'social.isPublic': true,
        'gamification.points': { $gt: currentUser.gamification.points }
      }) + 1
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeThisWeek,
          topPerformer: topPerformer ? {
            username: topPerformer.username,
            avatar: topPerformer.avatar,
            level: topPerformer.gamification.level,
            totalActions: topPerformer.stats.totalActions
          } : null
        },
        currentUserRanks: {
          totalActions: totalActionsRank,
          currentStreak: currentStreakRank,
          level: levelRank,
          points: pointsRank
        }
      }
    });
    
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard stats' });
  }
});

module.exports = router;

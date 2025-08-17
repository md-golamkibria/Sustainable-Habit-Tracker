const express = require('express');
const User = require('../model/User');
const Goal = require('../model/Goal');
const Action = require('../model/Action');
const Challenge = require('../model/Challenge');
const Ranking = require('../model/Ranking');

const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /compare/users - Get users to compare with
router.get('/users', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { limit = 10, search } = req.query;

    let query = { _id: { $ne: currentUserId }, isActive: true };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username profile.firstName profile.lastName profile.avatar createdAt')
      .limit(parseInt(limit))
      .lean();

    // Get basic stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [goalsCompleted, actionsCompleted, ranking] = await Promise.all([
        Goal.countDocuments({ user: user._id, status: 'completed' }),
        Action.countDocuments({ user: user._id, status: 'completed' }),
        Ranking.findOne({ user: user._id, category: 'overall' }).lean()
      ]);

      return {
        ...user,
        stats: {
          goalsCompleted,
          actionsCompleted,
          sustainabilityScore: ranking?.sustainabilityScore || 0,
          rank: ranking?.rank || 0
        }
      };
    }));

    res.json({ success: true, data: usersWithStats });
  } catch (error) {
    console.error('Get users for comparison error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users for comparison' });
  }
});

// GET /compare/:userId - Compare current user with another user
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;

    if (currentUserId === userId) {
      return res.status(400).json({ success: false, message: 'Cannot compare with yourself' });
    }

    // Calculate date range based on timeframe
    let startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get both users' data
    const [currentUser, compareUser] = await Promise.all([
      User.findById(currentUserId).select('username profile').lean(),
      User.findById(userId).select('username profile').lean()
    ]);

    if (!compareUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get comprehensive comparison data
    const [currentUserStats, compareUserStats] = await Promise.all([
      getUserComparisonStats(currentUserId, startDate),
      getUserComparisonStats(userId, startDate)
    ]);

    const comparison = {
      currentUser: {
        ...currentUser,
        stats: currentUserStats
      },
      compareUser: {
        ...compareUser,
        stats: compareUserStats
      },
      differences: calculateDifferences(currentUserStats, compareUserStats),
      timeframe,
      generatedAt: new Date()
    };

    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Compare users error:', error);
    res.status(500).json({ success: false, message: 'Failed to compare users' });
  }
});

// GET /compare/leaderboard - Get leaderboard comparison
router.get('/leaderboard/position', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { category = 'overall' } = req.query;

    const currentUserRanking = await Ranking.findOne({ 
      user: currentUserId, 
      category 
    }).populate('user', 'username profile.firstName profile.lastName').lean();

    if (!currentUserRanking) {
      return res.status(404).json({ success: false, message: 'Ranking not found' });
    }

    // Get users around current user's position
    const rankingsAround = await Ranking.find({ category })
      .populate('user', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ sustainabilityScore: -1 })
      .lean();

    const currentIndex = rankingsAround.findIndex(r => r.user._id.toString() === currentUserId);
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(rankingsAround.length, currentIndex + 3);
    
    const nearbyRankings = rankingsAround.slice(start, end);

    res.json({
      success: true,
      data: {
        currentUser: currentUserRanking,
        nearbyRankings,
        totalUsers: rankingsAround.length,
        position: currentIndex + 1
      }
    });
  } catch (error) {
    console.error('Get leaderboard position error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard position' });
  }
});

// Helper function to get user comparison statistics
async function getUserComparisonStats(userId, startDate) {
  const [
    totalGoals,
    completedGoals,
    totalActions,
    completedActions,
    recentGoals,
    recentActions,
    challenges,
    ranking
  ] = await Promise.all([
    Goal.countDocuments({ user: userId }),
    Goal.countDocuments({ user: userId, status: 'completed' }),
    Action.countDocuments({ user: userId }),
    Action.countDocuments({ user: userId, status: 'completed' }),
    Goal.countDocuments({ user: userId, updatedAt: { $gte: startDate } }),
    Action.countDocuments({ user: userId, createdAt: { $gte: startDate } }),
    Challenge.countDocuments({ 
      'participants.user': userId, 
      'participants.completed': true 
    }),
    Ranking.findOne({ user: userId, category: 'overall' }).lean()
  ]);

  // Calculate additional metrics
  const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  const actionCompletionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  // Get environmental impact
  const environmentalImpact = await Action.aggregate([
    { $match: { user: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalCO2Saved: { $sum: '$co2Saved' },
        totalWaterSaved: { $sum: '$waterSaved' },
        totalWastePrevented: { $sum: '$wastePrevented' }
      }
    }
  ]);

  const impact = environmentalImpact[0] || {
    totalCO2Saved: 0,
    totalWaterSaved: 0,
    totalWastePrevented: 0
  };

  return {
    goals: {
      total: totalGoals,
      completed: completedGoals,
      recent: recentGoals,
      completionRate: Math.round(goalCompletionRate * 100) / 100
    },
    actions: {
      total: totalActions,
      completed: completedActions,
      recent: recentActions,
      completionRate: Math.round(actionCompletionRate * 100) / 100
    },
    challenges: {
      completed: challenges
    },
    ranking: {
      score: ranking?.sustainabilityScore || 0,
      rank: ranking?.rank || 0,
      rankChange: ranking?.rankChange || 'new'
    },
    environmentalImpact: {
      co2Saved: Math.round(impact.totalCO2Saved * 100) / 100,
      waterSaved: Math.round(impact.totalWaterSaved * 100) / 100,
      wastePrevented: Math.round(impact.totalWastePrevented * 100) / 100
    }
  };
}

// Helper function to calculate differences between two users
function calculateDifferences(currentStats, compareStats) {
  return {
    goals: {
      completedDiff: currentStats.goals.completed - compareStats.goals.completed,
      completionRateDiff: currentStats.goals.completionRate - compareStats.goals.completionRate,
      recentDiff: currentStats.goals.recent - compareStats.goals.recent
    },
    actions: {
      completedDiff: currentStats.actions.completed - compareStats.actions.completed,
      completionRateDiff: currentStats.actions.completionRate - compareStats.actions.completionRate,
      recentDiff: currentStats.actions.recent - compareStats.actions.recent
    },
    ranking: {
      scoreDiff: currentStats.ranking.score - compareStats.ranking.score,
      rankDiff: compareStats.ranking.rank - currentStats.ranking.rank // Lower rank is better
    },
    environmentalImpact: {
      co2SavedDiff: currentStats.environmentalImpact.co2Saved - compareStats.environmentalImpact.co2Saved,
      waterSavedDiff: currentStats.environmentalImpact.waterSaved - compareStats.environmentalImpact.waterSaved,
      wastePreventedDiff: currentStats.environmentalImpact.wastePrevented - compareStats.environmentalImpact.wastePrevented
    }
  };
}

module.exports = router;

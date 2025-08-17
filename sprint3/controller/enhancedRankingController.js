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

// GET /ranking/leaderboard - Enhanced comprehensive leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const { 
      category = 'overall', 
      timeframe = 'all', 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const currentUserId = req.session.userId;

    // Get rankings with user details
    let rankings = await Ranking.find({ category })
      .populate('user', 'username profile.firstName profile.lastName profile.avatar createdAt')
      .sort({ sustainabilityScore: -1, totalGoalsCompleted: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate additional metrics for timeframe filtering
    if (timeframe !== 'all') {
      rankings = await filterByTimeframe(rankings, timeframe);
    }

    // Add rank positions
    rankings = rankings.map((ranking, index) => ({
      ...ranking,
      position: skip + index + 1
    }));

    // Get current user's ranking
    const currentUserRanking = await Ranking.findOne({ 
      user: currentUserId, 
      category 
    }).populate('user', 'username profile.firstName profile.lastName').lean();

    const totalUsers = await Ranking.countDocuments({ category });

    res.json({
      success: true,
      data: {
        rankings,
        currentUser: currentUserRanking,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: skip + rankings.length < totalUsers,
          hasPrev: page > 1
        },
        category,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get enhanced leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard' });
  }
});

// GET /ranking/categories - Get all ranking categories with stats
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = [
      {
        id: 'overall',
        name: 'Overall Sustainability',
        description: 'Based on goals completed, actions taken, and environmental impact',
        icon: '🌍'
      },
      {
        id: 'goals',
        name: 'Goal Achievers',
        description: 'Users who complete the most sustainability goals',
        icon: '🎯'
      },
      {
        id: 'actions',
        name: 'Action Heroes',
        description: 'Users who take the most sustainable actions',
        icon: '⚡'
      },
      {
        id: 'streaks',
        name: 'Consistency Champions',
        description: 'Users with the longest activity streaks',
        icon: '🔥'
      },
      {
        id: 'sustainability',
        name: 'Eco Warriors',
        description: 'Based on environmental impact and carbon footprint reduction',
        icon: '🌱'
      }
    ];

    // Get user counts for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const userCount = await Ranking.countDocuments({ category: category.id });
        return { ...category, userCount };
      })
    );

    res.json({ success: true, data: categoriesWithStats });
  } catch (error) {
    console.error('Get ranking categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ranking categories' });
  }
});

// GET /ranking/user/:userId - Get specific user's ranking across all categories
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's rankings across all categories
    const userRankings = await Ranking.find({ user: userId })
      .populate('user', 'username profile.firstName profile.lastName profile.avatar')
      .lean();

    if (userRankings.length === 0) {
      return res.status(404).json({ success: false, message: 'User rankings not found' });
    }

    // Get additional user stats
    const [goals, actions, challenges] = await Promise.all([
      Goal.find({ user: userId }).lean(),
      Action.find({ user: userId }).lean(),
      Challenge.find({ 'participants.user': userId }).lean()
    ]);

    const userStats = {
      goals: {
        total: goals.length,
        completed: goals.filter(g => g.status === 'completed').length,
        inProgress: goals.filter(g => g.status === 'in_progress').length
      },
      actions: {
        total: actions.length,
        completed: actions.filter(a => a.status === 'completed').length,
        environmentalImpact: actions.reduce((acc, action) => ({
          co2Saved: acc.co2Saved + (action.co2Saved || 0),
          waterSaved: acc.waterSaved + (action.waterSaved || 0),
          wastePrevented: acc.wastePrevented + (action.wastePrevented || 0)
        }), { co2Saved: 0, waterSaved: 0, wastePrevented: 0 })
      },
      challenges: {
        participated: challenges.length,
        completed: challenges.filter(c => 
          c.participants.some(p => 
            p.user.toString() === userId && p.completed
          )
        ).length
      }
    };

    res.json({
      success: true,
      data: {
        rankings: userRankings,
        stats: userStats,
        user: userRankings[0].user
      }
    });
  } catch (error) {
    console.error('Get user ranking error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user ranking' });
  }
});

// GET /ranking/achievements - Get ranking-based achievements
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const userRankings = await Ranking.find({ user: userId }).lean();
    const achievements = [];

    for (const ranking of userRankings) {
      // Top 10 achievements
      if (ranking.rank <= 10 && ranking.rank > 0) {
        achievements.push({
          id: `top10_${ranking.category}`,
          title: `Top 10 ${ranking.category.charAt(0).toUpperCase() + ranking.category.slice(1)}`,
          description: `Ranked #${ranking.rank} in ${ranking.category} category`,
          icon: '🏆',
          rarity: 'legendary',
          unlockedAt: ranking.lastUpdated
        });
      }

      // Top 50 achievements
      if (ranking.rank <= 50 && ranking.rank > 10) {
        achievements.push({
          id: `top50_${ranking.category}`,
          title: `Top 50 ${ranking.category.charAt(0).toUpperCase() + ranking.category.slice(1)}`,
          description: `Ranked #${ranking.rank} in ${ranking.category} category`,
          icon: '🥉',
          rarity: 'rare',
          unlockedAt: ranking.lastUpdated
        });
      }

      // Rank improvement achievements
      if (ranking.rankChange === 'up' && ranking.previousRank - ranking.rank >= 10) {
        achievements.push({
          id: `climber_${ranking.category}`,
          title: 'Rank Climber',
          description: `Improved by ${ranking.previousRank - ranking.rank} positions in ${ranking.category}`,
          icon: '📈',
          rarity: 'epic',
          unlockedAt: ranking.lastUpdated
        });
      }

      // Score milestones
      if (ranking.sustainabilityScore >= 1000) {
        achievements.push({
          id: 'sustainability_master',
          title: 'Sustainability Master',
          description: 'Achieved 1000+ sustainability score',
          icon: '🌟',
          rarity: 'legendary',
          unlockedAt: ranking.lastUpdated
        });
      }
    }

    res.json({ success: true, data: achievements });
  } catch (error) {
    console.error('Get ranking achievements error:', error);
    res.status(500).json({ success: false, message: 'Failed to get achievements' });
  }
});

// POST /ranking/update - Manually trigger ranking update for user
router.post('/update', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Recalculate user's rankings
    await updateUserRankings(userId);
    
    res.json({ success: true, message: 'Rankings updated successfully' });
  } catch (error) {
    console.error('Update ranking error:', error);
    res.status(500).json({ success: false, message: 'Failed to update rankings' });
  }
});

// Helper function to filter rankings by timeframe
async function filterByTimeframe(rankings, timeframe) {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return rankings;
  }

  // Recalculate scores for the timeframe
  const filteredRankings = await Promise.all(
    rankings.map(async (ranking) => {
      const [goals, actions] = await Promise.all([
        Goal.countDocuments({
          user: ranking.user._id,
          status: 'completed',
          updatedAt: { $gte: startDate }
        }),
        Action.countDocuments({
          user: ranking.user._id,
          status: 'completed',
          createdAt: { $gte: startDate }
        })
      ]);

      const timeframeSustainabilityScore = (goals * 10) + (actions * 2);
      
      return {
        ...ranking,
        timeframeSustainabilityScore,
        timeframeGoals: goals,
        timeframeActions: actions
      };
    })
  );

  // Sort by timeframe score
  return filteredRankings.sort((a, b) => b.timeframeSustainabilityScore - a.timeframeSustainabilityScore);
}

// Helper function to update user rankings
async function updateUserRankings(userId) {
  const [completedGoals, completedActions, challenges] = await Promise.all([
    Goal.countDocuments({ user: userId, status: 'completed' }),
    Action.countDocuments({ user: userId, status: 'completed' }),
    Challenge.countDocuments({ 
      'participants.user': userId, 
      'participants.completed': true 
    })
  ]);

  const sustainabilityScore = (completedGoals * 10) + (completedActions * 2) + (challenges * 5);

  // Update overall ranking
  await Ranking.findOneAndUpdate(
    { user: userId, category: 'overall' },
    {
      totalGoalsCompleted: completedGoals,
      totalActionsCompleted: completedActions,
      challengesCompleted: challenges,
      sustainabilityScore,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );

  // Update category-specific rankings
  await Promise.all([
    updateCategoryRanking(userId, 'goals', completedGoals),
    updateCategoryRanking(userId, 'actions', completedActions),
    updateCategoryRanking(userId, 'sustainability', sustainabilityScore)
  ]);
}

async function updateCategoryRanking(userId, category, score) {
  await Ranking.findOneAndUpdate(
    { user: userId, category },
    {
      sustainabilityScore: score,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
}

module.exports = router;

const express = require('express');
const Action = require('../model/Action');
const User = require('../model/User');
const moment = require('moment');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  next();
};

// Get comprehensive dashboard analytics
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Time ranges for analytics
    const now = new Date();
    const startOfToday = moment().startOf('day').toDate();
    const startOfWeek = moment().startOf('week').toDate();
    const startOfMonth = moment().startOf('month').toDate();
    const startOfYear = moment().startOf('year').toDate();

    // Get actions for different time periods
    const [todayActions, weekActions, monthActions, yearActions, allActions] = await Promise.all([
      Action.find({ userId, date: { $gte: startOfToday } }),
      Action.find({ userId, date: { $gte: startOfWeek } }),
      Action.find({ userId, date: { $gte: startOfMonth } }),
      Action.find({ userId, date: { $gte: startOfYear } }),
      Action.find({ userId })
    ]);

    // Calculate totals
    const todayStats = calculateStats(todayActions);
    const weekStats = calculateStats(weekActions);
    const monthStats = calculateStats(monthActions);
    const yearStats = calculateStats(yearActions);
    const allTimeStats = calculateStats(allActions);

    // Action type breakdown for this month
    const actionTypeBreakdown = {};
    monthActions.forEach(action => {
      if (!actionTypeBreakdown[action.actionType]) {
        actionTypeBreakdown[action.actionType] = {
          count: 0,
          co2Saved: 0,
          waterSaved: 0
        };
      }
      actionTypeBreakdown[action.actionType].count++;
      actionTypeBreakdown[action.actionType].co2Saved += action.impact.co2Saved;
      actionTypeBreakdown[action.actionType].waterSaved += action.impact.waterSaved;
    });

    // Daily activity for the past 30 days
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days').startOf('day');
      const endDate = moment(date).endOf('day');
      
      const dayActions = allActions.filter(action => {
        const actionDate = moment(action.date);
        return actionDate.isBetween(date, endDate, null, '[]');
      });
      
      dailyActivity.push({
        date: date.format('YYYY-MM-DD'),
        actions: dayActions.length,
        co2Saved: dayActions.reduce((sum, action) => sum + action.impact.co2Saved, 0),
        waterSaved: dayActions.reduce((sum, action) => sum + action.impact.waterSaved, 0)
      });
    }

    // Weekly comparison (this week vs last week)
    const lastWeekStart = moment().subtract(1, 'week').startOf('week').toDate();
    const lastWeekEnd = moment().subtract(1, 'week').endOf('week').toDate();
    const lastWeekActions = await Action.find({ 
      userId, 
      date: { $gte: lastWeekStart, $lte: lastWeekEnd } 
    });
    const lastWeekStats = calculateStats(lastWeekActions);

    // Calculate streak
    let currentStreak = 0;
    let checkDate = moment().startOf('day');
    
    while (true) {
      const dayStart = moment(checkDate).toDate();
      const dayEnd = moment(checkDate).endOf('day').toDate();
      
      const hasAction = allActions.some(action => {
        const actionDate = moment(action.date);
        return actionDate.isBetween(dayStart, dayEnd, null, '[]');
      });
      
      if (hasAction) {
        currentStreak++;
        checkDate.subtract(1, 'day');
      } else {
        break;
      }
    }

    res.json({
      overview: {
        today: todayStats,
        week: weekStats,
        month: monthStats,
        year: yearStats,
        allTime: allTimeStats
      },
      comparisons: {
        weekOverWeek: {
          current: weekStats,
          previous: lastWeekStats,
          improvement: {
            actions: weekStats.totalActions - lastWeekStats.totalActions,
            co2: weekStats.totalCO2Saved - lastWeekStats.totalCO2Saved,
            water: weekStats.totalWaterSaved - lastWeekStats.totalWaterSaved
          }
        }
      },
      trends: {
        dailyActivity,
        actionTypeBreakdown
      },
      achievements: {
        currentStreak,
        level: user.stats.level,
        experiencePoints: user.stats.experiencePoints,
        badges: user.stats.badges,
        totalActions: user.stats.totalActions
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get detailed time-series data for charts
router.get('/charts', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { period = 'month', metric = 'actions' } = req.query;

    let startDate, groupBy;
    switch (period) {
      case 'week':
        startDate = moment().subtract(7, 'days').startOf('day').toDate();
        groupBy = 'day';
        break;
      case 'month':
        startDate = moment().subtract(30, 'days').startOf('day').toDate();
        groupBy = 'day';
        break;
      case 'year':
        startDate = moment().subtract(365, 'days').startOf('day').toDate();
        groupBy = 'month';
        break;
      default:
        startDate = moment().subtract(30, 'days').startOf('day').toDate();
        groupBy = 'day';
    }

    const actions = await Action.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Group data by time period
    const groupedData = {};
    actions.forEach(action => {
      const key = groupBy === 'day' 
        ? moment(action.date).format('YYYY-MM-DD')
        : moment(action.date).format('YYYY-MM');

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          actions: 0,
          co2Saved: 0,
          waterSaved: 0,
          actionTypes: {}
        };
      }

      groupedData[key].actions++;
      groupedData[key].co2Saved += action.impact.co2Saved;
      groupedData[key].waterSaved += action.impact.waterSaved;

      // Track action types
      if (!groupedData[key].actionTypes[action.actionType]) {
        groupedData[key].actionTypes[action.actionType] = 0;
      }
      groupedData[key].actionTypes[action.actionType]++;
    });

    const chartData = Object.values(groupedData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      period,
      metric,
      data: chartData
    });

  } catch (error) {
    console.error('Charts data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get environmental impact insights
router.get('/impact', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const actions = await Action.find({ userId });

    const totalCO2Saved = actions.reduce((sum, action) => sum + action.impact.co2Saved, 0);
    const totalWaterSaved = actions.reduce((sum, action) => sum + action.impact.waterSaved, 0);

    // Calculate equivalent impacts
    const equivalents = {
      co2: {
        treesPlanted: Math.floor(totalCO2Saved / 21.8), // 1 tree absorbs ~21.8kg CO2/year
        carMilesAvoided: Math.floor(totalCO2Saved / 0.404), // 1 mile = ~0.404kg CO2
        phoneCharges: Math.floor(totalCO2Saved / 0.0047) // 1 charge = ~0.0047kg CO2
      },
      water: {
        showers: Math.floor(totalWaterSaved / 62), // Average shower uses 62L
        dishwasherLoads: Math.floor(totalWaterSaved / 13), // Average load uses 13L
        teaCups: Math.floor(totalWaterSaved / 0.25) // 1 cup of tea = 0.25L
      }
    };

    // Monthly trends
    const monthlyImpact = {};
    actions.forEach(action => {
      const month = moment(action.date).format('YYYY-MM');
      if (!monthlyImpact[month]) {
        monthlyImpact[month] = { co2: 0, water: 0, actions: 0 };
      }
      monthlyImpact[month].co2 += action.impact.co2Saved;
      monthlyImpact[month].water += action.impact.waterSaved;
      monthlyImpact[month].actions++;
    });

    res.json({
      totals: {
        co2Saved: totalCO2Saved,
        waterSaved: totalWaterSaved,
        actions: actions.length
      },
      equivalents,
      monthlyTrends: Object.entries(monthlyImpact)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
    });

  } catch (error) {
    console.error('Impact insights error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate stats
function calculateStats(actions) {
  return {
    totalActions: actions.length,
    totalCO2Saved: actions.reduce((sum, action) => sum + action.impact.co2Saved, 0),
    totalWaterSaved: actions.reduce((sum, action) => sum + action.impact.waterSaved, 0),
    uniqueActionTypes: [...new Set(actions.map(action => action.actionType))].length
  };
}

module.exports = router;

const express = require('express');
const Action = require('../model/Action');
const User = require('../model/User');
const { calculateCO2Savings, calculateWaterSavings } = require('../../shared/utils/helpers');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  next();
};

// Log a new action
router.post('/log', requireAuth, async (req, res) => {
  try {
    const { actionType, description, quantity, unit, notes } = req.body;
    
    if (!actionType || !description) {
      return res.status(400).json({ message: 'Action type and description are required' });
    }

    // Calculate environmental impact
    const co2Saved = calculateCO2Savings(actionType, quantity || 1);
    const waterSaved = calculateWaterSavings(actionType, quantity || 1);

    const newAction = new Action({
      userId: req.session.userId,
      actionType,
      description,
      quantity: quantity || 1,
      unit: unit || 'times',
      notes: notes || '',
      impact: {
        co2Saved,
        waterSaved
      }
    });

    await newAction.save();

    // Update user stats
    await User.findOneAndUpdate(
      { userId: req.session.userId },
      { 
        $inc: { 'stats.totalActions': 1 }
      }
    );

    res.json({ 
      message: 'Action logged successfully', 
      action: newAction,
      impact: { co2Saved, waterSaved }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get user's actions
router.get('/list', requireAuth, async (req, res) => {
  try {
    const { limit = 10, page = 1, dateFrom, dateTo } = req.query;
    
    let query = { userId: req.session.userId };
    
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const actions = await Action.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Action.countDocuments(query);

    res.json({
      actions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get action statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Today's actions
    const todayActions = await Action.countDocuments({
      userId,
      date: { $gte: today }
    });

    // This week's actions
    const weeklyActions = await Action.countDocuments({
      userId,
      date: { $gte: startOfWeek }
    });

    // Total impact calculation
    const impactStats = await Action.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCO2Saved: { $sum: '$impact.co2Saved' },
          totalWaterSaved: { $sum: '$impact.waterSaved' },
          totalActions: { $sum: 1 }
        }
      }
    ]);

    const impact = impactStats[0] || { totalCO2Saved: 0, totalWaterSaved: 0, totalActions: 0 };

    res.json({
      todayActions,
      weeklyActions,
      totalImpact: impact
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;

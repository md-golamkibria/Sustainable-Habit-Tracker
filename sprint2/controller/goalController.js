const express = require('express');
const Goal = require('../model/Goal');
const User = require('../model/User');
const Action = require('../model/Action');
const moment = require('moment');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  next();
};

// Get user's goals
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status, type } = req.query;

    let query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    // Update progress for each goal based on current actions
    const updatedGoals = await Promise.all(goals.map(async (goal) => {
      await updateGoalProgress(goal);
      return goal;
    }));

    res.json(updatedGoals);

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new goal
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      title,
      description,
      type,
      category,
      target,
      timeframe,
      milestones,
      rewards,
      priority,
      isPublic,
      reminders
    } = req.body;

    // Calculate end date if not provided
    let endDate = timeframe.endDate;
    if (!endDate && timeframe.duration) {
      endDate = moment().add(timeframe.duration, 'days').toDate();
    }

    const goal = new Goal({
      userId,
      title,
      description,
      type,
      category,
      target,
      timeframe: {
        ...timeframe,
        endDate
      },
      milestones: milestones || [],
      rewards: rewards || {},
      priority: priority || 'medium',
      isPublic: isPublic || false,
      reminders: reminders || { enabled: true, frequency: 'daily' }
    });

    await goal.save();
    res.status(201).json({ message: 'Goal created successfully', goal });

  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a goal
router.put('/:goalId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { goalId } = req.params;
    const updateData = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Don't allow updating completed goals
    if (goal.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update completed goals' });
    }

    Object.assign(goal, updateData);
    await goal.save();

    res.json({ message: 'Goal updated successfully', goal });

  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a goal
router.delete('/:goalId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { goalId } = req.params;

    const goal = await Goal.findOneAndDelete({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });

  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get goal statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const [totalGoals, activeGoals, completedGoals, failedGoals] = await Promise.all([
      Goal.countDocuments({ userId }),
      Goal.countDocuments({ userId, status: 'active' }),
      Goal.countDocuments({ userId, status: 'completed' }),
      Goal.countDocuments({ userId, status: 'failed' })
    ]);

    // Get goals by category
    const goalsByCategory = await Goal.aggregate([
      { $match: { userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get completion rate by type
    const completionByType = await Goal.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate completion rates
    const typeStats = {};
    completionByType.forEach(stat => {
      const type = stat._id.type;
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, completed: 0 };
      }
      typeStats[type].total += stat.count;
      if (stat._id.status === 'completed') {
        typeStats[type].completed += stat.count;
      }
    });

    Object.keys(typeStats).forEach(type => {
      typeStats[type].completionRate = typeStats[type].total > 0 ? 
        (typeStats[type].completed / typeStats[type].total * 100).toFixed(1) : 0;
    });

    res.json({
      overview: {
        total: totalGoals,
        active: activeGoals,
        completed: completedGoals,
        failed: failedGoals,
        completionRate: totalGoals > 0 ? 
          ((completedGoals / totalGoals) * 100).toFixed(1) : 0
      },
      byCategory: goalsByCategory.reduce((acc, cat) => {
        acc[cat._id] = cat.count;
        return acc;
      }, {}),
      byType: typeStats
    });

  } catch (error) {
    console.error('Get goal stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get goal progress dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const activeGoals = await Goal.find({ userId, status: 'active' })
      .sort({ priority: -1, createdAt: -1 });

    // Update progress for all active goals
    const updatedGoals = await Promise.all(activeGoals.map(async (goal) => {
      await updateGoalProgress(goal);
      return goal;
    }));

    // Get goals that are close to deadline (within 7 days)
    const urgentGoals = updatedGoals.filter(goal => {
      const daysLeft = moment(goal.timeframe.endDate).diff(moment(), 'days');
      return daysLeft <= 7 && daysLeft >= 0;
    });

    // Get goals that are making good progress (>50% complete)
    const progressingGoals = updatedGoals.filter(goal => goal.progress.percentage > 50);

    // Get recently achieved milestones
    const recentMilestones = [];
    updatedGoals.forEach(goal => {
      goal.milestones.forEach(milestone => {
        if (milestone.reached && milestone.reachedDate && 
            moment(milestone.reachedDate).isAfter(moment().subtract(7, 'days'))) {
          recentMilestones.push({
            goalTitle: goal.title,
            milestone: milestone.description,
            reachedDate: milestone.reachedDate
          });
        }
      });
    });

    res.json({
      activeGoals: updatedGoals,
      urgentGoals,
      progressingGoals,
      recentMilestones: recentMilestones.sort((a, b) => 
        new Date(b.reachedDate) - new Date(a.reachedDate)
      )
    });

  } catch (error) {
    console.error('Get goal dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manually update goal progress
router.put('/:goalId/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { goalId } = req.params;
    const { progress } = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.progress.current = progress;
    goal.updateMilestones();
    await goal.save();

    res.json({ message: 'Goal progress updated', goal });

  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to update goal progress based on user actions
async function updateGoalProgress(goal) {
  try {
    const startDate = goal.timeframe.startDate;
    const endDate = goal.timeframe.endDate;

    let query = {
      userId: goal.userId,
      date: { $gte: startDate, $lte: endDate }
    };

    // Add specific action type filter if it's a specific action goal
    if (goal.category === 'specific_action' && goal.target.actionType) {
      query.actionType = goal.target.actionType;
    }

    const actions = await Action.find(query);

    let currentProgress = 0;

    switch (goal.category) {
      case 'actions':
        currentProgress = actions.length;
        break;
      case 'co2_reduction':
        currentProgress = actions.reduce((sum, action) => sum + action.impact.co2Saved, 0);
        break;
      case 'water_saving':
        currentProgress = actions.reduce((sum, action) => sum + action.impact.waterSaved, 0);
        break;
      case 'specific_action':
        currentProgress = actions.reduce((sum, action) => sum + action.quantity, 0);
        break;
      case 'streak':
        // Calculate current streak
        const today = moment().startOf('day');
        let streak = 0;
        let checkDate = moment(today);
        
        while (checkDate.isAfter(startDate)) {
          const dayStart = moment(checkDate).toDate();
          const dayEnd = moment(checkDate).endOf('day').toDate();
          
          const hasAction = actions.some(action => {
            const actionDate = moment(action.date);
            return actionDate.isBetween(dayStart, dayEnd, null, '[]');
          });
          
          if (hasAction) {
            streak++;
            checkDate.subtract(1, 'day');
          } else {
            break;
          }
        }
        currentProgress = streak;
        break;
      default:
        currentProgress = actions.length;
    }

    goal.progress.current = currentProgress;
    goal.updateMilestones();
    await goal.save();

    return goal;

  } catch (error) {
    console.error('Update goal progress error:', error);
    return goal;
  }
}

module.exports = router;

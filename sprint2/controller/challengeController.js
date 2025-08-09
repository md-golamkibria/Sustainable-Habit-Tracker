const express = require('express');
const Challenge = require('../model/Challenge');
const User = require('../model/User');
const Action = require('../model/Action');
const OpenChallenge = require('../model/OpenChallenge');
const moment = require('moment');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  next();
};

// Create a new challenge
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      title,
      description,
      type,
      category,
      target,
      reward,
      difficulty,
      duration,
      requirements,
      isGlobal
    } = req.body;

    // Set end date based on type if not provided
    let endDate;
    if (duration && duration.endDate) {
      endDate = new Date(duration.endDate);
    } else {
      const now = new Date();
      switch (type) {
        case 'daily':
          endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    const challenge = new Challenge({
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      target: {
        value: parseInt(target.value),
        unit: target.unit,
        description: target.description || `Complete ${target.value} ${target.unit}`
      },
      reward: {
        points: reward && reward.points ? parseInt(reward.points) : 0,
        badge: reward && reward.badge ? reward.badge : null,
        title: reward && reward.title ? reward.title : null
      },
      difficulty: difficulty || 'medium',
      duration: {
        startDate: new Date(),
        endDate: endDate,
        isActive: true
      },
      requirements: {
        minLevel: requirements && requirements.minLevel ? parseInt(requirements.minLevel) : 1,
        prerequisiteBadges: requirements && requirements.prerequisiteBadges ? requirements.prerequisiteBadges : [],
        actionTypes: requirements && requirements.actionTypes ? requirements.actionTypes : []
      },
      isGlobal: isGlobal !== undefined ? isGlobal : true,
      createdBy: userId,
      stats: {
        totalParticipants: 0,
        completedCount: 0,
        completionRate: 0
      }
    });

    await challenge.save();
    res.status(201).json({ message: 'Challenge created successfully!', challenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all challenges with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, status, page = 1, limit = 10 } = req.query;
    let query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;

    const challenges = await Challenge.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Challenge.countDocuments(query);

    res.json({
      challenges,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single challenge by ID
router.get('/:challengeId', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    console.error('Get single challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a challenge
router.post('/:challengeId/join', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user has already joined
    const existingEntry = await OpenChallenge.findOne({ userId, challengeId });
    if (existingEntry) {
      return res.status(400).json({ message: 'You have already joined this challenge' });
    }

    const newEntry = new OpenChallenge({
      userId,
      challengeId,
      startDate: new Date(),
      endDate: moment().add(challenge.duration, 'days').toDate(),
      status: 'in-progress'
    });

    await newEntry.save();

    // Update user's list of challenges
    await User.findOneAndUpdate({ userId }, {
      $addToSet: { 'challenges.active': newEntry._id }
    });

    res.status(201).json({ message: 'Challenge joined successfully', entry: newEntry });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update progress on a challenge
router.post('/:challengeId/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const openChallenge = await OpenChallenge.findOne({ userId, challengeId, status: 'in-progress' }).populate('challengeId');
    if (!openChallenge) {
      return res.status(404).json({ message: 'You are not currently in this challenge' });
    }

    const challenge = openChallenge.challengeId;
    const { targetType, targetValue, actionType } = challenge.criteria;

    // Get all user actions within the challenge timeframe
    const actions = await Action.find({
      userId,
      date: { $gte: openChallenge.startDate, $lte: openChallenge.endDate }
    });

    let currentProgress = 0;
    switch (targetType) {
      case 'count':
        currentProgress = actions.filter(a => a.actionType === actionType).length;
        break;
      case 'co2':
        currentProgress = actions.reduce((sum, a) => sum + a.impact.co2Saved, 0);
        break;
      case 'water':
        currentProgress = actions.reduce((sum, a) => sum + a.impact.waterSaved, 0);
        break;
      default:
        return res.status(400).json({ message: 'Invalid challenge target type' });
    }

    openChallenge.progress = currentProgress;

    // Check for completion
    if (currentProgress >= targetValue) {
      openChallenge.status = 'completed';
      openChallenge.completedDate = new Date();

      // Move from active to completed in user's profile
      await User.findOneAndUpdate({ userId }, {
        $pull: { 'challenges.active': openChallenge._id },
        $addToSet: { 'challenges.completed': openChallenge._id }
      });

      // Grant rewards
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'stats.experiencePoints': challenge.rewards.experiencePoints,
          'stats.coins': challenge.rewards.coins || 0
        }
      });
      if (challenge.rewards.badge) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { 'stats.badges': challenge.rewards.badge }
        });
      }
    }

    await openChallenge.save();
    res.json({ message: 'Progress updated', entry: openChallenge });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's challenges (active, completed, etc.)
router.get('/my-challenges', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status } = req.query; // e.g., 'in-progress', 'completed'

    let query = { userId };
    if (status) query.status = status;

    const challenges = await OpenChallenge.find(query)
      .populate('challengeId')
      .sort({ startDate: -1 });

    res.json(challenges);
  } catch (error) {
    console.error('Get my challenges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard for a challenge
router.get('/:challengeId/leaderboard', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const entries = await OpenChallenge.find({ challengeId })
      .populate('userId', 'username stats.level')
      .sort({ progress: -1 })
      .limit(50);

    res.json(entries);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const Challenge = require('../model/Challenge');
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

// Get all user-created challenges that others can join (excluding own challenges)
router.get('/available', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all active user-created challenges (not created by current user and not system challenges)
    const challenges = await Challenge.find({
      'duration.isActive': true,
      createdBy: { 
        $ne: userId, 
        $ne: 'system',
        $exists: true,
        $type: 'objectId' // Ensure createdBy is an ObjectId (user-created)
      },
      isGlobal: true, // Only public challenges
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    })
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });

    // Additional filter to ensure we only get challenges created by actual users
    const userCreatedChallenges = challenges.filter(challenge => 
      challenge.createdBy && 
      challenge.createdBy._id && 
      challenge.createdBy._id.toString() !== userId.toString()
    );

    // Add participation status and creator info
    const availableChallenges = userCreatedChallenges.map(challenge => {
      const participant = challenge.participants.find(p => p.userId.toString() === userId.toString());
      const meetsRequirements = challenge.requirements?.minLevel ? 
        challenge.requirements.minLevel <= (user.gamification?.level || user.stats?.level || 1) : true;
      
      return {
        ...challenge.toObject(),
        creatorName: challenge.createdBy?.username || 'Unknown User',
        userParticipating: !!participant,
        userProgress: participant ? participant.progress : 0,
        userCompleted: participant ? participant.completed : false,
        meetsRequirements,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null,
        participantCount: challenge.participants ? challenge.participants.length : 0,
        completionRate: challenge.stats.totalParticipants > 0 ? 
          Math.round((challenge.stats.completedCount / challenge.stats.totalParticipants) * 100) : 0
      };
    });

    res.json(availableChallenges);

  } catch (error) {
    console.error('Get available custom challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new custom challenge
router.post('/create', requireAuth, async (req, res) => {
  try {
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
      isPublic = true // Default to public for user-created challenges
    } = req.body;

    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate required fields
    if (!title || !description || !type || !category || !target) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate target
    if (!target.value || !target.unit || target.value <= 0) {
      return res.status(400).json({ message: 'Invalid target value or unit' });
    }

    // Set default reward points based on difficulty and type
    let defaultPoints = 50;
    switch (difficulty) {
      case 'easy': defaultPoints = 25; break;
      case 'medium': defaultPoints = 50; break;
      case 'hard': defaultPoints = 100; break;
      case 'extreme': defaultPoints = 200; break;
    }
    
    switch (type) {
      case 'daily': defaultPoints *= 1; break;
      case 'weekly': defaultPoints *= 2; break;
      case 'monthly': defaultPoints *= 4; break;
      case 'milestone': defaultPoints *= 3; break;
    }

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
        points: reward && reward.points ? parseInt(reward.points) : defaultPoints,
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
      isGlobal: isPublic,
      createdBy: userId,
      stats: {
        totalParticipants: 0,
        completedCount: 0,
        completionRate: 0
      }
    });

    await challenge.save();
    
    // Update user's created challenges count
    if (!user.stats) user.stats = {};
    if (!user.stats.challengesCreated) {
      user.stats.challengesCreated = 0;
    }
    user.stats.challengesCreated += 1;
    
    // Award points for creating a challenge
    if (!user.stats.experiencePoints) user.stats.experiencePoints = 0;
    user.stats.experiencePoints += 25;
    await user.save();

    res.status(201).json({ 
      message: 'Custom challenge created successfully!', 
      challenge: {
        ...challenge.toObject(),
        creatorName: user.username
      },
      pointsAwarded: 25
    });

  } catch (error) {
    console.error('Create custom challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a custom challenge
router.post('/join/:challengeId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const user = await User.findById(userId);
    const challenge = await Challenge.findById(challengeId);

    if (!user || !challenge) {
      return res.status(404).json({ message: 'User or challenge not found' });
    }

    // Check if challenge is user-created and public
    if (challenge.createdBy === 'system' || !challenge.isGlobal) {
      return res.status(400).json({ message: 'This challenge is not available for joining' });
    }

    // Check if user is trying to join their own challenge
    if (challenge.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot join your own challenge' });
    }

    // Check if user is already participating
    if (challenge.participants && challenge.participants.some(p => p.userId.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already participating in this challenge' });
    }

    // Check if user meets requirements
    const userLevel = user.gamification?.level || user.stats?.level || 1;
    if (challenge.requirements?.minLevel && challenge.requirements.minLevel > userLevel) {
      return res.status(400).json({ message: 'User level too low for this challenge' });
    }

    // Initialize participants array if it doesn't exist
    if (!challenge.participants) {
      challenge.participants = [];
    }

    // Add user to challenge participants
    challenge.participants.push({
      userId,
      progress: 0,
      completed: false,
      joinedDate: new Date()
    });

    // Initialize stats if they don't exist
    if (!challenge.stats) {
      challenge.stats = { totalParticipants: 0, completedCount: 0 };
    }
    challenge.stats.totalParticipants++;
    await challenge.save();

    // Initialize user challenges structure if it doesn't exist
    if (!user.challenges) {
      user.challenges = { active: [], completed: [] };
    }
    if (!user.challenges.active) {
      user.challenges.active = [];
    }

    // Add challenge to user's active challenges
    user.challenges.active.push({
      challengeId: challenge._id,
      progress: 0,
      completed: false,
      joinedDate: new Date()
    });
    await user.save();

    // Get creator info for response
    const creator = await User.findById(challenge.createdBy);

    res.json({ 
      message: 'Successfully joined challenge', 
      challenge: {
        ...challenge.toObject(),
        creatorName: creator?.username || 'Unknown User'
      }
    });

  } catch (error) {
    console.error('Join custom challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's created challenges AND joined challenges
router.get('/my-created', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get challenges created by the user (both private and public)
    const createdChallenges = await Challenge.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate('participants.userId', 'username');

    // Get challenges the user has joined (created by others)
    const joinedChallengeIds = [];
    if (user.challenges && user.challenges.active) {
      user.challenges.active.forEach(uc => {
        joinedChallengeIds.push(uc.challengeId);
      });
    }

    const joinedChallenges = await Challenge.find({
      _id: { $in: joinedChallengeIds },
      createdBy: { $ne: userId } // Exclude own challenges from joined list
    })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username')
    .populate('participants.userId', 'username');

    // Format created challenges
    const formattedCreatedChallenges = createdChallenges.map(challenge => {
      return {
        ...challenge.toObject(),
        challengeType: 'created',
        participantCount: challenge.participants ? challenge.participants.length : 0,
        completionRate: challenge.stats.totalParticipants > 0 
          ? Math.round((challenge.stats.completedCount / challenge.stats.totalParticipants) * 100) 
          : 0,
        isActive: challenge.duration && challenge.duration.isActive,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null,
        participantNames: challenge.participants ? 
          challenge.participants.map(p => p.userId?.username || 'Unknown').slice(0, 5) : [],
        visibility: challenge.isGlobal ? 'public' : 'private'
      };
    });

    // Format joined challenges
    const formattedJoinedChallenges = joinedChallenges.map(challenge => {
      const participant = challenge.participants.find(p => p.userId._id.toString() === userId.toString());
      
      return {
        ...challenge.toObject(),
        challengeType: 'joined',
        creatorName: challenge.createdBy?.username || 'Unknown User',
        userProgress: participant ? participant.progress : 0,
        userCompleted: participant ? participant.completed : false,
        participantCount: challenge.participants ? challenge.participants.length : 0,
        isActive: challenge.duration && challenge.duration.isActive,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null,
        progressPercentage: challenge.target && challenge.target.value > 0 ? 
          Math.min(100, ((participant ? participant.progress : 0) / challenge.target.value) * 100) : 0
      };
    });

    // Combine and sort by creation date
    const allChallenges = [
      ...formattedCreatedChallenges,
      ...formattedJoinedChallenges
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      created: formattedCreatedChallenges,
      joined: formattedJoinedChallenges,
      all: allChallenges
    });

  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get challenge details with participants
router.get('/:challengeId/details', requireAuth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.session.userId;
    
    const challenge = await Challenge.findById(challengeId)
      .populate('createdBy', 'username')
      .populate('participants.userId', 'username');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const participant = challenge.participants.find(p => p.userId._id.toString() === userId.toString());
    
    const challengeDetails = {
      ...challenge.toObject(),
      creatorName: challenge.createdBy?.username || 'Unknown User',
      userParticipating: !!participant,
      userProgress: participant ? participant.progress : 0,
      userCompleted: participant ? participant.completed : false,
      participantCount: challenge.participants ? challenge.participants.length : 0,
      daysRemaining: challenge.duration?.endDate ? 
        Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null,
      participants: challenge.participants.map(p => ({
        username: p.userId?.username || 'Unknown',
        progress: p.progress,
        completed: p.completed,
        joinedDate: p.joinedDate,
        progressPercentage: challenge.target.value > 0 ? 
          Math.min(100, (p.progress / challenge.target.value) * 100) : 0
      }))
    };

    res.json(challengeDetails);

  } catch (error) {
    console.error('Get challenge details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search custom challenges
router.get('/search', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { query, category, difficulty, type } = req.query;

    let searchCriteria = {
      'duration.isActive': true,
      createdBy: { 
        $ne: userId, 
        $ne: 'system',
        $exists: true,
        $type: 'objectId' // Ensure createdBy is an ObjectId (user-created)
      },
      isGlobal: true,
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    };

    // Add search filters
    if (query) {
      searchCriteria.$and = [
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        }
      ];
    }

    if (category) {
      searchCriteria.category = category;
    }

    if (difficulty) {
      searchCriteria.difficulty = difficulty;
    }

    if (type) {
      searchCriteria.type = type;
    }

    const challenges = await Challenge.find(searchCriteria)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    // Additional filter to ensure we only get challenges created by actual users
    const userCreatedChallenges = challenges.filter(challenge => 
      challenge.createdBy && 
      challenge.createdBy._id && 
      challenge.createdBy._id.toString() !== userId.toString()
    );

    const user = await User.findById(userId);
    
    const searchResults = userCreatedChallenges.map(challenge => {
      const participant = challenge.participants.find(p => p.userId.toString() === userId.toString());
      
      return {
        ...challenge.toObject(),
        creatorName: challenge.createdBy?.username || 'Unknown User',
        userParticipating: !!participant,
        participantCount: challenge.participants ? challenge.participants.length : 0,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null
      };
    });

    res.json(searchResults);

  } catch (error) {
    console.error('Search custom challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

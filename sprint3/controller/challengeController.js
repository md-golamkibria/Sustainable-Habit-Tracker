const express = require('express');
const Challenge = require('../model/Challenge');
const User = require('../model/User');
const Action = require('../model/Action');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  next();
};

// Get all available challenges (main route)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const challenges = await Challenge.find({
      'duration.isActive': true,
      createdBy: { $exists: true, $ne: userId, $ne: 'system', $ne: null, $ne: '' },
      isGlobal: true,
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    }).populate('createdBy', 'username').sort({ createdAt: -1 });

    // Filter challenges based on user requirements and add participation status
    const availableChallenges = challenges.map(challenge => {
      const participant = challenge.participants.find(p => p.userId.toString() === userId.toString());
      const meetsRequirements = challenge.requirements?.minLevel ? challenge.requirements.minLevel <= (user.gamification?.level || 1) : true;
      
      return {
        ...challenge.toObject(),
        userParticipating: !!participant,
        userProgress: participant ? participant.progress : 0,
        userCompleted: participant ? participant.completed : false,
        meetsRequirements,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null
      };
    });

    res.json(availableChallenges);

  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all available challenges (alias for /list)
router.get('/list', requireAuth, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all available challenges (detailed)
router.get('/available', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const challenges = await Challenge.find({
      'duration.isActive': true,
      createdBy: { $exists: true, $ne: userId, $ne: 'system', $ne: null, $ne: '' },
      isGlobal: true,
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    }).populate('createdBy', 'username').sort({ createdAt: -1 });

    // Filter challenges based on user requirements and add participation status
    const availableChallenges = challenges.map(challenge => {
      const participant = challenge.participants.find(p => p.userId.toString() === userId.toString());
      const meetsRequirements = challenge.requirements?.minLevel ? challenge.requirements.minLevel <= (user.gamification?.level || 1) : true;
      
      return {
        ...challenge.toObject(),
        userParticipating: !!participant,
        userProgress: participant ? participant.progress : 0,
        userCompleted: participant ? participant.completed : false,
        meetsRequirements,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null
      };
    });

    res.json(availableChallenges);

  } catch (error) {
    console.error('Get available challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a challenge (alias for frontend compatibility)
router.post('/join/:challengeId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const user = await User.findById(userId);
    const challenge = await Challenge.findById(challengeId);

    if (!user || !challenge) {
      return res.status(404).json({ message: 'User or challenge not found' });
    }

    // Check if user is already participating
    if (challenge.participants && challenge.participants.some(p => p.userId.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already participating in this challenge' });
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

    res.json({ message: 'Successfully joined challenge', challenge });

  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a challenge (original endpoint)
router.post('/:challengeId/join', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const user = await User.findById(userId);
    const challenge = await Challenge.findById(challengeId);

    if (!user || !challenge) {
      return res.status(404).json({ message: 'User or challenge not found' });
    }

    // Check if user meets requirements
    if (challenge.requirements.minLevel > user.stats.level) {
      return res.status(400).json({ message: 'User level too low for this challenge' });
    }

    // Check if user is already participating
    if (challenge.participants.some(p => p.userId.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already participating in this challenge' });
    }

    // Add user to challenge participants
    challenge.participants.push({
      userId,
      progress: 0,
      completed: false,
      joinedDate: new Date()
    });

    challenge.stats.totalParticipants++;
    await challenge.save();

    // Add challenge to user's active challenges
    user.challenges.active.push({
      challengeId: challenge._id,
      progress: 0,
      completed: false,
      joinedDate: new Date()
    });
    await user.save();

    res.json({ message: 'Successfully joined challenge', challenge });

  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's active challenges
router.get('/my-challenges', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize challenges structure if it doesn't exist
    if (!user.challenges) {
      user.challenges = { active: [], completed: [] };
    }
    if (!user.challenges.active) {
      user.challenges.active = [];
    }
    if (!user.challenges.completed) {
      user.challenges.completed = [];
    }

    // Get challenge IDs from user's active challenges
    const activeChallengeIds = user.challenges.active.map(uc => uc.challengeId);
    const activeChallengeObjects = await Challenge.find({ _id: { $in: activeChallengeIds } });

    const activeChallenges = user.challenges.active.map(userChallenge => {
      const challenge = activeChallengeObjects.find(c => c._id.toString() === userChallenge.challengeId.toString());
      if (!challenge) return null;
      
      const participant = challenge.participants ? challenge.participants.find(p => p.userId.toString() === userId.toString()) : null;
      
      return {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        category: challenge.category,
        target: challenge.target,
        userProgress: participant ? participant.progress : userChallenge.progress || 0,
        userCompleted: participant ? participant.completed : userChallenge.completed || false,
        joinedDate: userChallenge.joinedDate,
        endDate: challenge.duration && challenge.duration.endDate ? challenge.duration.endDate : challenge.endDate,
        daysRemaining: challenge.duration && challenge.duration.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null,
        progressPercentage: challenge.target && challenge.target.value > 0 ? 
          Math.min(100, ((participant ? participant.progress : userChallenge.progress || 0) / challenge.target.value) * 100) : 0
      };
    }).filter(Boolean);

    const completedChallenges = user.challenges.completed || [];

    res.json({
      active: activeChallenges,
      completed: completedChallenges
    });

  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update challenge progress (called when user logs an action)
router.put('/:challengeId/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;
    const { actionType, quantity = 1 } = req.body;

    const challenge = await Challenge.findById(challengeId);
    const user = await User.findById(userId);

    if (!challenge || !user) {
      return res.status(404).json({ message: 'Challenge or user not found' });
    }

    const participant = challenge.participants.find(p => p.userId.toString() === userId.toString());
    if (!participant) {
      return res.status(400).json({ message: 'User not participating in this challenge' });
    }

    // Check if action type matches challenge category
    if (challenge.category !== 'general' && challenge.category !== actionType) {
      return res.json({ message: 'Action type does not match challenge category' });
    }

    // Update progress based on challenge type
    let progressIncrease = 0;
    switch (challenge.target.unit) {
      case 'actions':
        progressIncrease = 1;
        break;
      case 'times':
        progressIncrease = quantity;
        break;
      case 'km':
      case 'miles':
      case 'kg':
      case 'lbs':
      case 'hours':
      case 'minutes':
      case 'liters':
        progressIncrease = quantity;
        break;
      default:
        progressIncrease = 1;
    }

    participant.progress += progressIncrease;

    // Check if challenge is completed
    if (participant.progress >= challenge.target.value && !participant.completed) {
      participant.completed = true;
      participant.completedDate = new Date();
      challenge.stats.completedCount++;

      // Award rewards to user
      user.stats.experiencePoints += challenge.reward.points;
      
      if (challenge.reward.badge) {
        user.stats.badges.push({
          name: challenge.reward.badge.name,
          description: challenge.reward.badge.description,
          icon: challenge.reward.badge.icon,
          earnedDate: new Date()
        });
      }

      // Move challenge from active to completed
      const userChallengeIndex = user.challenges.active.findIndex(
        uc => uc.challengeId.toString() === challengeId
      );
      
      if (userChallengeIndex > -1) {
        const completedChallenge = user.challenges.active[userChallengeIndex];
        user.challenges.completed.push({
          challengeId: challenge._id,
          completedDate: new Date(),
          reward: {
            points: challenge.reward.points,
            badge: challenge.reward.badge ? challenge.reward.badge.name : null
          }
        });
        user.challenges.active.splice(userChallengeIndex, 1);
      }

      // Check for level up
      const newLevel = Math.floor(user.stats.experiencePoints / 1000) + 1;
      if (newLevel > user.stats.level) {
        user.stats.level = newLevel;
      }

      await user.save();
    }

    await challenge.save();

    res.json({
      message: participant.completed ? 'Challenge completed!' : 'Progress updated',
      progress: participant.progress,
      target: challenge.target.value,
      completed: participant.completed,
      reward: participant.completed ? challenge.reward : null
    });

  } catch (error) {
    console.error('Update challenge progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new custom challenge (user function)
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
      isPublic = false
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

    // Set default reward points based on difficulty and type
    let defaultPoints = 50; // Base points
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
    if (!user.stats.challengesCreated) {
      user.stats.challengesCreated = 0;
    }
    user.stats.challengesCreated += 1;
    
    // Award points for creating a challenge
    user.stats.experiencePoints += 25;
    await user.save();

    res.status(201).json({ 
      message: 'Custom challenge created successfully!', 
      challenge,
      pointsAwarded: 25
    });

  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's created challenges
router.get('/my-created', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const createdChallenges = await Challenge.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate('participants.userId', 'username');

    const challengesWithStats = createdChallenges.map(challenge => {
      return {
        ...challenge.toObject(),
        participantCount: challenge.participants ? challenge.participants.length : 0,
        completionRate: challenge.stats.totalParticipants > 0 
          ? Math.round((challenge.stats.completedCount / challenge.stats.totalParticipants) * 100) 
          : 0,
        isActive: challenge.duration && challenge.duration.isActive,
        daysRemaining: challenge.duration?.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null
      };
    });

    res.json(challengesWithStats);

  } catch (error) {
    console.error('Get user created challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get challenge templates for inspiration
router.get('/templates', requireAuth, async (req, res) => {
  try {
    // Predefined challenge templates users can customize
    const templates = [
      {
        id: 'template1',
        title: 'Plastic-Free Week',
        description: 'Avoid single-use plastics for a full week',
        type: 'weekly',
        category: 'waste_reduction',
        target: { value: 7, unit: 'days' },
        difficulty: 'medium',
        tags: ['plastic', 'waste', 'environment']
      },
      {
        id: 'template2',
        title: 'Daily Bike Commute',
        description: 'Bike to work or school instead of driving',
        type: 'daily',
        category: 'biking',
        target: { value: 5, unit: 'trips' },
        difficulty: 'easy',
        tags: ['transportation', 'exercise', 'co2']
      },
      {
        id: 'template3',
        title: 'Energy Conservation Month',
        description: 'Reduce home energy consumption by 20%',
        type: 'monthly',
        category: 'energy_saving',
        target: { value: 30, unit: 'days' },
        difficulty: 'hard',
        tags: ['energy', 'home', 'savings']
      },
      {
        id: 'template4',
        title: 'Water Conservation Challenge',
        description: 'Reduce daily water usage by taking shorter showers',
        type: 'weekly',
        category: 'water_conservation',
        target: { value: 7, unit: 'days' },
        difficulty: 'easy',
        tags: ['water', 'conservation', 'daily habits']
      },
      {
        id: 'template5',
        title: 'Public Transport Pioneer',
        description: 'Use public transport instead of private vehicle',
        type: 'weekly',
        category: 'public_transport',
        target: { value: 10, unit: 'trips' },
        difficulty: 'medium',
        tags: ['transport', 'community', 'emissions']
      },
      {
        id: 'template6',
        title: 'Reusable Bag Champion',
        description: 'Always bring reusable bags when shopping',
        type: 'monthly',
        category: 'reusable_bag',
        target: { value: 20, unit: 'shopping trips' },
        difficulty: 'easy',
        tags: ['shopping', 'plastic', 'reusable']
      }
    ];

    res.json(templates);

  } catch (error) {
    console.error('Get challenge templates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a user's created challenge (creators can delete even with participants)
router.delete('/:challengeId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user is the creator
    if (challenge.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this challenge' });
    }

    // If challenge has participants, clean up their references
    if (challenge.participants && challenge.participants.length > 0) {
      const participantIds = challenge.participants.map(p => p.userId);
      
      // Remove challenge from all participants' active challenges
      await User.updateMany(
        { _id: { $in: participantIds } },
        { 
          $pull: { 
            'challenges.active': { challengeId: challengeId }
          }
        }
      );
      
      console.log(`Cleaned up challenge ${challengeId} from ${participantIds.length} participants`);
    }

    // Delete the challenge
    await Challenge.findByIdAndDelete(challengeId);

    const participantCount = challenge.participants ? challenge.participants.length : 0;
    const message = participantCount > 0 
      ? `Challenge deleted successfully. Removed from ${participantCount} participants.`
      : 'Challenge deleted successfully';

    res.json({ message });

  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ message: 'Error deleting challenge' });
  }
});

// Update a user's created challenge
router.put('/:challengeId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;
    const { title, description, difficulty, reward, duration } = req.body;

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user is the creator
    if (challenge.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this challenge' });
    }

    // Only allow certain fields to be updated
    if (title) challenge.title = title.trim();
    if (description) challenge.description = description.trim();
    if (difficulty) challenge.difficulty = difficulty;
    if (reward && reward.points) challenge.reward.points = parseInt(reward.points);
    if (duration && duration.endDate) {
      challenge.duration.endDate = new Date(duration.endDate);
    }

    await challenge.save();

    res.json({ message: 'Challenge updated successfully', challenge });

  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get challenge leaderboard
router.get('/:challengeId/leaderboard', requireAuth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get user details for participants
    const participantUserIds = challenge.participants.map(p => p.userId);
    const users = await User.find({ _id: { $in: participantUserIds } });

    const leaderboard = challenge.participants
      .map(participant => {
        const user = users.find(u => u._id.toString() === participant.userId.toString());
        return {
          userId: participant.userId,
          username: user ? user.username : 'Unknown',
          progress: participant.progress,
          completed: participant.completed,
          completedDate: participant.completedDate,
          progressPercentage: challenge.target.value > 0 ? 
            Math.min(100, (participant.progress / challenge.target.value) * 100) : 0
        };
      })
      .sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return b.progress - a.progress;
      });

    res.json({
      challenge: {
        title: challenge.title,
        target: challenge.target,
        totalParticipants: challenge.stats.totalParticipants,
        completedCount: challenge.stats.completedCount
      },
      leaderboard
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

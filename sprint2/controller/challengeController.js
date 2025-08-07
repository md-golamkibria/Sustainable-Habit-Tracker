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

// Get all available challenges
router.get('/available', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const challenges = await Challenge.find({
      'duration.isActive': true,
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    }).sort({ createdAt: -1 });

    // Filter challenges based on user requirements and add participation status
    const availableChallenges = challenges.map(challenge => {
      const participant = challenge.participants.find(p => p.userId === userId);
      const meetsRequirements = challenge.requirements.minLevel <= user.stats.level;
      
      return {
        ...challenge.toObject(),
        userParticipating: !!participant,
        userProgress: participant ? participant.progress : 0,
        userCompleted: participant ? participant.completed : false,
        meetsRequirements,
        daysRemaining: challenge.duration.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null
      };
    });

    res.json(availableChallenges);

  } catch (error) {
    console.error('Get available challenges error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a challenge
router.post('/:challengeId/join', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeId } = req.params;

    const user = await User.findOne({ userId });
    const challenge = await Challenge.findById(challengeId);

    if (!user || !challenge) {
      return res.status(404).json({ message: 'User or challenge not found' });
    }

    // Check if user meets requirements
    if (challenge.requirements.minLevel > user.stats.level) {
      return res.status(400).json({ message: 'User level too low for this challenge' });
    }

    // Check if user is already participating
    if (challenge.participants.some(p => p.userId === userId)) {
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
    const user = await User.findOne({ userId }).populate('challenges.active.challengeId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeChallenges = user.challenges.active.map(userChallenge => {
      const challenge = userChallenge.challengeId;
      const participant = challenge.participants.find(p => p.userId === userId);
      
      return {
        ...challenge.toObject(),
        userProgress: participant ? participant.progress : userChallenge.progress,
        userCompleted: participant ? participant.completed : userChallenge.completed,
        joinedDate: userChallenge.joinedDate,
        daysRemaining: challenge.duration.endDate ? 
          Math.max(0, moment(challenge.duration.endDate).diff(moment(), 'days')) : null,
        progressPercentage: challenge.target.value > 0 ? 
          Math.min(100, (participant.progress / challenge.target.value) * 100) : 0
      };
    });

    const completedChallenges = user.challenges.completed.map(completedChallenge => ({
      ...completedChallenge.toObject(),
      completedDate: completedChallenge.completedDate
    }));

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
    const user = await User.findOne({ userId });

    if (!challenge || !user) {
      return res.status(404).json({ message: 'Challenge or user not found' });
    }

    const participant = challenge.participants.find(p => p.userId === userId);
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

// Create a new challenge (admin/system function)
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
      requirements
    } = req.body;

    const challenge = new Challenge({
      title,
      description,
      type,
      category,
      target,
      reward,
      difficulty,
      duration,
      requirements,
      createdBy: req.session.userId
    });

    await challenge.save();
    res.status(201).json({ message: 'Challenge created successfully', challenge });

  } catch (error) {
    console.error('Create challenge error:', error);
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
    const users = await User.find({ userId: { $in: participantUserIds } });

    const leaderboard = challenge.participants
      .map(participant => {
        const user = users.find(u => u.userId === participant.userId);
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

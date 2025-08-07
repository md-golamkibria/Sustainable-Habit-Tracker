const Ranking = require('../model/Ranking');
const OpenChallenge = require('../model/OpenChallenge');
const Event = require('../model/Event');
const User = require('../model/User');
const Goal = require('../model/Goal');
const Action = require('../model/Action');

// ==================== RANKING FEATURES ====================

// Get global rankings
exports.getRankings = async (req, res) => {
  try {
    const { category = 'overall', limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const rankings = await Ranking.find({ category })
      .sort({ rank: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'name email profilePicture location');
    
    const totalCount = await Ranking.countDocuments({ category });
    
    res.json({
      success: true,
      data: rankings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNext: page * limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Error fetching rankings' });
  }
};

// Get user's current rank
exports.getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category = 'overall' } = req.query;
    
    const userRanking = await Ranking.findOne({ user: userId, category })
      .populate('user', 'name email profilePicture');
    
    if (!userRanking) {
      return res.status(404).json({ error: 'User ranking not found' });
    }
    
    res.json({
      success: true,
      data: userRanking
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ error: 'Error fetching user rank' });
  }
};

// Update rankings (called periodically or after significant actions)
exports.updateRankings = async (req, res) => {
  try {
    const users = await User.find({ isActive: true });
    
    for (const user of users) {
      // Calculate user statistics
      const completedGoals = await Goal.countDocuments({ 
        user: user._id, 
        status: 'completed' 
      });
      
      const completedActions = await Action.countDocuments({ 
        user: user._id, 
        status: 'completed' 
      });
      
      // Calculate sustainability score based on actions and goals
      const sustainabilityScore = (completedGoals * 10) + (completedActions * 2);
      
      // Update or create ranking
      await Ranking.findOneAndUpdate(
        { user: user._id, category: 'overall' },
        {
          totalGoalsCompleted: completedGoals,
          totalActionsCompleted: completedActions,
          sustainabilityScore,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }
    
    // Assign ranks based on sustainability score
    const rankings = await Ranking.find({ category: 'overall' })
      .sort({ sustainabilityScore: -1 });
    
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      const newRank = i + 1;
      const rankChange = ranking.rank === 0 ? 'new' : 
        newRank < ranking.rank ? 'up' : 
        newRank > ranking.rank ? 'down' : 'same';
      
      await Ranking.findByIdAndUpdate(ranking._id, {
        previousRank: ranking.rank,
        rank: newRank,
        rankChange
      });
    }
    
    res.json({ success: true, message: 'Rankings updated successfully' });
  } catch (error) {
    console.error('Error updating rankings:', error);
    res.status(500).json({ error: 'Error updating rankings' });
  }
};

// ==================== COMPARE RESULTS FEATURE ====================

// Compare user results with others
exports.compareResults = async (req, res) => {
  try {
    const { userId } = req.params;
    const { compareWith, category = 'overall' } = req.query;
    
    // Get current user's ranking
    const userRanking = await Ranking.findOne({ user: userId, category })
      .populate('user', 'name email profilePicture location');
    
    if (!userRanking) {
      return res.status(404).json({ error: 'User ranking not found' });
    }
    
    let compareData = {};
    
    if (compareWith === 'top10') {
      // Compare with top 10 users
      compareData.top10 = await Ranking.find({ category })
        .sort({ rank: 1 })
        .limit(10)
        .populate('user', 'name profilePicture');
    } else if (compareWith === 'friends') {
      // Compare with friends (you'll need to implement friends system)
      const user = await User.findById(userId).populate('friends');
      const friendIds = user.friends || [];
      compareData.friends = await Ranking.find({ 
        user: { $in: friendIds }, 
        category 
      })
        .sort({ rank: 1 })
        .populate('user', 'name profilePicture');
    } else if (compareWith === 'nearby') {
      // Compare with users in same location
      const user = await User.findById(userId);
      compareData.nearby = await Ranking.find({
        category,
        user: { $ne: userId }
      })
        .populate({
          path: 'user',
          match: { 'location.city': user.location?.city },
          select: 'name profilePicture location'
        })
        .sort({ rank: 1 })
        .limit(20);
    } else {
      // Default: compare with users around same rank
      const rankRange = 5;
      compareData.similarRank = await Ranking.find({
        category,
        rank: {
          $gte: Math.max(1, userRanking.rank - rankRange),
          $lte: userRanking.rank + rankRange
        },
        user: { $ne: userId }
      })
        .sort({ rank: 1 })
        .populate('user', 'name profilePicture');
    }
    
    res.json({
      success: true,
      data: {
        userRanking,
        comparison: compareData,
        insights: {
          betterThan: await Ranking.countDocuments({ 
            category, 
            rank: { $gt: userRanking.rank } 
          }),
          totalUsers: await Ranking.countDocuments({ category })
        }
      }
    });
  } catch (error) {
    console.error('Error comparing results:', error);
    res.status(500).json({ error: 'Error comparing results' });
  }
};

// ==================== OPEN CHALLENGES FEATURE ====================

// Get all challenges
exports.getChallenges = async (req, res) => {
  try {
    const { status = 'active', category, difficulty, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { status };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    const challenges = await OpenChallenge.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('creator', 'name profilePicture')
      .populate('participants.user', 'name profilePicture');
    
    const totalCount = await OpenChallenge.countDocuments(query);
    
    res.json({
      success: true,
      data: challenges,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Error fetching challenges' });
  }
};

// Create new challenge
exports.createChallenge = async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      creator: req.user.id
    };
    
    const challenge = new OpenChallenge(challengeData);
    await challenge.save();
    await challenge.populate('creator', 'name profilePicture');
    
    res.status(201).json({
      success: true,
      data: challenge,
      message: 'Challenge created successfully'
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(400).json({ error: error.message || 'Error creating challenge' });
  }
};

// Join a challenge
exports.joinChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    
    const challenge = await OpenChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    if (!challenge.canUserJoin(userId)) {
      return res.status(400).json({ 
        error: 'Cannot join this challenge' 
      });
    }
    
    challenge.participants.push({ user: userId });
    await challenge.save();
    
    res.json({
      success: true,
      message: 'Successfully joined the challenge'
    });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ error: 'Error joining challenge' });
  }
};

// Get challenge details
exports.getChallengeDetails = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    const challenge = await OpenChallenge.findById(challengeId)
      .populate('creator', 'name profilePicture location')
      .populate('participants.user', 'name profilePicture')
      .populate('leaderboard.user', 'name profilePicture');
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    res.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    res.status(500).json({ error: 'Error fetching challenge details' });
  }
};

// ==================== EVENTS FEATURE ====================

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const { 
      category, 
      city, 
      state, 
      status = 'published', 
      upcoming = true,
      page = 1, 
      limit = 20 
    } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { status };
    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    if (upcoming === 'true') {
      query['dateTime.start'] = { $gte: new Date() };
    }
    
    const events = await Event.find(query)
      .sort({ 'dateTime.start': 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('organizer', 'name profilePicture')
      .populate('attendees.user', 'name profilePicture');
    
    const totalCount = await Event.countDocuments(query);
    
    res.json({
      success: true,
      data: events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error fetching events' });
  }
};

// Create new event
exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id
    };
    
    const event = new Event(eventData);
    await event.save();
    await event.populate('organizer', 'name profilePicture');
    
    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ error: error.message || 'Error creating event' });
  }
};

// Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (!event.canUserRegister(userId)) {
      return res.status(400).json({ 
        error: 'Cannot register for this event' 
      });
    }
    
    event.attendees.push({ user: userId });
    await event.save();
    
    res.json({
      success: true,
      message: 'Successfully registered for the event'
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Error registering for event' });
  }
};

// Get event details
exports.getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('organizer', 'name email profilePicture')
      .populate('attendees.user', 'name profilePicture')
      .populate('feedback.user', 'name profilePicture');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventWithRating = {
      ...event.toObject(),
      averageRating: event.getAverageRating(),
      attendeeCount: event.attendeeCount,
      availableSpots: event.availableSpots
    };
    
    res.json({
      success: true,
      data: eventWithRating
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: 'Error fetching event details' });
  }
};

// Get events near user location
exports.getNearbyEvents = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    const events = await Event.find({
      status: 'published',
      'dateTime.start': { $gte: new Date() },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      }
    })
      .limit(20)
      .populate('organizer', 'name profilePicture');
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching nearby events:', error);
    res.status(500).json({ error: 'Error fetching nearby events' });
  }
};

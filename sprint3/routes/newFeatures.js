const express = require('express');
const router = express.Router();
const newFeaturesController = require('../controller/newFeaturesController');
const { requireAuth } = require('../middleware/auth'); // Assuming you have auth middleware

// ==================== RANKING ROUTES ====================

// Get global rankings
router.get('/rankings', newFeaturesController.getRankings);

// Get user's current rank
router.get('/rankings/user/:userId', newFeaturesController.getUserRank);

// Update rankings (admin or system endpoint)
router.post('/rankings/update', requireAuth, newFeaturesController.updateRankings);

// ==================== COMPARE RESULTS ROUTES ====================

// Compare user results with others
router.get('/compare/:userId', newFeaturesController.compareResults);

// ==================== OPEN CHALLENGES ROUTES ====================

// Get all challenges
router.get('/challenges', newFeaturesController.getChallenges);

// Create new challenge
router.post('/challenges', requireAuth, newFeaturesController.createChallenge);

// Get challenge details
router.get('/challenges/:challengeId', newFeaturesController.getChallengeDetails);

// Join a challenge
router.post('/challenges/:challengeId/join', requireAuth, newFeaturesController.joinChallenge);

// Leave a challenge
router.post('/challenges/:challengeId/leave', requireAuth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    
    const OpenChallenge = require('../model/OpenChallenge');
    const challenge = await OpenChallenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    challenge.participants = challenge.participants.filter(
      p => p.user.toString() !== userId.toString()
    );
    
    await challenge.save();
    
    res.json({
      success: true,
      message: 'Successfully left the challenge'
    });
  } catch (error) {
    console.error('Error leaving challenge:', error);
    res.status(500).json({ error: 'Error leaving challenge' });
  }
});

// Update challenge progress
router.put('/challenges/:challengeId/progress', requireAuth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;
    
    const OpenChallenge = require('../model/OpenChallenge');
    const challenge = await OpenChallenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    const participant = challenge.participants.find(
      p => p.user.toString() === userId.toString()
    );
    
    if (!participant) {
      return res.status(404).json({ error: 'You are not a participant in this challenge' });
    }
    
    participant.progress = Math.min(100, Math.max(0, progress));
    
    if (participant.progress === 100) {
      participant.status = 'completed';
    }
    
    await challenge.save();
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: participant
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    res.status(500).json({ error: 'Error updating challenge progress' });
  }
});

// Get user's challenges
router.get('/challenges/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    const OpenChallenge = require('../model/OpenChallenge');
    let query = { 'participants.user': userId };
    
    if (status) {
      query['participants.status'] = status;
    }
    
    const challenges = await OpenChallenge.find(query)
      .populate('creator', 'name profilePicture')
      .populate('participants.user', 'name profilePicture');
    
    res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ error: 'Error fetching user challenges' });
  }
});

// ==================== EVENTS ROUTES ====================

// Get all events
router.get('/events', newFeaturesController.getEvents);

// Create new event
router.post('/events', requireAuth, newFeaturesController.createEvent);

// Get event details
router.get('/events/:eventId', newFeaturesController.getEventDetails);

// Register for an event
router.post('/events/:eventId/register', requireAuth, newFeaturesController.registerForEvent);

// Cancel event registration
router.delete('/events/:eventId/register', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const Event = require('../model/Event');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    event.attendees = event.attendees.filter(
      a => a.user.toString() !== userId.toString() || a.status === 'cancelled'
    );
    
    // Mark as cancelled instead of removing
    const attendee = event.attendees.find(a => a.user.toString() === userId.toString());
    if (attendee) {
      attendee.status = 'cancelled';
    }
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Successfully cancelled event registration'
    });
  } catch (error) {
    console.error('Error cancelling event registration:', error);
    res.status(500).json({ error: 'Error cancelling event registration' });
  }
});

// Get nearby events
router.get('/events/nearby', newFeaturesController.getNearbyEvents);

// Get user's events (organized or attending)
router.get('/events/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all' } = req.query; // 'organized', 'attending', 'all'
    
    const Event = require('../model/Event');
    let query = {};
    
    if (type === 'organized') {
      query.organizer = userId;
    } else if (type === 'attending') {
      query = { 'attendees.user': userId, 'attendees.status': 'registered' };
    } else {
      // Get both organized and attending events
      const [organizedEvents, attendingEvents] = await Promise.all([
        Event.find({ organizer: userId }).populate('organizer', 'name profilePicture'),
        Event.find({ 'attendees.user': userId, 'attendees.status': 'registered' })
          .populate('organizer', 'name profilePicture')
      ]);
      
      return res.json({
        success: true,
        data: {
          organized: organizedEvents,
          attending: attendingEvents
        }
      });
    }
    
    const events = await Event.find(query).populate('organizer', 'name profilePicture');
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Error fetching user events' });
  }
});

// Check in to an event
router.post('/events/:eventId/checkin', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const Event = require('../model/Event');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const attendee = event.attendees.find(
      a => a.user.toString() === userId.toString() && a.status === 'registered'
    );
    
    if (!attendee) {
      return res.status(404).json({ error: 'You are not registered for this event' });
    }
    
    // Check if event has started (within 1 hour of start time)
    const now = new Date();
    const eventStart = new Date(event.dateTime.start);
    const timeDiff = now - eventStart;
    const oneHour = 60 * 60 * 1000;
    
    if (timeDiff < -oneHour || timeDiff > oneHour) {
      return res.status(400).json({ 
        error: 'Check-in is only available 1 hour before and after event start time' 
      });
    }
    
    attendee.checkedIn = true;
    attendee.checkedInAt = now;
    attendee.status = 'attended';
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Successfully checked in to the event'
    });
  } catch (error) {
    console.error('Error checking in to event:', error);
    res.status(500).json({ error: 'Error checking in to event' });
  }
});

// Submit event feedback
router.post('/events/:eventId/feedback', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    const Event = require('../model/Event');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if user attended the event
    const attendee = event.attendees.find(
      a => a.user.toString() === userId.toString() && a.status === 'attended'
    );
    
    if (!attendee) {
      return res.status(400).json({ 
        error: 'Only attendees can submit feedback' 
      });
    }
    
    // Check if feedback already exists
    const existingFeedback = event.feedback.find(
      f => f.user.toString() === userId.toString()
    );
    
    if (existingFeedback) {
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
      existingFeedback.submittedAt = new Date();
    } else {
      event.feedback.push({
        user: userId,
        rating,
        comment
      });
    }
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting event feedback:', error);
    res.status(500).json({ error: 'Error submitting event feedback' });
  }
});

// ==================== GENERAL STATS ROUTES ====================

// Get dashboard stats for new features
router.get('/stats/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const Ranking = require('../model/Ranking');
    const OpenChallenge = require('../model/OpenChallenge');
    const Event = require('../model/Event');
    
    const [userRanking, activeChallenges, upcomingEvents] = await Promise.all([
      Ranking.findOne({ user: userId, category: 'overall' }),
      OpenChallenge.countDocuments({ 'participants.user': userId, status: 'active' }),
      Event.countDocuments({ 
        'attendees.user': userId, 
        'attendees.status': 'registered',
        'dateTime.start': { $gte: new Date() }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        currentRank: userRanking?.rank || null,
        sustainabilityScore: userRanking?.sustainabilityScore || 0,
        activeChallenges,
        upcomingEvents,
        rankChange: userRanking?.rankChange || 'new'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
});

module.exports = router;

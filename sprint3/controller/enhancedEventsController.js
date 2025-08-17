const express = require('express');
const Event = require('../model/Event');
const User = require('../model/User');

const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /events/regional - Get events in user's region
router.get('/regional', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { radius = 50, category, limit = 20, page = 1 } = req.query;
    
    // Get user's location
    const user = await User.findById(userId).select('profile.location').lean();
    
    if (!user || !user.profile?.location?.coordinates) {
      // Return mock regional events if no user location
      return res.json({
        success: true,
        data: {
          events: getMockRegionalEvents(),
          userLocation: null,
          message: 'Showing sample events. Update your location in profile for personalized results.'
        }
      });
    }

    const userCoords = user.profile.location.coordinates;
    
    // Build query
    let query = {
      status: 'published',
      'dateTime.start': { $gte: new Date() },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userCoords
          },
          $maxDistance: radius * 1609.34 // Convert miles to meters
        }
      }
    };

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    
    const events = await Event.find(query)
      .populate('organizer', 'username profile.firstName profile.lastName')
      .sort({ 'dateTime.start': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add distance calculation
    const eventsWithDistance = events.map(event => ({
      ...event,
      distance: calculateDistance(userCoords, event.location.coordinates),
      attendeeCount: event.attendees?.length || 0,
      availableSpots: event.capacity ? event.capacity - (event.attendees?.length || 0) : null
    }));

    const totalEvents = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events: eventsWithDistance,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEvents / limit),
          totalEvents,
          hasNext: skip + events.length < totalEvents,
          hasPrev: page > 1
        },
        userLocation: user.profile.location,
        searchRadius: radius
      }
    });
  } catch (error) {
    console.error('Get regional events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get regional events' });
  }
});

// GET /events/categories - Get event categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'tree-planting',
        name: 'Tree Planting',
        description: 'Community tree planting and reforestation events',
        icon: '🌳',
        type: 'nature'
      },
      {
        id: 'beach-cleanup',
        name: 'Beach Cleanup',
        description: 'Ocean and beach conservation activities',
        icon: '🏖️',
        type: 'nature'
      },
      {
        id: 'recycling-drive',
        name: 'Recycling Drive',
        description: 'Community recycling and waste reduction events',
        icon: '♻️',
        type: 'nature'
      },
      {
        id: 'sustainability-workshop',
        name: 'Sustainability Workshop',
        description: 'Educational workshops on sustainable living',
        icon: '🎓',
        type: 'personal-development'
      },
      {
        id: 'nature-walk',
        name: 'Nature Walk',
        description: 'Guided nature walks and outdoor exploration',
        icon: '🥾',
        type: 'nature'
      },
      {
        id: 'environmental-conference',
        name: 'Environmental Conference',
        description: 'Conferences on environmental issues and solutions',
        icon: '🌍',
        type: 'personal-development'
      },
      {
        id: 'green-energy-seminar',
        name: 'Green Energy Seminar',
        description: 'Learn about renewable energy and green technology',
        icon: '⚡',
        type: 'personal-development'
      },
      {
        id: 'permaculture-course',
        name: 'Permaculture Course',
        description: 'Sustainable agriculture and permaculture training',
        icon: '🌱',
        type: 'personal-development'
      },
      {
        id: 'wildlife-conservation',
        name: 'Wildlife Conservation',
        description: 'Wildlife protection and habitat restoration',
        icon: '🦋',
        type: 'nature'
      },
      {
        id: 'personal-development',
        name: 'Personal Development',
        description: 'Self-improvement and mindfulness sessions',
        icon: '🧘',
        type: 'personal-development'
      },
      {
        id: 'mindfulness-session',
        name: 'Mindfulness Session',
        description: 'Meditation and mindfulness practices in nature',
        icon: '🧘‍♀️',
        type: 'personal-development'
      },
      {
        id: 'eco-friendly-cooking',
        name: 'Eco-Friendly Cooking',
        description: 'Sustainable cooking and nutrition workshops',
        icon: '👨‍🍳',
        type: 'personal-development'
      },
      {
        id: 'gardening-workshop',
        name: 'Gardening Workshop',
        description: 'Organic gardening and urban farming',
        icon: '🌿',
        type: 'personal-development'
      },
      {
        id: 'climate-action',
        name: 'Climate Action',
        description: 'Climate activism and advocacy events',
        icon: '🌡️',
        type: 'nature'
      }
    ];

    // Get event counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Event.countDocuments({ 
          category: category.id,
          status: 'published',
          'dateTime.start': { $gte: new Date() }
        });
        return { ...category, eventCount: count };
      })
    );

    res.json({ success: true, data: categoriesWithCounts });
  } catch (error) {
    console.error('Get event categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get event categories' });
  }
});

// GET /events/upcoming - Get upcoming events with enhanced filtering
router.get('/upcoming', async (req, res) => {
  try {
    const { 
      category, 
      type, 
      location, 
      dateRange = '30d',
      limit = 20, 
      page = 1 
    } = req.query;

    let query = {
      status: 'published',
      'dateTime.start': { $gte: new Date() }
    };

    // Date range filtering
    if (dateRange !== 'all') {
      const now = new Date();
      let endDate;
      
      switch (dateRange) {
        case '7d':
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (endDate) {
        query['dateTime.start'].$lte = endDate;
      }
    }

    if (category) {
      query.category = category;
    }

    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    let events = await Event.find(query)
      .populate('organizer', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ 'dateTime.start': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // If no events found, return mock events
    if (events.length === 0) {
      events = getMockUpcomingEvents();
    }

    // Add computed fields
    events = events.map(event => ({
      ...event,
      attendeeCount: event.attendees?.length || 0,
      availableSpots: event.capacity ? event.capacity - (event.attendees?.length || 0) : null,
      isRegistered: event.attendees?.some(a => a.user?.toString() === req.session.userId) || false,
      daysUntilEvent: Math.ceil((new Date(event.dateTime.start) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    const totalEvents = await Event.countDocuments(query) || events.length;

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEvents / limit),
          totalEvents,
          hasNext: skip + events.length < totalEvents,
          hasPrev: page > 1
        },
        filters: {
          category,
          type,
          location,
          dateRange
        }
      }
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get upcoming events' });
  }
});

// POST /events/:id/register - Register for an event
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const eventId = req.params.id;

    // For mock events, simulate registration
    if (eventId.startsWith('upcoming') || eventId.startsWith('regional')) {
      return res.json({
        success: true,
        message: 'Successfully registered for event',
        data: {
          attendeeCount: Math.floor(Math.random() * 20) + 1,
          availableSpots: Math.floor(Math.random() * 30) + 10
        }
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event is still open for registration
    if (event.dateTime.start <= new Date()) {
      return res.status(400).json({ success: false, message: 'Registration closed - event has already started' });
    }

    // Check if user is already registered
    if (event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    // Check capacity
    if (event.capacity && event.attendees.length >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // Add user to attendees
    event.attendees.push(userId);
    await event.save();

    // Update user's registered events
    await User.findByIdAndUpdate(userId, {
      $addToSet: { 'profile.registeredEvents': eventId }
    });

    res.json({
      success: true,
      message: 'Successfully registered for event',
      data: {
        attendeeCount: event.attendees.length,
        availableSpots: event.capacity ? event.capacity - event.attendees.length : null
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to register for event' });
  }
});

// POST /events/:id/unregister - Unregister from an event
router.post('/:id/unregister', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const eventId = req.params.id;

    // For mock events, simulate unregistration
    if (eventId.startsWith('upcoming') || eventId.startsWith('regional')) {
      return res.json({
        success: true,
        message: 'Successfully unregistered from event',
        data: {
          attendeeCount: Math.floor(Math.random() * 15),
          availableSpots: Math.floor(Math.random() * 35) + 15
        }
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is registered
    if (!event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are not registered for this event' });
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(id => id.toString() !== userId.toString());
    await event.save();

    // Update user's registered events
    await User.findByIdAndUpdate(userId, {
      $pull: { 'profile.registeredEvents': eventId }
    });

    res.json({
      success: true,
      message: 'Successfully unregistered from event',
      data: {
        attendeeCount: event.attendees.length,
        availableSpots: event.capacity ? event.capacity - event.attendees.length : null
      }
    });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({ success: false, message: 'Failed to unregister from event' });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(coords1, coords2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
  const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Distance in miles, rounded to 1 decimal
}

// Mock data functions
function getMockRegionalEvents() {
  return [
    {
      _id: 'regional1',
      title: 'Community Tree Planting Day',
      description: 'Join us for a day of tree planting in Central Park. Help us plant 500 native trees to improve air quality and create wildlife habitat.',
      category: 'tree-planting',
      organizer: { username: 'GreenNYC', profile: { firstName: 'Green', lastName: 'NYC' } },
      location: {
        address: 'Central Park, 5th Ave',
        city: 'New York',
        state: 'NY',
        coordinates: [-73.9712, 40.7831]
      },
      dateTime: {
        start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)
      },
      capacity: 100,
      attendees: [],
      distance: 2.3,
      pricing: { isFree: true, price: 0 },
      tags: ['trees', 'community', 'environment']
    },
    {
      _id: 'regional2',
      title: 'Mindfulness in Nature Workshop',
      description: 'A guided mindfulness session in beautiful Prospect Park. Learn meditation techniques while connecting with nature.',
      category: 'mindfulness-session',
      organizer: { username: 'MindfulNature', profile: { firstName: 'Mindful', lastName: 'Nature' } },
      location: {
        address: 'Prospect Park, Brooklyn',
        city: 'Brooklyn',
        state: 'NY',
        coordinates: [-73.9690, 40.6602]
      },
      dateTime: {
        start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
      },
      capacity: 25,
      attendees: [],
      distance: 5.7,
      pricing: { isFree: false, price: 15 },
      tags: ['mindfulness', 'meditation', 'personal-development']
    }
  ];
}

function getMockUpcomingEvents() {
  return [
    {
      _id: 'upcoming1',
      title: 'Sustainable Living Workshop',
      description: 'Learn practical tips for reducing your environmental impact through sustainable living practices.',
      category: 'sustainability-workshop',
      organizer: { username: 'EcoEducator', profile: { firstName: 'Eco', lastName: 'Educator' } },
      location: {
        address: '123 Green St',
        city: 'San Francisco',
        state: 'CA'
      },
      dateTime: {
        start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)
      },
      capacity: 50,
      attendees: [],
      pricing: { isFree: true, price: 0 },
      tags: ['sustainability', 'workshop', 'education']
    },
    {
      _id: 'upcoming2',
      title: 'Urban Gardening Masterclass',
      description: 'Master the art of urban gardening. Learn to grow your own food in small spaces.',
      category: 'gardening-workshop',
      organizer: { username: 'UrbanGardener', profile: { firstName: 'Urban', lastName: 'Gardener' } },
      location: {
        address: '456 Garden Ave',
        city: 'Portland',
        state: 'OR'
      },
      dateTime: {
        start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)
      },
      capacity: 30,
      attendees: [],
      pricing: { isFree: false, price: 25 },
      tags: ['gardening', 'urban', 'food', 'sustainability']
    }
  ];
}

module.exports = router;

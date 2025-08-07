const express = require('express');
const EducationalContent = require('../model/EducationalContent');

const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /educational/content - Get all educational content with filtering
router.get('/content', async (req, res) => {
  try {
    const { category, difficulty, type, page = 1, limit = 10 } = req.query;
    
    // Mock educational content data
    const educationalContent = [
      {
        id: 1,
        title: "10 Simple Ways to Reduce Your Carbon Footprint",
        category: "Environment",
        type: "article",
        difficulty: "beginner",
        readTime: 5,
        content: `<h3>Small Changes, Big Impact</h3><p>Reducing your carbon footprint doesn't require drastic lifestyle changes...</p>`,
        tags: ["carbon footprint", "energy", "sustainability", "beginner"],
        likes: 245,
        views: 1200,
        author: "EcoTeam",
        publishedAt: "2024-01-15T10:00:00Z"
      },
      {
        id: 2,
        title: "The Complete Guide to Zero Waste Living",
        category: "Lifestyle",
        type: "guide",
        difficulty: "intermediate",
        readTime: 12,
        content: `<h3>Your Journey to Zero Waste</h3><p>Zero waste living is about minimizing waste...</p>`,
        tags: ["zero waste", "lifestyle", "sustainability", "intermediate"],
        likes: 189,
        views: 890,
        author: "GreenLife",
        publishedAt: "2024-01-10T14:30:00Z"
      },
      {
        id: 3,
        title: "Sustainable Fashion: Building an Eco-Friendly Wardrobe",
        category: "Fashion",
        type: "article",
        difficulty: "beginner",
        readTime: 8,
        content: `<h3>Fashion with a Conscience</h3><p>The fashion industry is one of the world's largest polluters...</p>`,
        tags: ["fashion", "sustainability", "ethical", "wardrobe"],
        likes: 156,
        views: 723,
        author: "SustainableStyle",
        publishedAt: "2024-01-08T09:15:00Z"
      }
    ];
    
    let filteredContent = [...educationalContent];
    
    // Apply filters
    if (category) {
      filteredContent = filteredContent.filter(content => 
        content.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (difficulty) {
      filteredContent = filteredContent.filter(content => 
        content.difficulty === difficulty
      );
    }
    
    if (type) {
      filteredContent = filteredContent.filter(content => 
        content.type === type
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedContent = filteredContent.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        content: paginatedContent,
        totalItems: filteredContent.length,
        totalPages: Math.ceil(filteredContent.length / limit),
        currentPage: parseInt(page),
        categories: ['Environment', 'Lifestyle', 'Fashion', 'Energy', 'Transportation', 'Gardening'],
        difficulties: ['beginner', 'intermediate', 'advanced'],
        types: ['article', 'guide', 'video', 'infographic']
      }
    });
  } catch (error) {
    console.error('Get educational content error:', error);
    res.status(500).json({ success: false, message: 'Failed to get educational content' });
  }
});

// GET /educational/featured - Get featured educational content
router.get('/featured', async (req, res) => {
  try {
    const featuredContent = await EducationalContent.getFeaturedContent();
    
    // If no content in database, return mock data
    if (!featuredContent || featuredContent.length === 0) {
      const mockFeatured = [
        {
          _id: 'feat1',
          title: '10 Simple Ways to Reduce Energy Consumption',
          summary: 'Learn practical tips to cut your energy bills and reduce your carbon footprint at home.',
          type: 'article',
          difficulty: 'beginner',
          estimatedReadTime: 5,
          author: { name: 'EcoTeam' },
          interactions: { views: 234, likes: [] },
          tags: ['energy', 'home', 'savings']
        },
        {
          _id: 'feat2',
          title: 'Water Conservation: Every Drop Counts',
          summary: 'Discover effective strategies to conserve water in your daily routine.',
          type: 'guide',
          difficulty: 'beginner',
          estimatedReadTime: 7,
          author: { name: 'WaterWise' },
          interactions: { views: 189, likes: [] },
          tags: ['water', 'conservation', 'home']
        }
      ];
      return res.json({ success: true, data: mockFeatured });
    }
    
    res.json({ success: true, data: featuredContent });
  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({ success: false, message: 'Failed to get featured content' });
  }
});

// GET /educational/popular - Get popular educational content
router.get('/popular', async (req, res) => {
  try {
    const popularContent = await EducationalContent.getPopularContent();
    
    // If no content in database, return mock data
    if (!popularContent || popularContent.length === 0) {
      const mockPopular = [
        {
          _id: 'pop1',
          title: 'Sustainable Living: A Beginner\'s Guide',
          summary: 'Start your journey toward a more sustainable lifestyle with these easy-to-follow tips.',
          type: 'guide',
          difficulty: 'beginner',
          estimatedReadTime: 8,
          author: { name: 'GreenLife' },
          interactions: { views: 456, likes: [] },
          tags: ['lifestyle', 'beginner', 'sustainable']
        },
        {
          _id: 'pop2',
          title: 'Zero Waste Kitchen Tips',
          summary: 'Transform your kitchen into a zero-waste zone with these practical strategies.',
          type: 'tip',
          difficulty: 'intermediate',
          estimatedReadTime: 6,
          author: { name: 'ZeroWaste Pro' },
          interactions: { views: 342, likes: [] },
          tags: ['kitchen', 'zero-waste', 'food']
        },
        {
          _id: 'pop3',
          title: 'Green Transportation Options',
          summary: 'Explore eco-friendly ways to get around your city while reducing emissions.',
          type: 'article',
          difficulty: 'beginner',
          estimatedReadTime: 5,
          author: { name: 'EcoTransport' },
          interactions: { views: 278, likes: [] },
          tags: ['transport', 'green', 'city']
        }
      ];
      return res.json({ success: true, data: mockPopular });
    }
    
    res.json({ success: true, data: popularContent });
  } catch (error) {
    console.error('Get popular content error:', error);
    res.status(500).json({ success: false, message: 'Failed to get popular content' });
  }
});

// GET /educational/category/:category - Get content by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const contentByCategory = await EducationalContent.getContentByCategory(category);
    res.json({ success: true, data: contentByCategory });
  } catch (error) {
    console.error('Get content by category error:', error);
    res.status(500).json({ success: false, message: 'Failed to get content by category' });
  }
});

// GET /educational/:id - Get single educational content
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle mock data IDs first
    if (id.startsWith('feat') || id.startsWith('pop')) {
      // Mock data for featured and popular content
      const mockData = {
        'feat1': {
          _id: 'feat1',
          title: '10 Simple Ways to Reduce Energy Consumption',
          summary: 'Learn practical tips to cut your energy bills and reduce your carbon footprint at home.',
          content: `<h3>10 Simple Ways to Reduce Energy Consumption</h3>
<p>Reducing energy consumption at home is one of the most effective ways to lower your carbon footprint and save money on utility bills. Here are 10 practical strategies you can implement today:</p>
<h4>1. Switch to LED Light Bulbs</h4>
<p>LED bulbs use up to 80% less energy than traditional incandescent bulbs and last much longer.</p>
<h4>2. Unplug Electronics When Not in Use</h4>
<p>Many devices draw power even when turned off. Unplugging them can save 5-10% on your electricity bill.</p>
<h4>3. Use a Programmable Thermostat</h4>
<p>Set your thermostat to automatically adjust temperatures when you're away from home.</p>
<h4>4. Seal Air Leaks</h4>
<p>Check for drafts around windows and doors. Sealing these can reduce heating and cooling costs significantly.</p>
<h4>5. Upgrade to Energy-Efficient Appliances</h4>
<p>Look for ENERGY STAR certified appliances when it's time to replace old ones.</p>`,
          type: 'article',
          difficulty: 'beginner',
          estimatedReadTime: 5,
          author: { name: 'EcoTeam', bio: 'Environmental sustainability experts' },
          interactions: { views: 235, likes: [] },
          tags: ['energy', 'home', 'savings'],
          publishedAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        'feat2': {
          _id: 'feat2',
          title: 'Water Conservation: Every Drop Counts',
          summary: 'Discover effective strategies to conserve water in your daily routine.',
          content: `<h3>Water Conservation: Every Drop Counts</h3>
<p>Water is one of our most precious resources, and conserving it is crucial for environmental sustainability. Here are practical ways to reduce water consumption:</p>
<h4>Fix Leaks Immediately</h4>
<p>A single dripping faucet can waste over 3,000 gallons per year. Check and fix leaks promptly.</p>
<h4>Install Low-Flow Fixtures</h4>
<p>Low-flow showerheads and faucets can reduce water usage by up to 50% without sacrificing performance.</p>
<h4>Take Shorter Showers</h4>
<p>Reducing shower time by just 2 minutes can save up to 150 gallons per month.</p>
<h4>Run Full Loads</h4>
<p>Only run dishwashers and washing machines with full loads to maximize water efficiency.</p>`,
          type: 'guide',
          difficulty: 'beginner',
          estimatedReadTime: 7,
          author: { name: 'WaterWise', bio: 'Water conservation specialists' },
          interactions: { views: 190, likes: [] },
          tags: ['water', 'conservation', 'home'],
          publishedAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12')
        },
        'pop1': {
          _id: 'pop1',
          title: 'Sustainable Living: A Beginner\'s Guide',
          summary: 'Start your journey toward a more sustainable lifestyle with these easy-to-follow tips.',
          content: `<h3>Sustainable Living: A Beginner's Guide</h3>
<p>Sustainable living doesn't have to be overwhelming. Start with these simple changes that make a real difference:</p>
<h4>Reduce, Reuse, Recycle</h4>
<p>The three R's are the foundation of sustainable living. Focus on reducing consumption first.</p>
<h4>Choose Sustainable Transportation</h4>
<p>Walk, bike, use public transport, or carpool whenever possible to reduce your carbon footprint.</p>
<h4>Support Local and Organic</h4>
<p>Buy local, seasonal produce to reduce transportation emissions and support your community.</p>
<h4>Minimize Single-Use Items</h4>
<p>Replace disposable items with reusable alternatives like water bottles, shopping bags, and containers.</p>`,
          type: 'guide',
          difficulty: 'beginner',
          estimatedReadTime: 8,
          author: { name: 'GreenLife', bio: 'Sustainable lifestyle advocates' },
          interactions: { views: 457, likes: [] },
          tags: ['lifestyle', 'beginner', 'sustainable'],
          publishedAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        },
        'pop2': {
          _id: 'pop2',
          title: 'Zero Waste Kitchen Tips',
          summary: 'Transform your kitchen into a zero-waste zone with these practical strategies.',
          content: `<h3>Zero Waste Kitchen Tips</h3>
<p>The kitchen is often where most household waste is generated. Here's how to minimize it:</p>
<h4>Meal Planning</h4>
<p>Plan your meals weekly to avoid food waste and reduce packaging from impulse purchases.</p>
<h4>Use Glass Containers</h4>
<p>Store food in glass containers instead of plastic wrap or disposable containers.</p>
<h4>Compost Food Scraps</h4>
<p>Start composting vegetable peels and food scraps to create nutrient-rich soil for plants.</p>
<h4>Buy in Bulk</h4>
<p>Purchase dry goods in bulk using your own containers to reduce packaging waste.</p>`,
          type: 'tip',
          difficulty: 'intermediate',
          estimatedReadTime: 6,
          author: { name: 'ZeroWaste Pro', bio: 'Zero waste lifestyle experts' },
          interactions: { views: 343, likes: [] },
          tags: ['kitchen', 'zero-waste', 'food'],
          publishedAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-08')
        },
        'pop3': {
          _id: 'pop3',
          title: 'Green Transportation Options',
          summary: 'Explore eco-friendly ways to get around your city while reducing emissions.',
          content: `<h3>Green Transportation Options</h3>
<p>Transportation is a major source of carbon emissions. Here are eco-friendly alternatives:</p>
<h4>Public Transportation</h4>
<p>Buses, trains, and subways can significantly reduce your carbon footprint compared to driving alone.</p>
<h4>Cycling and Walking</h4>
<p>For short distances, cycling and walking are the most sustainable options and great for your health.</p>
<h4>Electric Vehicles</h4>
<p>If you need a car, consider electric or hybrid vehicles to reduce emissions.</p>
<h4>Carpooling and Ride-Sharing</h4>
<p>Share rides with others to reduce the number of vehicles on the road.</p>`,
          type: 'article',
          difficulty: 'beginner',
          estimatedReadTime: 5,
          author: { name: 'EcoTransport', bio: 'Sustainable transportation advocates' },
          interactions: { views: 279, likes: [] },
          tags: ['transport', 'green', 'city'],
          publishedAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-05')
        }
      };
      
      const content = mockData[id];
      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
      
      // Increment view count
      content.interactions.views += 1;
      
      return res.json({ success: true, data: content });
    }
    
    // For regular ObjectIds, try to find in database
    let content;
    try {
      content = await EducationalContent.findById(id);
    } catch (mongoError) {
      // If it's not a valid ObjectId, return 404
      if (mongoError.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
      throw mongoError;
    }
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    
    await content.incrementView(); // Increment view count
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ success: false, message: 'Failed to get content' });
  }
});

// POST /educational/:id/like - Like or unlike content
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    // Handle mock data IDs
    if (id.startsWith('feat') || id.startsWith('pop')) {
      // For mock data, just return success (since this is demo data)
      return res.json({ success: true, message: 'Content liked/unliked successfully' });
    }
    
    // For regular ObjectIds, try to find in database
    let content;
    try {
      content = await EducationalContent.findById(id);
    } catch (mongoError) {
      if (mongoError.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
      throw mongoError;
    }
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    await content.toggleLike(userId);
    res.json({ success: true, message: 'Content liked/unliked successfully' });
  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({ success: false, message: 'Failed to like/unlike content' });
  }
});

// POST /educational/:id/bookmark - Bookmark or remove bookmark
router.post('/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    // Handle mock data IDs
    if (id.startsWith('feat') || id.startsWith('pop')) {
      // For mock data, just return success (since this is demo data)
      return res.json({ success: true, message: 'Content bookmarked/unbookmarked successfully' });
    }
    
    // For regular ObjectIds, try to find in database
    let content;
    try {
      content = await EducationalContent.findById(id);
    } catch (mongoError) {
      if (mongoError.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
      throw mongoError;
    }
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    await content.toggleBookmark(userId);
    res.json({ success: true, message: 'Content bookmarked/unbookmarked successfully' });
  } catch (error) {
    console.error('Bookmark content error:', error);
    res.status(500).json({ success: false, message: 'Failed to bookmark/unbookmark content' });
  }
});

module.exports = router;


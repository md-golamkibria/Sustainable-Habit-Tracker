const express = require('express');
const router = express.Router();

// Educational content data with more detailed information
const educationalContent = [
  {
    id: 1,
    title: 'Sustainable Living Basics',
    description: 'Learn the fundamentals of sustainable living.',
    content: 'Sustainable living is about making choices that reduce our environmental impact and promote a healthier planet. This includes conserving energy and water, reducing waste, choosing sustainable products, and being mindful of our transportation choices. By making small changes in our daily habits, we can collectively make a significant positive impact on the environment. Start by assessing your current lifestyle and identifying areas where you can make sustainable changes.',
    type: 'article',
    category: 'lifestyle',
    readTime: 5,
    author: 'EcoTeam',
    views: 120,
    likes: 24
  },
  {
    id: 2,
    title: 'Reducing Carbon Footprint',
    description: 'Tips and tricks to reduce your carbon footprint.',
    content: 'Your carbon footprint is the total amount of greenhouse gases produced directly and indirectly to support your activities. To reduce it, consider using public transportation, carpooling, or biking instead of driving alone. Eat locally-produced, seasonal foods and reduce meat consumption. Improve your home\'s energy efficiency with proper insulation and energy-efficient appliances. Reduce, reuse, and recycle to minimize waste. Be mindful of your water usage and consider supporting renewable energy initiatives.',
    type: 'guide',
    category: 'environment',
    readTime: 8,
    author: 'Climate Expert',
    views: 95,
    likes: 18
  },
  {
    id: 3,
    title: 'Water Conservation at Home',
    description: 'Simple ways to save water in your daily routine.',
    content: 'Water conservation is crucial for environmental sustainability. Install low-flow fixtures in your bathroom and kitchen. Fix leaky faucets and pipes promptly. Take shorter showers and turn off the tap while brushing teeth or shaving. Run full loads in your dishwasher and washing machine. Collect rainwater for gardening and use drought-resistant plants in your landscape. Be mindful of indirect water usage through the products you buy and the food you eat.',
    type: 'article',
    category: 'water',
    readTime: 4,
    author: 'WaterWise',
    views: 78,
    likes: 15
  },
  {
    id: 4,
    title: 'Renewable Energy Explained',
    description: 'Understanding different types of renewable energy sources.',
    content: 'Renewable energy comes from naturally replenishing sources like sunlight, wind, rain, tides, and geothermal heat. Solar energy harnesses the sun\'s power through photovoltaic panels or solar thermal collectors. Wind energy uses turbines to convert wind into electricity. Hydropower captures energy from flowing water. Geothermal energy taps into the Earth\'s internal heat. Biomass energy comes from organic materials like plants and waste. These renewable sources provide sustainable alternatives to fossil fuels, reducing greenhouse gas emissions and dependence on finite resources.',
    type: 'guide',
    category: 'energy',
    readTime: 10,
    author: 'Energy Specialist',
    views: 110,
    likes: 22
  },
  {
    id: 5,
    title: 'Zero Waste Living',
    description: 'Steps to reduce waste in your everyday life.',
    content: 'Zero waste living aims to send nothing to landfills by refusing, reducing, reusing, recycling, and composting. Start by refusing single-use items like plastic bags and straws. Reduce consumption by buying only what you need. Reuse items instead of disposing of them. Recycle properly by knowing your local recycling guidelines. Compost food scraps and yard waste to create nutrient-rich soil. Shop at bulk stores with your own containers, choose products with minimal packaging, and repair items instead of replacing them.',
    type: 'article',
    category: 'waste',
    readTime: 6,
    author: 'Waste Reduction Expert',
    views: 85,
    likes: 17
  }
];

// Get all educational content with optional category filter
router.get('/', (req, res) => {
  const { category } = req.query;
  
  if (category && category !== 'all') {
    const filteredContent = educationalContent.filter(c => c.category === category);
    return res.json(filteredContent);
  }
  
  res.json(educationalContent);
});

// Get educational content by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  
  if (category === 'all') {
    return res.json(educationalContent);
  }
  
  const filteredContent = educationalContent.filter(c => c.category === category);
  if (filteredContent.length === 0) {
    return res.status(404).json({ message: 'No content found for this category' });
  }
  
  res.json(filteredContent);
});

// Get educational content by ID
router.get('/:id', (req, res) => {
  const content = educationalContent.find(c => c.id === parseInt(req.params.id));
  if (!content) {
    return res.status(404).json({ message: 'Content not found' });
  }
  
  // Increment view count when content is viewed
  content.views += 1;
  
  res.json(content);
});

// Like educational content
router.post('/:id/like', (req, res) => {
  const content = educationalContent.find(c => c.id === parseInt(req.params.id));
  if (!content) {
    return res.status(404).json({ message: 'Content not found' });
  }
  
  // Increment like count
  content.likes += 1;
  
  res.json({ 
    success: true, 
    message: 'Content liked successfully', 
    likes: content.likes 
  });
});

module.exports = () => router;

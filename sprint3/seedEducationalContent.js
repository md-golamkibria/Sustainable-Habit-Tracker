const mongoose = require('mongoose');
const EducationalContent = require('./models/EducationalContent');

require('dotenv').config();

const sampleContent = [
  {
    title: "10 Simple Ways to Save Energy at Home",
    content: `
    <h2>Transform Your Home into an Energy-Efficient Haven</h2>
    
    <p>Reducing energy consumption doesn't require major renovations. Here are 10 simple yet effective ways to make your home more energy-efficient:</p>
    
    <h3>1. Switch to LED Bulbs</h3>
    <p>LED bulbs consume up to 75% less energy than traditional incandescent bulbs and last 25 times longer. Replace your most-used lights first for maximum impact.</p>
    
    <h3>2. Unplug Electronics When Not in Use</h3>
    <p>Many devices draw power even when turned off. This "phantom load" can account for 5-10% of your electricity bill. Use power strips to easily disconnect multiple devices.</p>
    
    <h3>3. Adjust Your Thermostat</h3>
    <p>Lower your thermostat by 7-10 degrees when you're away from home. A programmable thermostat can save you up to 10% on heating and cooling costs.</p>
    
    <h3>4. Seal Air Leaks</h3>
    <p>Check for drafts around windows, doors, and electrical outlets. Use weatherstripping, caulk, or foam sealers to plug gaps and reduce heating/cooling loss.</p>
    
    <h3>5. Use Energy-Efficient Appliances</h3>
    <p>When replacing appliances, look for ENERGY STAR certified models. They use 10-50% less energy than standard appliances.</p>
    
    <h3>6. Maintain Your HVAC System</h3>
    <p>Change air filters regularly and schedule annual maintenance. A clean system runs more efficiently and lasts longer.</p>
    
    <h3>7. Use Natural Light</h3>
    <p>Open curtains and blinds during the day to reduce the need for artificial lighting. Consider installing skylights in dark areas.</p>
    
    <h3>8. Wash Clothes in Cold Water</h3>
    <p>About 90% of a washing machine's energy goes toward heating water. Cold water detergents work just as well for most loads.</p>
    
    <h3>9. Install Ceiling Fans</h3>
    <p>Ceiling fans use only about 75 watts of electricity and can make you feel 3-4 degrees cooler, allowing you to raise the thermostat setting.</p>
    
    <h3>10. Use Smart Power Strips</h3>
    <p>These automatically cut power to devices in standby mode, eliminating phantom loads without any effort on your part.</p>
    
    <p><strong>Start with one or two changes and gradually implement more. Small steps lead to significant energy savings!</strong></p>
    `,
    summary: "Discover 10 easy and effective ways to reduce energy consumption at home, from switching to LED bulbs to using smart power strips. These simple changes can cut your energy bills by up to 25%.",
    type: "article",
    category: "energy_saving",
    difficulty: "beginner",
    readTime: 8,
    tags: ["energy efficiency", "home improvement", "cost saving", "LED lights", "HVAC"],
    author: {
      name: "Dr. Sarah Johnson",
      bio: "Environmental Engineer with 15 years of experience in sustainable building design",
      credentials: "PhD in Environmental Engineering, LEED AP"
    },
    sources: [
      {
        title: "U.S. Department of Energy - Energy Saver Guide",
        url: "https://www.energy.gov/energysaver",
        description: "Official government resource for energy saving tips"
      }
    ],
    media: {
      imageUrl: "/images/energy-saving-home.jpg"
    },
    relatedActions: ["switch_to_led", "unplug_devices", "adjust_thermostat"],
    featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Featured for 30 days
  },
  {
    title: "Quick Tip: The 5-Minute Shower Challenge",
    content: `
    <h2>Save Water with the 5-Minute Shower Challenge</h2>
    
    <p>Did you know that the average shower uses 2.5 gallons of water per minute? A typical 8-minute shower uses 20 gallons of water!</p>
    
    <h3>Why 5 Minutes?</h3>
    <p>Reducing your shower time to 5 minutes can save:</p>
    <ul>
      <li>🚿 <strong>7.5 gallons of water</strong> per shower</li>
      <li>💰 <strong>$50-100 per year</strong> on water bills</li>
      <li>⚡ <strong>Energy costs</strong> from heating less water</li>
      <li>🌍 <strong>2,700+ gallons annually</strong> for daily showers</li>
    </ul>
    
    <h3>How to Do It:</h3>
    <ol>
      <li><strong>Use a waterproof timer</strong> or play a 5-minute song</li>
      <li><strong>Wet your body and hair quickly</strong> (30 seconds)</li>
      <li><strong>Turn off water while soaping/shampooing</strong> (2 minutes)</li>
      <li><strong>Rinse thoroughly</strong> (2.5 minutes)</li>
    </ol>
    
    <h3>Pro Tips:</h3>
    <ul>
      <li>Install a low-flow showerhead to save even more water</li>
      <li>Take navy showers: wet, soap, rinse</li>
      <li>Collect cold water while waiting for hot water to use for plants</li>
    </ul>
    
    <p><strong>Challenge yourself for one week and see the difference!</strong></p>
    `,
    summary: "Learn how reducing your shower time to 5 minutes can save thousands of gallons of water annually and cut your utility bills significantly.",
    type: "tip",
    category: "water_conservation",
    difficulty: "beginner",
    readTime: 3,
    tags: ["water saving", "shower", "conservation", "quick tip"],
    author: {
      name: "Maria Rodriguez",
      bio: "Water Conservation Specialist",
      credentials: "MS in Environmental Science"
    },
    relatedActions: ["shorter_shower", "water_conservation"]
  },
  {
    title: "Zero Waste Kitchen: A Beginner's Guide",
    content: `
    <h2>Creating a Zero Waste Kitchen: Start Your Sustainable Journey</h2>
    
    <p>The kitchen is often the biggest source of household waste, but it's also where you can make the most significant impact. Here's how to transform your kitchen into a zero-waste zone.</p>
    
    <h3>The Zero Waste Hierarchy</h3>
    <ol>
      <li><strong>Refuse</strong> - Say no to single-use items</li>
      <li><strong>Reduce</strong> - Buy only what you need</li>
      <li><strong>Reuse</strong> - Repurpose containers and materials</li>
      <li><strong>Recycle</strong> - Proper disposal of materials</li>
      <li><strong>Rot</strong> - Compost organic waste</li>
    </ol>
    
    <h3>Essential Zero Waste Kitchen Swaps</h3>
    
    <h4>Storage Solutions</h4>
    <ul>
      <li>Replace plastic bags with glass containers or beeswax wraps</li>
      <li>Use mason jars for bulk storage</li>
      <li>Invest in a good set of reusable containers</li>
    </ul>
    
    <h4>Shopping Changes</h4>
    <ul>
      <li>Bring reusable bags and produce bags</li>
      <li>Shop at farmers markets and bulk stores</li>
      <li>Choose products with minimal packaging</li>
    </ul>
    
    <h4>Food Preparation</h4>
    <ul>
      <li>Use cloth napkins instead of paper towels</li>
      <li>Make your own cleaning products</li>
      <li>Repurpose vegetable scraps for broth</li>
    </ul>
    
    <h3>Composting Made Simple</h3>
    <p>Even apartment dwellers can compost:</p>
    <ul>
      <li><strong>Countertop composters</strong> for small spaces</li>
      <li><strong>Worm bins</strong> for efficient decomposition</li>
      <li><strong>Community gardens</strong> often accept compost materials</li>
    </ul>
    
    <h3>Common Mistakes to Avoid</h3>
    <ul>
      <li>Don't try to change everything at once</li>
      <li>Use up existing supplies before buying replacements</li>
      <li>Focus on high-impact changes first</li>
    </ul>
    
    <h3>Track Your Progress</h3>
    <p>Start with one change per week:</p>
    <ul>
      <li>Week 1: Eliminate single-use plastic bags</li>
      <li>Week 2: Start composting</li>
      <li>Week 3: Switch to bulk shopping</li>
      <li>Week 4: Make your own cleaning products</li>
    </ul>
    
    <p><strong>Remember: Progress, not perfection, is the goal!</strong></p>
    `,
    summary: "Transform your kitchen into a zero-waste zone with practical tips, essential swaps, and a step-by-step approach to reducing food waste and packaging.",
    type: "guide",
    category: "waste_reduction",
    difficulty: "beginner",
    readTime: 12,
    tags: ["zero waste", "kitchen", "composting", "plastic free", "sustainable living"],
    author: {
      name: "Emma Chen",
      bio: "Zero Waste Lifestyle Coach and Environmental Blogger",
      credentials: "Certified Zero Waste Specialist"
    },
    sources: [
      {
        title: "Zero Waste Home by Bea Johnson",
        url: "https://zerowastehome.com",
        description: "Pioneering resource for zero waste living"
      }
    ],
    media: {
      imageUrl: "/images/zero-waste-kitchen.jpg"
    },
    relatedActions: ["compost_food_waste", "use_reusable_bags", "buy_in_bulk"],
    featuredUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Featured for 7 days
  },
  {
    title: "Sustainable Transportation: Beyond Just Driving Less",
    content: `
    <h2>Revolutionize Your Commute: Sustainable Transportation Options</h2>
    
    <p>Transportation accounts for nearly 30% of greenhouse gas emissions. But sustainable mobility goes beyond just driving less – it's about smart choices that benefit both you and the planet.</p>
    
    <h3>The Transportation Hierarchy</h3>
    <ol>
      <li><strong>Walk</strong> - Zero emissions, great exercise</li>
      <li><strong>Bike</strong> - Low impact, efficient for short trips</li>
      <li><strong>Public Transit</strong> - Shared resources, reduced congestion</li>
      <li><strong>Carpool/Rideshare</strong> - Maximize vehicle efficiency</li>
      <li><strong>Electric/Hybrid</strong> - Cleaner personal transport</li>
      <li><strong>Traditional Vehicle</strong> - Last resort, drive efficiently</li>
    </ol>
    
    <h3>Active Transportation Benefits</h3>
    <h4>Walking & Cycling</h4>
    <ul>
      <li><strong>Health:</strong> 150 minutes of moderate activity per week recommended</li>
      <li><strong>Cost:</strong> Save $8,000+ annually on car ownership</li>
      <li><strong>Environment:</strong> Zero direct emissions</li>
      <li><strong>Community:</strong> Connect with your neighborhood</li>
    </ul>
    
    <h3>Making It Work</h3>
    <h4>Planning Your Route</h4>
    <ul>
      <li>Use apps like Google Maps for bike/walking directions</li>
      <li>Find safe, well-lit paths</li>
      <li>Identify rest stops and facilities</li>
    </ul>
    
    <h4>Weather Strategies</h4>
    <ul>
      <li>Invest in quality rain gear</li>
      <li>Layer clothing for temperature changes</li>
      <li>Have backup transportation plans</li>
    </ul>
    
    <h3>Public Transportation Mastery</h3>
    <ul>
      <li><strong>Apps:</strong> Use transit apps for real-time updates</li>
      <li><strong>Passes:</strong> Monthly passes often cheaper than daily tickets</li>
      <li><strong>Timing:</strong> Avoid peak hours when possible</li>
      <li><strong>Productivity:</strong> Use commute time to read, plan, or relax</li>
    </ul>
    
    <h3>Car Alternatives</h3>
    <h4>Car Sharing Services</h4>
    <ul>
      <li>Zipcar, Car2Go for occasional needs</li>
      <li>Perfect for errands and weekend trips</li>
      <li>No parking, insurance, or maintenance costs</li>
    </ul>
    
    <h4>E-bikes and Scooters</h4>
    <ul>
      <li>Extend cycling range and reduce effort</li>
      <li>Great for hilly areas or longer commutes</li>
      <li>Many cities offer shared e-bike programs</li>
    </ul>
    
    <h3>When You Must Drive</h3>
    <ul>
      <li><strong>Combine trips</strong> to maximize efficiency</li>
      <li><strong>Maintain your vehicle</strong> for optimal fuel economy</li>
      <li><strong>Drive smoothly</strong> - avoid rapid acceleration and braking</li>
      <li><strong>Remove excess weight</strong> from your vehicle</li>
    </ul>
    
    <h3>Creating Your Transportation Plan</h3>
    <ol>
      <li>Map your regular destinations</li>
      <li>Calculate time and cost for each option</li>
      <li>Start with one or two route changes</li>
      <li>Track your savings and emissions reduction</li>
    </ol>
    
    <p><strong>Small changes in how we move can create big environmental impacts!</strong></p>
    `,
    summary: "Explore sustainable transportation options that go beyond driving less, including active transportation, public transit, and smart driving strategies for reducing your carbon footprint.",
    type: "guide",
    category: "transportation",
    difficulty: "intermediate",
    readTime: 15,
    tags: ["transportation", "cycling", "public transit", "carbon footprint", "commuting"],
    author: {
      name: "Alex Thompson",
      bio: "Urban Planning Consultant specializing in sustainable mobility",
      credentials: "MS in Urban Planning, Certified Transportation Planner"
    },
    sources: [
      {
        title: "EPA Transportation and Climate",
        url: "https://www.epa.gov/transportation-air-pollution-and-climate-change",
        description: "Government data on transportation emissions"
      }
    ],
    media: {
      imageUrl: "/images/sustainable-transport.jpg"
    },
    relatedActions: ["bike_to_work", "use_public_transport", "carpool", "walk_instead_drive"]
  },
  {
    title: "Seasonal Eating: A Guide to Sustainable Food Choices",
    content: `
    <h2>Eat with the Seasons: Your Guide to Sustainable Food Choices</h2>
    
    <p>Seasonal eating isn't just trendy – it's one of the most impactful ways to reduce your environmental footprint while enjoying fresher, more nutritious, and often cheaper food.</p>
    
    <h3>Why Seasonal Eating Matters</h3>
    <ul>
      <li><strong>Lower Carbon Footprint:</strong> Reduces transportation emissions</li>
      <li><strong>Better Nutrition:</strong> Peak ripeness means maximum nutrients</li>
      <li><strong>Cost Savings:</strong> Abundant seasonal produce costs less</li>
      <li><strong>Supports Local Economy:</strong> Keeps money in your community</li>
      <li><strong>Biodiversity:</strong> Encourages diverse farming practices</li>
    </ul>
    
    <h3>Spring (March - May)</h3>
    <h4>Fresh Starts: Light Greens and Early Vegetables</h4>
    <ul>
      <li><strong>Vegetables:</strong> Asparagus, artichokes, peas, spring onions, lettuce</li>
      <li><strong>Fruits:</strong> Strawberries, rhubarb, early berries</li>
      <li><strong>Herbs:</strong> Chives, dill, mint, early basil</li>
    </ul>
    <p><strong>Try:</strong> Light salads, vegetable soups, and fresh herb dishes</p>
    
    <h3>Summer (June - August)</h3>
    <h4>Abundance: Peak Growing Season</h4>
    <ul>
      <li><strong>Vegetables:</strong> Tomatoes, peppers, zucchini, corn, cucumbers</li>
      <li><strong>Fruits:</strong> Berries, stone fruits, melons, grapes</li>
      <li><strong>Herbs:</strong> Basil, oregano, thyme, rosemary</li>
    </ul>
    <p><strong>Try:</strong> Fresh salsas, gazpacho, grilled vegetables, fruit salads</p>
    
    <h3>Fall (September - November)</h3>
    <h4>Harvest Time: Hearty and Warming Foods</h4>
    <ul>
      <li><strong>Vegetables:</strong> Squash, pumpkins, root vegetables, Brussels sprouts</li>
      <li><strong>Fruits:</strong> Apples, pears, cranberries, late grapes</li>
      <li><strong>Nuts:</strong> Fresh walnuts, chestnuts, pecans</li>
    </ul>
    <p><strong>Try:</strong> Roasted vegetables, apple dishes, hearty stews</p>
    
    <h3>Winter (December - February)</h3>
    <h4>Storage Crops: Preserved and Hardy Vegetables</h4>
    <ul>
      <li><strong>Vegetables:</strong> Cabbage, potatoes, carrots, onions, kale</li>
      <li><strong>Fruits:</strong> Citrus fruits, stored apples, dried fruits</li>
      <li><strong>Preserved:</strong> Canned tomatoes, frozen vegetables, fermented foods</li>
    </ul>
    <p><strong>Try:</strong> Warming soups, citrus dishes, preserved vegetables</p>
    
    <h3>How to Start Seasonal Eating</h3>
    
    <h4>1. Know Your Local Season</h4>
    <ul>
      <li>Visit farmers markets to see what's available</li>
      <li>Look up local growing calendars</li>
      <li>Join a Community Supported Agriculture (CSA) program</li>
    </ul>
    
    <h4>2. Plan Around Seasonal Produce</h4>
    <ul>
      <li>Base meals on what's in season</li>
      <li>Learn to prepare unfamiliar vegetables</li>
      <li>Batch cook seasonal favorites</li>
    </ul>
    
    <h4>3. Preserve the Abundance</h4>
    <ul>
      <li><strong>Freezing:</strong> Berries, chopped vegetables, herbs in ice cubes</li>
      <li><strong>Canning:</strong> Tomatoes, jams, pickles</li>
      <li><strong>Dehydrating:</strong> Fruits, vegetables, herbs</li>
      <li><strong>Fermenting:</strong> Sauerkraut, kimchi, pickles</li>
    </ul>
    
    <h3>Budget-Friendly Tips</h3>
    <ul>
      <li>Buy in bulk when produce is at peak season</li>
      <li>Shop at the end of farmers market days for deals</li>
      <li>Consider "ugly" produce that tastes just as good</li>
      <li>Grow your own herbs and easy vegetables</li>
    </ul>
    
    <h3>Recipe Ideas by Season</h3>
    <h4>Spring</h4>
    <ul>
      <li>Asparagus and pea risotto</li>
      <li>Strawberry spinach salad</li>
      <li>Spring vegetable soup</li>
    </ul>
    
    <h4>Summer</h4>
    <ul>
      <li>Gazpacho with fresh herbs</li>
      <li>Grilled vegetable pasta</li>
      <li>Berry and peach cobbler</li>
    </ul>
    
    <h4>Fall</h4>
    <ul>
      <li>Butternut squash soup</li>
      <li>Apple and Brussels sprouts salad</li>
      <li>Roasted root vegetable medley</li>
    </ul>
    
    <h4>Winter</h4>
    <ul>
      <li>Citrus and kale salad</li>
      <li>Hearty potato and leek soup</li>
      <li>Braised cabbage with apples</li>
    </ul>
    
    <p><strong>Start with one seasonal swap per week and gradually build your seasonal eating habits!</strong></p>
    `,
    summary: "Learn how eating seasonally can reduce your environmental impact while providing fresher, more nutritious, and cost-effective meals throughout the year.",
    type: "guide",
    category: "food_sustainability",
    difficulty: "intermediate",
    readTime: 18,
    tags: ["seasonal eating", "local food", "sustainable agriculture", "nutrition", "farmers market"],
    author: {
      name: "Chef Michael Torres",
      bio: "Sustainable Cuisine Expert and Farm-to-Table Advocate",
      credentials: "Culinary Arts Degree, Certified Organic Chef"
    },
    sources: [
      {
        title: "Seasonal Food Guide - USDA",
        url: "https://www.seasonalfoodguide.org",
        description: "Comprehensive seasonal food availability by region"
      }
    ],
    media: {
      imageUrl: "/images/seasonal-eating.jpg"
    },
    relatedActions: ["eat_seasonal", "shop_local", "grow_own_food", "reduce_food_waste"]
  }
];

async function seedEducationalContent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing content
    await EducationalContent.deleteMany({});
    console.log('Cleared existing educational content');

    // Insert sample content
    const insertedContent = await EducationalContent.insertMany(sampleContent);
    console.log(`Inserted ${insertedContent.length} educational content items`);

    // Add some interaction data to make content appear popular
    for (let content of insertedContent) {
      // Add some random views
      content.interactions.views = Math.floor(Math.random() * 1000) + 50;
      
      // Add some random likes (we'd need actual user IDs in a real scenario)
      const likeCount = Math.floor(Math.random() * 20);
      for (let i = 0; i < likeCount; i++) {
        content.interactions.likes.push({
          user: new mongoose.Types.ObjectId(), // Random ObjectId
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
      }
      
      content.interactions.shares = Math.floor(Math.random() * 50);
      await content.save();
    }

    console.log('Educational content seeded successfully with interaction data!');
    
  } catch (error) {
    console.error('Error seeding educational content:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedEducationalContent();

const mongoose = require('mongoose');
const Challenge = require('./model/Challenge');
const Goal = require('./model/Goal');
require('dotenv').config();

const sampleChallenges = [
  {
    title: "Daily Eco Warrior",
    description: "Complete 10 sustainable actions this week",
    type: "weekly",
    category: "general",
    target: {
      value: 10,
      unit: "actions",
      description: "Complete various sustainable actions"
    },
    duration: {
      isActive: true,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    },
    participants: [],
    stats: { totalParticipants: 0, completedCount: 0 },
    reward: {
      points: 100,
      badge: {
        name: "Eco Warrior",
        icon: "🌱",
        description: "Completed 10 sustainable actions in a week"
      }
    }
  },
  {
    title: "Bike to Work Challenge",
    description: "Bike to work 5 times this month",
    type: "monthly",
    category: "biking",
    target: {
      value: 5,
      unit: "times",
      description: "Use your bike for commuting"
    },
    duration: {
      isActive: true,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    participants: [],
    stats: { totalParticipants: 0, completedCount: 0 },
    reward: {
      points: 200,
      badge: {
        name: "Bike Commuter",
        icon: "🚴",
        description: "Biked to work 5 times in a month"
      }
    }
  },
  {
    title: "Water Conservation Hero",
    description: "Save 100 liters of water through conservation practices",
    type: "weekly",
    category: "water_conservation",
    target: {
      value: 100,
      unit: "liters",
      description: "Conserve water through various methods"
    },
    duration: {
      isActive: true,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    },
    participants: [],
    stats: { totalParticipants: 0, completedCount: 0 },
    reward: {
      points: 150,
      badge: {
        name: "Water Saver",
        icon: "💧",
        description: "Saved 100 liters of water in a week"
      }
    }
  }
];

const sampleGoals = [
  {
    title: "Reduce Carbon Footprint",
    description: "Aim to reduce my daily carbon footprint by using sustainable transportation",
    category: "transport",
    targetValue: 50,
    unit: "km",
    currentValue: 0,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true
  },
  {
    title: "Weekly Recycling Goal",
    description: "Recycle at least 20 items per week",
    category: "waste",
    targetValue: 20,
    unit: "items",
    currentValue: 0,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing challenges
    await Challenge.deleteMany({});
    console.log('Cleared existing challenges');

    // Insert sample challenges
    const createdChallenges = await Challenge.insertMany(sampleChallenges);
    console.log(`Created ${createdChallenges.length} sample challenges`);

    console.log('✅ Database seeded successfully!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

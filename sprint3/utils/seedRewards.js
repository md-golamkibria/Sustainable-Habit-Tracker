const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Sample rewards data
const sampleRewards = [
  {
    name: "Eco Warrior Badge",
    description: "Show off your commitment to sustainability with this exclusive badge",
    category: "environmental_impact",
    type: "badge",
    icon: "🌿",
    rarity: "common",
    isActive: true,
    criteria: {
      level: 5,
      actionCount: 50
    },
    rewards: {
      points: 100,
      experience: 50,
      title: "Eco Warrior"
    }
  },
  {
    name: "Green Champion Badge",
    description: "Unlock the prestigious Green Champion badge for dedicated environmental action",
    category: "environmental_impact",
    type: "badge",
    icon: "🏆",
    rarity: "rare",
    isActive: true,
    criteria: {
      level: 10,
      actionCount: 100,
      streakDays: 7
    },
    rewards: {
      points: 250,
      experience: 150,
      title: "Green Champion"
    }
  },
  {
    name: "Consistency Master",
    description: "Awarded for maintaining a strong daily habit streak",
    category: "consistency",
    type: "streak_bonus",
    icon: "🔥",
    rarity: "uncommon",
    isActive: true,
    criteria: {
      streakDays: 30
    },
    rewards: {
      points: 300,
      experience: 200,
      title: "Streak Master"
    }
  },
  {
    name: "Environmental Impact Hero",
    description: "Recognized for significant CO2 savings through sustainable actions",
    category: "environmental_impact",
    type: "milestone",
    icon: "🌍",
    rarity: "epic",
    isActive: true,
    criteria: {
      co2Saved: 100,
      actionCount: 200
    },
    rewards: {
      points: 500,
      experience: 300,
      title: "Impact Hero"
    }
  },
  {
    name: "Community Leader",
    description: "Awarded for active participation and leadership in the community",
    category: "community",
    type: "achievement",
    icon: "👥",
    rarity: "rare",
    isActive: true,
    criteria: {
      level: 15,
      friendsReferred: 5
    },
    rewards: {
      points: 400,
      experience: 250,
      title: "Community Leader"
    }
  },
  {
    name: "Challenge Champion",
    description: "Master of challenges - completed numerous community challenges",
    category: "challenges",
    type: "challenge_reward",
    icon: "🎯",
    rarity: "epic",
    isActive: true,
    criteria: {
      challengesCompleted: 10,
      level: 12
    },
    rewards: {
      points: 600,
      experience: 400,
      title: "Challenge Champion"
    }
  },
  {
    name: "Social Butterfly",
    description: "Highly engaged community member with great social connections",
    category: "social_engagement",
    type: "achievement",
    icon: "🦋",
    rarity: "uncommon",
    isActive: true,
    criteria: {
      friendsReferred: 3,
      level: 8
    },
    rewards: {
      points: 200,
      experience: 100,
      title: "Social Butterfly"
    }
  },
  {
    name: "Milestone Achiever",
    description: "Reached significant milestones in sustainable living",
    category: "milestones",
    type: "milestone",
    icon: "🎖️",
    rarity: "rare",
    isActive: true,
    criteria: {
      actionCount: 500,
      level: 20
    },
    rewards: {
      points: 750,
      experience: 500,
      title: "Milestone Master"
    }
  },
  {
    name: "Carbon Offset Champion",
    description: "Exceptional contributor to carbon reduction efforts",
    category: "environmental_impact",
    type: "achievement",
    icon: "🌱",
    rarity: "legendary",
    isActive: true,
    criteria: {
      co2Saved: 500,
      actionCount: 1000,
      level: 25
    },
    rewards: {
      points: 1000,
      experience: 750,
      title: "Carbon Champion"
    },
    maxRecipients: 100
  },
  {
    name: "Early Adopter",
    description: "Among the first users to join and actively participate",
    category: "special_events",
    type: "achievement",
    icon: "⭐",
    rarity: "epic",
    isActive: true,
    criteria: {
      level: 10,
      actionCount: 50
    },
    rewards: {
      points: 300,
      experience: 200,
      title: "Early Adopter"
    },
    availableUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    maxRecipients: 500
  }
];

async function seedRewards() {
  try {
    await connectDB();
    
    const Reward = require('../model/Reward');
    
    // Clear existing rewards
    await Reward.deleteMany({});
    console.log('Cleared existing rewards');
    
    // Insert sample rewards
    await Reward.insertMany(sampleRewards);
    console.log(`✅ Successfully seeded ${sampleRewards.length} rewards`);
    
    // Display summary
    const categories = await Reward.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsCost' }
        }
      }
    ]);
    
    console.log('\n📊 Rewards Summary:');
    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} rewards (${cat.totalPoints} total points)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding rewards:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedRewards();
}

module.exports = { seedRewards, sampleRewards };

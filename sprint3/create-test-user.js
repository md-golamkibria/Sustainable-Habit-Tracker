const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./model/User');

async function createTestUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Username: testuser');
      console.log('Password: password123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      bio: 'Test user for Sprint 3 development',
      location: 'Test Location',
      social: {
        friends: [],
        following: [],
        followers: [],
        isPublic: true,
        allowFriendRequests: true
      },
      gamification: {
        level: 1,
        experience: 0,
        points: 0,
        badges: [],
        achievements: []
      },
      settings: {
        notifications: {
          dailyReminders: true,
          weeklyReports: true,
          challengeInvites: true,
          friendActivity: true,
          leaderboardUpdates: true,
          achievements: true
        },
        privacy: {
          showOnLeaderboard: true,
          shareGoals: true,
          shareActions: true,
          allowMessages: true
        },
        display: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC'
        }
      },
      stats: {
        totalActions: 0,
        totalCO2Saved: 0,
        totalWaterSaved: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyStats: {
          actionsThisWeek: 0,
          co2SavedThisWeek: 0,
          waterSavedThisWeek: 0
        },
        monthlyStats: {
          actionsThisMonth: 0,
          co2SavedThisMonth: 0,
          waterSavedThisMonth: 0
        },
        yearlyStats: {
          actionsThisYear: 0,
          co2SavedThisYear: 0,
          waterSavedThisYear: 0
        },
        ranking: {
          global: 0,
          weekly: 0,
          monthly: 0
        }
      },
      challenges: {
        active: [],
        completed: []
      },
      activity: {
        lastActive: new Date(),
        isOnline: false
      },
      isActive: true
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📧 Username: testuser');
    console.log('🔑 Password: password123');
    console.log('💡 You can now login with these credentials');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createTestUser();

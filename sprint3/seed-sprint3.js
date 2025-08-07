const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification');
const Reward = require('./models/Reward');
const Community = require('./models/Community');
const Post = require('./models/Post');
const Challenge = require('./models/Challenge');

const MONGODB_URI = 'mongodb://localhost:27017/sustainable_habit_tracker_sprint3';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding for Sprint 3...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Notification.deleteMany({}),
      Reward.deleteMany({}),
      Community.deleteMany({}),
      Post.deleteMany({}),
      Challenge.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.create([
      {
        username: 'eco_warrior',
        email: 'eco@example.com',
        password: hashedPassword,
        level: 5,
        experience: 4500,
        badges: ['Early Adopter', 'Green Champion'],
        achievements: ['First Steps', 'Week Warrior'],
        stats: { weekly: 25, monthly: 120, yearly: 1200 },
        activity: { isOnline: true, lastActive: new Date() }
      },
      {
        username: 'green_guru',
        email: 'guru@example.com',
        password: hashedPassword,
        level: 8,
        experience: 7800,
        badges: ['Sustainability Master', 'Community Leader', 'Streak King'],
        achievements: ['First Steps', 'Week Warrior', 'Month Master', 'Social Butterfly'],
        stats: { weekly: 42, monthly: 180, yearly: 2100 },
        activity: { isOnline: false, lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      },
      {
        username: 'nature_lover',
        email: 'nature@example.com',
        password: hashedPassword,
        level: 3,
        experience: 2100,
        badges: ['Nature Friend'],
        achievements: ['First Steps'],
        stats: { weekly: 15, monthly: 80, yearly: 500 },
        activity: { isOnline: true, lastActive: new Date() }
      },
      {
        username: 'planet_protector',
        email: 'protector@example.com',
        password: hashedPassword,
        level: 6,
        experience: 5500,
        badges: ['Eco Defender', 'Climate Champion'],
        achievements: ['First Steps', 'Week Warrior', 'Challenge Master'],
        stats: { weekly: 35, monthly: 150, yearly: 1800 },
        activity: { isOnline: false, lastActive: new Date(Date.now() - 30 * 60 * 1000) }
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Set up friendships
    users[0].friends.push({ friendId: users[1]._id, status: 'accepted' });
    users[1].friends.push({ friendId: users[0]._id, status: 'accepted' });
    users[0].friends.push({ friendId: users[2]._id, status: 'pending' });
    users[2].friends.push({ friendId: users[0]._id, status: 'requested' });
    
    // Set up following relationships
    users[0].following.push(users[1]._id, users[3]._id);
    users[1].followers.push(users[0]._id);
    users[3].followers.push(users[0]._id);
    users[2].following.push(users[1]._id);
    users[1].followers.push(users[2]._id);

    await Promise.all(users.map(user => user.save()));
    console.log('Set up social relationships');

    // Create rewards
    const rewards = await Reward.create([
      {
        name: 'First Steps',
        description: 'Complete your first sustainable action',
        type: 'badge',
        category: 'environmental',
        criteria: { actions: { count: 1 } },
        rewards: { points: 100, experience: 50 },
        rarity: 'common',
        icon: '🌱',
        earnedBy: [
          { user: users[0]._id, earnedAt: new Date() },
          { user: users[1]._id, earnedAt: new Date() },
          { user: users[2]._id, earnedAt: new Date() },
          { user: users[3]._id, earnedAt: new Date() }
        ]
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        type: 'achievement',
        category: 'streak',
        criteria: { streakDays: 7 },
        rewards: { points: 500, experience: 200 },
        rarity: 'uncommon',
        icon: '🔥',
        earnedBy: [
          { user: users[0]._id, earnedAt: new Date() },
          { user: users[1]._id, earnedAt: new Date() },
          { user: users[3]._id, earnedAt: new Date() }
        ]
      },
      {
        name: 'Social Butterfly',
        description: 'Make 5 friends on the platform',
        type: 'badge',
        category: 'social',
        criteria: { friendsReferred: 5 },
        rewards: { points: 300, experience: 150 },
        rarity: 'rare',
        icon: '🦋',
        earnedBy: [
          { user: users[1]._id, earnedAt: new Date() }
        ]
      },
      {
        name: 'Green Champion',
        description: 'Save 100kg of CO2',
        type: 'achievement',
        category: 'environmental',
        criteria: { co2Saved: 100 },
        rewards: { points: 1000, experience: 500 },
        rarity: 'epic',
        icon: '🏆',
        earnedBy: [
          { user: users[0]._id, earnedAt: new Date() }
        ]
      }
    ]);

    console.log(`Created ${rewards.length} rewards`);

    // Create communities
    const communities = await Community.create([
      {
        name: 'Eco Warriors',
        description: 'A community for passionate environmental advocates',
        members: [users[0]._id, users[1]._id, users[3]._id],
        privacySettings: 'public'
      },
      {
        name: 'Green Living Tips',
        description: 'Share and discover sustainable living tips',
        members: [users[1]._id, users[2]._id],
        privacySettings: 'public'
      },
      {
        name: 'Climate Action Network',
        description: 'Taking action against climate change together',
        members: [users[0]._id, users[2]._id, users[3]._id],
        privacySettings: 'public'
      }
    ]);

    console.log(`Created ${communities.length} communities`);

    // Create posts
    const posts = await Post.create([
      {
        author: users[0]._id,
        community: communities[0]._id,
        content: {
          text: 'Just completed my first week of using public transport instead of driving! Feeling great about reducing my carbon footprint. 🚌🌍',
        },
        type: 'achievement',
        tags: ['public-transport', 'co2-reduction', 'milestone'],
        likes: [
          { user: users[1]._id },
          { user: users[3]._id }
        ],
        comments: [
          {
            author: users[1]._id,
            content: 'That\'s awesome! Keep it up! 👏',
            likes: [{ user: users[0]._id }]
          }
        ]
      },
      {
        author: users[1]._id,
        community: communities[1]._id,
        content: {
          text: 'Pro tip: Use reusable water bottles and coffee cups. Small changes make a big difference! ♻️',
        },
        type: 'tip',
        tags: ['reusable', 'waste-reduction', 'tips'],
        likes: [
          { user: users[0]._id },
          { user: users[2]._id }
        ]
      },
      {
        author: users[2]._id,
        content: {
          text: 'Started composting at home this week. Any tips for beginners? 🌱',
        },
        type: 'text',
        tags: ['composting', 'beginner', 'help'],
        likes: [{ user: users[1]._id }],
        comments: [
          {
            author: users[1]._id,
            content: 'Start with fruit and vegetable scraps. Avoid meat and dairy at first!'
          },
          {
            author: users[3]._id,
            content: 'Great choice! Make sure to turn it regularly for better decomposition.'
          }
        ]
      }
    ]);

    console.log(`Created ${posts.length} posts`);

    // Create challenges
    const challenges = await Challenge.create([
      {
        title: 'Plastic-Free Week',
        description: 'Avoid single-use plastics for 7 consecutive days',
        type: 'weekly',
        category: 'general',
        target: {
          value: 7,
          unit: 'days',
          description: 'Days without using single-use plastics'
        },
        reward: {
          points: 500,
          badge: {
            name: 'Plastic-Free Pioneer',
            icon: '♻️',
            description: 'Completed the plastic-free week challenge'
          }
        },
        difficulty: 'medium',
        duration: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        participants: [
          { userId: users[0]._id.toString(), progress: 3 },
          { userId: users[2]._id.toString(), progress: 1 }
        ],
        stats: {
          totalParticipants: 2,
          completedCount: 0,
          completionRate: 0
        }
      },
      {
        title: 'Green Commute Challenge',
        description: 'Use sustainable transportation (bike, walk, public transport) for all trips this month',
        type: 'monthly',
        category: 'public_transport',
        target: {
          value: 30,
          unit: 'trips',
          description: 'Sustainable transportation trips'
        },
        reward: {
          points: 1000,
          badge: {
            name: 'Eco Commuter',
            icon: '🚌',
            description: 'Master of sustainable transportation'
          }
        },
        difficulty: 'hard',
        duration: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        participants: [
          { userId: users[0]._id.toString(), progress: 15 },
          { userId: users[1]._id.toString(), progress: 22 },
          { userId: users[3]._id.toString(), progress: 8 }
        ],
        stats: {
          totalParticipants: 3,
          completedCount: 0,
          completionRate: 0
        }
      }
    ]);

    console.log(`Created ${challenges.length} challenges`);

    // Create notifications
    const notifications = await Notification.create([
      {
        recipient: users[0]._id,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${users[2].username} wants to be your friend!`,
        data: { userId: users[2]._id },
        priority: 'medium'
      },
      {
        recipient: users[1]._id,
        type: 'achievement_earned',
        title: 'Achievement Unlocked!',
        message: 'You\'ve earned the "Social Butterfly" achievement!',
        data: { achievementId: 'social_butterfly' },
        priority: 'high',
        read: true,
        readAt: new Date()
      },
      {
        recipient: users[0]._id,
        type: 'challenge_invite',
        title: 'Challenge Invitation',
        message: 'You\'ve been invited to join the "Plastic-Free Week" challenge!',
        data: { challengeId: challenges[0]._id },
        priority: 'medium'
      },
      {
        recipient: users[2]._id,
        type: 'system',
        title: 'Welcome to Sustainable Habit Tracker!',
        message: 'Start your journey towards a more sustainable lifestyle. Complete your first challenge to earn rewards!',
        priority: 'low'
      }
    ]);

    console.log(`Created ${notifications.length} notifications`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏆 Rewards: ${rewards.length}`);
    console.log(`   🏘️  Communities: ${communities.length}`);
    console.log(`   📝 Posts: ${posts.length}`);
    console.log(`   🎯 Challenges: ${challenges.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    
    console.log('\n🔐 Test credentials:');
    console.log('   Username: eco_warrior | Password: password123');
    console.log('   Username: green_guru | Password: password123');
    console.log('   Username: nature_lover | Password: password123');
    console.log('   Username: planet_protector | Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

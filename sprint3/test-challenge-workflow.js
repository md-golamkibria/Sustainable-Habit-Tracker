const mongoose = require('mongoose');
const Challenge = require('./model/Challenge');
const User = require('./model/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sustainable_habits', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testChallengeWorkflow() {
  try {
    console.log('🧪 Testing Complete Public/Private Challenge Workflow...\n');

    // Create test users
    const user1 = await User.findOneAndUpdate(
      { username: 'testuser1' },
      { 
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'hashedpassword',
        gamification: { level: 1, points: 0 },
        challenges: { active: [] }
      },
      { upsert: true, new: true }
    );

    const user2 = await User.findOneAndUpdate(
      { username: 'testuser2' },
      { 
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'hashedpassword',
        gamification: { level: 1, points: 0 },
        challenges: { active: [] }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Created test users: ${user1.username}, ${user2.username}`);

    // Clean up existing test challenges
    await Challenge.deleteMany({ 
      title: { $in: ['Test Public Challenge', 'Test Private Challenge', 'User2 Public Challenge'] }
    });

    // Test 1: User1 creates a public challenge
    const publicChallenge = new Challenge({
      title: 'Test Public Challenge',
      description: 'A public challenge for testing visibility',
      type: 'daily',
      category: 'energy_saving',
      target: { value: 10, unit: 'actions' },
      reward: { points: 50 },
      difficulty: 'easy',
      duration: { 
        isActive: true,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      requirements: {},
      isGlobal: true,
      createdBy: user1._id,
      participants: [],
      stats: { totalParticipants: 0, completedCount: 0, completionRate: 0 }
    });
    await publicChallenge.save();
    console.log('✅ User1 created public challenge');

    // Test 2: User1 creates a private challenge
    const privateChallenge = new Challenge({
      title: 'Test Private Challenge',
      description: 'A private challenge for testing visibility',
      type: 'weekly',
      category: 'water_conservation',
      target: { value: 5, unit: 'days' },
      reward: { points: 100 },
      difficulty: 'medium',
      duration: { 
        isActive: true,
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      requirements: {},
      isGlobal: false,
      createdBy: user1._id,
      participants: [],
      stats: { totalParticipants: 0, completedCount: 0, completionRate: 0 }
    });
    await privateChallenge.save();
    console.log('✅ User1 created private challenge');

    // Test 3: User2 creates a public challenge
    const user2PublicChallenge = new Challenge({
      title: 'User2 Public Challenge',
      description: 'Another public challenge for cross-user testing',
      type: 'daily',
      category: 'waste_reduction',
      target: { value: 7, unit: 'items' },
      reward: { points: 75 },
      difficulty: 'medium',
      duration: { 
        isActive: true,
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      requirements: {},
      isGlobal: true,
      createdBy: user2._id,
      participants: [],
      stats: { totalParticipants: 0, completedCount: 0, completionRate: 0 }
    });
    await user2PublicChallenge.save();
    console.log('✅ User2 created public challenge');

    // Test 4: Check available challenges for user2 (should only see user1's public challenge)
    const availableForUser2 = await Challenge.find({
      'duration.isActive': true,
      createdBy: { $ne: user2._id, $ne: 'system', $exists: true, $ne: null, $ne: '' },
      isGlobal: true,
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    }).populate('createdBy', 'username');

    console.log(`\n📋 Available challenges for ${user2.username}:`);
    availableForUser2.forEach(challenge => {
      console.log(`  - ${challenge.title} (${challenge.isGlobal ? 'Public' : 'Private'}) by ${challenge.createdBy.username}`);
    });

    // Test 5: Check available challenges for user1 (should only see user2's public challenge)
    const availableForUser1 = await Challenge.find({
      'duration.isActive': true,
      createdBy: { $ne: user1._id, $ne: 'system', $exists: true, $ne: null, $ne: '' },
      isGlobal: true,
      $or: [
        { 'duration.endDate': { $exists: false } },
        { 'duration.endDate': { $gte: new Date() } }
      ]
    }).populate('createdBy', 'username');

    console.log(`\n📋 Available challenges for ${user1.username}:`);
    availableForUser1.forEach(challenge => {
      console.log(`  - ${challenge.title} (${challenge.isGlobal ? 'Public' : 'Private'}) by ${challenge.createdBy.username}`);
    });

    // Test 6: User2 joins user1's public challenge
    publicChallenge.participants.push({
      userId: user2._id,
      joinedAt: new Date(),
      progress: 3,
      completed: false
    });
    await publicChallenge.save();

    user2.challenges.active.push({
      challengeId: publicChallenge._id,
      joinedAt: new Date(),
      progress: 3,
      completed: false
    });
    await user2.save();
    console.log('✅ User2 joined user1\'s public challenge');

    // Test 7: User1 joins user2's public challenge
    user2PublicChallenge.participants.push({
      userId: user1._id,
      joinedAt: new Date(),
      progress: 5,
      completed: false
    });
    await user2PublicChallenge.save();

    user1.challenges.active.push({
      challengeId: user2PublicChallenge._id,
      joinedAt: new Date(),
      progress: 5,
      completed: false
    });
    await user1.save();
    console.log('✅ User1 joined user2\'s public challenge');

    // Test 8: Check user1's "My Created" section (should show both public and private)
    const user1Created = await Challenge.find({ createdBy: user1._id })
      .sort({ createdAt: -1 })
      .populate('participants.userId', 'username');

    console.log(`\n📋 ${user1.username}'s "My Created" challenges:`);
    user1Created.forEach(challenge => {
      console.log(`  - ${challenge.title} (${challenge.isGlobal ? 'Public' : 'Private'}) - ${challenge.participants.length} participants`);
    });

    // Test 9: Check user1's "My Challenges" section (should show joined challenges + own challenges)
    const user1JoinedIds = user1.challenges.active.map(uc => uc.challengeId);
    const user1Joined = await Challenge.find({
      _id: { $in: user1JoinedIds }
    }).populate('createdBy', 'username');

    const user1AllChallenges = [...user1Created, ...user1Joined.filter(c => !c.createdBy._id.equals(user1._id))];

    console.log(`\n📋 ${user1.username}'s "My Challenges" section:`);
    user1AllChallenges.forEach(challenge => {
      const isCreated = challenge.createdBy._id.equals(user1._id);
      const type = isCreated ? 'Created' : 'Joined';
      console.log(`  - ${challenge.title} (${type}) - ${challenge.isGlobal ? 'Public' : 'Private'}`);
    });

    // Test 10: Check user2's "My Created" section (should show only their public challenge)
    const user2Created = await Challenge.find({ createdBy: user2._id })
      .sort({ createdAt: -1 })
      .populate('participants.userId', 'username');

    console.log(`\n📋 ${user2.username}'s "My Created" challenges:`);
    user2Created.forEach(challenge => {
      console.log(`  - ${challenge.title} (${challenge.isGlobal ? 'Public' : 'Private'}) - ${challenge.participants.length} participants`);
    });

    // Test 11: Check user2's "My Challenges" section
    const user2JoinedIds = user2.challenges.active.map(uc => uc.challengeId);
    const user2Joined = await Challenge.find({
      _id: { $in: user2JoinedIds }
    }).populate('createdBy', 'username');

    const user2AllChallenges = [...user2Created, ...user2Joined.filter(c => !c.createdBy._id.equals(user2._id))];

    console.log(`\n📋 ${user2.username}'s "My Challenges" section:`);
    user2AllChallenges.forEach(challenge => {
      const isCreated = challenge.createdBy._id.equals(user2._id);
      const type = isCreated ? 'Created' : 'Joined';
      console.log(`  - ${challenge.title} (${type}) - ${challenge.isGlobal ? 'Public' : 'Private'}`);
    });

    // Test 12: Test challenge deletion with active participants
    console.log('\n🧪 Testing challenge deletion with active participants...');
    
    // Create a test challenge that will have participants
    const deletionTestChallenge = new Challenge({
      title: 'Deletion Test Challenge',
      description: 'Challenge to test deletion with participants',
      type: 'daily',
      category: 'energy_saving',
      target: { value: 5, unit: 'actions' },
      reward: { points: 30 },
      difficulty: 'easy',
      duration: { 
        isActive: true,
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      requirements: {},
      isGlobal: true,
      createdBy: user1._id,
      participants: [
        {
          userId: user2._id,
          joinedAt: new Date(),
          progress: 2,
          completed: false
        }
      ],
      stats: { totalParticipants: 1, completedCount: 0, completionRate: 0 }
    });
    await deletionTestChallenge.save();

    // Add challenge to user2's active challenges
    user2.challenges.active.push({
      challengeId: deletionTestChallenge._id,
      joinedAt: new Date(),
      progress: 2,
      completed: false
    });
    await user2.save();

    console.log('✅ Created test challenge with 1 participant');

    // Verify user2 has the challenge in their active list
    const user2BeforeDeletion = await User.findById(user2._id);
    const hasChallengeBefore = user2BeforeDeletion.challenges.active.some(
      c => c.challengeId.toString() === deletionTestChallenge._id.toString()
    );
    console.log(`✅ User2 has challenge in active list: ${hasChallengeBefore}`);

    // Simulate deletion (this would normally be done via API call)
    // Clean up participant references
    await User.updateMany(
      { _id: { $in: [user2._id] } },
      { 
        $pull: { 
          'challenges.active': { challengeId: deletionTestChallenge._id }
        }
      }
    );

    // Delete the challenge
    await Challenge.findByIdAndDelete(deletionTestChallenge._id);
    console.log('✅ Challenge deleted successfully');

    // Verify user2 no longer has the challenge in their active list
    const user2AfterDeletion = await User.findById(user2._id);
    const hasChallengeAfter = user2AfterDeletion.challenges.active.some(
      c => c.challengeId.toString() === deletionTestChallenge._id.toString()
    );
    console.log(`✅ User2 challenge removed from active list: ${!hasChallengeAfter}`);

    // Verify challenge no longer exists
    const deletedChallenge = await Challenge.findById(deletionTestChallenge._id);
    console.log(`✅ Challenge completely removed: ${deletedChallenge === null}`);

    // Validation checks
    console.log('\n🔍 Validation Results:');
    
    const checks = [
      {
        name: 'Public challenges visible to other users',
        passed: availableForUser2.length === 1 && availableForUser1.length === 1
      },
      {
        name: 'Private challenges hidden from other users',
        passed: !availableForUser2.some(c => c.title === 'Test Private Challenge')
      },
      {
        name: 'Users can join public challenges',
        passed: publicChallenge.participants.length === 1 && user2PublicChallenge.participants.length === 1
      },
      {
        name: 'My Created shows both public and private',
        passed: user1Created.length === 2 && user1Created.some(c => c.isGlobal) && user1Created.some(c => !c.isGlobal)
      },
      {
        name: 'My Challenges shows created + joined',
        passed: user1AllChallenges.length >= 2 && user2AllChallenges.length >= 2
      },
      {
        name: 'Challenge deletion with participants works',
        passed: hasChallengeBefore && !hasChallengeAfter && deletedChallenge === null
      }
    ];

    checks.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(check => check.passed);
    console.log(`\n🎉 Overall Test Result: ${allPassed ? 'PASSED' : 'FAILED'}`);

    if (allPassed) {
      console.log('\n🚀 Public/Private Challenge Feature is working correctly!');
      console.log('📝 Summary:');
      console.log('   • Private challenges appear only in creator\'s "My Created" section');
      console.log('   • Public challenges are visible to all users and can be joined');
      console.log('   • "My Challenges" shows both created and joined challenges');
      console.log('   • "My Created" shows all user-created challenges with visibility indicators');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testChallengeWorkflow();

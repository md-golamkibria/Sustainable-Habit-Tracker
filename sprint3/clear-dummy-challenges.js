const mongoose = require('mongoose');
const Challenge = require('./model/Challenge');
const User = require('./model/User');

async function clearDummyChallenges() {
  try {
    console.log('🧹 Clearing dummy challenges...\n');

    // Connect to MongoDB with proper async handling
    await mongoose.connect('mongodb://localhost:27017/sustainable_habits', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find challenges without proper createdBy field or with 'system' as creator
    const dummyChallenges = await Challenge.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null },
        { createdBy: 'system' },
        { createdBy: '' }
      ]
    });

    console.log(`Found ${dummyChallenges.length} dummy challenges to remove:`);
    dummyChallenges.forEach(challenge => {
      console.log(`  - ${challenge.title} (createdBy: ${challenge.createdBy || 'undefined'})`);
    });

    if (dummyChallenges.length > 0) {
      // Remove dummy challenges
      const result = await Challenge.deleteMany({
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: null },
          { createdBy: 'system' },
          { createdBy: '' }
        ]
      });

      console.log(`\n✅ Removed ${result.deletedCount} dummy challenges`);

      // Clean up user challenge references
      const users = await User.find({});
      let updatedUsers = 0;

      for (const user of users) {
        if (user.challenges && user.challenges.active) {
          const originalCount = user.challenges.active.length;
          
          // Remove references to deleted challenges
          user.challenges.active = user.challenges.active.filter(uc => {
            return !dummyChallenges.some(dc => dc._id.toString() === uc.challengeId.toString());
          });

          if (user.challenges.active.length !== originalCount) {
            await user.save();
            updatedUsers++;
            console.log(`  - Cleaned up challenge references for user: ${user.username}`);
          }
        }
      }

      if (updatedUsers > 0) {
        console.log(`\n✅ Updated ${updatedUsers} users' challenge references`);
      }
    } else {
      console.log('\n✅ No dummy challenges found - database is clean!');
    }

    // Show remaining challenges
    const remainingChallenges = await Challenge.find({})
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    console.log(`\n📋 Remaining challenges (${remainingChallenges.length}):`);
    remainingChallenges.forEach(challenge => {
      const creator = challenge.createdBy?.username || 'Unknown';
      const visibility = challenge.isGlobal ? 'Public' : 'Private';
      console.log(`  - ${challenge.title} by ${creator} (${visibility})`);
    });

    console.log('\n🎉 Dummy challenge cleanup completed!');

  } catch (error) {
    console.error('❌ Error clearing dummy challenges:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearDummyChallenges();

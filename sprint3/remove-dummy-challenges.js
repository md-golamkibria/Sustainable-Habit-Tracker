const mongoose = require('mongoose');
const Challenge = require('./model/Challenge');

async function removeDummyChallenges() {
  try {
    console.log('🧹 Removing dummy challenges...');
    
    await mongoose.connect('mongodb://localhost:27017/sustainable_habits');
    console.log('Connected to database');

    // First, show all current challenges
    const allChallenges = await Challenge.find({}).populate('createdBy', 'username');
    console.log(`\n📋 Current challenges in database: ${allChallenges.length}`);
    allChallenges.forEach(c => {
      console.log(`  - ${c.title} | createdBy: ${c.createdBy?.username || c.createdBy || 'UNDEFINED'} | isGlobal: ${c.isGlobal}`);
    });

    // Remove challenges that are dummy/system challenges
    const result = await Challenge.deleteMany({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null },
        { createdBy: 'system' },
        { createdBy: '' },
        // Also remove challenges with titles that match the dummy ones
        { title: 'Plastic-Free Week' },
        { title: 'Daily Bike Commute' },
        { title: 'Zero Food Waste Month' },
        { title: 'Water Conservation Challenge' },
        { title: 'Green Commute Challenge' }
      ]
    });

    console.log(`\n✅ Removed ${result.deletedCount} dummy challenges`);

    // Show remaining challenges
    const remaining = await Challenge.find({}).populate('createdBy', 'username');
    console.log(`\n📋 Remaining challenges: ${remaining.length}`);
    remaining.forEach(c => {
      console.log(`  - ${c.title} by ${c.createdBy?.username || 'Unknown'} (${c.isGlobal ? 'Public' : 'Private'})`);
    });

    if (remaining.length === 0) {
      console.log('\n🎉 Database is now clean! No dummy challenges remaining.');
      console.log('💡 Create some challenges through the UI to test the system.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

removeDummyChallenges();

const mongoose = require('mongoose');
const Challenge = require('./model/Challenge');

async function deleteAllChallenges() {
  try {
    console.log('🗑️ Deleting ALL challenges from database...');
    
    await mongoose.connect('mongodb://localhost:27017/sustainable_habits');
    console.log('Connected to database');

    // Delete ALL challenges
    const result = await Challenge.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} challenges`);

    // Verify database is empty
    const remaining = await Challenge.find({});
    console.log(`📋 Remaining challenges: ${remaining.length}`);

    console.log('\n🎉 Database is now completely clean!');
    console.log('💡 Only user-created challenges will appear from now on.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

deleteAllChallenges();

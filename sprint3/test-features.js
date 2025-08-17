// Simple test script to verify new features are working
const axios = require('axios');

const baseURL = 'http://localhost:5002';

async function testFeatures() {
  console.log('🧪 Testing New Features...\n');

  try {
    // Test 1: Compare API
    console.log('1. Testing Compare API...');
    try {
      const compareResponse = await axios.get(`${baseURL}/api/compare/search?query=test`);
      console.log('✅ Compare API: Working');
    } catch (error) {
      console.log('❌ Compare API: Error -', error.response?.status || error.message);
    }

    // Test 2: Enhanced Ranking API
    console.log('2. Testing Enhanced Ranking API...');
    try {
      const rankingResponse = await axios.get(`${baseURL}/api/ranking/leaderboard?category=overall`);
      console.log('✅ Enhanced Ranking API: Working');
    } catch (error) {
      console.log('❌ Enhanced Ranking API: Error -', error.response?.status || error.message);
    }

    // Test 3: Enhanced Events API
    console.log('3. Testing Enhanced Events API...');
    try {
      const eventsResponse = await axios.get(`${baseURL}/api/events/upcoming`);
      console.log('✅ Enhanced Events API: Working');
    } catch (error) {
      console.log('❌ Enhanced Events API: Error -', error.response?.status || error.message);
    }

    // Test 4: Educational Content API
    console.log('4. Testing Educational Content API...');
    try {
      const educationResponse = await axios.get(`${baseURL}/api/educational/content`);
      console.log('✅ Educational Content API: Working');
    } catch (error) {
      console.log('❌ Educational Content API: Error -', error.response?.status || error.message);
    }

    console.log('\n🎉 Feature testing completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start your servers: npm run dev');
    console.log('2. Navigate to: http://localhost:3000');
    console.log('3. Login and click "New Features" in the navbar');
    console.log('4. Test each feature tab in the NewFeaturesHub');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure your server is running on port 5002');
  }
}

// Run tests
testFeatures();

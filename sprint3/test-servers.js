#!/usr/bin/env node

const axios = require('axios');

async function testServers() {
  console.log('🧪 Testing Sprint 3 servers...\n');
  
  // Test backend server
  try {
    console.log('Testing backend server (localhost:5002)...');
    const backendResponse = await axios.get('http://localhost:5002/', { timeout: 5000 });
    if (backendResponse.status === 200) {
      console.log('✅ Backend server is running and responding');
    }
  } catch (error) {
    console.log('❌ Backend server issue:', error.code || error.message);
  }
  
  // Test frontend server
  try {
    console.log('\nTesting frontend server (localhost:3000)...');
    const frontendResponse = await axios.get('http://localhost:3000/', { timeout: 5000 });
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend server is running and responding');
    }
  } catch (error) {
    console.log('❌ Frontend server issue:', error.code || error.message);
  }
  
  // Test specific API endpoints
  try {
    console.log('\nTesting API endpoints...');
    
    // Test that API endpoints return proper error for unauthenticated requests
    const apiTests = [
      '/api/user/profile',
      '/api/actions/list',
      '/api/goals/',
      '/api/challenges/my-challenges'
    ];
    
    for (const endpoint of apiTests) {
      try {
        await axios.get(`http://localhost:5002${endpoint}`, { timeout: 3000 });
        console.log(`⚠️  ${endpoint}: Expected authentication error but got success`);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log(`✅ ${endpoint}: Correctly requires authentication`);
        } else {
          console.log(`❌ ${endpoint}: Unexpected error - ${error.code || error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ API testing failed:', error.message);
  }
  
  console.log('\n🏁 Server testing complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Register or log in to test the application');
  console.log('3. Try the dashboard, analytics, actions, goals, and challenges features');
}

// Run the tests
testServers().catch(console.error);

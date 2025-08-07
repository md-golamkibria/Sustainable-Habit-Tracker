const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing database connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Disable buffering to prevent timeout issues
mongoose.set('bufferCommands', false);

async function testConnection() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Try to access the User model
    const User = require('./model/User');
    console.log('🔍 Testing User.findOne...');
    
    const user = await User.findOne({ username: 'testuser' });
    console.log('✅ User found:', user ? user.username : 'No user found');
    
    mongoose.connection.close();
    console.log('✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testConnection();

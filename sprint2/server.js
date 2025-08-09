const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./shared/database/connection');

require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true // Allow credentials (cookies)
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Changed to false for security
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true, // Prevent XSS attacks
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax' // CSRF protection
  }
}));

// Routes
app.use('/', require('./controller/authController'));
app.use('/user', require('./controller/userController'));
app.use('/actions', require('./controller/actionController'));
app.use('/analytics', require('./controller/analyticsController'));
app.use('/challenges', require('./controller/challengeController'));
app.use('/goals', require('./controller/goalController'));
const educationalController = require('./controller/educationalController');
app.use('/educational', educationalController());

// Scheduled tasks
// Reset daily challenges at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily challenge reset...');
  try {
    const Challenge = require('./model/Challenge');
    await Challenge.updateMany(
      { type: 'daily', isActive: true },
      { $set: { 'participants.$[].completed': false, 'participants.$[].progress': 0 } }
    );
    console.log('Daily challenges reset successfully');
  } catch (error) {
    console.error('Error resetting daily challenges:', error);
  }
});

// Reset weekly challenges on Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
  console.log('Running weekly challenge reset...');
  try {
    const Challenge = require('./model/Challenge');
    await Challenge.updateMany(
      { type: 'weekly', isActive: true },
      { $set: { 'participants.$[].completed': false, 'participants.$[].progress': 0 } }
    );
    console.log('Weekly challenges reset successfully');
  } catch (error) {
    console.error('Error resetting weekly challenges:', error);
  }
});

const PORT = 5002;

app.listen(PORT, () => {
  console.log(`🚀 Sprint 2 Server running on port ${PORT}`);
  console.log(`📊 Enhanced with analytics, challenges, and goal tracking!`);
});

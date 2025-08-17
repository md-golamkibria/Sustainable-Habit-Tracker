const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

require('dotenv').config();

// Disable buffering globally before any models are loaded
mongoose.set('bufferCommands', false);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline styles for development
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Basic middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// Sprint 3 Enhanced Scheduled Tasks

// Update leaderboards and rankings every hour
cron.schedule('0 * * * *', async () => {
  console.log('Updating leaderboards and rankings...');
  try {
    const User = require('./model/User');
    const Ranking = require('./model/Ranking');
    const Goal = require('./model/Goal');
    const Action = require('./model/Action');
    
    // Update user rankings based on recent activity
    const users = await User.find({ isActive: true });
    
    for (const user of users) {
      // Calculate user statistics
      const completedGoals = await Goal.countDocuments({ 
        user: user._id, 
        status: 'completed' 
      });
      
      const completedActions = await Action.countDocuments({ 
        user: user._id, 
        status: 'completed' 
      });
      
      // Calculate sustainability score based on actions and goals
      const sustainabilityScore = (completedGoals * 10) + (completedActions * 2);
      
      // Update or create ranking
      await Ranking.findOneAndUpdate(
        { user: user._id, category: 'overall' },
        {
          totalGoalsCompleted: completedGoals,
          totalActionsCompleted: completedActions,
          sustainabilityScore,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }
    
    // Assign ranks based on sustainability score
    const rankings = await Ranking.find({ category: 'overall' })
      .sort({ sustainabilityScore: -1 });
    
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      const newRank = i + 1;
      const rankChange = ranking.rank === 0 ? 'new' : 
        newRank < ranking.rank ? 'up' : 
        newRank > ranking.rank ? 'down' : 'same';
      
      await Ranking.findByIdAndUpdate(ranking._id, {
        previousRank: ranking.rank,
        rank: newRank,
        rankChange
      });
    }
    
    console.log('Leaderboards and rankings updated successfully');
  } catch (error) {
    console.error('Error updating leaderboards and rankings:', error);
  }
});

// Send reminder notifications every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Sending daily reminders...');
  try {
    const User = require('./model/User');
    const users = await User.find({ 
      'settings.notifications.dailyReminders': true,
      lastActionDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    for (const user of users) {
      // This would send notifications via the notification system
      console.log(`Reminder sent to user: ${user.username}`);
    }
    console.log('Daily reminders sent successfully');
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
});

// Weekly community stats update (Sunday at 1 AM)
cron.schedule('0 1 * * 0', async () => {
  console.log('Updating weekly community stats...');
  try {
    const Action = require('./model/Action');
    const User = require('./model/User');
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weeklyStats = await Action.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: null,
          totalActions: { $sum: 1 },
          totalCO2Saved: { $sum: '$co2Saved' },
          totalWaterSaved: { $sum: '$waterSaved' }
        }
      }
    ]);
    
    console.log('Weekly community stats updated:', weeklyStats[0]);
  } catch (error) {
    console.error('Error updating community stats:', error);
  }
});

const PORT = process.env.PORT || 5002;

// Direct database connection function
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Async startup function
async function startServer() {
  try {
    // Connect to database first
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully!');
    
    // Set up session middleware after DB connection
    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
      }),
      cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
      }
    }));
    
    // Set up routes after DB connection (use /api prefix for Sprint 3)
    app.use('/api/auth', require('./controller/authController'));
    app.use('/api/user', require('./controller/userController'));
    app.use('/api/actions', require('./controller/actionController'));
    app.use('/api/analytics', require('./controller/analyticsController'));
    app.use('/api/challenges', require('./controller/challengeController'));
    app.use('/api/goals', require('./controller/goalController'));
    // Sprint 3 new routes
    app.use('/api/social', require('./controller/socialController'));
    app.use('/api/leaderboard', require('./controller/leaderboardController'));
    app.use('/api/rewards', require('./controller/rewardsController'));
    app.use('/api/community', require('./controller/communityController'));
    app.use('/api/notifications', require('./controller/notificationsController'));
    app.use('/api/sharing', require('./controller/sharingController'));
    app.use('/api/educational', require('./controller/educationalController'));
    // New enhanced features routes
    app.use('/api/compare', require('./controller/compareController'));
    app.use('/api/ranking', require('./controller/enhancedRankingController'));
    app.use('/api/events', require('./controller/enhancedEventsController'));
    // New features routes
    app.use('/api', require('./routes/newFeatures'));
    
    // Direct logout route for frontend compatibility
    app.post('/api/logout', async (req, res) => {
      try {
        if (req.session.userId) {
          const User = require('./model/User');
          await User.findByIdAndUpdate(req.session.userId, {
            'activity.isOnline': false,
            'activity.lastActive': new Date()
          });
        }
        
        req.session.destroy((err) => {
          if (err) return res.status(500).json({ message: 'Logout error', error: err });
          res.json({ message: 'Successfully logged out' });
        });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    });
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Sprint 3 Complete Sustainable Habit Tracker running on port ${PORT}`);
      console.log(`🌟 Full-featured with social features, gamification, leaderboards, and real-time updates!`);
      console.log(`🔗 Socket.io enabled for real-time features`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

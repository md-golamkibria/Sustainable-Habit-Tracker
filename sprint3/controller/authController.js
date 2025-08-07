const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../model/User');
const Notification = require('../model/Notification');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username: username.trim() }, { email: email.trim() }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({ 
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword
    });
    await newUser.save();

    // Create welcome notification
    await Notification.createNotification({
      recipient: newUser._id,
      type: 'daily_reminder',
      title: 'Welcome to Sustainable Habit Tracker!',
      message: 'Start your journey towards a more sustainable lifestyle. Complete your first challenge to earn rewards!',
      data: {},
      priority: 'medium'
    });

    req.session.userId = newUser._id;
    res.json({ 
      message: 'Registration successful', 
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        level: newUser.gamification.level
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    console.info('Attempting login for user:', username);
    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username: username.trim() }, { email: username.trim() }] 
    });
    
    if (!user) {
      console.warn('Invalid login attempt, user not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.warn('Invalid login attempt, wrong password:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.info('Password check passed for user:', username);

    // Initialize user activity if doesn't exist
    if (!user.activity) {
      user.activity = { lastActive: new Date(), isOnline: true };
    } else {
      user.activity.lastActive = new Date();
      user.activity.isOnline = true;
    }
    
    // Initialize gamification if doesn't exist
    if (!user.gamification) {
      user.gamification = { level: 1, experience: 0, points: 0, badges: [], achievements: [] };
    }
    
    // Initialize stats if doesn't exist
    if (!user.stats) {
      user.stats = {
        totalActions: 0,
        totalCO2Saved: 0,
        totalWaterSaved: 0,
        currentStreak: 0,
        longestStreak: 0
      };
    }

    await user.save();
    console.info('User data updated successfully');

    // Save session
    req.session.userId = user._id;
    
    // Simplified response without session.save callback
    res.json({ 
      message: 'Login successful', 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.username, // Add name field for frontend compatibility
        level: user.gamification?.level || 1,
        experience: user.gamification?.experience || 0,
        badges: user.gamification?.badges || [],
        achievements: user.gamification?.achievements || [],
        stats: user.stats || {}
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    if (req.session.userId) {
      // Update user offline status
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

// Debug route to check if user exists (remove in production)
router.get('/check-user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ 
      $or: [{ username: username.trim() }, { email: username.trim() }] 
    });
    
    if (user) {
      res.json({ 
        exists: true, 
        username: user.username, 
        email: user.email,
        hasPassword: !!user.password
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const User = require('../model/User');
const { generateUserId } = require('../shared/utils/helpers');

const router = express.Router();

// Create a new user with username only or login existing user
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    // Check if user already exists
    let existingUser = await User.findOne({ username: username.trim() });
    
    if (existingUser) {
      // User exists, just log them in
      req.session.userId = existingUser.userId;
      res.json({ message: 'Login successful', userId: existingUser.userId });
    } else {
      // Create new user
      const userId = generateUserId();
      const newUser = new User({ userId, username: username.trim() });
      await newUser.save();

      req.session.userId = userId;
      res.json({ message: 'Account created and login successful', userId });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout error', error: err });
    res.json({ message: 'Successfully logged out' });
  });
});

module.exports = router;

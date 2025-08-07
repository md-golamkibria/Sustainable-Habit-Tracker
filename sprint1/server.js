const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

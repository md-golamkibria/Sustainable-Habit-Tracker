const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');

// Create test app
const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
}));

// Mock the auth controller
const mockAuthRoutes = require('../controller/authController');
app.use('/', mockAuthRoutes);

// Mock database connection
jest.mock('../shared/database/connection', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock User model
jest.mock('../model/User', () => {
  const mongoose = require('mongoose');
  const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    totalCO2Saved: { type: Number, default: 0 },
    totalWaterSaved: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActionDate: Date
  });
  return mongoose.model('User', UserSchema);
});

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/sprint2_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    const User = require('../model/User');
    await User.deleteMany({});
  });

  describe('POST /register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    test('should not register user with existing email', async () => {
      // First create a user
      const User = require('../model/User');
      await User.create({
        username: 'existinguser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const res = await request(app)
        .post('/register')
        .send({
          username: 'newuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser'
          // Missing email and password
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /login', () => {
    test('should login with valid credentials', async () => {
      // Create a test user
      const User = require('../model/User');
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$hashedpassword' // Mock hashed password
      });

      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /logout', () => {
    test('should logout successfully', async () => {
      const res = await request(app)
        .get('/logout');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});

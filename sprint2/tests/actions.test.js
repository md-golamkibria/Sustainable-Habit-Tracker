const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Action = require('../model/Action');

// Create test app
const app = express();
app.use(express.json());

// Mock the action controller
const actionController = require('../controller/actionController');
app.use('/actions', actionController);

describe('Actions API Endpoints', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sprint2_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Action.deleteMany({});
  });

  describe('GET /actions', () => {
    test('should return empty array when no actions', async () => {
      const res = await request(app).get('/actions');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('should return all actions for a user', async () => {
      const mockActions = [
        {
          userId: 'user123',
          actionType: 'biking',
          description: 'Rode bike to work',
          quantity: 5,
          unit: 'km',
          impact: { co2Saved: 2.5, waterSaved: 0 }
        },
        {
          userId: 'user123',
          actionType: 'recycling',
          description: 'Recycled plastic bottles',
          quantity: 10,
          unit: 'items',
          impact: { co2Saved: 1.2, waterSaved: 5 }
        }
      ];

      await Action.insertMany(mockActions);

      const res = await request(app)
        .get('/actions')
        .set('userId', 'user123');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('actionType', 'biking');
    });
  });

  describe('POST /actions', () => {
    test('should create a new action', async () => {
      const newAction = {
        actionType: 'walking',
        description: 'Walked to the store',
        quantity: 2,
        unit: 'km',
        notes: 'Great exercise!'
      };

      const res = await request(app)
        .post('/actions')
        .set('userId', 'user123')
        .send(newAction);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.actionType).toBe('walking');
      expect(res.body.impact.co2Saved).toBeGreaterThan(0);
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/actions')
        .set('userId', 'user123')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('should calculate environmental impact correctly', async () => {
      const action = {
        actionType: 'biking',
        description: 'Bike ride',
        quantity: 10,
        unit: 'km'
      };

      const res = await request(app)
        .post('/actions')
        .set('userId', 'user123')
        .send(action);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.impact.co2Saved).toBeCloseTo(5.0, 1); // 10km * 0.5kg/km
    });
  });

  describe('GET /actions/analytics', () => {
    test('should return analytics data', async () => {
      const mockActions = [
        {
          userId: 'user123',
          actionType: 'biking',
          description: 'Bike ride',
          quantity: 10,
          unit: 'km',
          impact: { co2Saved: 5, waterSaved: 0 },
          date: new Date('2024-01-01')
        },
        {
          userId: 'user123',
          actionType: 'recycling',
          description: 'Recycling',
          quantity: 5,
          unit: 'items',
          impact: { co2Saved: 0.6, waterSaved: 2.5 },
          date: new Date('2024-01-02')
        }
      ];

      await Action.insertMany(mockActions);

      const res = await request(app)
        .get('/actions/analytics')
        .set('userId', 'user123');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalCO2Saved', 5.6);
      expect(res.body).toHaveProperty('totalWaterSaved', 2.5);
      expect(res.body).toHaveProperty('actionsByType');
    });
  });

  describe('DELETE /actions/:id', () => {
    test('should delete an action', async () => {
      const action = await Action.create({
        userId: 'user123',
        actionType: 'walking',
        description: 'Test walk',
        quantity: 1,
        unit: 'km'
      });

      const res = await request(app)
        .delete(`/actions/${action._id}`)
        .set('userId', 'user123');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Action deleted successfully');
    });

    test('should return 404 for non-existent action', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/actions/${fakeId}`)
        .set('userId', 'user123');
      
      expect(res.statusCode).toBe(404);
    });
  });
});

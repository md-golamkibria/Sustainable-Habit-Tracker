const mongoose = require('mongoose');
const express = require('express');
const Action = require('../model/Action');
const User = require('../model/User');

// Global test setup
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sprint2_test';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global error handling for unhandled promises
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

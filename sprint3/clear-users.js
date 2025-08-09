require('dotenv').config();
const mongoose = require('mongoose');

const clearUsers = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in your .env file.');
    process.exit(1);
  }

  try {
    console.log('Connecting to your database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected.');

    console.log('Attempting to drop the "users" collection...');
    const collections = await mongoose.connection.db.listCollections({name: 'users'}).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection('users');
      console.log('Successfully dropped the "users" collection.');
    } else {
      console.log('"users" collection not found, nothing to drop.');
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

clearUsers();
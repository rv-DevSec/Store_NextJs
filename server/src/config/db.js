const mongoose = require('mongoose');
const config = require('./index');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }
    console.error('All MongoDB connection attempts failed. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;

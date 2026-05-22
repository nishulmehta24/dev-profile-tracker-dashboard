const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devpulse');
    console.log(`🚀 MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not crash the server in dev mode so the frontend can still interact with status ping
    console.warn('⚠️ Server will operate in Offline Fallback Mode until database is connected.');
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gurukripa_estate';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
  console.log(`[db] connected -> ${uri}`);
}

module.exports = connectDB;

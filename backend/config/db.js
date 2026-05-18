const mongoose = require('mongoose');

function getMongoUri() {
  // Default local dev string; override via .env if you want.
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telecom_intel';
}

module.exports = async function connectDB() {
  const uri = getMongoUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true
  });
  return mongoose.connection;
};


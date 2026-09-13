const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_this_to_a_long_random_secret') {
      throw new Error('يجب ضبط JWT_SECRET بقيمة سرية قوية قبل تشغيل الخادم');
    }
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elsafeer_pos';
    const dbName = process.env.MONGO_DB_NAME || 'elsafeer_pos';
    await mongoose.connect(uri, { dbName });
    console.log(`MongoDB connected to database: ${dbName}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

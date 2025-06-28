import mongoose from 'mongoose';
import { ENV_VARS } from '../config/env.config.js'; // Import ENV_VARS
import Chapter from '../models/chapter.model.js';

const migrateChapters = async () => {
  try {
    // Kết nối đến MongoDBMONGO_URI: process.env.MONGO_URI
    await mongoose.connect(ENV_VARS.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Thêm trường audios vào tất cả bản ghi Chapter
    await Chapter.updateMany({}, { $set: { audios: [] } });
    console.log('Migration completed: Added audios field to Chapters');

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1); // Thoát với mã lỗi
  }
};

migrateChapters();
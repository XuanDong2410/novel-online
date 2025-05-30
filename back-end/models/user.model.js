import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 50,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    required: false,
    maxLength: 500,
  },
  bio: {
    type: String,
    maxLength: 500,
  },
  lastLogin: {
    type: Date,
  },
  // Truyện đã đăng
  uploadedNovels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
  }],

  // Báo cáo đã gửi
  reportsMade: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
  }],

  // Kháng cáo đã gửi
  appeals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appeal",
  }],
  // Lịch sử tìm kiếm truyện
  searchHistory: [{
    query: {
      type: String,
      maxLength: 200
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
  }],

  // Các truyện đã yêu thích
  favoriteNovels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
  }],
  // Lịch sử đánh giá truyện
  ratedNovels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rate",
  }],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification', // Tham chiếu đến collection Notification
  }],
  // Lưu trạng thái thông báo đã xem
  notificationSeenAt: {
    type: Date,
    default: null
  },

  // Thống kê tóm tắt
  statistics: {
    totalUploaded: { type: Number, default: 0, min: 0 },
    totalReports: { type: Number, default: 0, min: 0 },
    totalAppeals: { type: Number, default: 0, min: 0 },
    totalLikesReceived: { type: Number, default: 0, min: 0 },
  }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;

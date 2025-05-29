import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    required: true
  },

  // Truyện đã đăng
  uploadedNovels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    default: []
  }],

  // Báo cáo đã gửi
  reportsMade: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    default: []
  }],

  // Kháng cáo đã gửi
  appeals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appeal",
    default: []
  }],
  // Lịch sử tìm kiếm truyện
  searchHistory: {
    type: [String], // hoặc [mongoose.Schema.Types.ObjectId] nếu lưu ID truyện
    default: []
  },

  // Các truyện đã yêu thích
  favoriteNovels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    default: []
  }],
  // Lịch sử đánh giá truyện
  ratedNovels: [{
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novel"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Lưu trạng thái thông báo đã xem
  notificationSeenAt: {
    type: Date,
    default: null
  },

  // Thống kê tóm tắt
  statistics: {
    totalUploaded: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },
    totalAppeals: { type: Number, default: 0 },
    totalLikesReceived: { type: Number, default: 0 },
  }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;

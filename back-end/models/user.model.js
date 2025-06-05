import mongoose from "mongoose";
import { handleViolationThreshold } from "../utils/moderation/moderationActionHandler.js";
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
    enum: ['user', 'moderator', 'admin', 'system'],
    default: 'user',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
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
  violation: {
      userReports: {
        type: Number,
        default: 0,
        min: 0,
      },
      modConfirmed: {
        type: Boolean,
        default: false,
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      }
  },
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
    totalFavoriteNovels: { type: Number, default: 0, min: 0 },
  }

}, { timestamps: true });
userSchema.pre("save", function (next) {
  if (this.isModified("uploadedNovels")) {
    this.statistics.totalUploaded = this.uploadedNovels.length;
  }
  if (this.isModified("reportsMade")) {
    this.statistics.totalReports = this.reportsMade.length;
  }
  if (this.isModified("appeals")) {
    this.statistics.totalAppeals = this.appeals.length;
  }
  if (this.isModified("favoriteNovels")) {
    this.statistics.totalFavoriteNovels = this.favoriteNovels.length;
  }
  next();
});

// Middleware post-save để kiểm tra violationCount
userSchema.post("save", async function (doc, next) {
  try {
    if (doc.violation.count > 0) { // Chỉ kiểm tra nếu violationCount đã tăng
      const result = await handleViolationThreshold(doc._id, doc.violation.count);
      if (!result.success) {
        console.error("Lỗi khi kiểm tra ngưỡng vi phạm:", result.error);
      }
    }
    next();
  } catch (error) {
    console.error("Lỗi trong middleware post-save:", error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;

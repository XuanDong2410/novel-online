import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  chapterNumber: {
    type: Number,
    required: false,
  },
  audioFileUrl: {
    type: String,
    required: true,
  },
  subtitleFileUrl: {
    type: String,
    required: false,
  },
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },

  // ✅ Trạng thái kiểm duyệt
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  moderationHistory: [{
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: String, // "approved", "rejected", "edited"
    note: String,
    date: {
      type: Date,
      default: Date.now,
    }
  }],

  // ✅ Báo cáo vi phạm
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  }],

  // ✅ Gắn cờ bởi AI
  aiViolationFlag: {
    type: Boolean,
    default: false,
  },
  aiViolationDetails: {
    type: String,
  },

  // ✅ Thống kê
  viewCount: {
    type: Number,
    default: 0,
  },
  averageListenTime: {
    type: Number,
    default: 0, // đơn vị giây, hoặc phút
  }
}, {
  timestamps: true,
});
const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
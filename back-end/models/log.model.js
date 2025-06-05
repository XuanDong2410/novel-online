import mongoose from 'mongoose';
import { MODERATION_ACTIONS } from "../utils/moderation/constants/action.js";

const moderationLogSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel',
    required: true,
    index: true,
    validate: {
      validator: (v) => mongoose.isValidObjectId(v),
      message: "novelId phải là ObjectId hợp lệ",
    },
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    index: true,
    validate: {
      validator: (v) => v == null || mongoose.isValidObjectId(v),
      message: "chapterId phải là ObjectId hợp lệ hoặc null",
    },
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: (v) => v == null || mongoose.isValidObjectId(v),
      message: "moderator phải là ObjectId hợp lệ hoặc null",
    },
  },
  action: {
    type: String,
    enum: Object.values(MODERATION_ACTIONS),
    required: true,
  },
  note: {
    type: String,
    maxLength: 1000,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Hỗ trợ lưu object
    default: null, // Chi tiết vi phạm, ví dụ: từ aiViolationDetails
    maxLength: 5000,
  },
  isSystemAction: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// Middleware kiểm tra kích thước details
moderationLogSchema.pre('save', function (next) {
  if (this.details && JSON.stringify(this.details).length > 5000) {
    return next(new Error('Chi tiết vượt quá giới hạn 5000 ký tự'));
  }
  next();
});
const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);
export default ModerationLog;
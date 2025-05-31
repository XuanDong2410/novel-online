import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel',
    required: true,
    index: true,
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    index: true,
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    enum: ['flagged', 'rejected', 'reported', 'appealed'],
    required: true,
  },
  note: {
    type: String,
    maxlength: 1000,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Hỗ trợ lưu object
    default: null, // Chi tiết vi phạm, ví dụ: từ aiViolationDetails
    maxlength: 3000,
  }
}, { timestamps: true });

// Middleware kiểm tra kích thước details
moderationLogSchema.pre('save', function (next) {
  if (this.details && JSON.stringify(this.details).length > 3000) {
    return next(new Error('Chi tiết vượt quá giới hạn 3000 ký tự'));
  }
  next();
});
const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);
export default ModerationLog;
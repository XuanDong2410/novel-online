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
    type: String, // Chi tiết vi phạm, ví dụ: từ aiViolationDetails
    maxlength: 1000,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);
export default ModerationLog;
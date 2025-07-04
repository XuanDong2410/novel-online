import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporter: {  // Người gửi báo cáo
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  targetType: { // Loại đối tượng bị báo cáo: 'rate', 'novel', 'chapter' ...
    type: String,
    required: true,
    enum: ["Rate", "Novel", "Chapter"]
  },
  targetId: {  // ID của đối tượng bị báo cáo
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "targetType" // Tự động tham chiếu đến model dựa trên targetType
  },
  reason: {   // Lý do báo cáo (bắt buộc)
    type: String,
    required: true,
    maxLength: 500
  },
  status: {  // Trạng thái xử lý báo cáo
    type: String,
    enum: ["pending", "reviewed", "rejected"],
    default: "pending"
  },
  moderator: { // Người kiểm duyệt xử lý báo cáo
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  handledAt: {  // Thời gian xử lý
    type: Date
  },
  note: { // Ghi chú khi xử lý
    type: String,
    maxLength: 1000
  }
}, { timestamps: true });

reportSchema.index({ reporter: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;

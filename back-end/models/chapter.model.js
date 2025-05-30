import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200, // Giới hạn độ dài tiêu đề
    index: true, // Tạo chỉ mục cho trường title để tăng tốc độ truy vấn
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000000, // Giới hạn độ dài nội dung chương
  },
  contentUrl: {
    type: String,
    required: true, // URL của nội dung chương, có thể là file hoặc trang web
  },
  chapterNumber: {
    type: Number,
    required: false,
    min: 1, // Số chương phải lớn hơn hoặc bằng 1
  },
  audioFileUrl: {
    type: String,
    required: false,
  },
  subtitleFileUrl: {
    type: String,
    required: false,
  },
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
    index: true, // Tạo chỉ mục cho trường novelId để tăng tốc độ truy vấn
  },

  // ✅ Trạng thái kiểm duyệt
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true, // Tạo chỉ mục cho trường status để tăng tốc độ truy vấn
  },
  publishDate: {
    type: Date, // Ngày xuất bản 
  },
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
    maxlength: 1000, // Giới hạn độ dài mô tả vi phạm
  },

  // ✅ Thống kê
  viewCount: {
    type: Number,
    default: 0,
    min: 0, // Đảm bảo viewCount không âm
  },
  averageListenTime: {
    type: Number,
    default: 0, // đơn vị giây, hoặc phút
    min: 0, // Đảm bảo averageListenTime không âm
  }
}, {
  timestamps: true,
});

// Chỉ mục kết hợp để đảm bảo tính duy nhất của chapterNumber trong một novel
chapterSchema.index({ novelId: 1, chapterNumber: 1 }, { unique: true });

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
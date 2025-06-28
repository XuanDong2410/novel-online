import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 100000,
    },
    previousContent: {
      type: String,
      maxlength: 100000,
    },
    chapterNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    contentUrl: {
      type: String,
      required: false,
    },
    audioFileUrl: {
      type: String,
      required: false,
    },
    subtitleFileUrl: {
      type: String,
      required: false,
    },
    audios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Audio',
        required: false,
      },
    ],
    novelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Novel',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'editing', 'warning', 'approved', 'rejected', 'retracted'],
      default: 'draft',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishDate: {
      type: Date,
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
    moderation: {
      isModerating: {
        type: Boolean,
        default: false,
      },
      moderator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      lastModeratedAt: {
        type: Date,
        default: null,
      },
      lastModeratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    violation: {
      count: {
        violence: { type: Number, default: 0 },
        adult: { type: Number, default: 0 },
        hate_speech: { type: Number, default: 0 },
        self_harm: { type: Number, default: 0 },
        spam: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
      },
      aiFlag: {
        violence: { type: Boolean, default: false },
        adult: { type: Boolean, default: false },
        hate_speech: { type: Boolean, default: false },
        self_harm: { type: Boolean, default: false },
        spam: { type: Boolean, default: false }
      },
      details: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
          category: { type: String, required: true },
          severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
          title: { type: String, required: false }, // Thêm trường title
          description: { type: String, required: true },
          line: { type: Number, required: true },
          start: { type: Number, required: true },
          end: { type: Number, required: true },
          resolved: { type: Boolean, default: false },
          isManual: { type: Boolean, default: false } // Thêm trường isManual
        }
      ]
  },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageListenTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: [
      {
        content: { type: String, required: true },
        type: { type: String, enum: ['general', 'suggestion', 'error', 'praise'], default: 'general' },
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        line: { type: Number, min: 1 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

chapterSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isNew) { // Chỉ tính lại nếu content thay đổi hoặc là tài liệu mới
    if (this.content) {
      // Loại bỏ các thẻ HTML (nếu có) và khoảng trắng thừa, sau đó tách thành từ
      const cleanedContent = this.content.replace(/<[^>]*>/g, '').trim();
      this.wordCount = cleanedContent.split(/\s+/).filter(word => word.length > 0).length;
    } else {
      this.wordCount = 0;
    }
  }
  next();
});
chapterSchema.index({ novelId: 1, chapterNumber: 1 }, { unique: true });

const Chapter = mongoose.model('Chapter', chapterSchema);

export default Chapter;
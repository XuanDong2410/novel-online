import mongoose from 'mongoose';

const voiceSchema = new mongoose.Schema({
  languageCodes: {
    type: [String],
    required: true,
    default: ['vi-VN'],
  },
  name: {
    type: String,
    required: true,
  },
  ssmlGender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE', 'NEUTRAL'],
  },
  naturalSampleRateHertz: {
    type: Number,
    required: true,
    default: 24000,
  },
});

const audioSchema = new mongoose.Schema(
  {
    audioName: {
      type: String,
      required: true,
      trim: true,
    },
    audioFileUrl: {
      type: String,
      required: true,
    },
    audioFileType: {
      type: String,
      required: true,
      enum: ['MP3', 'WAV', 'OGG'],
      default: 'MP3',
    },
    duration: {
      type: Number, // Đơn vị: giây
      required: false,
    },
    size: {
      type: Number, // Đơn vị: bytes
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'error'],
      default: 'pending',
    },
    voice: {
      type: voiceSchema,
      required: true,
    },
    subtitle: {
      url: {
        type: String,
        required: false,
      },
      language: {
        type: String,
        required: false,
        default: 'vi-VN',
      },
      format: {
        type: String,
        enum: ['VTT', 'SRT'],
        default: 'VTT',
      },
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true, // Tạo chỉ mục để tối ưu truy vấn theo chapterId
    },
  },
  { timestamps: true }
);

// audioSchema.index({ chapterId: 1 });

const Audio = mongoose.model('Audio', audioSchema);

export default Audio;
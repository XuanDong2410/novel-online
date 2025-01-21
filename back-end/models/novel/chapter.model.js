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
}, {
  timestamps: true,
})

const Chapter = mongoose.model("Chapter", chapterSchema);

export default Chapter;
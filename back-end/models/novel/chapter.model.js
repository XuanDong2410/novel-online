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
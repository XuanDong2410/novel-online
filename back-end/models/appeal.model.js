import mongoose from "mongoose";

const appealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
  },
  actionType: {
    type: String,
    enum: ["reject", "warning", "flag", "hide"],
    required: true,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "deleted"],
    default: "pending",
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  responseMessage: {
    type: String,
    maxlength: 2000,
  },
  handledAt: {
    type: Date,
  }
}, { timestamps: true });

const Appeal = mongoose.model("Appeal", appealSchema);

export default Appeal;

import mongoose from "mongoose";

const rateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  novel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: true
  },
}, { timestamps: true });

const Rate = mongoose.model("Rate", rateSchema);
export default Rate;

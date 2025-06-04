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
  reports: [{ // Thêm trường reports
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
  }],
}, { timestamps: true });

// Index
rateSchema.index({ novel: 1 });
rateSchema.index({ user: 1, novel: 1 }, { unique: true });
rateSchema.index({ reports: 1 }); // Index cho reports

const Rate = mongoose.model("Rate", rateSchema);
export default Rate;

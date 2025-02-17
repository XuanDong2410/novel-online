import mongoose from "mongoose";

const voiceSchema = new mongoose.Schema({
    languageCodes: {
        type: [String],
        required: true,
        default: ["vi-VN"]
    },
    name: {
        type: String,
        required: true,
        default: "vi-VN-Wavenet-D"
    },
    ssmlGender: {
        type: String,
        required: true,
        enum: ["MALE", "FEMALE", "NEUTRAL"],
        default: "MALE"
    },
    naturalSampleRateHertz: {
        type: Number,
        required: true,
        default: 24000
    }
});

const audioSchema = new mongoose.Schema(
    {
        audioName: {
            type: String,
            required: true,
            trim: true
        },
        audioFileUrl: {
            type: String,
            required: true
        },
        audioFileType: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // đơn vị: giây
            required: false
        },
        size: {
            type: Number, // đơn vị: bytes
            required: false
        },
        status: {
            type: String,
            enum: ["pending", "processed", "error"],
            default: "pending"
        },
        voice: {
            type: voiceSchema,
            required: true
        }
    },
    { timestamps: true }
);

const Audio = mongoose.model("Audio", audioSchema);

export default Audio;

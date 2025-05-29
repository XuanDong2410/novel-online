import mongoose from "mongoose";

const novelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    author: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    genre: {
        type: [String],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rates: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        default: []
    }],

    // ✅ Thêm để quản lý và kiểm duyệt
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    moderator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    moderationHistory: [{
        moderator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        action: String, // e.g., "approved", "rejected", "hidden"
        note: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],

    // ✅ Thêm thống kê
    viewCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },

    // ✅ Gắn cờ bởi AI
    aiViolationFlag: {
        type: Boolean,
        default: false
    },
    aiViolationDetails: {
        type: String
    }
}, { timestamps: true });

const Novel = mongoose.model('Novel', novelSchema);
export default Novel;
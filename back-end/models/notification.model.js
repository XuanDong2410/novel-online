import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        default: null
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'favorite',
            'rate',
            'comment',
            'mention',
            'reply',
            'report',
            'novelUpdate',
            'userNotice',
            'adminNotice',
            'systemNotice',
        ]
    },
    message: {
        type: String,
        required: false,

    },
    read: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
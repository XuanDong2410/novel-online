import { text} from 'express';
import mongoose from 'mongoose';

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
        type: Array,
        default: [], // Array of strings
        required: true
    },
}, { timestamps: true });

const Novel = mongoose.model('Novel', novelSchema);

export default Novel;
import mongoose from "mongoose";

const AnnouncementScheme = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timeStamp: true });

export const Announcement = mongoose.model("Announcement", AnnouncementScheme);    

const TagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
}, { timeStamp: true });

export const Tag = mongoose.model("Tag", TagSchema);

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
}, { timeStamp: true})

export const Category = mongoose.model("Category", CategorySchema);
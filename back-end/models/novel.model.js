import mongoose from "mongoose";
const novelAttributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100, // Giới hạn độ dài tên thuộc tính
    },
    type: {
        type: String,
        required: true,
        enum: ['genre', 'subgenre', 'world', 'character', 'audience'],
        index: true // Tạo chỉ mục cho trường type để tăng tốc độ truy vấn
    },
    description: {
        type: String,
        maxlength: 500 // Giới hạn độ dài mô tả
    },
    isActive: {
        type: Boolean,
        default: true // Trạng thái hoạt động của thuộc tính
    }
}, { timestamps: true });

export const NovelAttribute = mongoose.model('NovelAttribute', novelAttributeSchema);

const novelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 200, // Giới hạn độ dài tiêu đề
        index: true // Tạo chỉ mục cho trường title để tăng tốc độ truy vấn
    },
    author: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100 // Giới hạn độ dài tên tác giả
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000 // Giới hạn độ dài mô tả
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Tạo chỉ mục cho trường createdBy để tăng tốc độ truy vấn
    },
     // ✅ Thêm để quản lý và kiểm duyệt
    statusPublish: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected'],
        default: 'draft',
        index: true // Tạo chỉ mục cho trường statusPublish để tăng tốc độ truy vấn
    },
    // Trang thái của truyện
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'hiatus'],
        default: 'ongoing'
    },
    attributes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NovelAttribute'
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }],
    isHidden: {
        type: Boolean,
        default: false
    },
    // ✅ Thêm thống kê
    viewCount: {
        type: Number,
        default: 0,
        min: 0 // Đảm bảo viewCount không âm
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5 // Đảm bảo giá trị của averageRating trong khoảng từ 0 đến 5
    },
    // ✅ Gắn cờ bởi AI
    aiViolationFlag: {
        type: Boolean,
        default: false,        
    },
    aiViolationDetails: {
        type: String,
        maxlength: 1000 // Giới hạn độ dài mô tả vi phạm
    },
    coverImage: {
        type: String,
        required: false, // Không bắt buộc phải có ảnh bìa
        trim: true,
        maxlength: 500 // Giới hạn độ dài URL ảnh bìa
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 50 // Giới hạn độ dài mỗi tag
    }],
}, { timestamps: true });

// Thêm text index cho tìm kiếm văn bản
novelSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Novel = mongoose.model('Novel', novelSchema);
export default Novel;
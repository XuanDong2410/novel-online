import Novel from "../models/novel.model.js";
import {
  parsePagination,
  parseSort,
} from "../utils/moderation/helper/pagination.js";
import { sendErrorResponse } from "../utils/sendErrorResponse.js";
import mongoose from 'mongoose';

import { mongooseSchemaToValidatorRules, standardValidators } from '../utils/validator/inputValidator.js';

/**
 * Controller for handling novel moderation-related operations
 * @module NovelModeratorController
 */

/**
 * =========================
 *         READ
 * =========================
 */

export const getAllNovels = async (req, res) => {
    try {
        const novels = await Novel.find();
        res.status(200).json({
            success: true,
            message: "All novels fetched successfully",
            data: novels
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
// // Get novel by ID (admin)
export const getNovelById = async (req, res) => {
    try {
        const novel = await Novel.findById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Novel fetched successfully",
            data: novel
        })
    } catch (error) {
        res.status(500).json({
            success: false,
        });
    }
}
// // Search novels (admin)

// TODO: need fix , search can by genre, title or author
export const searchNovels = async (req, res) => {
    try {
        const keyword = req.query.keyword;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: "Missing search keyword"
            });
        }
        const regex = new RegExp(keyword, 'i'); // Không phân biệt hoa thường
        
        const novels = await Novel.find({
            $or: [
                { title: { $regex: regex } },
                { author: { $regex: regex } },
                { genre: { $regex: regex } }
            ]
        });

        res.status(200).json({
            success: true,
            message: "Novels fetched successfully",
            data: novels
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * =========================
 *         GROUPS / SAME SAME
 * =========================
 * - getAllNovels, getNovelById, searchNovels: Admin/General listing
 * - viewMyNovels, viewMyNovelById: User's own novels
 * - getApproveNovels, getPublishedNovelsWithPendingChapters, getNovelWithChapters: Moderation listing
 * - approveNovelAndChapters, rejectNovel, hideNovel, unHideNovel, toggleHideNovel: Moderation actions
 * - createNovel, updateNovel, updateNovelCover, resubmitNovel, requestPublish, requestEdit, cancelRequest, retractNovel: User actions on own novels
 * - deleteNovel: User deletes own novel
 * - getNovelStats: Statistics for user
 */
// validateNovel,

/**
 * Lấy danh sách các chương của tiểu thuyết đang chờ duyệt
 * @param {Object} req - Request object chứa query params
 * @param {Object} res - Response object
 * @returns {Object} JSON chứa danh sách chương của tiểu thuyết, thông tin truyện
 */

// export const createNovel = async (req, res) => {
//     try {
//         const { title, description, author, genre } = req.body;
//         if(!title || !description || !author || !genre) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please provide all the required fields"
//             })
//         }
//         const newNovel = new Novel({ 
//             title, 
//             description, 
//             author, 
//             genre,
//             user: req.user._id
//         });
//         await newNovel.save();
//         res.status(201).json({
//             success: true,
//             message: "Novel created successfully",
//             data: newNovel
//         })
//     } catch (error) {
//        res.status(500).json({ 
//             success: false,
//             message: error.message 
//         });
//         console.log("Error in creating novel: " + error.message);
//     }
// }



// export const updateNovel = async (req, res) => {
//     try {
//         const novel = await Novel.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.status(200).json({
//             success: true,
//             message: "Novel updated successfully",
//             data: novel
//         })
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }
// export const deleteNovel = async (req, res) => {
//     try {
//         const novel = await Novel.findById(req.params.id);
//         if(!novel) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Novel not found"
//             })
//         }
//         await Novel.findByIdAndDelete(req.params.id);
//         res.status(200).json({
//             success: true,
//             message: "Novel deleted successfully",
//             data: novel
//         })
//     }
//     catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//         console.log("Error in deleting novel: " + error.message);
//     }
// }


// Convert Mongoose schema to validation rules for Novel
const novelSchemaRules = mongooseSchemaToValidatorRules(Novel.schema);
novelSchemaRules.coverImage.validate = standardValidators.url; // Add URL validation for coverImage
novelSchemaRules.tags.items = { type: 'string', maxLength: 50, trim: true, lowercase: true };
novelSchemaRules.attributes.items = { type: 'objectid' };

/**
 * Retrieves statistics for novels of the authenticated user with pagination and sorting
 * @async
 * @param {Object} req - Express request object
 * @param {string} [req.params.id] - Optional Novel ID (if specified, get stats for single novel)
 * @param {Object} req.user - Authenticated user
 * @param {Object} req.query - Query parameters (page, limit, sort, direction)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novel statistics
 */
export const getNovelStats = async (req, res) => {
  try {
    const novelId = req.params.id;

    if (novelId) {
      // Single novel stats
      if (!mongoose.Types.ObjectId.isValid(novelId)) {
        return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
      }

      const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id })
        .populate('attributes')
        .lean();
      if (!novel) {
        return sendErrorResponse(null, 'Truyện không tồn tại hoặc bạn không có quyền', res, 404);
      }

      const [stats] = await Novel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(novelId), createdBy: req.user._id } },
        {
          $lookup: { from: 'chapters', localField: '_id', foreignField: 'novelId', as: 'chapters' },
        },
        {
          $project: {
            viewCount: 1,
            chapterCount: { $size: '$chapters' },
            favoriteCount: { $size: '$favorites' },
            reportCount: { $size: '$reports' },
            averageRating: '$rates.averageRating',
            ratingCount: '$rates.count',
          },
        },
      ]);

      if (!stats) {
        return sendErrorResponse(null, 'Không tìm thấy thống kê', res, 404);
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy thống kê truyện thành công',
        data: stats,
      });
    } else {
      // Multiple novels stats with pagination and sorting
      const pagination = parsePagination(req.query);
      if (!pagination.valid) {
        return sendErrorResponse(null, pagination.message, res, 400);
      }
      const { page, limit, skip } = pagination;

      const allowedSortFields = ['viewCount', 'chapterCount', 'favoriteCount', 'reportCount', 'averageRating', 'ratingCount'];
      const sort = parseSort(req.query);
      if (!allowedSortFields.includes(Object.keys(sort)[0])) {
        return sendErrorResponse(null, 'Trường sắp xếp không hợp lệ', res, 400);
      }

      const stats = await Novel.aggregate([
        { $match: { createdBy: req.user._id } },
        {
          $lookup: { from: 'chapters', localField: '_id', foreignField: 'novelId', as: 'chapters' },
        },
        {
          $project: {
            title: 1,
            viewCount: 1,
            chapterCount: { $size: '$chapters' },
            favoriteCount: { $size: '$favorites' },
            reportCount: { $size: '$reports' },
            averageRating: '$rates.averageRating',
            ratingCount: '$rates.count',
          },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);

      const total = await Novel.countDocuments({ createdBy: req.user._id });

      return res.status(200).json({
        success: true,
        message: 'Lấy thống kê truyện thành công',
        data: stats,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê truyện', res, 500);
  }
};
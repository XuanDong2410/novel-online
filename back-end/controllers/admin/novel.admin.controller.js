/**
 * Controller for handling novel moderation-related operations
 * @module NovelModeratorController
 */

import Novel from "../../models/novel.model.js";
// import { NovelAttribute } from "../../models/novel.model.js";
// import { validateNovelStatus } from "../../utils/validation.js"; // Hàm validation cho status (sẽ tạo sau)
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import {
  validateNote,
  validateId,
} from "../../utils/moderation/helper/validation.js";
import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";

/**
 * Lấy danh sách các tiểu thuyết đang chờ duyệt
 * @param {Object} req - Request object chứa query params (page, limit, sort, direction)
 * @param {Object} res - Response object
 * @returns {Object} JSON chứa danh sách tiểu thuyết, tổng số lượng, trang và giới hạn
 */

/**
 * Lấy danh sách các chương của tiểu thuyết đang chờ duyệt
 * @param {Object} req - Request object chứa query params
 * @param {Object} res - Response object
 * @returns {Object} JSON chứa danh sách chương của tiểu thuyết, thông tin truyện
 */


/**
 * @desc    Lấy danh sách TẤT CẢ truyện cho Admin (bao gồm cả draft, pending, rejected, hidden)
 * @route   GET /api/v2/admin/novels/all
 * @access  Private/Admin
 */
export const getAllNovelsForAdmin = async (req, res) => {
    try {

        // Thực hiện query
        const novels = await Novel.find({ statusPublish: { $ne: 'draft' } })
            .populate('createdBy', 'username email')
            .populate('attributes', 'name type')
            .lean();
        const totalNovels = novels.length;
        const page = 1;
        const limit = totalNovels;

        res.status(200).json({
            success: true,
            count: novels.length,
            total: totalNovels,
            page: parseInt(page),
            pages: Math.ceil(totalNovels / parseInt(limit)),
            data: novels,
        });

    } catch (error) {
        console.error("Error in getAllNovelsForAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ khi lấy danh sách truyện.",
            error: error.message
        });
    }
};

/**
 * @desc    Cập nhật trạng thái xuất bản của một truyện bởi Admin
 * @route   PATCH /api/v2/admin/novels/:id/status
 * @access  Private/Admin
 */
export const updateNovelStatusByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusPublish, status, isHidden } = req.body;

        // Validation cơ bản cho đầu vào
        if (!statusPublish && !status && isHidden === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ít nhất một trường để cập nhật (statusPublish, status, hoặc isHidden)."
            });
        }

        const updateFields = {};

        // Validate và thêm statusPublish nếu có
        if (statusPublish) {
            // Sử dụng hàm validateNovelStatus hoặc tự kiểm tra enum
            const validStatusPublish = ['draft', 'pending', 'editing', 'warning', 'approved', 'rejected'];
            if (!validStatusPublish.includes(statusPublish)) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái xuất bản không hợp lệ. Các giá trị cho phép: ${validStatusPublish.join(', ')}.`
                });
            }
            updateFields.statusPublish = statusPublish;
        }

        // Validate và thêm status nếu có
        if (status) {
            const validStatus = ['ongoing', 'completed', 'hiatus'];
            if (!validStatus.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái truyện không hợp lệ. Các giá trị cho phép: ${validStatus.join(', ')}.`
                });
            }
            updateFields.status = status;
        }

        // Thêm isHidden nếu có
        if (isHidden !== undefined) {
            if (typeof isHidden !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: "Trường 'isHidden' phải là một giá trị boolean."
                });
            }
            updateFields.isHidden = isHidden;
            // Nếu truyện bị ẩn, ghi lại ai là người ẩn
            if (isHidden) {
                updateFields.hiddenBy = req.user._id; // Giả sử req.user có _id của admin
            } else {
                updateFields.hiddenBy = null; // Bỏ ghi nếu bỏ ẩn
            }
        }

        const updatedNovel = await Novel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true } // `new: true` trả về tài liệu đã cập nhật, `runValidators: true` chạy các validator schema
        )
        .populate('createdBy', 'username email')
        .lean();

        if (!updatedNovel) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy truyện để cập nhật trạng thái."
            });
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái truyện thành công.",
            data: updatedNovel
        });

    } catch (error) {
        console.error("Error in updateNovelStatusByAdmin:", error);
        // Xử lý lỗi từ Mongoose (ví dụ: CastError nếu id không hợp lệ)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "ID truyện không hợp lệ."
            });
        }
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ khi cập nhật trạng thái truyện.",
            error: error.message
        });
    }
};
// POST /api/moderation/novels/:id/hide
export const hideNovel = async (req, res) => {
  try {
    await validateId(req.params.id);
    const { note } = req.body;
    if (!req.body.note) {
      return sendErrorResponse(null, "Ghi chú là bắt buộc", res, 400);
    }
    const novel = await Novel.findById(req.params.id);
    return await withTransaction(async (session) => {
      if (!novel) {
        const message = "Không tìm thấy truyện";
        return sendErrorResponse(null, message, res, 404);
      }
      const noteCheck = validateNote(note);
      if (!noteCheck) return sendErrorResponse(error, noteCheck.message, res, 400);
      if (novel.statusPublish === "rejected") {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Không thể ẩn truyện đã bị từ chối",
        });
      }
      if (novel.isHidden) {
        await session.abortTransaction();
        const message = "Truyện đã bị ẩn";
        return sendErrorResponse(error, message, res, 400);
      }

      novel.isHidden = true;
      await novel.save({ session });
      if (!req.user?._id) {
        return sendErrorResponse(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.hide,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} đã bị ẩn vì: ${note}`,
        logNote: "Ẩn truyện",
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      return res
        .status(200)
        .json({ success: true, message: "Truyện đã bị ẩn" });
    });
  } catch (error) {
    const message = "Lỗi khi ẩn truyện";
    return sendErrorResponse(error, message, res, 500);
  }
};
// POST /api/moderation/novels/:id/un-hide
export const unHideNovel = async (req, res) => {
  try {
    await validateId(req.params.id);
    const { note } = req.body;
    if (!req.body.note) {
      return sendErrorResponse(null, "Ghi chú là bắt buộc", res, 400);
    }
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      const message = "Không tìm thấy truyện";
      return sendErrorResponse(null, message, res, 404);
    }

    return await withTransaction(async (session) => {
      const noteCheck = validateNote(note);
      if (!noteCheck)
        return res
          .status(400)
          .json({ success: false, message: noteCheck.message });
      if (!novel.isHidden) {
        await session.abortTransaction();
        const message = "Truyện không bị ẩn";
        return sendErrorResponse(null, message, res, 400);
      }

      novel.isHidden = false;
      await novel.save({ session });
      if (!req.user?._id) {
        return sendErrorResponse(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.unHide,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} đã bị hiển thị vì: ${note}`,
        logNote: "Hiển thị truyện",
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      return res
        .status(200)
        .json({ success: true, message: "Truyện đã hiển thị" });
    });
  } catch (error) {
    const message = "Lỗi khi hiển thị truyện";
    return sendErrorResponse(error, message, res, 500);
  }
};
/**
 * View a novel for editing (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novel details
 */

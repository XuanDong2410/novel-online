import Chapter from "../../models/chapter.model.js";
import Novel from "../../models/novel.model.js";
// import ModerationLog from "../../models/moderationLog.model.js";
import { validateCreateChapter } from "../../utils/validator.js";
// import { checkContentByAI } from "../../utils/moderation/index.js";

// const createModerationLog = async (novelId, chapterId, details) => {
//   await new ModerationLog({
//     novelId,
//     chapterId,
//     action: "flagged",
//     note: "Nội dung chapter bị gắn cờ vi phạm",
//     details,
//   }).save();
// }
// export const createChapter = async (req, res) => {
//   try {
//     const { novelId, title, content, chapterNumber } = req.body;
//     const userId = req.user._id;

//     // Xác thực đầu vào
//     const { error } = validateCreateChapter(req.body);
//     if (error) {
//       return res.status(400).json({ success: false, message: error.details[0].message });
//     }

//     // Kiểm tra truyện
//     const novel = await Novel.findOne({ _id: novelId, createdBy: userId }).lean();
//     if (!novel) {
//       return res.status(404).json({
//         success: false,
//         message: "Truyện không tồn tại",
//       });
//     }

//     // Kiểm tra chapterNumber duy nhất
//     const existingChapter = await Chapter.findOne({ novelId, chapterNumber }).lean();
//     if (existingChapter) {
//       return res.status(400).json({
//         success: false,
//         message: "Số chương đã tồn tại",
//       });
//     }

//     // Kiểm tra nội dung bằng AI (giả định có hàm checkContentByAI)
//     const { hasViolation, violationDetails, labels, rawResult } = await checkContentByAI(content); // Hàm giả định
    
//     const moderationDetails = {
//       violationDetails,
//       labels,
//       rawResult,
//     };

//     // Tạo chương
//     const chapter = new Chapter({
//       novelId,
//       title: title.trim(),
//       content: content.trim(),
//       chapterNumber,
//       status: "pending",
//       aiViolationFlag: hasViolation,
//       aiViolationDetails: moderationDetails,
//     });

//     await chapter.save();

//     // Ghi log nếu có vi phạm
//     if (hasViolation) {
//       await createModerationLog(novelId, chapter._id, moderationDetails);
//     }

//     res.status(201).json({
//       success: true,
//       message: "Chương được tạo thành công",
//       data: chapter,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server khi tạo chương",
//       error: error.message,
//     });
//   }
// };
export const createChapter = async (req, res) => {
  try {
    const { novelId, title, content, chapterNumber } = req.body;
    const userId = req.user._id;

    // Xác thực đầu vào
    const { error } = validateCreateChapter(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Kiểm tra truyện
    const novel = await Novel.findOne({ _id: novelId, createdBy: userId }).lean();
    if (!novel) {
      return res.status(404).json({
        success: false,
        message: "Truyện không tồn tại",
      });
    }

    // Kiểm tra chapterNumber duy nhất
    const existingChapter = await Chapter.findOne({ novelId, chapterNumber }).lean();
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: "Số chương đã tồn tại",
      });
    }

    // Tạo chương
    const chapter = new Chapter({
      novelId,
      title: title.trim(),
      content: content.trim(),
      chapterNumber,
      status: "pending",
      aiViolationFlag: false,
      aiViolationDetails: null,
    });

    await chapter.save();

    res.status(201).json({
      success: true,
      message: "Chương được tạo thành công",
      data: chapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo chương",
      error: error.message,
    });
  }
};
export const viewMyChapters = async (req, res) => {
  
}
export const viewMyChapterById = async (req, res) => {
  
}
/**
 * Update a chapter (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.title - Chapter title
 * @param {string} req.body.content - Chapter content
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateChapter = async (req, res) => {
  try {
    const chapterId = await validateId(req.params.chapterId, res);
    if (!chapterId) return;

    const { title, content } = req.body;
    const schema = Joi.object({
      title: Joi.string().max(200).required().messages({
        "string.max": "Tiêu đề không được vượt quá 200 ký tự",
        "any.required": "Tiêu đề là bắt buộc",
      }),
      content: Joi.string().max(50000).required().messages({
        "string.max": "Nội dung không được vượt quá 50000 ký tự",
        "any.required": "Nội dung là bắt buộc",
      }),
    });
    const { error } = schema.validate({ title, content });
    if (error) {
      return sendErrorResponse(null, error.details[0].message, res, 400);
    }

    return await withTransaction(async (session) => {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return sendErrorResponse(null, "Không tìm thấy chương", res, 404);
      }
      if (!["pending", "editing", "draft"].includes(chapter.status)) {
        return sendErrorResponse(null, "Chương không ở trạng thái cho phép chỉnh sửa", res, 400);
      }
      const novel = await Novel.findById(chapter.novelId);
      if (!novel) {
        return sendErrorResponse(null, "Không tìm thấy truyện", res, 404);
      }
      if (novel.createdBy.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
        return sendErrorResponse(null, "Không có quyền chỉnh sửa chương", res, 403);
      }

      chapter.title = title;
      chapter.content = content;
      chapter.updatedAt = new Date();
      await chapter.save({ session });

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} của truyện ${novel.title} đã được cập nhật bởi ${req.user.username}`,
        logNote: `Cập nhật chương ${chapter.chapterNumber} của truyện ${novel.title}`,
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Chương đã được cập nhật" });
    });
  } catch (error) {
    const message = "Lỗi khi cập nhật chương";
    return sendErrorResponse(error, message, res, 500);
  }
};

/**
 * Delete a chapter (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteChapter = async (req, res) => {
  try {
    const chapterId = await validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return sendErrorResponse(null, "Không tìm thấy chương", res, 404);
      }
      if (!["pending", "editing", "draft"].includes(chapter.status)) {
        return sendErrorResponse(null, "Chương không ở trạng thái cho phép xóa", res, 400);
      }
      const novel = await Novel.findById(chapter.novelId);
      if (!novel) {
        return sendErrorResponse(null, "Không tìm thấy truyện", res, 404);
      }
      if (novel.createdBy.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
        return sendErrorResponse(null, "Không có quyền xóa chương", res, 403);
      }

      await chapter.deleteOne({ session });

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} của truyện ${novel.title} đã bị xóa bởi ${req.user.username}`,
        logNote: `Xóa chương ${chapter.chapterNumber} của truyện ${novel.title}`,
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Chương đã bị xóa" });
    });
  } catch (error) {
    const message = "Lỗi khi xóa chương";
    return sendErrorResponse(error, message, res, 500);
  }
};

export const requestPublish = async (req, res) => {
  
}
export const cancelRequestPublish = async (req, res) => {
  
}
export const resubmitChapter = async (req, res) => {
  
}
export const hideChapter = async (req, res) => {
  
}
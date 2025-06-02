import Novel from "../../models/novel.model.js";
import NovelAttribute from "../../models/novel.model.js";
import User from "../../models/user.model.js";
import Chapter from "../../models/chapter.model.js";
import { validateCreateNovel } from "../../utils/validator.js"; // Validator tùy chỉnh

export const createNovel = async (req, res) => {
  try {
    const { title, description, author, attributes, tags, coverImage } = req.body;
    const userId = req.user._id;

    // Xác thực đầu vào
    const { error } = validateCreateNovel(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Kiểm tra trùng lặp tiêu đề
    const existingNovel = await Novel.findOne({ title: title.trim() }).lean();
    if (existingNovel) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề truyện đã tồn tại",
      });
    }

    // Kiểm tra attributes (genres, subgenres, v.v.)
    const validAttributes = await NovelAttribute.find({
      _id: { $in: attributes || [] },
      isActive: true,
    }).lean();
    if (attributes && validAttributes.length !== attributes.length) {
      return res.status(400).json({
        success: false,
        message: "Một hoặc nhiều thuộc tính không hợp lệ",
      });
    }

    // Tạo truyện mới
    const newNovel = new Novel({
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      createdBy: userId,
      attributes: attributes || [],
      tags: tags || [],
      coverImage,
      statusPublish: "draft",
    });

    await newNovel.save();

    // Cập nhật uploadedNovels của người dùng
    await User.findByIdAndUpdate(userId, {
      $push: { uploadedNovels: newNovel._id },
    });

    res.status(201).json({
      success: true,
      message: "Truyện nháp được tạo thành công",
      data: newNovel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo truyện",
      error: error.message,
    });
  }
};
export const viewMyNovels = async (req, res) => {
  
}
export const viewMyNovelById = async (req, res) => {
  
}
/**
 * Update a novel (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.title - Novel title
 * @param {string} req.body.description - Novel description
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateNovel = async (req, res) => {
  try {
    const novelId = await validateId(req.params.id, res);
    if (!novelId) return;

    const { title, description } = req.body;
    const schema = Joi.object({
      title: Joi.string().max(200).required().messages({
        "string.max": "Tiêu đề không được vượt quá 200 ký tự",
        "any.required": "Tiêu đề là bắt buộc",
      }),
      description: Joi.string().max(2000).optional().messages({
        "string.max": "Mô tả không được vượt quá 2000 ký tự",
      }),
    });
    const { error } = schema.validate({ title, description });
    if (error) {
      return sendErrorResponse(null, error.details[0].message, res, 400);
    }

    return await withTransaction(async (session) => {
      const novel = await Novel.findById(novelId);
      const novelCheck = validateNovel(novel, session);
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }
      if (!["pending", "editing", "draft"].includes(novel.statusPublish)) {
        return sendErrorResponse(null, "Truyện không ở trạng thái cho phép chỉnh sửa", res, 400);
      }
      if (novel.createdBy.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
        return sendErrorResponse(null, "Không có quyền chỉnh sửa truyện", res, 403);
      }

      novel.title = title;
      if (description) novel.description = description;
      novel.updatedAt = new Date();
      await novel.save({ session });

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} đã được cập nhật bởi ${req.user.username}`,
        logNote: `Cập nhật thông tin truyện ${novel.title}`,
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Truyện đã được cập nhật" });
    });
  } catch (error) {
    const message = "Lỗi khi cập nhật truyện";
    return sendErrorResponse(error, message, res, 500);
  }
};

export const updateNovelCover = async (req, res) => {
  
}
/**
 * Delete a novel (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteNovel = async (req, res) => {
  try {
    const novelId = await validateId(req.params.id, res);
    if (!novelId) return;

    return await withTransaction(async (session) => {
      const novel = await Novel.findById(novelId);
      const novelCheck = validateNovel(novel, session);
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }
      if (!["pending", "editing", "draft"].includes(novel.statusPublish)) {
        return sendErrorResponse(null, "Truyện không ở trạng thái cho phép xóa", res, 400);
      }
      if (novel.createdBy.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
        return sendErrorResponse(null, "Không có quyền xóa truyện", res, 403);
      }

      await Chapter.deleteMany({ novelId: novel._id }, { session });
      await novel.deleteOne({ session });

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} đã bị xóa bởi ${req.user.username}`,
        logNote: `Xóa truyện ${novel.title}`,
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Truyện đã bị xóa" });
    });
  } catch (error) {
    const message = "Lỗi khi xóa truyện";
    return sendErrorResponse(error, message, res, 500);
  }
};

export const requestPublish = async (req, res) => {
  try {
    const novelId = req.params.id;
    const userId = req.user._id;

    const novel = await Novel.findOne({ _id: novelId, createdBy: userId }).lean();
    if (!novel) {
      return res.status(404).json({
        success: false,
        message: "Truyện không tồn tại hoặc bạn không có quyền",
      });
    }

    if (novel.statusPublish !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Truyện không ở trạng thái nháp",
      });
    }

    const chapterCount = await Chapter.countDocuments({ novelId });
    if (chapterCount < 10) {
      return res.status(400).json({
        success: false,
        message: "Truyện phải có ít nhất 10 chương",
      });
    }

    await Novel.findByIdAndUpdate(novelId, { statusPublish: "pending" });

    res.status(200).json({
      success: true,
      message: "Yêu cầu xuất bản đã được gửi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const cancelRequestPublish = async (req, res) => {
  
}
export const resubmitNovel = async (req, res) => {
  
}
export const hideNovel = async (req, res) => {
  
}

export const getNovelStats = async (req, res) => {
  
}

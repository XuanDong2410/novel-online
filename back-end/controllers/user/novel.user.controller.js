import mongoose from 'mongoose';
import Novel from '../../models/novel.model.js';
import NovelAttribute from '../../models/novel.model.js';
import User from '../../models/user.model.js';
import Chapter from '../../models/chapter.model.js';
import { validateInputWithSchema, mongooseSchemaToValidatorRules, standardValidators } from '../../utils/validator/inputValidator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';
import { parsePagination, parseSort } from '../../utils/moderation/helper/pagination.js';
// Convert Mongoose schema to validation rules for Novel
const novelSchemaRules = mongooseSchemaToValidatorRules(Novel.schema);
novelSchemaRules.coverImage.validate = standardValidators.url; // Add URL validation for coverImage
novelSchemaRules.tags.items = { type: 'string', maxLength: 50, trim: true, lowercase: true };
novelSchemaRules.attributes.items = { type: 'objectid' };

/**
 * Sends standardized error response
 * @param {Error|null} error - Error object, if any
 * @param {string} message - Error message
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 */
function sendErrorResponse(error, message, res, status) {
  return res.status(status).json({
    success: false,
    message,
    error: error ? error.message : undefined,
  });
}



/**
 * Validates novel existence and permissions
 * @param {Object} novel - Novel document
 * @param {Object} user - Authenticated user
 * @param {string[]} allowedStatuses - Allowed publish statuses
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateNovel(novel, user, allowedStatuses = []) {
  if (!novel) {
    return { valid: false, message: 'Truyện không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(novel.statusPublish)) {
    return { valid: false, message: `Truyện không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  if (novel.createdBy.toString() !== user._id.toString()) {
    return { valid: false, message: `'Không có quyền thực hiện hành động này, 'createdBy': ${novel.createdBy._id}, 'user._id': ${user._id}` };
  }
  return { valid: true, message: '' };
}

/**
 * Creates a new novel draft
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created novel
 */
export const createNovel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, description, author, attributes, tags, coverImage } = req.body;
    const userId = req.user._id;

    // Validate đầu vào
    const validationResult = validateInputWithSchema(
      { title, description, author, attributes, tags, coverImage },
      {},
      {
        title: novelSchemaRules.title,
        description: novelSchemaRules.description,
        author: novelSchemaRules.author,
        attributes: novelSchemaRules.attributes,
        tags: novelSchemaRules.tags,
        coverImage: novelSchemaRules.coverImage,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Kiểm tra tiêu đề trùng
    const existingNovel = await Novel.findOne({ title: title.trim() }).lean();
    if (existingNovel) {
      return sendErrorResponse(null, 'Tiêu đề truyện đã tồn tại', res, 400);
    }

    // Validate attributes
    if (attributes?.length) {
      const validAttributes = await NovelAttribute.find({
        _id: { $in: attributes },
        isActive: true,
      }).lean();
      if (validAttributes.length !== attributes.length) {
        return sendErrorResponse(null, 'Một hoặc nhiều thuộc tính không hợp lệ', res, 400);
      }
    }

    // Chọn kiểm duyệt viên ngẫu nhiên
    const [moderator] = await User.aggregate([
      { $match: { role: 'moderator' } },
      { $sample: { size: 1 } }
    ]);

    // Tạo truyện mới
    const newNovel = new Novel({
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      createdBy: userId,
      attributes: attributes || [],
      tags: tags?.map(tag => tag.trim().toLowerCase()) || [],
      coverImage: coverImage?.trim(),
      statusPublish: 'draft',
      moderation: {
        moderator: moderator?._id || null
      }
    });

    await newNovel.save({ session });

    await User.findByIdAndUpdate(userId, {
      $push: { uploadedNovels: newNovel._id }
    }, { session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: 'Truyện nháp được tạo thành công',
      data: newNovel,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi tạo truyện', res, 500);
  } finally {
    session.endSession();
  }
};
/**
 * Retrieves all novels created by the authenticated user with pagination and sorting
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} req.query - Query parameters (page, limit, sort, direction)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with user's novels and pagination info
 */
export const viewMyNovels = async (req, res) => {
  try {
    // Parse pagination
    const pagination = parsePagination(req.query);
    if (!pagination.valid) {
      return sendErrorResponse(null, pagination.message, res, 400);
    }
    const { page, limit, skip } = pagination;

    // Parse sort
    const allowedSortFields = ['title', 'createdAt', 'updatedAt', 'statusPublish'];
    const sort = parseSort(req.query);
    if (!allowedSortFields.includes(Object.keys(sort)[0])) {
      return sendErrorResponse(null, 'Trường sắp xếp không hợp lệ', res, 400);
    }

    // Fetch novels
    const novels = await Novel.find({ createdBy: req.user._id })
      .populate('attributes')
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();

    // Count total novels
    const total = await Novel.countDocuments({ createdBy: req.user._id });
    const message = novels.length > 0 ? 'Lấy truyện của tôi thành công' : 'Bạn chưa có truyện nào';

    return res.status(200).json({
      success: true,
      message: message,
      data: novels,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy truyện của tôi', res, 500);
  }
};
/**
 * Retrieves a specific novel by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novel details
 */
export const viewMyNovelById = async (req, res) => {
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id })
      .populate('attributes')
      .lean();
    if (!novel) {
      return sendErrorResponse(null, 'Truyện không tồn tại hoặc bạn không có quyền', res, 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy truyện thành công',
      data: novel,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi xem chi tiết truyện', res, 500);
  }
};

/**
 * Updates a novel's metadata when draft, and editing
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */

export const updateNovel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    // Fetch and validate novel
    const novel = await Novel.findById(novelId);
    const novelCheck = validateNovel(novel, req.user, ['editing', 'draft']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    const { title, description, author, attributes, tags, status } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { title, description, author, attributes, tags, status },
      {
        title: novel.title,
        description: novel.description,
        author: novel.author,
        attributes: novel.attributes,
        tags: novel.tags,
        status: novel.status,
      },
      {
        title: novelSchemaRules.title,
        description: novelSchemaRules.description,
        author: novelSchemaRules.author,
        attributes: novelSchemaRules.attributes,
        tags: novelSchemaRules.tags,
        status: novelSchemaRules.status,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }
    if (tags && tags.length > 10) {
      return sendErrorResponse(null, 'Tối đa 10 thẻ được phép', res, 400);
    }
    // Validate attributes
    if (attributes && attributes.length > 0) {
      const validAttributes = await NovelAttribute.find({
        _id: { $in: attributes },
        isActive: true,
      }).lean();
      if (validAttributes.length !== attributes.length) {
        return sendErrorResponse(null, 'Một hoặc nhiều thuộc tính không hợp lệ', res, 400);
      }
    }
    if (!validationResult.hasChanges) {
      return sendErrorResponse(null, 'Không có thay đổi nào trong dữ liệu', res, 400);
    }

    // Update novel
    const updateData = {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(author && { author: author.trim() }),
      ...(attributes && { attributes }),
      ...(tags && { tags: tags.map(tag => tag.trim().toLowerCase()) }),
      ...(status && { status }),
      updatedAt: new Date(),
    };

    await Novel.findByIdAndUpdate(novelId, { $set: updateData });
    if (novel.status === 'editing') {
      // Log moderation action
      const moderationResult = await moderationActionHandler({
        action: MODERATION_ACTIONS.userNotice,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel?.moderation?.moderator,
        message: `${req.user.username} đã chỉnh sửa truyện ${novel.title}`,
        logNote: `Chỉnh sửa truyện ${novel.title}`,
      }, session);

      if (!moderationResult.success) {
        return sendErrorResponse(null, moderationResult.message, res, 500);
      }

    }
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Truyện đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật truyện', res, 500);
  } finally {
    session.endSession();
  }
};

//TODO: Need check
/**
 * Updates a novel's cover image when draft, editing
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body with coverImage
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateNovelCover = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    const { coverImage } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { coverImage },
      {},
      { coverImage: novelSchemaRules.coverImage }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate novel
    const novel = await Novel.findById(novelId).session(session);
    const novelCheck = validateNovel(novel, req.user, ['pending', 'editing', 'draft']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    // Update cover image
    await Novel.findByIdAndUpdate(
      novelId,
      { $set: { coverImage: coverImage?.trim() || undefined, updatedAt: new Date() } },
      { session }
    );
    if (novel.status === 'editing') {
      // Log moderation action
      const moderationResult = await moderationActionHandler({
        action: MODERATION_ACTIONS.userNotice,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel?.moderation?.moderator,
        message: `${req.user.username} đã cập nhật ảnh bìa truyện ${novel.title}`,
        logNote: `Cập nhật ảnh bìa truyện ${novel.title}`,
      }, session);

      if (!moderationResult.success) {
        return sendErrorResponse(null, moderationResult.message, res, 500);
      }

    }
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Ảnh bìa truyện đã được cập nhật',
      data: { coverImage },
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật ảnh bìa truyện', res, 500);
  } finally {
    session.endSession();
  }
};


/**
 * Deletes a novel and its chapters when draft, editing
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteNovel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate novel
    const novel = await Novel.findById(novelId).session(session);
    const novelCheck = validateNovel(novel, req.user, ['editing', 'draft', 'warning']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    // Delete chapters
    await Chapter.deleteMany({ novelId: novel._id }, { session });

    // Delete novel
    await novel.deleteOne({ session });

    // Remove novel from user's uploadedNovels
    await User.findByIdAndUpdate(
      novel.createdBy,
      { $pull: { uploadedNovels: novel._id } },
      { session }
    );

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Truyện đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa truyện', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Requests to publish a novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming request
 */
export const requestPublish = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate novel
    const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id }).session(session);
    const novelCheck = validateNovel(novel, req.user, ['draft']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    // Check chapter count
    const chapterCount = await Chapter.countDocuments({ novelId });
    if (chapterCount < 0) {
      return sendErrorResponse(null, 'Truyện phải có ít nhất 0 chương', res, 400);
    }
    if (!novel?.moderation?.moderator) {
      return sendErrorResponse(null, 'Chưa có kiểm duyệt viên được gán cho truyện này', res, 400);
    }

    // Update status
    await Novel.findByIdAndUpdate(
      novelId,
      { $set: { statusPublish: 'pending', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.userNotice,
      novelId: novel._id,
      moderatorId: req.user._id,
      recipientId: novel?.moderation?.moderator,
      message: `${req.user.username} đã gửi yêu cầu xuất bản truyện ${novel.title}`,
      logNote: `Gửi yêu cầu xuất bản truyện ${novel.title}`,
    }, session);

    if (!moderationResult.success) {
      return sendErrorResponse(null, moderationResult.message, res, 500);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu xuất bản đã được gửi',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi gửi yêu cầu xuất bản', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Requests to edit a published novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming request
 */
export const requestEdit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    // Fetch and validate novel
    const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id }).session(session);
    const novelCheck = validateNovel(novel, req.user, ['pending', 'warning', 'approved']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    // Log moderation action
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: novel._id,
      moderatorId: req.user._id,
      recipientId: novel?.moderation?.moderator,
      message: `${req.user.username} đã gửi yêu cầu  chỉnh sửa truyện ${novel.title}`,
      logNote: `Gửi yêu cầu chỉnh sửa truyện ${novel.title}`,
    }, session);

    if (!moderationResult.success) {
      return sendErrorResponse(null, moderationResult.message, res, 500);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu chỉnh sửa truyện đã được gửi',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi gửi yêu cầu chỉnh sửa', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Cancels a pending or editing request
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming cancellation
 */
export const cancelRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate novel
    const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id }).session(session);
    const novelCheck = validateNovel(novel, req.user, ['pending', 'editing']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    // Update status back to draft
    await Novel.findByIdAndUpdate(
      novelId,
      { $set: { statusPublish: 'draft', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.userNotice,
      novelId: novel._id,
      moderatorId: req.user._id,
      recipientId: novel?.moderation?.moderator,
      message: `${req.user.username} đã huỷ yêu cầu cho truyện ${novel.title}`,
      logNote: `Hủy yêu cầu cho truyện ${novel.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu đã bị hủy, truyện trở về trạng thái nháp',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi hủy yêu cầu', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Resubmits a rejected novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body with updated novel data
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming resubmission
 */
//TODO: Need check
export const resubmitNovel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const { title, description, author, attributes, tags, status } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { title, description, author, attributes, tags, status },
      {},
      {
        title: novelSchemaRules.title,
        description: novelSchemaRules.description,
        author: novelSchemaRules.author,
        attributes: novelSchemaRules.attributes,
        tags: novelSchemaRules.tags,
        status: novelSchemaRules.status,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate novel
    const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id }).session(session);
    const novelCheck = validateNovel(novel, req.user, ['editing', 'warning', 'rejected']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }
    // Check for duplicate title
    if (title && title.trim() !== novel.title) {
      const existingNovel = await Novel.findOne({ title: title.trim() }).lean();
      if (existingNovel) {
        return sendErrorResponse(null, 'Tiêu đề truyện đã tồn tại', res, 400);
      }
    }

    // Validate attributes
    if (attributes && attributes.length > 0) {
      const validAttributes = await NovelAttribute.find({
        _id: { $in: attributes },
        isActive: true,
      }).lean();
      if (validAttributes.length !== attributes.length) {
        return sendErrorResponse(null, 'Một hoặc nhiều thuộc tính không hợp lệ', res, 400);
      }
    }

    // Update novel
    const updateData = {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(author && { author: author.trim() }),
      ...(attributes && { attributes }),
      ...(tags && { tags: tags.map(tag => tag.trim().toLowerCase()) }),
      ...(status && { status }),
      statusPublish: 'pending',
      updatedAt: new Date(),
    };

    await Novel.findByIdAndUpdate(novelId, { $set: updateData }, { session });

    // Log moderation action
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: novel._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Truyện ${title || novel.title} đã được gửi lại để xem xét`,
      logNote: `Gửi lại truyện ${title || novel.title}`,
    }, session);

    if (!moderationResult.success) {
      return sendErrorResponse(null, moderationResult.message, res, 500);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Truyện đã được gửi lại để xem xét',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi gửi lại truyện', res, 500);
  } finally {
    session.endSession();
  }
};

//TODO: Need check
/**
 * Retracts a published novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming retraction
 */
export const retractNovel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const novelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate novel
    const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id }).session(session);
    const novelCheck = validateNovel(novel, req.user, ['approved']);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    // Update status
    await Novel.findByIdAndUpdate(
      novelId,
      { $set: { statusPublish: 'draft', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: novel._id,
      moderatorId: req.user._id,
      recipientId: novel?.moderation?.moderator,
      message: `${req.user.username} đã thu hồi truyện ${novel.title}`,
      logNote: `Thu hồi truyện ${novel.title}`,
    }, session);

    if (!moderationResult.success) {
      return sendErrorResponse(null, moderationResult.message, res, 500);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Truyện đã được thu hồi',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi thu hồi truyện', res, 500);
  } finally {
    session.endSession();
  }
};

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
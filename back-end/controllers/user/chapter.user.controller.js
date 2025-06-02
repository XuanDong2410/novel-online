import mongoose from 'mongoose';
import Chapter from '../../models/chapter.model.js';
import Novel from '../../models/novel.model.js';
import User from '../../models/user.model.js';
import { mongooseSchemaToValidatorRules, validateInputWithSchema, standardValidators } from '../../utils/validator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';

// Convert Mongoose schema to validation rules for Chapter
const chapterSchemaRules = mongooseSchemaToValidatorRules(Chapter.schema);
chapterSchemaRules.contentUrl.validate = standardValidators.url;
chapterSchemaRules.audioFileUrl.validate = standardValidators.url;
chapterSchemaRules.subtitleFileUrl.validate = standardValidators.url;
chapterSchemaRules.novelId.crossValidate = async (data) => {
  if (!data.novelId) return true;
  const novel = await Novel.findById(data.novelId).lean();
  return novel ? true : 'Novel does not exist';
};

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
 * Validates ObjectId and returns it if valid
 * @param {string} id - ObjectId to validate
 * @param {Object} res - Express response object
 * @returns {string|null} Valid ObjectId or null if invalid
 */
async function validateId(id, res) {
  const validationResult = validateInputWithSchema({ id }, {}, { id: { type: 'objectid', required: true } });
  if (!validationResult.isValid) {
    sendErrorResponse(null, validationResult.errors.id[0], res, 400);
    return null;
  }
  return id;
}

/**
 * Validates chapter existence and permissions
 * @param {Object} chapter - Chapter document
 * @param {Object} user - Authenticated user
 * @param {string[]} allowedStatuses - Allowed status values
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateChapter(chapter, user, allowedStatuses = []) {
  if (!chapter) {
    return { valid: false, message: 'Chương không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(chapter.status)) {
    return { valid: false, message: `Chương không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  const novel = Novel.findById(chapter.novelId).lean();
  if (!novel || (novel.createdBy.toString() !== user._id.toString() && !['moderator', 'admin'].includes(user.role))) {
    return { valid: false, message: 'Không có quyền thực hiện hành động này' };
  }
  return { valid: true, message: '' };
}

/**
 * Creates a new chapter
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created chapter
 */
export const createChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, content, contentUrl, chapterNumber, audioFileUrl, subtitleFileUrl, novelId } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { title, content, contentUrl, chapterNumber, audioFileUrl, subtitleFileUrl, novelId },
      {},
      {
        title: chapterSchemaRules.title,
        content: chapterSchemaRules.content,
        contentUrl: chapterSchemaRules.contentUrl,
        chapterNumber: chapterSchemaRules.chapterNumber,
        audioFileUrl: chapterSchemaRules.audioFileUrl,
        subtitleFileUrl: chapterSchemaRules.subtitleFileUrl,
        novelId: chapterSchemaRules.novelId,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Validate novel existence and ownership
    const novel = await Novel.findById(novelId).lean();
    if (!novel || novel.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(null, 'Truyện không tồn tại hoặc bạn không có quyền', res, 400);
    }

    // Check for duplicate chapter number
    const existingChapter = await Chapter.findOne({ novelId, chapterNumber }).lean();
    if (existingChapter) {
      return sendErrorResponse(null, 'Số chương đã tồn tại cho truyện này', res, 400);
    }

    // Create new chapter
    const newChapter = new Chapter({
      title: title.trim(),
      content: content.trim(),
      contentUrl: contentUrl.trim(),
      chapterNumber,
      audioFileUrl: audioFileUrl?.trim(),
      subtitleFileUrl: subtitleFileUrl?.trim(),
      novelId,
      status: 'draft',
      isPublished: false,
    });

    await newChapter.save({ session });

    // Update novel's chapter count and latestChapter
    await Novel.findByIdAndUpdate(
      novelId,
      { 
        $inc: { 'chapters.count': 1 },
        $set: { 'chapters.latestChapter': newChapter._id, updatedAt: new Date() }
      },
      { session }
    );

    // Log moderation action
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId,
      chapterId: newChapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Chương ${newChapter.title} đã được tạo cho truyện ${novel.title}`,
      logNote: `Tạo chương ${newChapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Chương nháp được tạo thành công',
      data: newChapter,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi tạo chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Retrieves all chapters created by the authenticated user for a novel
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query.novelId - Novel ID (optional)
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with chapters
 */
export const viewMyChapters = async (req, res) => {
  try {
    const { novelId } = req.query;
    const query = novelId ? { novelId, createdBy: req.user._id } : { createdBy: req.user._id };

    // Validate novelId if provided
    if (novelId) {
      const validationResult = validateInputWithSchema({ novelId }, {}, { novelId: { type: 'objectid', required: true } });
      if (!validationResult.isValid) {
        return sendErrorResponse(null, validationResult.errors.novelId[0], res, 400);
      }
      const novel = await Novel.findOne({ _id: novelId, createdBy: req.user._id }).lean();
      if (!novel) {
        return sendErrorResponse(null, 'Truyện không tồn tại hoặc bạn không có quyền', res, 404);
      }
    }

    const chapters = await Chapter.find(query)
      .populate('novelId', 'title')
      .sort({ chapterNumber: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách chương thành công',
      data: chapters,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy danh sách chương', res, 500);
  }
};

/**
 * Retrieves a specific chapter by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with chapter details
 */
export const viewMyChapterById = async (req, res) => {
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    const chapter = await Chapter.findById(chapterId)
      .populate('novelId', 'title')
      .lean();
    const novel = await Novel.findById(chapter.novelId).lean();
    const chapterCheck = validateChapter(chapter, req.user);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chương thành công',
      data: chapter,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi xem chi tiết chương', res, 500);
  }
};

/**
 * Updates a chapter's metadata
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    const { title, content, contentUrl, chapterNumber, audioFileUrl, subtitleFileUrl } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { title, content, contentUrl, chapterNumber, audioFileUrl, subtitleFileUrl },
      {},
      {
        title: chapterSchemaRules.title,
        content: chapterSchemaRules.content,
        contentUrl: chapterSchemaRules.contentUrl,
        chapterNumber: chapterSchemaRules.chapterNumber,
        audioFileUrl: chapterSchemaRules.audioFileUrl,
        subtitleFileUrl: chapterSchemaRules.subtitleFileUrl,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = validateChapter(chapter, req.user, ['draft', 'editing', 'pending']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Check for duplicate chapter number
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await Chapter.findOne({ novelId: chapter.novelId, chapterNumber }).lean();
      if (existingChapter) {
        return sendErrorResponse(null, 'Số chương đã tồn tại cho truyện này', res, 400);
      }
    }

    // Update chapter
    const updateData = {
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(contentUrl && { contentUrl: contentUrl.trim() }),
      ...(chapterNumber && { chapterNumber }),
      ...(audioFileUrl && { audioFileUrl: audioFileUrl.trim() }),
      ...(subtitleFileUrl && { subtitleFileUrl: subtitleFileUrl.trim() }),
      updatedAt: new Date(),
    };

    await Chapter.findByIdAndUpdate(chapterId, { $set: updateData }, { session });

    // Update novel's latestChapter if necessary
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const latestChapter = await Chapter.findOne({ novelId: chapter.novelId })
        .sort({ chapterNumber: -1 })
        .lean();
      await Novel.findByIdAndUpdate(
        chapter.novelId,
        { $set: { 'chapters.latestChapter': latestChapter._id, updatedAt: new Date() } },
        { session }
      );
    }

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Chương ${title || chapter.title} đã được cập nhật`,
      logNote: `Cập nhật chương ${title || chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates a chapter's media (audioFileUrl, subtitleFileUrl)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.body - Request body with media URLs
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateChapterMedia = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    const { audioFileUrl, subtitleFileUrl } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { audioFileUrl, subtitleFileUrl },
      {},
      {
        audioFileUrl: chapterSchemaRules.audioFileUrl,
        subtitleFileUrl: chapterSchemaRules.subtitleFileUrl,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = validateChapter(chapter, req.user, ['draft', 'editing', 'pending']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Update media
    const updateData = {
      ...(audioFileUrl && { audioFileUrl: audioFileUrl.trim() }),
      ...(subtitleFileUrl && { subtitleFileUrl: subtitleFileUrl.trim() }),
      updatedAt: new Date(),
    };

    await Chapter.findByIdAndUpdate(chapterId, { $set: updateData }, { session });

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Media của chương ${chapter.title} đã được cập nhật`,
      logNote: `Cập nhật media chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Media của chương đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật media chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = validateChapter(chapter, req.user, ['draft', 'editing', 'pending']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Delete chapter
    await chapter.deleteOne({ session });

    // Update novel's chapter count and latestChapter
    const chapterCount = await Chapter.countDocuments({ novelId: chapter.novelId });
    const latestChapter = await Chapter.findOne({ novelId: chapter.novelId })
      .sort({ chapterNumber: -1 })
      .lean();
    await Novel.findByIdAndUpdate(
      chapter.novelId,
      { 
        $set: { 
          'chapters.count': chapterCount,
          'chapters.latestChapter': latestChapter ? latestChapter._id : null,
          updatedAt: new Date()
        }
      },
      { session }
    );

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Chương ${chapter.title} đã bị xóa`,
      logNote: `Xóa chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Requests to publish a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming request
 */
export const requestPublish = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = validateChapter(chapter, req.user, ['draft']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Update status
    await Chapter.findByIdAndUpdate(
      chapterId,
      { $set: { status: 'pending', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Yêu cầu xuất bản chương ${chapter.title} đã được gửi`,
      logNote: `Gửi yêu cầu xuất bản chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu xuất bản chương đã được gửi',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi gửi yêu cầu xuất bản', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Cancels a pending or editing request for a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming cancellation
 */
export const cancelRequestPublish = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = validateChapter(chapter, req.user, ['pending', 'editing']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Update status
    await Chapter.findByIdAndUpdate(
      chapterId,
      { $set: { status: 'draft', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Yêu cầu xuất bản chương ${chapter.title} đã bị hủy`,
      logNote: `Hủy yêu cầu xuất bản chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Yêu cầu xuất bản chương đã bị hủy',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi hủy yêu cầu xuất bản', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Resubmits a rejected chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.body - Request body with updated chapter data
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming resubmission
 */
export const resubmitChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    const { title, content, contentUrl, chapterNumber, audioFileUrl, subtitleFileUrl } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { title, content, contentUrl, chapterNumber, audioFileUrl, subtitleFileUrl },
      {},
      {
        title: chapterSchemaRules.title,
        content: chapterSchemaRules.content,
        contentUrl: chapterSchemaRules.contentUrl,
        chapterNumber: chapterSchemaRules.chapterNumber,
        audioFileUrl: chapterSchemaRules.audioFileUrl,
        subtitleFileUrl: chapterSchemaRules.subtitleFileUrl,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = validateChapter(chapter, req.user, ['rejected']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Check for duplicate chapter number
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await Chapter.findOne({ novelId: chapter.novelId, chapterNumber }).lean();
      if (existingChapter) {
        return sendErrorResponse(null, 'Số chương đã tồn tại cho truyện này', res, 400);
      }
    }

    // Update chapter
    const updateData = {
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(contentUrl && { contentUrl: contentUrl.trim() }),
      ...(chapterNumber && { chapterNumber }),
      ...(audioFileUrl && { audioFileUrl: audioFileUrl.trim() }),
      ...(subtitleFileUrl && { subtitleFileUrl: subtitleFileUrl.trim() }),
      status: 'pending',
      updatedAt: new Date(),
    };

    await Chapter.findByIdAndUpdate(chapterId, { $set: updateData }, { session });

    // Update novel's latestChapter if necessary
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const latestChapter = await Chapter.findOne({ novelId: chapter.novelId })
        .sort({ chapterNumber: -1 })
        .lean();
      await Novel.findByIdAndUpdate(
        chapter.novelId,
        { $set: { 'chapters.latestChapter': latestChapter._id, updatedAt: new Date() } },
        { session }
      );
    }

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Chương ${title || chapter.title} đã được gửi lại để xem xét`,
      logNote: `Gửi lại chương ${title || chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã được gửi lại để xem xét',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi gửi lại chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Hides a chapter (for moderators/admins)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming action
 */
export const hideChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    // Fetch chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    if (!chapter) {
      return sendErrorResponse(null, 'Chương không tồn tại', res, 404);
    }

    // Restrict to moderators/admins
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return sendErrorResponse(null, 'Không có quyền ẩn chương', res, 403);
    }

    // Update hidden status
    await Chapter.findByIdAndUpdate(
      chapterId,
      { 
        $set: { 
          isPublished: false,
          status: 'retracted',
          updatedAt: new Date(),
          'moderating.isModerating': true,
          'moderating.moderateBy': req.user._id
        }
      },
      { session }
    );

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.hide,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Chương ${chapter.title} đã bị ẩn bởi ${req.user.username}`,
      logNote: `Ẩn chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã bị ẩn',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi ẩn chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Unhides a chapter (for moderators/admins)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming action
 */
export const unhideChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    // Fetch chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    if (!chapter) {
      return sendErrorResponse(null, 'Chương không tồn tại', res, 404);
    }

    // Restrict to moderators/admins
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return sendErrorResponse(null, 'Không có quyền bỏ ẩn chương', res, 403);
    }

    // Update hidden status
    await Chapter.findByIdAndUpdate(
      chapterId,
      { 
        $set: { 
          isPublished: true,
          status: 'approved',
          updatedAt: new Date(),
          'moderating.isModerating': false,
          'moderating.moderateBy': null
        }
      },
      { session }
    );

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Chương ${chapter.title} đã được bỏ ẩn bởi ${req.user.username}`,
      logNote: `Bỏ ẩn chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã được bỏ ẩn',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi bỏ ẩn chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Retrieves statistics for a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with chapter statistics
 */
export const getChapterStats = async (req, res) => {
  try {
    const chapterId = await validateId(req.params.id, res);
    if (!chapterId) return;

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId)
      .populate('novelId', 'title')
      .lean();
    const chapterCheck = validateChapter(chapter, req.user);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 404);
    }

    // Aggregate statistics
    const stats = {
      viewCount: chapter.viewCount,
      averageListenTime: chapter.averageListenTime,
      reportCount: chapter.reports.length,
      isPublished: chapter.isPublished,
      status: chapter.status,
    };

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê chương thành công',
      data: stats,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê chương', res, 500);
  }
};
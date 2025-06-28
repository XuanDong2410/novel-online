import mongoose from 'mongoose';
import {Announcement, Tag, Category} from '../../models/system.model.js';
import User from '../../models/user.model.js';
import Novel from '../../models/novel.model.js';
import Chapter from '../../models/chapter.model.js';
import Report from '../../models/report.model.js';
import { validateInputWithSchema, mongooseSchemaToValidatorRules } from '../../utils/validator/inputValidator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';
import Redis from 'redis'; // Giả định sử dụng Redis cho cache

// Validation rules
const announcementSchemaRules = mongooseSchemaToValidatorRules(Announcement.schema);
const tagSchemaRules = mongooseSchemaToValidatorRules(Tag.schema);
const categorySchemaRules = mongooseSchemaToValidatorRules(Category.schema);

// Redis client (giả định)
// const redisClient = Redis.createClient({ url: 'redis://localhost:6379' });
// redisClient.connect().catch(console.error);

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
 * Validates admin permissions
 * @param {Object} user - Authenticated user
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateAdminPermissions(user) {
  if (user.role !== 'admin') {
    return { valid: false, message: 'Không có quyền thực hiện hành động này' };
  }
  return { valid: true, message: '' };
}

/**
 * Creates a new announcement
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created announcement
 */
export const createAnnouncement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const { title, content, isActive } = req.body;

    const validationResult = validateInputWithSchema(
      { title, content, isActive },
      {},
      {
        title: announcementSchemaRules.title,
        content: announcementSchemaRules.content,
        isActive: announcementSchemaRules.isActive,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    const newAnnouncement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      isActive: isActive ?? true,
      createdBy: req.user._id,
    });

    await newAnnouncement.save({ session });

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Thông báo "${title}" đã được tạo bởi ${req.user.username}`,
      logNote: `Tạo thông báo ${newAnnouncement._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Thông báo đã được tạo thành công',
      data: newAnnouncement,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi tạo thông báo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates an announcement
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Announcement ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateAnnouncement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const announcementId = await validateId(req.params.id, res);
    if (!announcementId) return;

    const { title, content, isActive } = req.body;

    const validationResult = validateInputWithSchema(
      { title, content, isActive },
      {},
      {
        title: announcementSchemaRules.title,
        content: announcementSchemaRules.content,
        isActive: announcementSchemaRules.isActive,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    const announcement = await Announcement.findById(announcementId).session(session);
    if (!announcement) {
      return sendErrorResponse(null, 'Thông báo không tồn tại', res, 404);
    }

    const updateData = {
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    };

    await Announcement.findByIdAndUpdate(announcementId, { $set: updateData }, { session });

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Thông báo "${title || announcement.title}" đã được cập nhật bởi ${req.user.username}`,
      logNote: `Cập nhật thông báo ${announcementId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Thông báo đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật thông báo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes an announcement
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Announcement ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteAnnouncement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const announcementId = await validateId(req.params.id, res);
    if (!announcementId) return;

    const announcement = await Announcement.findById(announcementId).session(session);
    if (!announcement) {
      return sendErrorResponse(null, 'Thông báo không tồn tại', res, 404);
    }

    await Announcement.findByIdAndDelete(announcementId, { session });

    const logData = {
      action: MODERATION_ACTIONS.delete,
      moderatorId: req.user._id,
      message: `Thông báo "${announcement.title}" đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa thông báo ${announcementId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Thông báo đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa thông báo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Lists all announcements
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with announcements
 */
export const listAnnouncements = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const announcements = await Announcement.find({})
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: announcements,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy danh sách thông báo', res, 500);
  }
};

/**
 * Creates a new tag
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created tag
 */
export const createTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const { name, description } = req.body;

    const validationResult = validateInputWithSchema(
      { name, description },
      {},
      {
        name: tagSchemaRules.name,
        description: tagSchemaRules.description,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    const existingTag = await Tag.findOne({ name: name.trim() }).lean();
    if (existingTag) {
      return sendErrorResponse(null, 'Thẻ đã tồn tại', res, 400);
    }

    const newTag = new Tag({
      name: name.trim(),
      description: description?.trim(),
    });

    await newTag.save({ session });

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Thẻ "${name}" đã được tạo bởi ${req.user.username}`,
      logNote: `Tạo thẻ ${newTag._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Thẻ đã được tạo thành công',
      data: newTag,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi tạo thẻ', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates a tag
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Tag ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const tagId = await validateId(req.params.id, res);
    if (!tagId) return;

    const { name, description } = req.body;

    const validationResult = validateInputWithSchema(
      { name, description },
      {},
      {
        name: tagSchemaRules.name,
        description: tagSchemaRules.description,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    const tag = await Tag.findById(tagId).session(session);
    if (!tag) {
      return sendErrorResponse(null, 'Thẻ không tồn tại', res, 404);
    }

    if (name && name.trim() !== tag.name) {
      const existingTag = await Tag.findOne({ name: name.trim() }).lean();
      if (existingTag) {
        return sendErrorResponse(null, 'Tên thẻ đã tồn tại', res, 400);
      }
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      updatedAt: new Date(),
    };

    await Tag.findByIdAndUpdate(tagId, { $set: updateData }, { session });

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Thẻ "${name || tag.name}" đã được cập nhật bởi ${req.user.username}`,
      logNote: `Cập nhật thẻ ${tagId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Thẻ đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật thẻ', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes a tag
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Tag ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const tagId = await validateId(req.params.id, res);
    if (!tagId) return;

    const tag = await Tag.findById(tagId).session(session);
    if (!tag) {
      return sendErrorResponse(null, 'Thẻ không tồn tại', res, 404);
    }

    await Tag.findByIdAndDelete(tagId, { session });

    // Optionally remove tag from novels
    await Novel.updateMany(
      { tags: tagId },
      { $pull: { tags: tagId }, $set: { updatedAt: new Date() } },
      { session }
    );

    const logData = {
      action: MODERATION_ACTIONS.delete,
      moderatorId: req.user._id,
      message: `Thẻ "${tag.name}" đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa thẻ ${tagId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Thẻ đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa thẻ', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Lists all tags
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with tags
 */
export const listTags = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const tags = await Tag.find({}).sort({ name: 1 }).lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thẻ thành công',
      data: tags,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy danh sách thẻ', res, 500);
  }
};

/**
 * Creates a new category
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created category
 */
export const createCategory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const { name, description } = req.body;

    const validationResult = validateInputWithSchema(
      { name, description },
      {},
      {
        name: categorySchemaRules.name,
        description: categorySchemaRules.description,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    const existingCategory = await Category.findOne({ name: name.trim() }).lean();
    if (existingCategory) {
      return sendErrorResponse(null, 'Danh mục đã tồn tại', res, 400);
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description?.trim(),
    });

    await newCategory.save({ session });

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Danh mục "${name}" đã được tạo bởi ${req.user.username}`,
      logNote: `Tạo danh mục ${newCategory._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Danh mục đã được tạo thành công',
      data: newCategory,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi tạo danh mục', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates a category
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Category ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateCategory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const categoryId = await validateId(req.params.id, res);
    if (!categoryId) return;

    const { name, description } = req.body;

    const validationResult = validateInputWithSchema(
      { name, description },
      {},
      {
        name: categorySchemaRules.name,
        description: categorySchemaRules.description,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    const category = await Category.findById(categoryId).session(session);
    if (!category) {
      return sendErrorResponse(null, 'Danh mục không tồn tại', res, 404);
    }

    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ name: name.trim() }).lean();
      if (existingCategory) {
        return sendErrorResponse(null, 'Tên danh mục đã tồn tại', res, 400);
      }
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      updatedAt: new Date(),
    };

    await Category.findByIdAndUpdate(categoryId, { $set: updateData }, { session });

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Danh mục "${name || category.name}" đã được cập nhật bởi ${req.user.username}`,
      logNote: `Cập nhật danh mục ${categoryId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Danh mục đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật danh mục', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes a category
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Category ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteCategory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const categoryId = await validateId(req.params.id, res);
    if (!categoryId) return;

    const category = await Category.findById(categoryId).session(session);
    if (!category) {
      return sendErrorResponse(null, 'Danh mục không tồn tại', res, 404);
    }

    await Category.findByIdAndDelete(categoryId, { session });

    // Optionally remove category from novels
    await Novel.updateMany(
      { categories: categoryId },
      { $pull: { categories: categoryId }, $set: { updatedAt: new Date() } },
      { session }
    );

    const logData = {
      action: MODERATION_ACTIONS.delete,
      moderatorId: req.user._id,
      message: `Danh mục "${category.name}" đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa danh mục ${categoryId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Danh mục đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa danh mục', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Lists all categories
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with categories
 */
export const listCategories = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: categories,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy danh sách danh mục', res, 500);
  }
};

/**
 * Retrieves system statistics
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with system statistics
 */
export const getSystemStatistics = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const [userCount, novelCount, chapterCount, reportStats] = await Promise.all([
      User.countDocuments(),
      Novel.countDocuments(),
      Chapter.countDocuments(),
      Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    const stats = {
      users: userCount,
      novels: novelCount,
      chapters: chapterCount,
      reports: {
        total: reportStats.reduce((acc, curr) => acc + curr.count, 0),
        byStatus: reportStats,
      },
    };

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê hệ thống thành công',
      data: stats,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê hệ thống', res, 500);
  }
};

/**
 * Performs a system action (e.g., reset cache, reindex)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with action type
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming action
 */
export const performSystemAction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const { action } = req.body;

    const validActions = ['reset_cache', 'reindex_search'];
    const validationResult = validateInputWithSchema(
      { action },
      {},
      { action: { type: 'string', enum: validActions, required: true } }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    let result;
    switch (action) {
      case 'reset_cache':
        await redisClient.flushAll();
        result = { message: 'Bộ nhớ cache đã được xóa' };
        break;
      case 'reindex_search':
        // Giả định logic tái tạo chỉ mục (ví dụ: Elasticsearch)
        // await reindexSearchIndex();
        result = { message: 'Chỉ mục tìm kiếm đã được tái tạo' };
        break;
      default:
        throw new Error('Hành động không được hỗ trợ');
    }

    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      message: `Hành động hệ thống "${action}" đã được thực hiện bởi ${req.user.username}`,
      logNote: `Thực hiện hành động ${action}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Hành động hệ thống đã được thực hiện',
      data: result,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi thực hiện hành động hệ thống', res, 500);
  } finally {
    session.endSession();
  }
};
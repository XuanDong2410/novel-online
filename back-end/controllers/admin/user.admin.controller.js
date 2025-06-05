import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import ModerationLog from '../../models/log.model.js';
import { validateId, validateDocument, schemas } from '../../utils/validator/unifiedValidator.js';
import { validateInputWithSchema } from '../../utils/validator/inputValidator.js';
import { sendErrorResponse } from '../../utils/sendErrorResponse.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';
// Lấy danh sách tất cả người dùng (chỉ admin)
export const getAllUsers = async (req, res) => {
  try {
    const { error, value } = schemas.getUsersQuery.validate(req.query);
    if (error) {
      return sendErrorResponse(null, error.details.map(d => d.message).join('; '), res, 400);
    }

    const { page, limit } = value;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Validate each user document
    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi lấy danh sách người dùng", res, 500);
  }
};
export const getUserById = async (req, res) => {
  try {
    const userId = validateId(req.params.id, res);
    if (!userId) return;

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return sendErrorResponse(null, 'Người dùng không tồn tại', res, 404);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thông tin người dùng', res, 500);
  }
};

export const updateUserRoleById = async (req, res) => {
  let session;
  try {

    const userId = validateId(req.params.id, res);
    if (!userId) return;

    if (res.headersSent) return;

    session = await mongoose.startSession();
    session.startTransaction();

    const { role } = req.body;

    // Kiểm tra admin cuối cùng
    if (role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const user = await User.findById(userId).session(session);
      if (user.role === 'admin' && adminCount <= 1) {
        await session.abortTransaction();
        session.endSession();
        return sendErrorResponse(null, 'Không thể thay đổi vai trò của admin cuối cùng', res, 400);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password').lean();

    if (!updatedUser) {
      return sendErrorResponse(null, 'Người dùng không tồn tại', res, 404);
    }
    // Ghi log
    const logData = {
      action: MODERATION_ACTIONS.notice,
      moderatorId: req.user._id,
      recipientId: updatedUser._id,
      message: `${req.user.username} đã cập nhật : Người dùng ${updatedUser.username} thành ${updatedUser.role}`,
      logNote: `${updatedUser.username}  -> ${updatedUser.role}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);
    if (!moderationResult.success) throw new Error(moderationResult.message);

    await session.commitTransaction();

    res.status(200).json({ success: true, message: 'Cập nhật vai trò thành công', user: updatedUser });
  } catch (error) {
    if (session) await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật vai trò', res, 500);
  } finally {
    if (session) session.endSession();
  }
};


export const toggleUserStatus = async (req, res) => {
  try {

    const userId = validateId(req.params.id, res);
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) {
      return sendErrorResponse(null, 'Người dùng không tồn tại', res, 404);
    }

    // Kiểm tra admin cuối cùng
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1 && user.isActive) {
        return sendErrorResponse(null, 'Không thể vô hiệu hóa admin cuối cùng', res, 400);
      }
    }

    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      success: true,
      message: `Người dùng đã được ${user.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      user: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi thay đổi trạng thái người dùng', res, 500);
  }
};

export const deleteUserById = async (req, res) => {
  let session = null;
  try {
    const userId = validateId(req.params.id, res);
    if (!userId) return;

    session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return sendErrorResponse(null, 'Người dùng không tồn tại', res, 404);
    }

    // Kiểm tra admin cuối cùng
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        await session.abortTransaction();
        session.endSession();
        return sendErrorResponse(null, 'Không thể xóa admin cuối cùng', res, 400);
      }
    }

    // Xóa tài liệu liên quan
    await Promise.all([
      Novel.deleteMany({ _id: { $in: user.uploadedNovels } }, { session }),
      Report.deleteMany({ _id: { $in: user.reportsMade } }, { session }),
      Appeal.deleteMany({ _id: { $in: user.appeals } }, { session }),
      Notification.deleteMany({ _id: { $in: user.notifications } }, { session }),
    ]);

    await User.findByIdAndDelete(userId, { session });

    // Ghi log
    const logData = {
      action: MODERATION_ACTIONS.delete,
      moderatorId: req.user._id,
      message: `Người dùng ${user.username} đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa người dùng ${userId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);
    if (!moderationResult.success) throw new Error(moderationResult.message);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (error) {
    if (session) await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa người dùng', res, 500);
  } finally {
    if (session) session.endSession();
  }
};

//TODO: Need to implement statistics in User model
export const getUserStatisticsById = async (req, res) => {
  try {

    const userId = validateId(req.params.id, res);
    if (!userId) return;

    const user = await User.findById(userId).select('username statistics').lean();
    if (!user) {
      return sendErrorResponse(null, 'Người dùng không tồn tại', res, 404);
    }

    res.status(200).json({
      success: true,
      username: user.username,
      statistics: user.statistics,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê người dùng', res, 500);
  }
};

export const getUserActivityLogsById = async (req, res) => {
  try {

    const userId = validateId(req.params.id, res);
    if (!userId) return;

    const { error, value } = schemas.getUsersQuery.validate(req.query);
    if (error) {
      return sendErrorResponse(null, error.details.map(d => d.message).join('; '), res, 400);
    }

    const { page, limit } = value;
    const skip = (page - 1) * limit;

    const logs = await ModerationLog.find({
      $or: [{ moderator: userId }, { recipientId: userId }],
    })
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('moderator', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await ModerationLog.countDocuments({
      $or: [{ moderator: userId }, { recipientId: userId }],
    });

    for (const log of logs) {
      const logCheck = await validateDocument('ModerationLog', log);
      if (!logCheck.valid) {
        return sendErrorResponse(null, logCheck.message, res, 400);
      }
    }

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy nhật ký hoạt động', res, 500);
  }
};

export const toggleBanUser = async (req, res) => {
  let session = null;
  try {
    const userId = validateId(req.params.id, res);
    if (!userId) return;

    session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return sendErrorResponse(null, 'Người dùng không tồn tại', res, 404);
    }

    // Kiểm tra admin cuối cùng
    if (user.role === 'admin' && !user.isBanned) {
      const adminCount = await User.countDocuments({ role: 'admin', isBanned: false });
      if (adminCount <= 1) {
        await session.abortTransaction();
        session.endSession();
        return sendErrorResponse(null, 'Không thể cấm admin cuối cùng', res, 400);
      }
    }

    user.isBanned = !user.isBanned;
    await user.save({ session });

    // Ghi log
    const logData = {
      action: user.isBanned ? MODERATION_ACTIONS.ban : MODERATION_ACTIONS.unBan,
      moderatorId: req.user._id,
      recipientId: user._id,
      message: `Người dùng ${user.username} đã bị ${user.isBanned ? 'cấm' : 'bỏ cấm'} bởi ${req.user.username}`,
      logNote: `${user.isBanned ? 'Cấm' : 'Bỏ cấm'} người dùng ${userId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);
    if (!moderationResult.success) throw new Error(moderationResult.message);

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: `Người dùng đã được ${user.isBanned ? 'cấm' : 'bỏ cấm'}`,
      user: { _id: user._id, isBanned: user.isBanned },
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi thay đổi trạng thái cấm', res, 500);
  } finally {
    if (session) session.endSession();
  }
};
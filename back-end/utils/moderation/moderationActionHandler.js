import Notification from "../../models/notification.model.js";
import ModerationLog from "../../models/log.model.js";
import User from "../../models/user.model.js";
import { MODERATION_ACTIONS } from "./constants/action.js";
import { getSystemUserId } from "../../config/systemAccount.config.js";
export const moderationActionHandler = async ({
  action, // Loại hành động: 'approved', 'edit', 'rejected', 'flagged'
  novelId = null, // ID của truyện
  chapterId = null, // ID của chương (nếu có)
  moderatorId = null, // ID của người thực hiện hành động (nếu có)
  recipientId, // ID của người nhận thông báo
  message, // Nội dung thông báo
  logNote = "Không có ghi chú", // Ghi chú cho log
  details = null, // Chi tiết bổ sung
}) => {
  try {
    // Kiểm tra tính hợp lệ của hành động
    if (!Object.values(MODERATION_ACTIONS).includes(action)) {
      return { success: false, message: `Hành động không hợp lệ: ${action}` };
    }

    // Kiểm tra quyền của moderator (trừ hành động hệ thống)
    let isSystemAction = [
      MODERATION_ACTIONS.systemBan,
      MODERATION_ACTIONS.systemFlag,
      MODERATION_ACTIONS.systemNotice,
    ].includes(action);
    let effectiveModeratorId = moderatorId;

    if (isSystemAction) {
      effectiveModeratorId = await getSystemUserId(); // Lấy _id của tài khoản hệ thống
    } 
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return { success: false, message: "Không tìm thấy người nhận thông báo" };
    }

    // 1. Gửi thông báo
    const notification = await Notification.create({
      from: effectiveModeratorId || null,
      to: recipientId,
      type: getNotificationType(action),
      message,
      read: false,
    });
    // 2. Ghi log hành động
    const log = await ModerationLog.create({
      novelId,
      chapterId,
      moderator: effectiveModeratorId,
      action,
      note: logNote,
      details: details ? details : message,
      isSystemAction,
    });
    return {
      success: true,
      notification,
      log,
    };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi khi gửi thông báo hoặc ghi log",
      error: error.message,
    };
  }
};
export const getNotificationType = (action) => {
  const notificationTypeMap = {
    [MODERATION_ACTIONS.approve]: "adminNotice",
    [MODERATION_ACTIONS.reject]: "adminNotice",
    [MODERATION_ACTIONS.requestEdit]: "adminNotice",
    [MODERATION_ACTIONS.flag]: "adminNotice",
    [MODERATION_ACTIONS.ban]: "adminNotice",
    [MODERATION_ACTIONS.unBan]: "adminNotice",
    [MODERATION_ACTIONS.hide]: "adminNotice",
    [MODERATION_ACTIONS.unHide]: "adminNotice",
    [MODERATION_ACTIONS.notice]: "adminNotice",
    [MODERATION_ACTIONS.warning]: "adminNotice",
    [MODERATION_ACTIONS.systemBan]: "systemNotice",
    [MODERATION_ACTIONS.systemFlag]: "systemNotice",
    [MODERATION_ACTIONS.systemNotice]: "systemNotice",
    [MODERATION_ACTIONS.userNotice]: "userNotice",
    [MODERATION_ACTIONS.userReport]: "userReport",
    [MODERATION_ACTIONS.userAppeal]: "userAppeal",
  };
  return notificationTypeMap[action] || "adminNotice";
};
// Hàm kiểm tra và xử lý vi phạm tự động
export const handleViolationThreshold = async (
  userId,
  violationCountThreshold = 5
) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: "Không tìm thấy người dùng" };

    if (user.violation.count >= violationCountThreshold) {
      user.isBanned = true; // Khóa tài khoản
      await user.save();

      // Gửi thông báo khóa tài khoản
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.systemBan,
        recipientId: user._id,
        message: `Tài khoản của bạn đã bị khóa do vi phạm quá ${violationCountThreshold} lần`,
        logNote: "Khóa tài khoản do vi phạm ngưỡng",
        details: {
          violationCount: user.violation.count,
          timestamp: new Date(),
        },
      });

      return result;
    }

    return { success: true, message: "Chưa đạt ngưỡng vi phạm" };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi khi kiểm tra ngưỡng vi phạm",
      error: error.message,
    };
  }
};

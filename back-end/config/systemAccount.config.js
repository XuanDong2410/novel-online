// Tạo tài khoản hệ thống khi khởi động
import User from '../models/user.model.js';
import bcrypt from "bcryptjs";
import { ENV_VARS } from './env.config.js';
// Biến toàn cục để lưu _id của tài khoản hệ thống
let systemUserId = null;

export const initializeSystemUser = async () => {
  try {
    const systemUser = await User.findOne({ role: 'system' });
    if (!systemUser) {
      await User.create({
        username: 'system',
        email: 'system@platform.com',
        password: await bcrypt.hash(ENV_VARS.SYSTEM_USER_PASSWORD, 10), // Đảm bảo mã hóa
        role: 'system',
        isActive: true,
        isBanned: false,
      });
      console.log('Tài khoản hệ thống đã được tạo');
    }
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản hệ thống:', error);
  }
};
// Hàm lấy _id của tài khoản hệ thống
export const getSystemUserId = async () => {
  if (systemUserId) {
    return systemUserId; // Trả về _id từ bộ nhớ
  }
  // Nếu chưa có, thử tìm trong cơ sở dữ liệu
  const systemUser = await User.findOne({ role: 'system' });
  if (!systemUser) {
    throw new Error('Tài khoản hệ thống chưa được khởi tạo');
  }
  systemUserId = systemUser._id;
  return systemUserId;
};
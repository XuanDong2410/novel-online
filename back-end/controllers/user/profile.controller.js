// controllers/user/profile.controller.js

import User from '../../models/user.model.js';
import bcrypt from 'bcryptjs';

// Lấy thông tin người dùng hiện tại
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cập nhật thông tin cá nhân (username, email, image)
//TODO: xác thực email trong quá trình cập nhật
export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;

    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    console.log('Updating user:', req.user._id);
    console.log('Updates:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found or update failed' });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};
//TODO: Cập nhật ảnh đại diện
// Cập nhật ảnh đại diện (image)

// Đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
     if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ success: false, message: 'Change password failed' });
  }
};
export const getFavoriteNovels = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favoriteNovels");

    return res.status(200).json({
      success: true,
      novels: user.favoriteNovels
    });
  } catch (err) {
    console.error("Get favorite novels error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
import User from '../../models/user.model.js';

// Lấy danh sách tất cả người dùng (chỉ admin)
export const getAllUsers = async (req, res) => {
  try {
    // Phân trang (tùy chọn)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Có thể thêm lọc/tìm kiếm tại đây nếu cần
    const users = await User.find()
      .select("-password") // Ẩn password
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

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
    console.error("Error getting user list:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
};

export const updateUserRoleById = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'moderator', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'Role updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
  }
};


export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User has been ${user.isActive ? 'activated' : 'deactivated'}`,
      user: { _id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Action failed', error: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
};

//TODO: Need to implement statistics in User model
export const getUserStatisticsById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username statistics');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      username: user.username,
      statistics: user.statistics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
};

export const getUserActivityLogsById = async (req, res) => {
  //TODO:
}

export const toggleBanUser = async (req, res) => {
  //TODO:
}
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

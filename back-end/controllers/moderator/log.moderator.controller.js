import mongoose from 'mongoose';
import ModerationLog from '../../models/log.model.js';

/**
 * GET /moderation-logs?page=1&limit=20
 * Xem tất cả bản ghi kiểm duyệt (có phân trang).
 */
export const getAllModerationLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ModerationLog.find()
        .populate('novelId', 'title')
        .populate('chapterId', 'title')
        .populate('moderator', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ModerationLog.countDocuments()
    ]);

    res.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách bản ghi.', error });
  }
};

/**
 * GET /moderation-logs/:id
 * Xem chi tiết một bản ghi kiểm duyệt.
 */
export const getModerationLogById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID bản ghi không hợp lệ.' });
    }
    const log = await ModerationLog.findById(req.params.id)
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('moderator', 'name email')
      .lean();

    if (!log) return res.status(404).json({ message: 'Không tìm thấy bản ghi.' });

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy bản ghi.', error});
  }
};

/**
 * DELETE /moderation-logs/:id
 * Xóa một bản ghi kiểm duyệt.
 */
export const deleteModerationLogById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID bản ghi không hợp lệ.' });
    }
    const deleted = await ModerationLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy bản ghi để xoá.' });

    res.json({ message: 'Đã xoá bản ghi thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá bản ghi.', error });
  }
};

/**
 * DELETE /moderation-logs
 * Xóa toàn bộ bản ghi kiểm duyệt.
 */
export const deleteAllModerationLogs = async (req, res) => {
  try {
    // Yêu cầu xác nhận qua body (ví dụ: { confirm: true })
    if (!req.body.confirm) {
      return res.status(400).json({ message: 'Yêu cầu xác nhận để xóa toàn bộ bản ghi.' });
    }
    await ModerationLog.deleteMany({});
    res.json({ message: 'Đã xoá toàn bộ bản ghi kiểm duyệt.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá toàn bộ bản ghi.', error });
  }
};

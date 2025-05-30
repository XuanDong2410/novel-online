import Novel from "../../models/novel.model.js";
import Chapter from "../../models/chapter.model.js";
import User from "../../models/user.model.js";
import ModerationLog from "../../models/moderationLog.model.js";

export const moderateNovel = async (req, res) => {
  try {
    const { action, note, details } = req.body;
    const novelId = req.params.id;
    const moderator = req.user;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Hành động không hợp lệ",
      });
    }

    const novel = await Novel.findById(novelId);
    if (!novel || novel.statusPublish !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Truyện không tồn tại hoặc không ở trạng thái chờ duyệt",
      });
    }

    if (action === "approve") {
      novel.statusPublish = "approved";
      novel.isPublished = true;
      novel.publishDate = new Date();
      await Chapter.updateMany(
        { novelId },
        { status: "approved", isPublished: true }
      );
    } else {
      novel.statusPublish = "rejected";
      // Ghi log cho vi phạm
      await new ModerationLog({
        novelId,
        moderator: moderator._id,
        action: "rejected",
        note,
        details,
      }).save();
    }

    await novel.save();

    // Gửi thông báo cho người dùng
    await User.findByIdAndUpdate(novel.createdBy, {
      $push: {
        notifications: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Notification",
          data: { novelId, action, note },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Truyện đã được ${action === "approve" ? "phê duyệt" : "từ chối"}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
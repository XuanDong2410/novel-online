import Novel from "../../models/novel.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";

// Người dùng yêu thích hoặc huỷ yêu thích một truyện
export const toggleFavoriteNovel = async (req, res) => {
  try {
    const userId = req.user._id;
    const novelId = req.params.novelId;

    const novel = await Novel.findById(novelId);
    const user = await User.findById(userId);

    if (!novel) {
      return res.status(404).json({ success: false, message: 'Novel not found' });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isFavorited = novel.favorites.includes(userId);

    if (isFavorited) {
      // ✅ BỎ yêu thích
      novel.favorites.pull(userId);
      user.favoriteNovels.pull(novel._id);

      // Xoá thông báo favorite chưa đọc nếu có
      await Notification.deleteMany({
        from: userId,
        to: novel.createdBy,
        type: 'favorite',
        read: false
      });

    } else {
      // ✅ Thêm yêu thích
      novel.favorites.push(userId);
      user.favoriteNovels.push(novel._id);

      // Kiểm tra nếu chưa có thông báo cùng loại và chưa đọc thì mới tạo
      const existingNotification = await Notification.findOne({
        from: userId,
        to: novel.createdBy,
        type: 'favorite',
        read: false
      });

      if (!existingNotification && String(userId) !== String(novel.createdBy)) {
        const newNotification = new Notification({
          from: userId,
          to: novel.createdBy,
          type: 'favorite',
          message: `${user.username} đã yêu thích truyện "${novel.title}" của bạn.`,
          read: false
        });
        await newNotification.save();
      }
    }

    await novel.save();
    await user.save();

    res.status(200).json({ success: true, message: isFavorited ? 'Removed from favorites' : 'Added to favorites' });
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUsersWhoFavoriteNovel = async (req, res) => {
  try {
    const { novelId } = req.params;
    const novel = await Novel.findById(novelId).populate("favorites", "username image");

    if (!novel) return res.status(404).json({ success: false, message: "Novel not found" });

    return res.status(200).json({
      success: true,
      users: novel.favorites
    });
  } catch (err) {
    console.error("Get users who favorited novel error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const viewFavoriteNovels = async (req, res) => {
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
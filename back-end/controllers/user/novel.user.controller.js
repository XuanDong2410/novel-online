import Novel from "../../models/novel/novel.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";

// Người dùng yêu thích hoặc huỷ yêu thích một truyện
export const toggleFavoriteNovel = async (req, res) => {
  try {
    const userId = req.user._id;
    const { novelId } = req.params;

    const novel = await Novel.findById(novelId);
    const user = await User.findById(userId);

    if (!novel || !user) {
      return res.status(404).json({ success: false, message: 'Novel or user not found' });
    }

    const isFavorited = novel.favorites.includes(userId);

    if (isFavorited) {
      // ✅ BỎ yêu thích
      novel.favorites.pull(userId);
      user.favoriteNovels.pull(novel._id);

      // Xoá thông báo favorite chưa đọc nếu có
      await Notification.deleteMany({
        from: userId,
        to: novel.user,
        type: 'novel',
        message: 'favorite',
        read: false
      });

    } else {
      // ✅ Thêm yêu thích
      novel.favorites.push(userId);
      user.favoriteNovels.push(novel._id);

      // Kiểm tra nếu chưa có thông báo cùng loại và chưa đọc thì mới tạo
      const existingNotification = await Notification.findOne({
        from: userId,
        to: novel.user,
        type: 'novel',
        message: 'favorite',
        read: false
      });

      if (!existingNotification && String(userId) !== String(novel.user)) {
        const newNotification = new Notification({
          from: userId,
          to: novel.user,
          type: 'novel',
          message: 'favorite'
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

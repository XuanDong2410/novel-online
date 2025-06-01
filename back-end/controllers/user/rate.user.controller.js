import Rate from "../../models/rate.model.js";
import Novel from "../../models/novel.model.js";
// import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";

export const createOrUpdateRate = async (req, res) => {
  try {
    const { novelId } = req.params;
    const { rate, text } = req.body;
    const userId = req.user._id;

    const novel = await Novel.findById(novelId);
    if (!novel) return res.status(404).json({ message: "Novel not found" });

    const existingRate = await Rate.findOne({ novel: novelId, user: userId });

    if (existingRate) {
      // Giới hạn chỉnh sửa: không cho sửa trong vòng 1 giờ
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(existingRate.createdAt) > oneHourAgo) {
        return res.status(429).json({
          message: "You can only update your rating once per hour."
        });
      }

      // Cập nhật đánh giá
      existingRate.rate = rate;
      existingRate.text = text;
      await existingRate.save();

    } else {
      // Thêm đánh giá mới
      await Rate.create({ novel: novelId, user: userId, rate, text });
    }

    // Cập nhật điểm trung bình
    const allRates = await Rate.find({ novel: novelId });
    const avg = allRates.reduce((sum, r) => sum + r.rate, 0) / allRates.length;
    novel.averageRating = parseFloat(avg.toFixed(1));
    await novel.save();

    // Thông báo cho người đăng truyện (nếu không phải tự đánh giá truyện mình)
    if (novel.user.toString() !== userId.toString()) {
      await Notification.create({
        from: userId,
        to: novel.user,
        type: "rate",
        message: `${req.user.username} đã đánh giá truyện "${novel.title}" của bạn với điểm ${rate}.`,
        read: false
      });
    }

    return res.status(200).json({
      success: true,
      message: existingRate ? "Rating updated" : "Rated successfully"
    });

  } catch (err) {
    console.error("Rate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getRatesByNovel = async (req, res) => {
  try {
    const { novelId } = req.params;
    const rates = await Rate.find({ novel: novelId })
      .populate("user", "username image")
      .sort({ createdAt: -1 });

    res.json({ success: true, rates });
  } catch (err) {
    console.error("Get rates error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteRate = async (req, res) => {
  try {
    const { novelId } = req.params;
    const userId = req.user._id;

    const deleted = await Rate.findOneAndDelete({ novel: novelId, user: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Rate not found" });
    }

    // Cập nhật lại điểm trung bình
    const remaining = await Rate.find({ novel: novelId });
    const avg = remaining.length > 0
      ? remaining.reduce((acc, r) => acc + r.rate, 0) / remaining.length
      : 0;

    await Novel.findByIdAndUpdate(novelId, { averageRating: parseFloat(avg.toFixed(1))});

    res.json({ success: true, message: "Rate removed" });
  } catch (err) {
    console.error("Delete rate error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

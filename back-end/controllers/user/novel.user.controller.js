import Novel from "../../models/novel.model.js";
import NovelAttribute from "../../models/novel.model.js";
import User from "../../models/user.model.js";
import Chapter from "../../models/chapter.model.js";
import { validateCreateNovel } from "../../utils/validator.js"; // Validator tùy chỉnh

export const createNovel = async (req, res) => {
  try {
    const { title, description, author, attributes, tags, coverImage } = req.body;
    const userId = req.user._id;

    // Xác thực đầu vào
    const { error } = validateCreateNovel(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Kiểm tra trùng lặp tiêu đề
    const existingNovel = await Novel.findOne({ title: title.trim() }).lean();
    if (existingNovel) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề truyện đã tồn tại",
      });
    }

    // Kiểm tra attributes (genres, subgenres, v.v.)
    const validAttributes = await NovelAttribute.find({
      _id: { $in: attributes || [] },
      isActive: true,
    }).lean();
    if (attributes && validAttributes.length !== attributes.length) {
      return res.status(400).json({
        success: false,
        message: "Một hoặc nhiều thuộc tính không hợp lệ",
      });
    }

    // Tạo truyện mới
    const newNovel = new Novel({
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      createdBy: userId,
      attributes: attributes || [],
      tags: tags || [],
      coverImage,
      statusPublish: "draft",
    });

    await newNovel.save();

    // Cập nhật uploadedNovels của người dùng
    await User.findByIdAndUpdate(userId, {
      $push: { uploadedNovels: newNovel._id },
    });

    res.status(201).json({
      success: true,
      message: "Truyện nháp được tạo thành công",
      data: newNovel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo truyện",
      error: error.message,
    });
  }
};

export const requestPublish = async (req, res) => {
  try {
    const novelId = req.params.id;
    const userId = req.user._id;

    const novel = await Novel.findOne({ _id: novelId, createdBy: userId }).lean();
    if (!novel) {
      return res.status(404).json({
        success: false,
        message: "Truyện không tồn tại hoặc bạn không có quyền",
      });
    }

    if (novel.statusPublish !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Truyện không ở trạng thái nháp",
      });
    }

    const chapterCount = await Chapter.countDocuments({ novelId });
    if (chapterCount < 10) {
      return res.status(400).json({
        success: false,
        message: "Truyện phải có ít nhất 10 chương",
      });
    }

    await Novel.findByIdAndUpdate(novelId, { statusPublish: "pending" });

    res.status(200).json({
      success: true,
      message: "Yêu cầu xuất bản đã được gửi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
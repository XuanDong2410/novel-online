import Chapter from "../../models/chapter.model.js";
import Novel from "../../models/novel.model.js";
import { validateCreateChapter } from "../../utils/validator.js";

export const createChapter = async (req, res) => {
  try {
    const { novelId, title, content, chapterNumber, language } = req.body;
    const userId = req.user._id;

    // Xác thực đầu vào
    const { error } = validateCreateChapter(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Kiểm tra truyện
    const novel = await Novel.findOne({ _id: novelId, createdBy: userId }).lean();
    if (!novel) {
      return res.status(404).json({
        success: false,
        message: "Truyện không tồn tại hoặc bạn không có quyền",
      });
    }

    // Kiểm tra chapterNumber duy nhất
    const existingChapter = await Chapter.findOne({ novelId, chapterNumber }).lean();
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: "Số chương đã tồn tại",
      });
    }

    // Kiểm tra nội dung bằng AI (giả định có hàm checkContentByAI)
    const { hasViolation, violationDetails } = await checkContentByAI(content); // Hàm giả định

    // Tạo chương
    const chapter = new Chapter({
      novelId,
      title: title.trim(),
      content: content.trim(),
      chapterNumber,
      language: language || req.user.language || "vi",
      status: "pending",
      aiViolationFlag: hasViolation,
      aiViolationDetails: violationDetails,
    });

    await chapter.save();

    // Ghi log nếu có vi phạm
    if (hasViolation) {
      await new ModerationLog({
        novelId,
        chapterId: chapter._id,
        action: "flagged",
        note: "Nội dung chương bị gắn cờ bởi AI",
        details: violationDetails,
      }).save();
    }

    res.status(201).json({
      success: true,
      message: "Chương được tạo thành công",
      data: chapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo chương",
      error: error.message,
    });
  }
};
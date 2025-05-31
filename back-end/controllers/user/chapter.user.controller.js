import Chapter from "../../models/chapter.model.js";
import Novel from "../../models/novel.model.js";
// import ModerationLog from "../../models/moderationLog.model.js";
import { validateCreateChapter } from "../../utils/validator.js";
// import { checkContentByAI } from "../../utils/moderation/index.js";

// const createModerationLog = async (novelId, chapterId, details) => {
//   await new ModerationLog({
//     novelId,
//     chapterId,
//     action: "flagged",
//     note: "Nội dung chapter bị gắn cờ vi phạm",
//     details,
//   }).save();
// }
// export const createChapter = async (req, res) => {
//   try {
//     const { novelId, title, content, chapterNumber } = req.body;
//     const userId = req.user._id;

//     // Xác thực đầu vào
//     const { error } = validateCreateChapter(req.body);
//     if (error) {
//       return res.status(400).json({ success: false, message: error.details[0].message });
//     }

//     // Kiểm tra truyện
//     const novel = await Novel.findOne({ _id: novelId, createdBy: userId }).lean();
//     if (!novel) {
//       return res.status(404).json({
//         success: false,
//         message: "Truyện không tồn tại",
//       });
//     }

//     // Kiểm tra chapterNumber duy nhất
//     const existingChapter = await Chapter.findOne({ novelId, chapterNumber }).lean();
//     if (existingChapter) {
//       return res.status(400).json({
//         success: false,
//         message: "Số chương đã tồn tại",
//       });
//     }

//     // Kiểm tra nội dung bằng AI (giả định có hàm checkContentByAI)
//     const { hasViolation, violationDetails, labels, rawResult } = await checkContentByAI(content); // Hàm giả định
    
//     const moderationDetails = {
//       violationDetails,
//       labels,
//       rawResult,
//     };

//     // Tạo chương
//     const chapter = new Chapter({
//       novelId,
//       title: title.trim(),
//       content: content.trim(),
//       chapterNumber,
//       status: "pending",
//       aiViolationFlag: hasViolation,
//       aiViolationDetails: moderationDetails,
//     });

//     await chapter.save();

//     // Ghi log nếu có vi phạm
//     if (hasViolation) {
//       await createModerationLog(novelId, chapter._id, moderationDetails);
//     }

//     res.status(201).json({
//       success: true,
//       message: "Chương được tạo thành công",
//       data: chapter,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Lỗi server khi tạo chương",
//       error: error.message,
//     });
//   }
// };
export const createChapter = async (req, res) => {
  try {
    const { novelId, title, content, chapterNumber } = req.body;
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
        message: "Truyện không tồn tại",
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

    // Tạo chương
    const chapter = new Chapter({
      novelId,
      title: title.trim(),
      content: content.trim(),
      chapterNumber,
      status: "pending",
      aiViolationFlag: false,
      aiViolationDetails: null,
    });

    await chapter.save();

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
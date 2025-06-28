import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.config.js';
import Chapter from "../models/chapter.model.js";
import Novel from "../models/novel.model.js";

import { generateDefaultAudio, generateCustomAudio } from "../utils/textToSpeech/generate.js";
import { generatePreviewAudio } from "../utils/textToSpeech/processAudio.js"
import { validateInputWithSchema, mongooseSchemaToValidatorRules, standardValidators } from '../utils/validator/inputValidator.js';
import { validateChapter } from '../utils/validator/ownValidator.js';
import { MODERATION_ACTIONS } from '../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../utils/moderation/moderationActionHandler.js';
import { sendErrorResponse } from '../utils/sendErrorResponse.js';
import { getVietnameseVoices } from '../utils/textToSpeech/voiceCache.js';
// Convert Mongoose schema to validation rules for Chapter
const chapterSchemaRules = mongooseSchemaToValidatorRules(Chapter.schema);
chapterSchemaRules.contentUrl.validate = standardValidators.url;
chapterSchemaRules.audioFileUrl.validate = standardValidators.url;
chapterSchemaRules.subtitleFileUrl.validate = standardValidators.url;
chapterSchemaRules.novelId.crossValidate = async (data) => {
  if (!data.novelId) return true;
  const novel = await Novel.findById(data.novelId).lean();
  return novel ? true : 'Novel does not exist';
};
/**
 * CRUD STRUCTURE FOR CHAPTER CONTROLLER
 * --------------------------------------
 * 1. CREATE
 *    - createChapter
 *    - generateAudio
 *    - generateCustomAudio
 *    - generateAudioAndVTT
 *    - generateJob
 *
 * 2. READ
 *    - getAllChaptersByNovel
 *    - viewMyChapters
 *    - getChapterByNovel
 *    - getChapterById
 *    - viewMyChapterById
 *    - getChapterStats
 *    - getSyncVoices
 *    - getJobStatus
 *    - countChapterWords
 *
 * 3. UPDATE
 *    - updateChapter
 *    - updateChapterMedia
 *    - requestPublish
 *    - requestEdit
 *    - cancelRequest
 *    - resubmitChapter
 *    - hideChapter
 *    - unhideChapter
 *
 * 4. DELETE
 *    - deleteChapter
 *    - deleteAllChaptersByIdNovel
 *
 * NOTE: The following functions have similar or overlapping functionality:
 * - getAllChaptersByNovel //SAME
 * - viewMyChapters        //SAME
 *   => Both retrieve chapters of a novel, but with different filters (ownership, etc.)
 *
 * - getChapterByNovel     //SAME
 * - getChapterById        //SAME
 * - viewMyChapterById     //SAME
 *   => All fetch a single chapter by id, with different access control or query logic.
 *
 * - deleteAllChaptersByIdNovel //SAME
 * - deleteChapter              //SAME
 *   => Both delete chapters, one by novel, one by chapter.
 */
/**
 * Creates a new chapter
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created chapter
 */
// export const generateAudio = async (req, res) => {
//   try {
//     const { chapterId } = req.params;

//     // Tìm chapter
//     const chapter = await Chapter.findById(chapterId);
//     if (!chapter) {
//       return res.status(404).json({ message: 'Chapter not found' });
//     }

//     // Gọi hàm generate để tạo tất cả âm thanh tiếng Việt
//     const results = await generate(chapter.content, chapter.novelId.toString(), chapter.title);

//     // Lưu vào Audio model
//     const audioDocs = await Promise.all(
//       results.map(async ({ audioFileUrl, subtitleFileUrl, voiceConfig, duration, size }) => {
//         const audio = new Audio({
//           audioName: `${voiceConfig.name}-${formatName(chapter.novelId.toString())}-${formatName(chapter.title)}`,
//           audioFileUrl,
//           audioFileType: 'MP3',
//           duration,
//           size,
//           status: 'processed',
//           voice: {
//             languageCodes: voiceConfig.languageCodes,
//             name: voiceConfig.name,
//             ssmlGender: voiceConfig.ssmlGender,
//             naturalSampleRateHertz: voiceConfig.naturalSampleRateHertz,
//           },
//           subtitle: {
//             url: subtitleFileUrl,
//             language: voiceConfig.languageCodes[0],
//             format: 'VTT',
//           },
//           chapterId,
//         });
//         return audio.save();
//       })
//     );

//     // Cập nhật Chapter
//     const audioIds = audioDocs.map((doc) => doc._id);
//     chapter.audioFileUrl = audioDocs[0]?.audioFileUrl; // Giữ lại trường cũ
//     chapter.subtitleFileUrl = audioDocs[0]?.subtitle?.url; // Giữ lại trường cũ
//     await chapter.save();

//     res.status(200).json({ message: 'All Vietnamese audio and VTT generated successfully', audios: audioDocs });
//   } catch (error) {
//     console.error(`Error creating audio: ${error.message}`);
//     res.status(500).json({ message: 'Failed to generate audio and VTT' });
//   }
// }

export const createDefaultAudio = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    const novel = await Novel.findById(chapter.novelId);
    if (!novel) return res.status(404).json({ error: 'Novel not found' });
    // chapter.content,
    // console.log("Testing audio generation: ", testContent);
    const { audioUrl, subtitleFileUrl, voiceConfig, duration, size } = await generateDefaultAudio(
      chapter.content,
      novel.title, 
      chapter.title,
      chapterId
    );

    res.status(201).json({
      audioUrl,
      subtitleFileUrl,
      voiceConfig,
      duration,
      size,
    });
  } catch (error) {
    console.error(`Error in default audio generation: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate default audio' });
  }
}

export const previewAudioChapter = async (req, res) => {
  try {
    const { text, voiceConfig, customConfig } = req.body;

    if (!text || !voiceConfig || !voiceConfig.name || !voiceConfig.languageCodes?.[0]) {
      return res.status(400).json({ message: 'Missing required fields for preview audio generation.' });
    }
    const { signedUrl } = await generatePreviewAudio(text, voiceConfig, customConfig);
    // Trả về signed URL cho frontend
    res.status(200).json({ audioUrl: signedUrl });

  } catch (error) {
    console.error('Error generating preview audio:', error);
    // Google Cloud TTS có thể trả về lỗi chi tiết hơn
    if (error.code && error.details) {
      console.error('Google Cloud TTS Error Details:', error.code, error.details);
    }
    res.status(500).json({ message: error.message || 'Failed to generate preview audio' });
  }
};
export const createCustomAudio = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { voiceConfig, customConfig } = req.body;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    const novel = await Novel.findById(chapter.novelId);
    if (!novel) return res.status(404).json({ error: 'Novel not found' });
    if (!voiceConfig || !voiceConfig.name) return res.status(400).json({ error: 'Voice config required' });

    const { audioFileUrl, subtitleFileUrl, duration, size } = await generateCustomAudio(
      chapter.content,
      novel.title,
      chapter.title,
      chapterId,
      voiceConfig,
      customConfig || {}
    );

    res.status(201).json({
      audioFileUrl,
      subtitleFileUrl,
      voiceConfig,
      duration,
      size,
    });
  } catch (error) {
    console.error(`Error in custom audio generation: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate custom audio' });
  }
}

export const getVoices = async (req, res) => {
  try {
    const voices = await getVietnameseVoices();
    res.status(200).json({ voices });
  } catch (error) {
    console.error(`Error syncing voices: ${error.message}`);
    res.status(500).json({ error: 'Failed to sync voices' });
  }
}

/**
 * Retrieves statistics for a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with chapter statistics
 */
export const getChapterStats = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId)
      .populate('novelId', 'title')
      .lean();
    const chapterCheck = await validateChapter(chapter, req.user);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 404);
    }

    // Aggregate statistics
    const stats = {
      viewCount: chapter.viewCount,
      averageListenTime: chapter.averageListenTime,
      reportCount: chapter.reports.length,
      isPublished: chapter.isPublished,
      status: chapter.status,
    };

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê chương thành công',
      data: stats,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê chương', res, 500);
  }
};
export const getChaptersByNovel = async (req, res) => {
    const { novel } = req.params;
    try {        
        const novelId = novel.toString()
        // console.log(novelId);
        const chapters = await Chapter.find({ novelId: novelId }).populate('audios');
        // .log("Chapter: " + chapters)
          // Kiểm tra nếu không có chương nào
          if (!chapters || chapters.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No chapters found for this novel",
            });
        }

        res.status(200).json({
            success: true,
            message: "Chapters fetched successfully",
            data: chapters
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Err: " + error.message,
            novel: novel
        });
    }
}

export const getChapterById = async (req, res) => {
    try {

        const chapter = await Chapter.findById(req.params.chapterId).populate('audios');
        if(!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            })
        }
        res.status(200).json({
            success: true,
            message: "Chapter fetched successfully",
            data: chapter
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Updates a chapter's metadata
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = req.params.chapterId;
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    const { title, content, chapterNumber } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { title, content, chapterNumber },
      {},
      {
        title: chapterSchemaRules.title,
        content: chapterSchemaRules.content,
        chapterNumber: chapterSchemaRules.chapterNumber,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    if(req.user.role != 'admin' || 'moderator'){
      const chapterCheck = await validateChapter(chapter, req.user, ['draft', 'editing']);
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
    }
    // const chapterCheck = await validateChapter(chapter, req.user, ['draft', 'editing']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Check for duplicate chapter number
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await Chapter.findOne({ novelId: chapter.novelId, chapterNumber }).lean();
      if (existingChapter) {
        return sendErrorResponse(null, 'Số chương đã tồn tại cho truyện này', res, 400);
      }
    }

    // Update chapter
    const updateData = {
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(chapterNumber && { chapterNumber }),
      updatedAt: new Date(),
    };

    await Chapter.findByIdAndUpdate(chapterId, { $set: updateData }, { session });

    // Update novel's latestChapter if necessary
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const latestChapter = await Chapter.findOne({ novelId: chapter.novelId })
        .sort({ chapterNumber: -1 })
        .lean();
      await Novel.findByIdAndUpdate(
        chapter.novelId,
        { $set: { 'chapters.latestChapter': latestChapter, updatedAt: new Date() } },
        { session }
      );
    }
    if (chapter.status === 'editing') {
      // Log moderation action
      const novel = await Novel.findById(chapter.novelId).lean();
      const moderationResult = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: chapter.novelId,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel?.moderation?.moderator,
        message: `Chương ${chapter.title} đã được cập nhật (${novel.title})`,
        logNote: `Cập nhật chương ${chapter.title}`,
      }, session);

      if (!moderationResult.success) {
        throw new Error(moderationResult.message);
      }
    }
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật chương', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates a chapter's media (audioFileUrl, subtitleFileUrl)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.body - Request body with media URLs
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
//TODO: need check
export const updateChapterMedia = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = req.params.chapterId;
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    const { audioFileUrl, subtitleFileUrl } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { audioFileUrl, subtitleFileUrl },
      {},
      {
        audioFileUrl: chapterSchemaRules.audioFileUrl,
        subtitleFileUrl: chapterSchemaRules.subtitleFileUrl,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = await validateChapter(chapter, req.user, ['draft', 'editing', 'pending']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Update media
    const updateData = {
      ...(audioFileUrl && { audioFileUrl: audioFileUrl.trim() }),
      ...(subtitleFileUrl && { subtitleFileUrl: subtitleFileUrl.trim() }),
      updatedAt: new Date(),
    };

    await Chapter.findByIdAndUpdate(chapterId, { $set: updateData }, { session });

    // Log moderation action
    const novel = await Novel.findById(chapter.novelId).lean();
    const moderationResult = await moderationActionHandler({
      action: MODERATION_ACTIONS.notice,
      novelId: chapter.novelId,
      chapterId: chapter._id,
      moderatorId: req.user._id,
      recipientId: novel.createdBy,
      message: `Media của chương ${chapter.title} đã được cập nhật`,
      logNote: `Cập nhật media chương ${chapter.title}`,
    }, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Media của chương đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật media chương', res, 500);
  } finally {
    session.endSession();
  }
};


const extractPublicId = (url, resourceType) => {
    try {
        // URL mẫu: https://res.cloudinary.com/dkkluqchv/{resourceType}/upload/v1738820121/path/to/file.mp3
        const parts = url.split("/");
        const index = parts.indexOf(resourceType);
        if (index === -1 || index + 2 >= parts.length) return null;

        // Lấy phần sau "upload/"
        const publicIdWithExtension = parts.slice(index + 2).join("/");
        return publicIdWithExtension.replace(/\.[^/.]+$/, ""); // Loại bỏ đuôi file (.mp3, .vtt, ...)
    } catch (error) {
        return null;
    }
};

/**
 * Deletes a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Chapter ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chapterId = req.params.chapterId;
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate chapter
    const chapter = await Chapter.findById(chapterId).session(session);
    const chapterCheck = await validateChapter(chapter, req.user, ['draft', 'editing']);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }

    // Delete chapter
    await chapter.deleteOne({ session });

    // Update novel's chapter count and latestChapter
    const chapterCount = await Chapter.countDocuments({ novelId: chapter.novelId });
    const latestChapter = await Chapter.findOne({ novelId: chapter.novelId })
      .sort({ chapterNumber: -1 })
      .lean();
    await Novel.findByIdAndUpdate(
      chapter.novelId,
      {
        $set: {
          'chapters.count': chapterCount,
          'chapters.latestChapter': latestChapter ? latestChapter._id : null,
          updatedAt: new Date()
        }
      },
      { session }
    )
    if (chapter.status === 'editing') {

      // Log moderation action
      const novel = await Novel.findById(chapter.novelId).lean();
      const moderationResult = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: chapter.novelId,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel?.moderation?.moderator,
        message: `Chương ${chapter.title} đã bị xóa (${novel.title})`,
        logNote: `Xóa chương ${chapter.title}`,
      }, session);

      if (!moderationResult.success) {
        throw new Error(moderationResult.message);
      }
    }
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Chương đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa chương', res, 500);
  } finally {
    session.endSession();
  }
};
export const deleteAllChaptersByIdNovel = async (req, res) => {
    const { novel } = req.params;
    try {
        const novelId = novel.toString()
        console.log(novelId);
        const chapters = await Chapter.find({ novelId: novelId });

        if (chapters.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No chapters found for this novel"
            });
        }

        // Xóa tất cả file trên Cloudinary
        for (const chapter of chapters) {
            // Xóa file audio (video)
            if (chapter.audioFileUrl) {
                const publicIdAudio = extractPublicId(chapter.audioFileUrl, "video");
                if (publicIdAudio) await cloudinary.uploader.destroy(publicIdAudio, { resource_type: "video" });
            }

            // Xóa file subtitle (raw)
            if (chapter.subtitleFileUrl) {
                const publicIdSubtitle = extractPublicId(chapter.subtitleFileUrl, "raw");
                if (publicIdSubtitle) await cloudinary.uploader.destroy(publicIdSubtitle, { resource_type: "raw" });
            }
        }
        // Xóa tất cả bản ghi trong database thuộc idNovel
        const result = await Chapter.deleteMany({ novelId: novelId });

        res.status(200).json({
            success: true,
            message: `All chapters of novel ${novelId} deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting chapters",
            error: error.message
        });
    }
};
import Chapter from "../../models/chapter.model.js";
import Novel from "../../models/novel.model.js";
import { generate } from "../../utils/textToSpeech/mainTextAndSpeech.js";
import cloudinary from '../../config/cloudinary.config.js';

//import { generateAudio, generateSubtitles } from "../../utils/backups-tests/generateAudio.js";

export const createChapter = async (req, res) => {
    try {
        const { title, content, chapterNumber , novelId } = req.body;
        
        const novel = await Novel.findById(novelId);
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: "Novel not found"
            })
        }
        if(!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Please provide title and content"
            })
        }
        const {audioFileUrl, subtitleFileUrl } = await generate(content, novel.title,title);
        if (!audioFileUrl || !subtitleFileUrl) {
            throw new Error("Failed to generate audio or subtitle URLs");
        }
        // Fetch all chapters of the novel
        const chapters = await Chapter.find({ novelId }).sort({ chapterNumber: 1 });

        let newChapterNumber = chapterNumber;
        if (!newChapterNumber) {
            // If chapterNumber is not provided, auto-increment
            newChapterNumber = chapters.length + 1;
        } else {
            // If chapterNumber is provided, ensure it doesn't conflict
            if (newChapterNumber <= 0) {
                return res.status(400).json({
                success: false,
                message: "Invalid chapter number",
                });
            }

            // Shift chapter numbers if a specific chapterNumber is provided
            for (const chapter of chapters) {
                if (chapter.chapterNumber >= newChapterNumber) {
                chapter.chapterNumber += 1;
                await chapter.save(); // Update the chapter number in the database
                }
            }
        }
        // const newChapter = new Chapter({
        //     title,
        //     content,            
        //     novelId: novelId,
        // });
        const newChapter = await Chapter.create({
            ...req.body,
            chapterNumber: newChapterNumber,
            audioFileUrl: audioFileUrl,
            subtitleFileUrl: subtitleFileUrl,
            novel: novelId
        });
        await newChapter.save();
        res.status(201).json({
            success: true,
            message: "Chapter created successfully",
            novel: novel.title,
            chapter: newChapter
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
        console.error("Error creating chapter" + error.message);
    }
}
export const updateChapter = async (req, res) => {
    try {        
        //const chapter = await Chapter.findOne({ _id: req.params.chapter });       
        const updateChapter = await Chapter.findByIdAndUpdate(
            req.params.chapter, req.body,{ new: true }
        );
        res.status(200).json({
            success: true,
            message: "Chapter updated successfully",
            chapter: updateChapter
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
        console.error("Error updating chapter" + error.message);
    }
}
export const getAllChaptersByNovel = async (req, res) => {
    const { novel } = req.params;
    try {        
        const novelId = novel.toString()
        console.log(novelId);
        const chapters = await Chapter.find({ novelId: novelId });
        console.log("Chapter: " + chapters)
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
export const getChapterByNovel = async (req, res) => {
    try {
        const { novel, chapter } = req.params;

        // Convert `novel` to ObjectId
        const novelId = novel.toString()
        const chapterId = chapter.toString()

        // Tìm chapter theo `novelId` và `_id`
        const chapters = await Chapter.find({ novelId });
        const chapterData = await chapters.find(c => c._id.toString() === chapterId.toString());

        // Nếu không tìm thấy
        if (!chapterData) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found",
                novel: novel
            });
        }

        // Nếu tìm thấy
        res.status(200).json({
            success: true,
            message: "Chapter fetched successfully",
            data: chapterData
        });

    } catch (error) {
        console.error("Error fetching chapter:", error);

        // Xử lý lỗi
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching chapter",
            error: error.message
        });
    }
};
export const deleteChapter = async (req, res) => { 
    try {
        const chapter = await Chapter.findById(req.params.chapter);
        if(!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            })
        }
        await Chapter.findByIdAndDelete(req.params.chapter);
        res.status(200).json({
            success: true,
            delete: req.params.chapter,
            message: "Chapter deleted successfully",
            data: chapter
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
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
    //     cloudinary.v2.api
    //     .delete_resources(['umzptpsku6pfym65cfud.vtt'], 
    //       { type: 'upload', resource_type: 'raw' })
    //     .then(console.log);
    
    //   cloudinary.v2.api
    //     .delete_resources(['hiefoa77pfzg0dwuzwaj'], 
    //       { type: 'upload', resource_type: 'video' })
    //     .then(console.log);
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

export const getChapterById = async (req, res) => {
    try {

        const chapter = await Chapter.findById(req.params.chapterId);
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
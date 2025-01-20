import Chapter from "../../models/novel/chapter.model.js";
import Novel from "../../models/novel/novel.model.js";
import mongoose from "mongoose";

export const createChapter = async (req, res) => {
    try {
        const { title, content, novelId } = req.body;
        
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
        const chapter = await Chapter.create({
            ...req.body,
            novel: novelId
        });
        res.status(201).json({
            success: true,
            message: "Chapter created successfully",
            novel: novel.title,
            chapter: chapter
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
        console.error("Error creating chapter" + error.message);
    }
}
export const getAllChaptersByNovel = async (req, res) => {
    try {        
        const { novel } = req.params;
        const novelId = novel.toString()
        const chapters = await Chapter.find({ novelId });
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
            message: error.message
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
                message: "Chapter not found"
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
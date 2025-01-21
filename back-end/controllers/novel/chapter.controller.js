import Chapter from "../../models/novel/chapter.model.js";
import Novel from "../../models/novel/novel.model.js";

import { generateAudio, generateSubtitles } from "../../utils/generateAudio.js";

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
        const { audioFileUrl } = await generateAudio(content);
        const { subtitleFileUrl } = await generateSubtitles(content);
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
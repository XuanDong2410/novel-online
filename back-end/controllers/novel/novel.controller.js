import Novel from "../../models/novel/novel.model.js";

import { v2 as cloudinary } from "cloudinary";

export const createNovel = async (req, res) => {
    try {
        const { title, description, author, genre } = req.body;
        if(!title || !description || !author || !genre) {
            return res.status(400).json({
                success: false,
                message: "Please provide all the required fields"
            })
        }
        const newNovel = new Novel({ 
            title, 
            description, 
            author, 
            genre, 
        });
        await newNovel.save();
        res.status(201).json({
            success: true,
            message: "Novel created successfully",
            data: newNovel
        })
    } catch (error) {
       res.status(500).json({ 
            success: false,
            message: error.message 
        });
        console.log("Error in creating novel: " + error.message);
    }
}
export const getAllNovels = async (req, res) => {
    try {
        const novels = await Novel.find();
        res.status(200).json({
            success: true,
            message: "All novels fetched successfully",
            data: novels
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
export const getNovelById = async (req, res) => {
    try {
        const novel = await Novel.findById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Novel fetched successfully",
            data: novel
        })
    } catch (error) {
        res.status(500).json({
            success: false,
        });
    }
}
// TODO: need fix , search can by genre, title or author
export const searchNovels = async (req, res) => {
    try {
        const novels = await Novel.find({ title: { $regex: req.params.title, $options: 'i' } });
        res.status(200).json({
            success: true,
            message: "Novels fetched successfully",
            data: novels
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })  
    }
}
export const updateNovel = async (req, res) => {
    try {
        const novel = await Novel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({
            success: true,
            message: "Novel updated successfully",
            data: novel
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
export const deleteNovel = async (req, res) => {
    try {
        const novel = await Novel.findById(req.params.id);
        if(!novel) {
            return res.status(404).json({
                success: false,
                message: "Novel not found"
            })
        }
        await Novel.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: "Novel deleted successfully",
            data: novel
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
        console.log("Error in deleting novel: " + error.message);
    }
}
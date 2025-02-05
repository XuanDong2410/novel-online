import { listVoices, generateAudio } from '../utils/useGoogleApi.js';
import Audio from '../models/audio.model.js';

// Tạo một bản ghi audio mới
export const createAudio = async (req, res) => {
    try {
        const voiceReq = {
            "languageCodes": [
                "vi-VN"
            ],
            "name": "vi-VN-Neural2-A",
            "ssmlGender": "FEMALE",
            "naturalSampleRateHertz": 24000
        };
        const { text, novelName, chapterName } = req.body;
        const newAudio = await generateAudio(text, voiceReq,novelName, chapterName);
        res.status(201).json({
            success: true,
            message: "Audio created successfully",
            data: {
                voice: voiceReq,
                novel: novelName,
                chapter: chapterName,
                audio: newAudio
            }
            
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating audio",
            error: error.message
        });
    }
};

// Lấy danh sách tất cả audio
export const getAllAudios = async (req, res) => {
    try {
        const audios = await Audio.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "List of audios retrieved successfully",
            data: audios
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting audios",
            error: error.message
        });
    }
};

// Lấy thông tin chi tiết của một audio theo ID
export const getAudioById = async (req, res) => {
    try {
        const { id } = req.params;
        const audio = await Audio.findById(id);

        if (!audio) {
            return res.status(404).json({
                success: false,
                message: "Audio not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Audio retrieved successfully",
            data: audio
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting audio",
            error: error.message
        });
    }
};

// Cập nhật thông tin audio
export const updateAudio = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedAudio = await Audio.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedAudio) {
            return res.status(404).json({
                success: false,
                message: "Audio not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Audio updated successfully",
            data: updatedAudio
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating audio",
            error: error.message
        });
    }
};

// Xóa một audio theo ID
export const deleteAudio = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAudio = await Audio.findByIdAndDelete(id);

        if (!deletedAudio) {
            return res.status(404).json({
                success: false,
                message: "Audio not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Audio deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting audio",
            error: error.message
        });
    }
};

// Lấy danh sách các giọng đọc hỗ trợ cho ngôn ngữ (Google TTS API)
export const getListAudioLanguage = async (req, res) => {
    try {
        const listAudioLanguage = await listVoices('vi-VN');
        res.status(200).json({
            success: true,
            message: "Get list audio language successfully",
            listAudioLanguage: listAudioLanguage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting audio language",
            error: error.message
        });
    }
};

import cloudinary from '../config/cloudinary.config.js';
import Audio from '../models/audio.model.js';
import { transcribeAudio } from '../utils/textToSpeech/speechRecognition.js';
import { generate } from "../utils/textToSpeech/mainTextAndSpeech.js";
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
        //const content = "Ngàn năm trước, t·ai n·ạn chợt hàng lâm, nguyên bản Lam Tinh diện tích trong nháy mắt mở rộng vạn lần ở trên, đồng thời hàng năm đều còn ở không ngừng mở rộng. Đồng thời, kèm theo vô số không gian liệt phùng, tinh không Ma Thú cùng sinh linh mạnh mẽ tiến nhập Lam Tinh trung. Tất cả nhân loại đem hết toàn lực, ở tổn thất mấy tỉ nhân khẩu sau đó, mới đến rồi một tia sinh tồn chỗ trống cùng thở dốc cơ hội. Đến tận đây, toàn bộ Lam Tinh cũng tiến nhập một cái tiệm thời đại mới, được xưng là toàn dân giác tỉnh thời đại! Mỗi năm một lần THPT học viên chính thức tiến hành thời điểm thức tỉnh, mỗi cái THPT học viên ở tuổi tác đạt được 18 tuổi phía trước, liền có thể tiến hành giác tỉnh.Mỗi cá nhân sau khi thức tỉnh, liền có thể thu được một loại năng lực, mà năng lực đẳng cấp phân chia từ F cấp thấp nhất, đến tối cao SSS cấp.Thức tỉnh năng lực đẳng cấp cao thấp, cũng trực tiếp quyết định sau này thành tựu cao thấp, cùng thực lực cao thấp. Sở dĩ, tự nhiên mỗi cá nhân đều hy vọng chính mình thức tỉnh năng lực đẳng cấp càng cao.Mỗi cái THPT học viên thức tỉnh năng lực, đều là ngẫu nhiên, cũng không thể dựa vào tự thân tới chọn, mà là tại giác tỉnh không gian bên trong, kiểm tra đo lường ra mỗi cái học viên giác tỉnh loại hình gì năng lực."
        //const path = 'https://res.cloudinary.com/dkkluqchv/video/upload/v1738820121/novels/toan-dan-giac-tinh-bat-dau-dang-cap-vo-thuong-han-de-thang/chuong-5-cap-thap-nhat-nang-luc-vo-han-thang-cap/vi-vn-neural2-a-toan-dan-giac-tinh-bat-dau-dang-cap-vo-thuong-han-de-thang-chuong-5-cap-thap-nhat-nang-luc-vo-han-thang-cap.mp3';
        const { content, novelName, chapterName } = req.body;
        //const newAudio = await generateAudio(text, voiceReq,novelName, chapterName);
        // const newVtt = await processVtt(path, novelName, chapterName);
        // const data = await transcribeAudio(content, path);
        const data = await generate(content, novelName, chapterName);
        console.log(data)
        res.status(201).json({
            success: true,
            message: "Audio created successfully",
            data: data
            
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
// Hàm trích xuất public_id từ URL
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
export const deleteAllAudios = async (req, res) => {
    try {
        // Lấy danh sách tất cả audio
        const audios = await Audio.find({}, "audioFileUrl subtitleFileUrl");

        // Xóa tất cả file trên Cloudinary
        for (const audio of audios) {
            // Xóa file audio (video)
            if (audio.audioFileUrl) {
                const publicIdAudio = extractPublicId(audio.audioFileUrl, "video");
                if (publicIdAudio) await cloudinary.uploader.destroy(publicIdAudio, { resource_type: "video" });
            }

            // Xóa file subtitle (raw)
            if (audio.subtitleFileUrl) {
                const publicIdSubtitle = extractPublicId(audio.subtitleFileUrl, "raw");
                if (publicIdSubtitle) await cloudinary.uploader.destroy(publicIdSubtitle, { resource_type: "raw" });
            }
        }

        // Xóa tất cả bản ghi trong database
        const result = await Audio.deleteMany({});

        res.status(200).json({
            success: true,
            message: "All audios and subtitles deleted successfully",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting audios and subtitles",
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

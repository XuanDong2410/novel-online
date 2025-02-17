import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises"; // Đúng cú pháp để dùng fs.unlink()
import { formatName } from "./formatName.js";

// Hàm upload file lên Cloudinary
const uploadToCloudinary = async (filePath, novelName, chapterName, fileName, options) => {
    try {
        // Chuẩn hóa tên
        const formattedNovel = formatName(novelName);
        const formattedChapter = formatName(chapterName);
        const formattedFileName = formatName(fileName);

        // Đường dẫn lưu trữ trên Cloudinary
        const publicId = `novels/${formattedNovel}/${formattedChapter}/${formattedFileName}`;
        // Upload file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath,{ 
            ...options,
            public_id: publicId, // Tên file không dấu cách
        });
        // Cleanup temporary file
        await fs.unlink(filePath);
        // Return the secure URL of the uploaded file
        return uploadResult.secure_url;
    } catch (error) {
        console.error(`Error uploading file to Cloudinary: ${error.message}`);
        throw new Error("Cloudinary upload failed");
    }
};
export default uploadToCloudinary;

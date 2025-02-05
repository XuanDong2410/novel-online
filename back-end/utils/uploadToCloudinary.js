import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises"; // Đúng cú pháp để dùng fs.unlink()
import slugify from "slugify";

// Hàm chuẩn hóa tên (loại bỏ dấu, khoảng trắng, viết thường)
const formatName = (name) => {
    // Kiểm tra nếu name không phải là chuỗi, mặc định cho nó là một chuỗi rỗng
    if (typeof name !== "string") {
        console.error("Warning: Invalid name provided, using empty string.");
        name = "";
    }
    return slugify(name, {
        lower: true, // Chuyển thành chữ thường
        strict: true, // Loại bỏ ký tự đặc biệt
        locale: "vi" // Hỗ trợ chuẩn hóa tiếng Việt
    }).replace(/-+/g, "-"); // Loại bỏ dấu "-" dư thừa;
};

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

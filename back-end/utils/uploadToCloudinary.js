import cloudinary from '../config/cloudinary.config.js';
import fs from 'fs/promises';
import pino from 'pino';
import { formatName } from './formatName.js';

const logger = pino();

const uploadToCloudinary = async (filePath, novelName, chapterName, fileName, options) => {
  if (!filePath || !novelName || !chapterName || !fileName) {
    throw new Error('Missing required parameters: filePath, novelName, chapterName, or fileName');
  }

  try {
    // Kiểm tra file tồn tại
    await fs.access(filePath);

    // Chuẩn hóa tên
    const formattedNovel = formatName(novelName);
    const formattedChapter = formatName(chapterName);
    const formattedFileName = formatName(fileName);

    // Đường dẫn lưu trữ trên Cloudinary
    const publicId = `novels/${formattedNovel}/${formattedChapter}/${formattedFileName}`;

    // Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      ...options,
      public_id: publicId,
    });

    logger.info(`File uploaded to Cloudinary: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (error) {
    logger.error(`Error uploading file to Cloudinary: ${error.message}`);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  } finally {
    // Cleanup temporary file
    await fs.unlink(filePath).catch((err) => logger.warn(`Failed to delete temp file ${filePath}: ${err.message}`));
  }
};

export default uploadToCloudinary;
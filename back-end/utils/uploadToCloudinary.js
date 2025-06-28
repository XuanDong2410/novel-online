import cloudinary from '../config/cloudinary.config.js';
import fs from 'fs/promises';
import { formatName } from './formatName.js';

const uploadToCloudinary = async (filePath, novelName, chapterName, fileName, options) => {
  try {
    const formattedNovel = formatName(novelName);
    const formattedChapter = formatName(chapterName);
    const formattedFileName = formatName(fileName);

    const publicId = `novels/${formattedNovel}/${formattedChapter}/${formattedFileName}`;

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      ...options,
      public_id: publicId,
    });

    await fs.unlink(filePath).catch(() => {});
    return uploadResult.secure_url;
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    console.error(`Error uploading file to Cloudinary: ${error.message}`);
    throw new Error('Cloudinary upload failed');
  }
};

export default uploadToCloudinary;
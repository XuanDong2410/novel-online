import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { transcribeAudio } from './speechRecognition.js';
import { createVttFile } from './vttGenerator.js';
import cloudinary from '../../config/cloudinary.config.js';
import { formatName } from '../formatName.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function processVtt(content, audioUrl, novelName, chapterName, languageCode = 'vi-VN') {
  try {
    const formattedNovel = formatName(novelName);
    const formattedChapter = formatName(chapterName);
    const vttFileName = `subtitles-${languageCode}-${formattedNovel}-${formattedChapter}`;
    const publicId = `novels/${formattedNovel}/${formattedChapter}/${vttFileName}`;

    // Kiểm tra xem file VTT đã tồn tại chưa
    try {
      const { resources } = await cloudinary.api.resources_by_ids([publicId], { resource_type: 'raw' });
      if (resources.length) {
        console.log(`VTT file already exists: ${resources[0].secure_url}`);
        return resources[0].secure_url;
      }
    } catch (error) {
      console.log('VTT file does not exist, generating new VTT.');
    }

    const transcriptData = await transcribeAudio(content, audioUrl, languageCode);
    const vttFilePath = path.join(__dirname, `${vttFileName}.vtt`);
    await createVttFile(transcriptData, vttFilePath);

    const uploadResult = await cloudinary.uploader.upload(vttFilePath, {
      public_id: publicId,
      resource_type: 'raw',
      format: 'vtt',
    });

    await fs.unlink(vttFilePath);
    return uploadResult.secure_url;
  } catch (error) {
    console.error(`Error generating VTT: ${error.message}`);
    throw new Error('Failed to generate and upload VTT');
  }
};
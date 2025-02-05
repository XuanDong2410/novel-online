import path from 'path';
import { fileURLToPath } from 'url';
import { transcribeAudio } from './speechRecognition.js';
import { createVttFile } from './vttGenerator.js';
import uploadToCloudinary from '../uploadToCloudinary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Hàm chính để xử lý audio và tạo VTT
export async function processAudio(filePath, novelName, chapterName) {
  try {
    console.log("Processing audio...");
    const transcriptData = await transcribeAudio(filePath);

    // Tạo file VTT
    const vttFileName = `subtitles-${novelName}-${chapterName}.vtt`;
    const vttFilePath = path.join(__dirname, vttFileName);

    createVttFile(transcriptData, vttFilePath);
    const vttUrl = await uploadToCloudinary(vttFilePath, novelName, chapterName);
    return vttUrl;
  } catch (error) {
    console.error("Error processing audio:", error);
  }
}


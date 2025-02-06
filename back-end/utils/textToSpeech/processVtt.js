import path from 'path';
import { fileURLToPath } from 'url';
import { transcribeAudio } from './speechRecognition.js';
import { createVttFile } from './vttGenerator.js';
import uploadToCloudinary from '../uploadToCloudinary.js'
import { formatName } from '../formatName.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Hàm chính để xử lý audio và tạo VTT
export async function processVtt(content, filePath, novelName, chapterName) {
  try {
    console.log("Processing audio...");
    const transcriptData = await transcribeAudio(content, filePath);
    const formattedNovel = formatName(novelName);
    const formattedChapter = formatName(chapterName);
    // Tạo file VTT
    const vttFileName = `subtitles-${formattedNovel}-${formattedChapter}`;
    const vttFilePath = path.join(__dirname, vttFileName);
    const vttOptions = {
      resource_type: "raw",            
      format: "vtt",
    }
    createVttFile(transcriptData, vttFilePath);
    const vttUrl = await uploadToCloudinary(vttFilePath, novelName, chapterName, vttFileName, vttOptions);
    return vttUrl;
  } catch (error) {
    console.error("Error generate vtt file:", error);
  }
}


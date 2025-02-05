import * as webvtt from 'node-webvtt';
import fs from 'fs/promises';

// Chuyển đổi timestamp sang định dạng WebVTT
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${hours}:${minutes}:${sec}.${ms}`;
}

// Tạo file VTT từ transcript
export async function createVttFile(transcriptData, outputPath) {
    try {
        let vttContent = "WEBVTT\n\n";

        transcriptData.forEach((result, index) => {
            result.words.forEach((wordInfo, wordIndex) => {
                const startTime = formatTime(wordInfo.start_time);
                const endTime = formatTime(wordInfo.end_time);
                vttContent += `${index + 1}.${wordIndex}\n${startTime} --> ${endTime}\n${wordInfo.word}\n\n`;
            });
        });

        await fs.writeFile(outputPath, vttContent, 'utf-8');
        console.log(`✅ VTT file saved: ${outputPath}`);
    } catch (error) {
        console.error("❌ Error saving VTT file:", error);
        throw error;
    }
}

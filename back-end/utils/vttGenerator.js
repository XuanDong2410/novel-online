import fs from 'fs/promises';
import pino from 'pino';

const logger = pino();

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${hours}:${minutes}:${sec}.${ms}`;
}

export async function createVttFile(sentences, outputPath) {
  try {
    if (!Array.isArray(sentences) || sentences.length === 0) {
      throw new Error('Sentences must be a non-empty array');
    }

    let vttContent = 'WEBVTT\n\n';
    sentences.forEach((sentence, index) => {
      if (typeof sentence !== 'object' || !sentence.sentence || typeof sentence.start_time !== 'number' || typeof sentence.end_time !== 'number') {
        logger.warn(`Skipping invalid sentence at index ${index}: ${JSON.stringify(sentence)}`);
        return;
      }

      const startTime = formatTime(sentence.start_time);
      const endTime = formatTime(sentence.end_time);
      vttContent += `${index + 1}\n${startTime} --> ${endTime}\n${sentence.sentence.trim()}\n\n`;
    });

    await fs.writeFile(outputPath, vttContent, 'utf-8');
    logger.info(`VTT file saved: ${outputPath}`);
  } catch (error) {
    logger.error(`Error saving VTT file: ${error.message}`);
    throw error;
  }
}
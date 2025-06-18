import pkg from 'worker';
const { parentPort, workerData } = pkg;
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { createVttFile } from '../utils/vttGenerator.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';

const logger = pino();
const ttsClient = new textToSpeech.TextToSpeechClient();

export async function generateAudioTask() {
  const { content, voiceReq, novelName, chapterName } = workerData;

  if (!content || !voiceReq || !novelName || !chapterName) {
    throw new Error('Missing required worker data: content, voiceReq, novelName, or chapterName');
  }

  const tempAudioPath = `temp-audio-${uuidv4()}.mp3`;
  const tempVttPath = `temp-vtt-${uuidv4()}.vtt`;
  const fileName = `${voiceReq.name}-${novelName}-${chapterName}`;
  const vttFileName = `subtitles-${novelName}-${chapterName}`;

  try {
    // Sử dụng SSML để thêm mark cho từng câu
    const sentences = content.match(/[^.!?]+[.!?]/g) || [content];
    const ssmlContent = `<speak>${sentences.map((s, i) => `<mark name="s${i}"/>${s}`).join('')}</speak>`;

    // Gọi Text-to-Speech
    const [response] = await ttsClient.synthesizeSpeech({
      input: { ssml: ssmlContent },
      voice: {
        languageCode: voiceReq.languageCode || 'vi-VN',
        name: voiceReq.name || 'vi-VN-Neural2-A',
        ssmlGender: voiceReq.ssmlGender || 'FEMALE',
      },
      audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 },
      enableTimePointing: ['SSML_MARK'],
    });

    // Lưu file audio
    await fs.writeFile(tempAudioPath, Buffer.from(response.audioContent, 'base64'));
    logger.info(`Audio file saved to ${tempAudioPath}`);

    // Tạo VTT từ timepoints
    const sentencesData = response.timepoints.map((point, index) => ({
      sentence: sentences[index] || '',
      start_time: point.timeSeconds + point.timeNanos / 1e9,
      end_time: (response.timepoints[index + 1]?.timeSeconds || point.timeSeconds + 1) + (response.timepoints[index + 1]?.timeNanos || 0) / 1e9,
    }));
    await createVttFile(sentencesData, tempVttPath);
    logger.info(`VTT file saved to ${tempVttPath}`);

    // Upload lên Cloudinary
    const audioUrl = await uploadToCloudinary(tempAudioPath, novelName, chapterName, fileName, { resource_type: 'video' });
    const vttUrl = await uploadToCloudinary(tempVttPath, novelName, chapterName, vttFileName, { resource_type: 'raw', format: 'vtt' });

    parentPort.postMessage({ success: true, audioUrl, vttUrl });
  } catch (err) {
    logger.error(`Audio/VTT generation failed: ${err.message}`);
    parentPort.postMessage({ error: err.message });
  } finally {
    await fs.unlink(tempAudioPath).catch(() => {});
    await fs.unlink(tempVttPath).catch(() => {});
  }
}

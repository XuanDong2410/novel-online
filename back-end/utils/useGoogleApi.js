
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import util from 'util';
import uploadToCloudinary from './uploadToCloudinary.js';
const client = new textToSpeech.TextToSpeechClient();
/**
 * Lists available voices for the specified language.
 *
 * @param {string} languageCode - The language code.
 */
export async function listVoices(languageCode) {
  const [result] = await client.listVoices({languageCode});
  const voices = result.voices;

  return voices;
}
/**
 * Sythesizes sample text into an .mp3 file.
 */
const defaultRequest = {
    input: { text: "" }, // Text content will be set dynamically
    voice: { languageCode: "vi-VN", ssmlGender: "FEMALE" },
    audioConfig: { audioEncoding: "MP3" },
    enableTimePointing: ["SSML_MARK"],
};
async function synthesize(text, voice) {    
    const request = {
      input: {text: text},
      voice: {languageCode: voice.languageCode, ssmlGender: voice.ssmlGender, name: voice.name},
      audioConfig: {audioEncoding: 'MP3'},
      enableTimePointing: ["SSML_MARK"],
    };
  
    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.mp3', response.audioContent, 'binary');
    console.log('Audio content written to file: output.mp3');
  }

/**
 * Generate audio file from text using Google Cloud Text-to-Speech and upload to Cloudinary
 * @param {string} content - Text content to convert to speech
 * @param {Object} voiceReq - Voice configuration (languageCode, ssmlGender, name)
 * @param {string} novelName - Novel name (for Cloudinary folder structure)
 * @param {string} chapterName - Chapter name (for Cloudinary folder structure)
 * @returns {Promise<string>} - URL of the uploaded audio file
 */
export const generateAudio = async (content, voiceReq, novelName, chapterName) => {
  try {
      // Tạo request tùy chỉnh
      const options = { resource_type: "video" };
      const request = {
          ...defaultRequest,
          input: { text: content },
          voice: {
              ...defaultRequest.voice,
              ...(voiceReq.languageCode && { languageCode: voiceReq.languageCode }),
              ...(voiceReq.ssmlGender && { ssmlGender: voiceReq.ssmlGender }),
              ...(voiceReq.name && { name: voiceReq.name }),
          },
      };
      const fileName = `${voiceReq.name}-${novelName}-${chapterName}`;

      // Gọi API Google Text-to-Speech
      const [response] = await client.synthesizeSpeech(request);

      // Ghi file tạm để upload
      const tempFilePath = "temp.mp3";
      //await fs.writeFile(tempFilePath, response.audioContent, "binary");
      await fs.writeFile(tempFilePath, Buffer.from(response.audioContent, 'base64'));
      // Upload lên Cloudinary
      const audioUrl = await uploadToCloudinary(tempFilePath, novelName, chapterName, fileName, options);

      return audioUrl;
  } catch (error) {
      console.error(`Error generating audio: ${error.message}`);
      throw new Error("Failed to generate and upload audio");
  } finally {
      // Xóa file tạm (dù có lỗi hay không)
      await fs.unlink("temp.mp3").catch(() => {});
  }
};

import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';
const client = new textToSpeech.TextToSpeechClient();
/**
 * Lists available voices for the specified language.
 *
 * @param {string} languageCode - The language code.
 */
export async function listVoices(languageCode) {
  const [result] = await client.listVoices({languageCode});
  const voices = result.voices;

  voices.forEach((voice) => {
    console.log(`${voice.name} (${voice.ssmlGender}): ${voice.languageCodes}`);
  });
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
  
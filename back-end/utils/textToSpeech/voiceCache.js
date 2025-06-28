import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import path from 'path';

const client = new textToSpeech.TextToSpeechClient();
const VOICES_FILE = path.join(process.cwd(), 'voices-vi-VN.json');

export const getVietnameseVoices = async (forceDefault = false) => {
  try {
    const data = await fs.readFile(VOICES_FILE, 'utf-8');
    const voices = JSON.parse(data);
    return forceDefault ? [voices.find(v => v.name === 'vi-VN-Wavenet-A')] : voices;
  } catch (error) {
    console.log('Voice cache not found, fetching from Google Cloud TTS...');
    const [result] = await client.listVoices({ languageCode: 'vi-VN' });
    const voices = result.voices;
    await fs.writeFile(VOICES_FILE, JSON.stringify(voices, null, 2));
    return forceDefault ? [voices.find(v => v.name === 'vi-VN-Wavenet-A')] : voices;
  }
};

export const syncVietnameseVoices = async () => {
  try {
    const [result] = await client.listVoices({ languageCode: 'vi-VN' });
    const voices = result.voices;
    await fs.writeFile(VOICES_FILE, JSON.stringify(voices, null, 2));
    console.log('Vietnamese voices synced to cache');
    return voices;
  } catch (error) {
    console.error(`Error syncing voices: ${error.message}`);
    throw error;
  }
};
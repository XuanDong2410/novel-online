import fs from 'fs';
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient();

export async function transcribeAudio(filePath) {
    try {
        const audio = {
            uri: filePath
        };

        const config = {
            encoding: 'MP3',
            sampleRateHertz: 24000,
            languageCode: 'vi-VN',
            enableWordTimeOffsets: true
        };

        const request = { audio, config };
        const [response] = await client.recognize(request);
        
        return response.results.map(result => ({
            transcript: result.alternatives[0].transcript,
            words: result.alternatives[0].words.map(word => ({
                word: word.word,
                start_time: parseFloat(word.startTime.seconds || 0) + parseFloat(word.startTime.nanos || 0) * 1e-9,
                end_time: parseFloat(word.endTime.seconds || 0) + parseFloat(word.endTime.nanos || 0) * 1e-9
            }))
        }));
    } catch (error) {
        console.error("❌ Error recognizing speech:", error);
        throw error;
    }
}

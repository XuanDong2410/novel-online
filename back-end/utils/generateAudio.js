import TextToSpeech from "@google-cloud/text-to-speech";
import fs from 'fs-extra'
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { ENV_VARS } from "../config/envVars.js";

const client = new TextToSpeech.TextToSpeechClient();

cloudinary.config({
    cloud_name: ENV_VARS.CLOUDINARY_CLOUD_NAME,
    api_key: ENV_VARS.CLOUDINARY_API_KEY,
    api_secret: ENV_VARS.CLOUDINARY_API_SECRET,
});

/**
 * Generate audio, subtitle, and save content chapter to cloudinary
 * @param {String} text -  Text content of the chapter
 * @returns {Promise<{audioFileUrl: String, subtitleFileUrl: String}>} 
 * - Promise that resolves to an object containing the audio file URL and subtitle file URL 
 */

export const generateAudio = async (content) => {
    try {                
        // Convert text to speech
        const request = {
            input: { text: content },
            voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
            audioConfig: { audioEncoding: "MP3" },
        };
        const [response] = await client.synthesizeSpeech(request);
        // Save audio temp as mp3 file
        const tempAudioPath = path.join('temp', "audio.mp3");
        await fs.writeFile(tempAudioPath, response.audioContent, "binary");
        // Upload MP3 to Cloudinary
        const audioUpload = await cloudinary.uploader.upload(tempAudioPath, {
            resource_type: "video", // Use video for audio files
        });
      ;
        // Cleanup temporary files
        await fs.unlink(tempAudioPath);
        return { 
            audioFileUrl: audioUpload.secure_url,
        };

    } catch (error) {
        console.log("Error generating audio:" + error.message);
        throw new Error("Error generating audio");        
    }
} 
export const generateSubtitles = async (content) => {
    try {                
        // Convert text to speech
        const request = {
            input: { text: content },
            voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
            audioConfig: { audioEncoding: "MP3" },
        };
        const [response] = await client.synthesizeSpeech(request);        

        // Generate subtitle file
        const subtitleContent = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:10.000\n${content}`;
        const tempVttPath = path.join('temp', "subtitle.vtt");
        await fs.writeFile(tempVttPath, subtitleContent, 'utf-8');

        // Upload subtitle temp as vtt file
        const subtitleUpload = await cloudinary.uploader(tempVttPath, {
            resource_type: "raw", // Use raw for subtitle files
        });
        // Save content to a text file
        const tempTextPath = path.join('temp', "content.txt");
        await fs.writeFile(tempTextPath, content, 'utf-8');
        // Cleanup temporary files
        await fs.unlink(tempVttPath);
        await fs.unlink(tempTextPath);
        return { 
            subtitleUrl: subtitleUpload.secure_url,
        };

    } catch (error) {
        console.log("Error generating subtitles:" + error.message);
        throw new Error("Error generating  subtitles");        
    }
} 
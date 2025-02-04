import TextToSpeech from "@google-cloud/text-to-speech";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "../config/cloudinary.config.js";
const client = new TextToSpeech.TextToSpeechClient();


// Tạo __dirname thay thế
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tiếp tục sử dụng TEMP_DIR trong mã của bạn


// Common directory for temporary files
const TEMP_DIR = path.join(__dirname, "..", "temp");

// Default Text-to-Speech request configuration
const defaultRequest = {
    input: { text: "" }, // Text content will be set dynamically
    voice: { languageCode: "vi-VN", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
};

/**
 * Helper function to upload a file to Cloudinary and clean up temporary files
 * @param {string} filePath - Local file path to upload
 * @param {string} resourceType - Cloudinary resource type ('video' or 'raw')
 * @returns {Promise<string>} - Uploaded file URL
 */
const uploadToCloudinary = async (filePath, options) => {
    try {
       

        // Upload file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, options);

        // Cleanup temporary file
        await fs.unlink(filePath);

        // Return the secure URL of the uploaded file
        return uploadResult.secure_url;
    } catch (error) {
        console.error(`Error uploading file to Cloudinary: ${error.message}`);
        throw new Error("Cloudinary upload failed");
    }
};

/**
 * Generate audio file from text using Google Cloud Text-to-Speech
 * @param {string} content - Text content to convert to speech
 * @param {string} languageCode - Optional language code
 * @param {string} ssmlGender - Optional voice gender
 * @returns {Promise<string>} - URL of the uploaded audio file
 */
export const generateAudio = async (content, languageCode, ssmlGender) => {
    try {
        // Ensure temp directory exists
        await fs.ensureDir(TEMP_DIR);

        // Create a customized request by overriding defaultRequest
        const request = {
            ...defaultRequest,
            input: { text: content },
            voice: {
                ...defaultRequest.voice,
                ...(languageCode && { languageCode }),
                ...(ssmlGender && { ssmlGender }),
            },
        };

        // Google Text-to-Speech request
        const [response] = await client.synthesizeSpeech(request);

        // Save audio file temporarily
        const tempAudioPath = path.join(TEMP_DIR, "audio.mp3");
        await fs.writeFile(tempAudioPath, response.audioContent, "binary");

        // Upload audio file to Cloudinary
        return await uploadToCloudinary(tempAudioPath,  { resource_type: "video" });
    } catch (error) {
        console.error(`Error generating audio: ${error.message}`);
        throw new Error("Failed to generate audio");
    }
};
/**
 * Generate subtitle file with UTF-8 encoding and proper Vietnamese text
 * @param {string} content - Text content for subtitle
 * @param {number} wordsPerSecond - Average words spoken per second (default: 2)
 * @returns {Promise<string>} - URL of the uploaded subtitle file
 */
export const generateSubtitles = async (content, wordsPerSecond = 2) => {
    try {
        // Ensure temp directory exists
        await fs.ensureDir(TEMP_DIR);

        // Split content into sentences
        const sentences = content.match(/[^.!?]+[.!?]*/g) || [content]; // Fallback to the whole content if no sentences

        // Generate timestamps for each sentence
        let currentTime = 0; // Start time in seconds
        const subtitleLines = sentences.map((sentence, index) => {
            const wordCount = sentence.split(/\s+/).length;
            const duration = wordCount / wordsPerSecond; // Duration in seconds
            const start = formatTime(currentTime);
            const end = formatTime(currentTime + duration);
            currentTime += duration;

            return `${index + 1}\n${start} --> ${end}\n${sentence.trim()}`;
        });

        // Combine all subtitle lines
        const subtitleContent = `WEBVTT\n\n${subtitleLines.join("\n\n")}`;
        // Ensure newline characters are consistent across platforms

        // Save subtitle content to temporary file with UTF-8 encoding
        const tempVttPath = path.join(TEMP_DIR, "subtitle.vtt");
        await fs.writeFile(tempVttPath, subtitleContent, { encoding: "utf8" });

        
        // Upload subtitle file to Cloudinary
        return await uploadToCloudinary(tempVttPath,  {
            resource_type: "raw",            
            format: "vtt",
        });
    } catch (error) {
        console.error(`Error generating subtitles: ${error.message}`);
        throw new Error("Failed to generate subtitles");
    }
};

/**
 * Format time in seconds to VTT timestamp format (hh:mm:ss.sss)
 * @param {number} timeInSeconds - Time in seconds
 * @returns {string} - Formatted timestamp
 */
const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = (timeInSeconds % 60).toFixed(3);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(6, "0")}`;
};

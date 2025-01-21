import TextToSpeech from "@google-cloud/text-to-speech";
import fs from "fs-extra";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { ENV_VARS } from "../config/envVars.js";
import { fileURLToPath } from "url";

const client = new TextToSpeech.TextToSpeechClient();

// Cloudinary configuration
cloudinary.config({
    cloud_name: ENV_VARS.CLOUDINARY_CLOUD_NAME,
    api_key: ENV_VARS.CLOUDINARY_API_KEY,
    api_secret: ENV_VARS.CLOUDINARY_API_SECRET,
});
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
const uploadToCloudinary = async (filePath, resourceType) => {
    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: resourceType });
        await fs.unlink(filePath); // Cleanup temporary file
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
        return await uploadToCloudinary(tempAudioPath, "video");
    } catch (error) {
        console.error(`Error generating audio: ${error.message}`);
        throw new Error("Failed to generate audio");
    }
};

/**
 * Generate subtitle file and upload it to Cloudinary
 * @param {string} content - Text content for subtitle
 * @returns {Promise<string>} - URL of the uploaded subtitle file
 */
export const generateSubtitles = async (content) => {
    try {
        // Ensure temp directory exists
        await fs.ensureDir(TEMP_DIR);

        // Generate subtitle content
        const subtitleContent = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:10.000\n${content}`;
        const tempVttPath = path.join(TEMP_DIR, "subtitle.vtt");
        await fs.writeFile(tempVttPath, subtitleContent, "utf-8");

        // Upload subtitle file to Cloudinary
        return await uploadToCloudinary(tempVttPath, "raw");
    } catch (error) {
        console.error(`Error generating subtitles: ${error.message}`);
        throw new Error("Failed to generate subtitles");
    }
};

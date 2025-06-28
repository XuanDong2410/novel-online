import textToSpeech from '@google-cloud/text-to-speech';
import fsPromises from 'fs/promises'; // Dùng cho các thao tác file bất đồng bộ dựa trên Promise
import fs from 'fs'; // Dùng cho các thao tác file dựa trên stream (như createWriteStream)
import { Storage } from '@google-cloud/storage';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import cloudinary from '../../config/cloudinary.config.js';
import { formatName } from '../formatName.js';
import * as wav from 'wav'; // Dùng để đọc và ghi WAV headers

// Import fluent-ffmpeg để xử lý ghép nối và mã hóa âm thanh.
// Đảm bảo FFmpeg đã được cài đặt trên hệ thống của bạn và có thể truy cập được qua PATH.
import ffmpeg from 'fluent-ffmpeg';

import { v4 as uuidv4 } from 'uuid'; // Thêm uuid để tạo tên file duy nhất

// Cấu hình Google Cloud Text-to-Speech Client
const client = new textToSpeech.TextToSpeechClient();

// Cấu hình Google Cloud Storage
const GCS_BUCKET_NAME = 'novel-online';
const storage = new Storage();

/**
 * Tạo một chunk âm thanh từ văn bản và tải lên GCS.
 * @param {string} content Nội dung văn bản để chuyển đổi.
 * @param {object} voiceConfig Cấu hình giọng nói (languageCode, ssmlGender, name).
 * @param {object} customConfig Cấu hình âm thanh tùy chỉnh (pitch, speakingRate).
 * @param {string} gcsObjectName Tên đối tượng (đường dẫn file) trong GCS bucket.
 * @returns {Promise<string>} Tên đối tượng GCS của file âm thanh đã tải lên.
 */
async function synthesizeChunkAndUpload(content, voiceConfig, customConfig, gcsObjectName) {
    const request = {
        input: { text: content },
        voice: {
            languageCode: voiceConfig.languageCodes?.[0] || 'vi-VN',
            ssmlGender: voiceConfig.ssmlGender || 'FEMALE',
            name: voiceConfig.name,
        },
        audioConfig: {
            audioEncoding: 'LINEAR16', // Trả về raw PCM, cần header WAV khi ghi file
            sampleRateHertz: voiceConfig.naturalSampleRateHertz || 24000,
            pitch: customConfig.pitch || 0,
            speakingRate: customConfig.speakingRate || 1,
        },
    };

    try {
        console.log(`Synthesizing chunk to Google TTS...`);
        const [response] = await client.synthesizeSpeech(request);
        
        if (!response || !response.audioContent) {
            throw new Error('Synthesis operation failed: No audio content received.');
        }

        const tempFilePath = `temp-tts-${uuidv4()}.wav`;

        // Ghi dữ liệu âm thanh thô vào một file WAV tạm thời với header chuẩn
        // LINEAR16 là 16-bit PCM, mono (channels: 1)
        const writer = new wav.Writer({
            channels: 1, 
            sampleRate: voiceConfig.naturalSampleRateHertz || 24000,
            bitDepth: 16, 
        });
        const writeStream = fs.createWriteStream(tempFilePath); // Sử dụng fs cho createWriteStream
        writer.pipe(writeStream);
        writer.write(response.audioContent); // Ghi dữ liệu âm thanh vào writer
        writer.end();

        // Chờ quá trình ghi file tạm hoàn tất
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        console.log(`Uploading ${tempFilePath} to GCS: gs://${GCS_BUCKET_NAME}/${gcsObjectName}`);
        await storage.bucket(GCS_BUCKET_NAME).upload(tempFilePath, {
            destination: gcsObjectName,
        });

        // Xóa file tạm thời cục bộ
        await fsPromises.unlink(tempFilePath); 

        return gcsObjectName; // Trả về tên đối tượng GCS đã upload
    } catch (error) {
        console.error('Detailed synthesis error (synthesizeChunkAndUpload):', error.message, error.stack);
        throw error;
    }
}

/**
 * Hàm chính để xử lý âm thanh, bao gồm chia chunk, tổng hợp, ghép nối và tải lên Cloudinary.
 * @param {string} content Nội dung văn bản của chương.
 * @param {object} voiceConfig Cấu hình giọng nói.
 * @param {string} novelName Tên tiểu thuyết.
 * @param {string} chapterName Tên chương.
 * @param {object} customConfig Cấu hình âm thanh tùy chỉnh.
 * @returns {Promise<object>} Đối tượng chứa URL âm thanh, thời lượng và kích thước.
 */
export async function processAudio(content, voiceConfig, novelName, chapterName, customConfig = {}) {
    try {
        const formattedNovel = formatName(novelName);
        const formattedChapter = formatName(chapterName);
        const uniqueId = uuidv4(); 
        const baseFileName = `${voiceConfig.name || 'default'}-${uniqueId}`;
        const publicId = `novels/${formattedNovel}/${formattedChapter}/${baseFileName}`; // Public ID cho Cloudinary

        // Kiểm tra file đã tồn tại trên Cloudinary để tránh tạo lại (giữ nguyên)
        try {
            const { resources } = await cloudinary.api.resources_by_ids([publicId], { resource_type: 'video' });
            if (resources.length > 0) {
                console.log(`Audio file already exists on Cloudinary: ${resources[0].secure_url}`);
                return {
                    audioUrl: resources[0].secure_url,
                    duration: resources[0].duration,
                    size: resources[0].bytes,
                };
            }
        } catch (error) {
            console.log('Audio file does not exist on Cloudinary, proceeding with generation.');
        }

        // ... (Logic chia chunk giữ nguyên) ...
        const chunks = [];
        const sentences = content.split(/([.!?\n]|\r\n|\r)/g).filter(s => s.trim() !== '');
        let currentChunk = '';
        const MAX_BYTE_LENGTH = 4900;

        for (const sentence of sentences) {
            const sentenceTrimmed = sentence.trim();
            if (!sentenceTrimmed) continue;

            const sentenceByteLength = Buffer.byteLength(sentenceTrimmed, 'utf8');
            const currentChunkByteLength = Buffer.byteLength(currentChunk, 'utf8');
            
            if ((currentChunkByteLength + sentenceByteLength) > MAX_BYTE_LENGTH && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentenceTrimmed;
            } else {
                currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentenceTrimmed;
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        console.log(`Divided content into ${chunks.length} chunks.`);

        const gcsObjectNames = []; 
        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const chunkByteLength = Buffer.byteLength(chunkContent, 'utf8');
            console.log(`Processing chunk ${i + 1}/${chunks.length} (Byte Length: ${chunkByteLength})...`);

            if (chunkByteLength > 5000) {
                console.error(`ERROR: Chunk ${i + 1} still exceeds 5000 bytes (${chunkByteLength} bytes). This will likely cause an API error.`);
                throw new Error(`Chunk ${i + 1} is too long (${chunkByteLength} bytes) for Google TTS (max 5000 bytes).`);
            }

            const chunkGcsObjectName = `${formattedNovel}/${formattedChapter}/${baseFileName}-chunk-${i}.wav`;
            const uploadedGcsObjectName = await synthesizeChunkAndUpload(chunkContent, voiceConfig, customConfig, chunkGcsObjectName);
            gcsObjectNames.push(uploadedGcsObjectName);
        }

        // ... (Phần tải xuống, ghép nối và chuyển đổi MP3 bằng FFmpeg giữ nguyên) ...
        const localChunkFilePaths = [];
        for (const gcsName of gcsObjectNames) {
            const tempChunkFilePath = `temp-download-${uuidv4()}.wav`; 
            console.log(`Downloading GCS object: gs://${GCS_BUCKET_NAME}/${gcsName} to ${tempChunkFilePath}`);
            await storage.bucket(GCS_BUCKET_NAME).file(gcsName).download({ destination: tempChunkFilePath });
            localChunkFilePaths.push(tempChunkFilePath);
        }

        const finalWavPath = `temp-final-merged-${baseFileName}.wav`;
        console.log(`Merging all chunks into: ${finalWavPath}`);

        await new Promise((resolve, reject) => {
            let command = ffmpeg();
            localChunkFilePaths.forEach(filePath => {
                command = command.input(filePath);
            });

            command
                .on('end', () => {
                    console.log('FFmpeg merging finished.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('FFmpeg merging error:', err.message);
                    reject(new Error(`FFmpeg merging failed: ${err.message}`));
                })
                .mergeToFile(finalWavPath, './temp_dir'); 
        });
        
        const mp3TempFilePath = `temp-${baseFileName}.mp3`;
        console.log(`Converting final WAV to MP3 using FFmpeg: ${mp3TempFilePath}`);

        await new Promise((resolve, reject) => {
            ffmpeg(finalWavPath)
                .audioChannels(1) 
                .audioCodec('libmp3lame') 
                .audioBitrate(128) 
                .format('mp3')
                .on('end', () => {
                    console.log('FFmpeg conversion to MP3 finished.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('FFmpeg conversion error:', err.message);
                    reject(new Error(`FFmpeg conversion to MP3 failed: ${err.message}`));
                })
                .save(mp3TempFilePath);
        });

        const duration = await getAudioDurationInSeconds(mp3TempFilePath);
        const stats = await fsPromises.stat(mp3TempFilePath);
        const size = stats.size;

        console.log(`Converted to MP3: ${mp3TempFilePath}, Duration: ${duration}s, Size: ${size} bytes`);

        // --- Tải MP3 lên Cloudinary ---
        console.log(`Uploading MP3 to Cloudinary with public_id: ${publicId}`);
        const uploadResult = await cloudinary.uploader.upload(mp3TempFilePath, {
            public_id: publicId,
            resource_type: 'video', 
            format: 'mp3', 
        });

        const cloudinaryAudioUrl = uploadResult.secure_url; // Lưu URL Cloudinary

        // --- THÊM BƯỚC MỚI: Tải MP3 lên GCS cho Speech-to-Text ---
        const gcsAudioObjectName = `audio-for-transcription/${baseFileName}.mp3`; // Đường dẫn trong GCS
        const gcsAudioUri = `gs://${GCS_BUCKET_NAME}/${gcsAudioObjectName}`; // URI dạng gs://

        console.log(`Uploading final MP3 to GCS for transcription: ${gcsAudioUri}`);
        await storage.bucket(GCS_BUCKET_NAME).upload(mp3TempFilePath, {
            destination: gcsAudioObjectName,
        });
        
        // --- Dọn dẹp các file tạm thời và các chunk trên GCS (giữ nguyên) ---
        // Xóa file MP3 tạm thời cục bộ
        await fsPromises.unlink(mp3TempFilePath)
            .catch(e => console.error(`Error deleting local MP3 file ${mp3TempFilePath}:`, e.message));
        
        // Xóa file WAV đã ghép cục bộ
        await fsPromises.unlink(finalWavPath) 
            .catch(e => console.error(`Error deleting local WAV file ${finalWavPath}:`, e.message));
        
        // Xóa các chunk WAV cục bộ đã tải xuống từ GCS
        for (const filePath of localChunkFilePaths) {
            await fsPromises.unlink(filePath)
                .catch(e => console.error(`Error deleting local chunk file ${filePath}:`, e.message));
        }

        // Xóa các chunk đã tải lên GCS
        for (const gcsName of gcsObjectNames) {
            await storage.bucket(GCS_BUCKET_NAME).file(gcsName).delete()
                .catch(e => console.error(`Error deleting GCS object ${gcsName}:`, e.message));
        }
        
        console.log("Cleaned up temporary files and GCS chunks.");

        // TRẢ VỀ CẢ URL CLOUDINARY VÀ GCS URI
        return { 
            audioUrl: cloudinaryAudioUrl, // URL cho việc phát lại trên front-end
            gcsAudioUri: gcsAudioUri,    // URI cho Speech-to-Text
            duration, 
            size 
        };

    } catch (error) {
        console.error(`Error in processAudio function: ${error.message}`);
        if (error.code && error.errors) {
            console.error('Google Cloud API Detailed Error:', error.code, JSON.stringify(error.errors, null, 2));
        }
        throw new Error(`Failed to generate and upload audio: ${error.message}`);
    }
}

export const generatePreviewAudio = async (text, voiceConfig, customConfig) => {
    try {
        const request = {
            input: { text },
            voice: {
            languageCode: voiceConfig.languageCodes[0],
            ssmlGender: voiceConfig.ssmlGender || 'FEMALE',
            name: voiceConfig.name,
            },
            audioConfig: {
            audioEncoding: 'MP3', // Yêu cầu định dạng MP3 trực tiếp để dễ phát ở frontend
            sampleRateHertz: voiceConfig.naturalSampleRateHertz || 24000,
            pitch: customConfig?.pitch || 0,
            speakingRate: customConfig?.speakingRate || 1,
            },
        };

        console.log(`[Preview API] Synthesizing preview audio for text: "${text.substring(0, 50)}..."`);
            const [ttsResponse] = await client.synthesizeSpeech(request);

        if (!ttsResponse || !ttsResponse.audioContent) {
            throw new Error('Synthesis operation failed: No audio content received for preview.');
        }

        const tempFileName = `preview-${uuidv4()}.mp3`;
        const gcsFile = storage.bucket(GCS_BUCKET_NAME).file(`temp_previews/${tempFileName}`);

        // Tải nội dung âm thanh trực tiếp lên GCS. File này sẽ ở trạng thái RIÊNG TƯ.
        await gcsFile.save(ttsResponse.audioContent, {
            metadata: { contentType: 'audio/mp3' },
        });

        // --- BƯỚC QUAN TRỌNG: TẠO SIGNED URL THAY VÌ makePublic() ---
        const expiration = Date.now() + 15 * 60 * 1000; // Hết hạn sau 15 phút

        const [signedUrl] = await gcsFile.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: expiration,
        });

        console.log(`[Preview API] Generated signed URL: ${signedUrl}`);
      return { signedUrl };
     
    } catch (err) {
        console.error(`[Preview API] Error: ${err}`);
        throw err;
    }
}
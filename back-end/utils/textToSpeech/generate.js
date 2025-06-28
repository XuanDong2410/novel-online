import { processAudio } from './processAudio.js';
import { processVtt } from './processVtt.js';
import { formatName } from '../formatName.js';
// import { getVietnameseVoices } from './voiceCache.js';
import Audio from '../../models/audio.model.js';
import Chapter from '../../models/chapter.model.js';

export const generateDefaultAudio = async (content, novelName, chapterName, chapterId) => {
    try {
        const defaultVoice = {
            languageCodes: ['vi-VN'],
            name: 'vi-VN-Wavenet-A',
            ssmlGender: 'FEMALE',
            naturalSampleRateHertz: 24000,
        };

        // Hàm processAudio giờ đây trả về cả audioUrl (Cloudinary) và gcsAudioUri
        const { audioUrl, gcsAudioUri, duration, size } = await processAudio(content, defaultVoice, novelName, chapterName);
        
        // Truyền gcsAudioUri cho processVtt
        const subtitleFileUrl = await processVtt(content, gcsAudioUri, novelName, chapterName, 'vi-VN');

        const audioDoc = new Audio({
            audioName: `${defaultVoice.name}-${formatName(chapterName)}`,
            audioFileUrl: audioUrl, // Vẫn lưu URL Cloudinary vào DB
            audioFileType: 'MP3',
            duration,
            size,
            status: 'processed',
            voice: defaultVoice,
            subtitle: { url: subtitleFileUrl, language: 'vi-VN', format: 'VTT' },
            chapterId,
        });
        await audioDoc.save();
                // Update the Chapter document to include the new audio ID in the audios array
        await Chapter.findByIdAndUpdate(
            chapterId,
            { $push: { audios: audioDoc._id } },
            { new: true }
        );
        //  chapter.audios = [...chapter.audios, audioDoc._id];
        return { audioUrl, subtitleFileUrl, voiceConfig: defaultVoice, duration, size };
    } catch (error) {
        console.error(`Error generating default audio and VTT: ${error.message}`);
        if (error.message.includes('INVALID_ARGUMENT')) {
            console.error('Check your Google Cloud project number and location in processAudio.js');
        }
        throw new Error('Failed to generate default audio and VTT');
    }
};

export const generateCustomAudio = async (content, novelName, chapterName, chapterId, voiceConfig, customConfig = {}) => {
    try {
        // Hàm processAudio giờ đây trả về cả audioUrl (Cloudinary) và gcsAudioUri
        const { audioUrl, gcsAudioUri, duration, size } = await processAudio(content, voiceConfig, novelName, chapterName, customConfig);
        
        // Truyền gcsAudioUri cho processVtt
        const subtitleFileUrl = await processVtt(content, gcsAudioUri, novelName, chapterName, voiceConfig.languageCodes[0]);

        const audioDoc = new Audio({
            audioName: `${voiceConfig.name}-${formatName(chapterName)}`,
            audioFileUrl: audioUrl, // Vẫn lưu URL Cloudinary vào DB
            audioFileType: 'MP3',
            duration,
            size,
            status: 'processed',
            voice: voiceConfig,
            subtitle: { url: subtitleFileUrl, language: voiceConfig.languageCodes[0], format: 'VTT' },
            chapterId,
        });
        await audioDoc.save();
                // Update the Chapter document to include the new audio ID in the audios array
        await Chapter.findByIdAndUpdate(
            chapterId,
            { $push: { audios: audioDoc._id } },
            { new: true }
        );
        return { audioFileUrl: audioUrl, subtitleFileUrl, voiceConfig, duration, size }; // Đã sửa audioFileUrl
    } catch (error) {
        console.error(`Error generating custom audio and VTT: ${error.message}`);
        if (error.message.includes('INVALID_ARGUMENT')) {
            console.error('Check your Google Cloud project number and location in processAudio.js');
        }
        throw new Error('Failed to generate custom audio and VTT');
    }
};

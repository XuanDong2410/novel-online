import { processAudio } from "./processAudio.js";
import { processVtt } from "./processVtt.js";

export const generate = async (content, novelName, chapterName) => {
    const voiceReq = {
        "languageCodes": [
            "vi-VN"
        ],
        "name": "vi-VN-Neural2-A",
        "ssmlGender": "FEMALE",
        "naturalSampleRateHertz": 24000
    };
    const audioFileUrl = await processAudio(content, voiceReq, novelName, chapterName);
    const subtitleFileUrl = await processVtt(content, audioFileUrl, novelName, chapterName);
    return { audioFileUrl, subtitleFileUrl };
};
import fs from "fs/promises";
import axios from "axios";
import speech from "@google-cloud/speech";

const client = new speech.SpeechClient();

function splitContent(content) {
  //return content.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim());
  return content.match(/[^.!?]+[.!?]/g) || [content];
}

export async function transcribeAudio(content, filePath) {
  try {
    const res = await axios.get(filePath, { responseType: "arraybuffer" });
    const localFilePath = "audio.mp3";
    fs.writeFileSync(localFilePath, res.data);

    const audioBytes = fs.readFileSync(localFilePath).toString("base64");
    const audio = { content: audioBytes };

    const config = {
      encoding: "MP3",
      sampleRateHertz: 24000,
      languageCode: "vi-VN",
      enableWordTimeOffsets: true,
      model: "latest_long",
      useEnhanced: true,
    };

    const request = { audio, config };
    const [response] = await client.recognize(request);

    let words = [];
    response.results.forEach((result) => {
      result.alternatives[0].words.forEach((word) => {
        words.push({
          word: word.word,
          start_time:
            parseFloat(word.startTime.seconds || 0) +
            parseFloat(word.startTime.nanos || 0) * 1e-9,
          end_time:
            parseFloat(word.endTime.seconds || 0) +
            parseFloat(word.endTime.nanos || 0) * 1e-9,
        });
      });
    });

    const sentences = splitContent(content);
    const transcribedSentences = [];
    let wordIndex = 0;

    for (let sentence of sentences) {
      let sentenceWords = sentence.split(" ");
      let start_time = words[wordIndex]?.start_time || 0;
      let end_time = start_time;
      let transcribedText = "";

      for (let i = 0; i < sentenceWords.length && wordIndex < words.length; i++, wordIndex++) {
        transcribedText += words[wordIndex].word + " ";
        end_time = words[wordIndex].end_time;
      }

      transcribedSentences.push({
        sentence: sentence.trim(),
        start_time,
        end_time,
      });
    }

    return transcribedSentences;
  } catch (error) {
    console.error("❌ Error recognizing speech:", error);
    throw error;
  }finally {
    // Xóa file tạm (dù có lỗi hay không)
    await fs.unlink("audio.mp3").catch(() => {});
}
}

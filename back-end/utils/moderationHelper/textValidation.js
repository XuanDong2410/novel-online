import { LanguageServiceClient } from "@google-cloud/language";
import { sensitiveWords } from "./sensitiveWords.js";
// Khởi tạo Google Natural Language API client
const client = new LanguageServiceClient();

/**
 * Hàm kiểm tra văn bản
 * @param {string} text Văn bản cần phân tích
 * @returns {Promise<object>} Kết quả phân tích từ Google Natural Language API
 */
export const validateText = async (text) => {
    if (!text) {
        throw new Error("Văn bản không được để trống!");
    }

//   return {
//     sentiment: result.documentSentiment,
//     sentences: result.sentences,
//   };
    const results = {
      spellingErrors: [], // Không có trong API này, cần tự xử lý
      sensitiveContent: ["bạo lực", "tục tĩu", "Dương vật"],
      sentiment: null,
      categories: [],
      isValid: true,
    };
  
    // 1. Gửi văn bản tới Natural Language API
    const [response] = await client.analyzeSentiment({ document: { content: text, type: "PLAIN_TEXT" } });
    const sentences = response.sentences;
  
    // 2. Phân tích cảm xúc từng câu
    results.sentiment = response.documentSentiment;
  
    const negativeSentences = sentences.filter((s) => s.sentiment.score < 0);
    if (negativeSentences.length > 0) {
      results.isValid = false; // Có câu tiêu cực
    }
  
    // 3. Tìm từ nhạy cảm trong văn bản
    sensitiveWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      if (regex.test(text)) {
        results.sensitiveContent.push(word);
      }
    });
  
    if (results.sensitiveContent.length > 0) {
      results.isValid = false; // Có từ nhạy cảm
    }
  
    // 4. Phân loại nội dung (nếu cần)
    const [classification] = await client.classifyText({ document: { content: text, type: "PLAIN_TEXT" } });
    results.categories = classification.categories.map((cat) => ({
      name: cat.name,
      confidence: cat.confidence,
    }));
  
    return results;
  };

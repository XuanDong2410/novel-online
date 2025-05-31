import openai from "../../config/openaiClient.js";
import limit from "./rateLimiter.js";
import { getViolationLabels } from "./categoryLabel.js";
import { getCachedModeration, setCachedModeration } from "./cache.js";
import retry from "async-retry";
/**
 * Kiểm duyệt nội dung bằng OpenAI và trả lại toàn bộ kết quả.
 * @param {string} text - Nội dung cần kiểm duyệt.
 * @returns {object} - Đối tượng moderationResult.results[0]
 */

const MAX_TEXT_LENGTH = 2048;

const callModerationAPI = async (text) => {
    return await limit(() => openai.moderations.create({
        input: text,
        model: "omni-moderation-latest",
    }));
};


export const checkContentByAI = async (text) => {
    if (!text || typeof text !== 'string') {
        throw new Error("Đầu vào phải là một chuỗi hợp lệ.");
    }
    if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`Nội dung vượt quá giới hạn ${MAX_TEXT_LENGTH} ký tự.`);
    }
    const cached = await getCachedModeration(text);
    if (cached) return {
        ...extractViolationFromResult(cached),
        labels: getViolationLabels(cached)
    }

    try {
        const moderationResponse = await retry(
            () => callModerationAPI(text),
            { retries: 3, minTimeout: 1000 }
        );

        const result = moderationResponse.results[0];
        if (!result) {
            throw new Error("Không nhận được kết quả kiểm duyệt từ API.");
        }
        setCachedModeration(text, result); // Cache toàn bộ result
        const rawResult = {
            result: result.flagged,
            categories: result.categories,
            category_scores: result.category_scores,
        }
        return {
            ...extractViolationFromResult(result),
            labels: getViolationLabels(result),
            rawResult: rawResult,
        };
    } catch (error) {
        console.error("Lỗi kiểm duyệt AI:", {
            message: error.message,
            stack: error.stack,
            status: error.response?.status,
        });
        return {
            hasViolation: false,
            violationDetails: "",
        };
  }
};
/**
 * Đánh giá vi phạm từ kết quả kiểm duyệt của OpenAI.
 * @param {Object} result - Kết quả từ OpenAI Moderation API.
 * @returns {{ hasViolation: boolean, violationDetails: string }} Kết quả đánh giá vi phạm.
 * @throws {Error} Nếu result không hợp lệ.
 */
export const CUSTOM_THRESHOLDS = {
  'sexual': 0.25,
  "violence": 0.15,
  'sexual/minors': 0.01,
  "harassment": 0.2,
  "hate": 0.2,
};

function extractViolationFromResult(result) {
    if (!result || !result.category_scores || !result.categories) {
        throw new Error("Kết quả kiểm duyệt không hợp lệ.");
    }
  const scores = result.category_scores;
  const categories = result.categories;

  // Vi phạm theo ngưỡng tùy chỉnh
  const customViolations = Object.entries(CUSTOM_THRESHOLDS)
    .filter(([category, threshold]) => scores[category] > threshold)
    .map(([category]) => ({
      category,
      score: scores[category],
    }));

    
    // Vi phạm theo đánh giá mặc định của OpenAI
   const flaggedCategories = Object.entries(categories)
    .filter(([_, isFlagged]) => isFlagged)
    .map(([category]) => category);
    
    const hasOpenAIFlagged = flaggedCategories.length > 0;
    const hasCustomViolation = customViolations.length > 0;

    // Gộp thông tin chi tiết
    const detailsParts = [];

    if (hasOpenAIFlagged) {
        detailsParts.push(`🔴 OpenAI flagged: ${flaggedCategories.join(", ")}`);
    }

    if (hasCustomViolation) {
        const customDetails = customViolations
        .map(v => `${v.category}: ${v.score.toFixed(2)}`)
        .join(", ");
        detailsParts.push(`⚠️ Custom threshold violations: ${customDetails}`);
    }
    return {
        hasViolation: hasOpenAIFlagged || hasCustomViolation,
        violationDetails: detailsParts.join(" | ")|| "Không có vi phạm",
    };
}

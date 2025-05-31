import { CUSTOM_THRESHOLDS } from "./index.js";
export const CATEGORY_LABELS = {
  "harassment": "Quấy rối",
  "harassment/threatening": "Đe dọa",
  "sexual": "Nội dung tình dục",
  "hate": "Thù ghét",
  "hate/threatening": "Thù ghét có đe dọa",
  "illicit": "Nội dung bất hợp pháp",
  "illicit/violent": "Bất hợp pháp & bạo lực",
  "self-harm": "Tự làm hại",
  "self-harm/intent": "Có ý định tự làm hại",
  "self-harm/instructions": "Hướng dẫn tự hại",
  "sexual/minors": "Tình dục trẻ vị thành niên",
  "violence": "Bạo lực",
  "violence/graphic": "Bạo lực đồ họa",
};
/**
 * Trả về danh sách nhãn vi phạm dựa trên kết quả kiểm duyệt.
 * @param {Object} result - Kết quả từ OpenAI Moderation API.
 * @returns {Array<{ key: string, label: string, score: number, flagged: boolean }>} Danh sách nhãn vi phạm.
 * @throws {Error} Nếu result không hợp lệ.
 */
export function getViolationLabels(result) {
    if (!result || !result.category_scores || !result.categories) {
        throw new Error("Kết quả kiểm duyệt không hợp lệ.");
    }
    const scores = result.category_scores;
    const categories = result.categories;
    
    const labels = [];

    for (const [key, score] of Object.entries(scores)) {
        const isFlagged = categories[key] || false;
        const threshold = CUSTOM_THRESHOLDS[key] || 0.5;

        if (score > threshold || isFlagged) {
        labels.push({
            key,
            label: CATEGORY_LABELS[key] || key,
            score: parseFloat(score.toFixed(2)),
        });
        }
    }

    return labels;
}

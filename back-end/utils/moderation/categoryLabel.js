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

export const CATEGORY_MAPPING = {
  'violence': 'violence',
  'violence/graphic': 'violence',
  'sexual': 'adult',
  'sexual/minors': 'adult',
  'hate': 'hate_speech',
  'hate/threatening': 'hate_speech',
  'harassment': 'hate_speech',
  'harassment/threatening': 'hate_speech',
  'illicit': 'spam',
  'illicit/violent': 'spam',
  'self-harm': 'self_harm',
  'self-harm/intent': 'self_harm',
  'self-harm/instructions': 'self_harm',
  'none': null
};
export const SEVERITY_MAPPING = {
  'violence': 'high',
  'violence/graphic': 'critical',
  'sexual': 'high',
  'sexual/minors': 'critical',
  'hate': 'medium',
  'hate/threatening': 'high',
  'harassment': 'medium',
  'harassment/threatening': 'medium',
  'illicit': 'medium',
  'illicit/violent': 'high',
  'self-harm': 'critical',
  'self-harm/intent': 'medium',
  'self-harm/instructions': 'medium',
  default: 'low',
};


export const CUSTOM_THRESHOLDS = {
  'sexual': 0.30,
  'violence': 0.75,
  'sexual/minors': 0.75,
  'self-harm': 0.75,
  'hate': 0.8,
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
        const threshold = CUSTOM_THRESHOLDS[key] || 0.7;

        if (score > threshold || isFlagged) {
        labels.push({
            key,
            label: CATEGORY_LABELS[key] || key,
            score: parseFloat(score.toFixed(2)),
            severity: SEVERITY_MAPPING[key] || 'low',
        });
        }
    }

    return labels;
}

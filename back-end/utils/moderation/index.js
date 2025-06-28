import openai from "../../config/openai.config.js";
import mongoose from "mongoose";
import limit from "./rateLimiter.js";
import { getViolationLabels, CATEGORY_MAPPING, SEVERITY_MAPPING, CUSTOM_THRESHOLDS } from "./categoryLabel.js";
import { getCachedModeration, setCachedModeration } from "./cache.js";
import retry from "async-retry";
import nlp from 'compromise';

const callModerationAPI = async (text) => {
  return await limit(() => openai.moderations.create({
    input: text,
    model: "omni-moderation-latest",
  }));
};

const MAX_TEXT_LENGTH = 2048;

export const checkContentByAI = async (text, chapterId = null) => {
  if (!text || typeof text !== 'string') {
    throw new Error("Đầu vào phải là một chuỗi hợp lệ.");
  }

  // Chia văn bản thành các câu dựa trên dấu xuống dòng
  const sentences = text.split('\n').filter(s => s.trim());
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;
  let currentLine = 1;
  let currentPos = 0;

  // Nhóm các câu thành chunk dựa trên độ dài tối đa
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length + 1; // +1 cho \n

    if (currentLength + sentenceLength > MAX_TEXT_LENGTH) {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n'),
          sentences: currentChunk,
          startLine: currentLine - currentChunk.length,
          startPos: currentPos - currentLength,
        });
        currentLength = 0;
        currentChunk = [];
      }
    }

    currentChunk.push(sentence);
    currentLength += sentenceLength;
    currentLine++;
    currentPos += sentenceLength;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('\n'),
      sentences: currentChunk,
      startLine: currentLine - currentChunk.length,
      startPos: currentPos - currentLength,
    });
  }

  const results = new Map();
  let violationCount = { violence: 0, adult: 0, hate_speech: 0, self_harm: 0, spam: 0, total: 0 };
  const aiFlag = { violence: false, adult: false, hate_speech: false, self_harm: false, spam: false };

  for (const chunk of chunks) {
    // Nhóm các câu theo bối cảnh ngữ nghĩa
    const semanticGroups = groupSentencesByContext(chunk.sentences, chunk.startLine, chunk.startPos);

    for (const group of semanticGroups) {
      const groupText = group.sentences.join('\n');
      const cached = await getCachedModeration(groupText);
      let result;
      if (cached) {
        result = cached;
      } else {
        try {
          const moderationResponse = await retry(
            () => callModerationAPI(groupText),
            { retries: 3, minTimeout: 1000 }
          );
          result = moderationResponse.results[0];
          setCachedModeration(groupText, result);
        } catch (error) {
          console.error("Lỗi kiểm duyệt AI:", error);
          continue;
        }
      }

      const violations = extractViolationFromResult(result, group.startLine, group.startPos, groupText);
      violations.forEach(v => {
        const key = `${v.category}-${v.line}-${v.description}`;
        if (!results.has(key)) {
          results.set(key, {
            _id: new mongoose.Types.ObjectId().toString(),
            category: CATEGORY_MAPPING[v.category] || 'spam',
            title: v.description,
            severity: SEVERITY_MAPPING[v.category] || 'low',
            description: v.description,
            line: v.line,
            start: v.start,
            end: v.end,
            resolved: false,
            isManual: false,
          });
          const mappedCategory = CATEGORY_MAPPING[v.category] || 'spam';
          violationCount[mappedCategory]++;
          violationCount.total++;
          aiFlag[mappedCategory] = true;
        }
      });
    }
  }
  console.log("Kết quả kiểm duyệt AI:", {
    results: Array.from(results.values()),
    aiFlag,
    count: violationCount,
  })
  return {
    results: Array.from(results.values()),
    aiFlag,
    count: violationCount,
  };
};

// Hàm nhóm các câu theo bối cảnh ngữ nghĩa
function groupSentencesByContext(sentences, startLine, startPos) {
  const groups = [];
  let currentGroup = { sentences: [], startLine, startPos };
  let currentPos = startPos;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    const sentenceDoc = nlp(sentence);
    const topics = sentenceDoc.topics().out('array');

    if (currentGroup.sentences.length === 0) {
      currentGroup.sentences.push(sentence);
    } else {
      const lastSentence = currentGroup.sentences[currentGroup.sentences.length - 1];
      const lastDoc = nlp(lastSentence);
      const lastTopics = lastDoc.topics().out('array');

      // Kiểm tra xem câu hiện tại có cùng chủ đề với câu trước không
      const hasCommonTopic = topics.some(t => lastTopics.includes(t));
      const groupText = currentGroup.sentences.join('\n') + '\n' + sentence;

      if (hasCommonTopic && groupText.length < MAX_TEXT_LENGTH) {
        currentGroup.sentences.push(sentence);
      } else {
        groups.push({
          sentences: currentGroup.sentences,
          startLine: currentGroup.startLine,
          startPos: currentGroup.startPos,
        });
        currentGroup = {
          sentences: [sentence],
          startLine: startLine + i,
          startPos: currentPos,
        };
      }
    }

    currentPos += sentence.length + 1; // +1 cho \n
  }

  if (currentGroup.sentences.length > 0) {
    groups.push({
      sentences: currentGroup.sentences,
      startLine: currentGroup.startLine,
      startPos: currentGroup.startPos,
    });
  }
  return groups;
}
function extractViolationFromResult(result, startLine, startPos, text) {
  const violations = new Map();
  const isFlagged = result.categories;
  const scores = result.category_scores;

  // Đánh dấu toàn bộ nhóm câu nếu có vi phạm
  for (const [category, score] of Object.entries(scores)) {
    const threshold = CUSTOM_THRESHOLDS[category] || 0.5;
    if (score > threshold && isFlagged[category]) {
      const mappedCategory = CATEGORY_MAPPING[category] || category;
      if (mappedCategory && mappedCategory !== 'none') {
        const violationKey = `${mappedCategory}-${startLine}-${score}`;
        violations.set(violationKey, {
          _id: `auto-${Date.now()}-${startLine}`,
          category: mappedCategory,
          score: parseFloat(score.toFixed(2)),
          description: `${getViolationLabels({ categories: isFlagged, category_scores: scores }).find(l => l.key === category)?.label || category}: Điểm ${score.toFixed(2)} vượt ngưỡng ${threshold.toFixed(2)} (Nội dung: "${text.slice(0, 50)}...")`,
          line: startLine,
          start: startPos,
          end: startPos + text.length,
          severity: score > 0.9 ? 'critical' : score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low',
          resolved: false,
        });
      }
    }
  }

  return Array.from(violations.values());
}
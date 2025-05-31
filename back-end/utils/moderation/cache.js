import { createHash } from 'crypto';
import NodeCache from "node-cache";

const moderationCache = new NodeCache({ 
    stdTTL: 3600,
    maxKeys: 10000
}); // 1 giờ
const MAX_TEXT_LENGTH = 100000; // Giới hạn độ dài nội dung để lưu cache
const getModerationKey = (text) =>
  createHash('md5').update(text).digest('hex');

export const getCachedModeration = (text) => {
  if (text.length > MAX_TEXT_LENGTH) {
    console.warn("Nội dung quá dài, không sử dụng cache.");
    return null;
  }
  const result = moderationCache.get(getModerationKey(text));
  if (result) {
    console.debug("Cache hit for moderation:", getModerationKey(text));
  }
  return result;
}
export const setCachedModeration = (text, result) => {
  if (text.length > MAX_TEXT_LENGTH) {
    console.warn("Nội dung quá dài, không lưu cache.");
    return;
  }
  console.debug("Cache set for moderation:", getModerationKey(text));
  return moderationCache.set(getModerationKey(text), result);
}

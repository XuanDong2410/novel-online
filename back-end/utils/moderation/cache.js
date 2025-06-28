import { createHash } from 'crypto';
import NodeCache from "node-cache";

const moderationCache = new NodeCache({
  stdTTL: 3600,
  maxKeys: 10000,
});

export const getCachedModeration = (text) => {
  const key = createHash('md5').update(text).digest('hex');
  const result = moderationCache.get(key);
  if (result) {
    console.debug("Cache hit for moderation:", key);
  }
  return result;
};

export const setCachedModeration = (text, result) => {
  const key = createHash('md5').update(text).digest('hex');
  console.debug("Cache set for moderation:", key);
  return moderationCache.set(key, result);
};
import axios from "axios";
import { ENV_VARS } from '../../config/envVars.js';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: ENV_VARS.OPENAI_API_KEY,
});

/**
 * Hàm kiểm tra văn bản
 * @param {string} text Văn bản cần phân tích
 * @returns {Promise<object>} Kết quả phân tích
 */
export async function moderate(text){
  if (!text) {
    throw new Error("Văn bản không được để trống!");
  }
  const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
  });
  return moderation.results;
};

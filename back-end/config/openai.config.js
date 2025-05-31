import { ENV_VARS } from './envVars.config.js';
import OpenAI from "openai";

if (!ENV_VARS.OPENAI_API_KEY) {
  console.error("[Config Error] OPENAI_API_KEY không được thiết lập.");
  throw new Error("OPENAI_API_KEY không được thiết lập trong biến môi trường.");
}
const openai = new OpenAI({
  apiKey: ENV_VARS.OPENAI_API_KEY,
});

export default openai;
import pLimit from "p-limit";
import { ENV_VARS } from "../../config/env.config.js";

const limit = pLimit(Number(ENV_VARS.RATE_LIMIT || 10)); // Giới hạn 10 gọi song song

export default limit;

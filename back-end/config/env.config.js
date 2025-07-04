import dotenv from 'dotenv';

dotenv.config();

export const ENV_VARS = {
    MONGO_URI: process.env.MONGO_URI,

    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,

    TMDB_API_KEY: process.env.TMDB_API_KEY,

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NOVEL_OPENAI_API_KEY: process.env.NOVEl_OPENAI_API_KEY,
    
    RATE_LIMIT: 10,
    SYSTEM_USER_PASSWORD:  process.env.SYSTEM_USER_PASSWORD || 'NovelOnlinePlatform',
}
import dotenv from 'dotenv';
import path from 'path';


dotenv.config();

// const googleCredentialsPath = path.resolve(
//     process.cwd(), // Thư mục gốc nơi bạn chạy ứng dụng
//     process.env.GOOGLE_APPLICATION_CREDENTIALS
// );
//process.env.GOOGLE_APPLICATION_CREDENTIALS = "/path/to/your/file.json";

export const ENV_VARS = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
}
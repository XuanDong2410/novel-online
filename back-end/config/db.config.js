import mongoose from "mongoose";
import { ENV_VARS } from "./env.config.js";

export const connectDB = async () => {
    try {
       const conn = await mongoose.connect(ENV_VARS.MONGO_URI);
       console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error("Mongoose connection failed: " + error.message);
        process.exit(1); // Exit process with failure
    }
}
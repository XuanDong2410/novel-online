import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import { ENV_VARS } from "./env.config.js"

export function createApp() {
    const app = express()
    // Cấu hình CORS
    app.use(cors({
        origin: 'http://localhost:3000', // Cho phép frontend từ localhost:3000
        credentials: true, // Cho phép gửi cookie
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức HTTP được phép
        allowedHeaders: ['Content-Type', 'Authorization'] // Các header được phép
    }))
    app.use(express.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(bodyParser.json())

    return app
}

export const PORT = ENV_VARS.PORT
import express from "express"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import { ENV_VARS } from "./env.config.js"

export function createApp(){
    const app = express()

    app.use(express.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(bodyParser.json())

    return app
}

export const PORT = ENV_VARS.PORT
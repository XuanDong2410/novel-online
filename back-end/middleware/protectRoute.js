import jwt, { decode } from 'jsonwebtoken';
import { ENV_VARS } from '../config/envVars.js';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies["jwt-novel"];
        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access - No Token Provided"});
        }

        const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access - Invalid Token"});
        }

        const user = await User.findById(decoded.userId).select("-password");

        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"});
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error: " + error.message
        });
        console.error("Error in protectRoute middleware: " + error.message);
    }
}
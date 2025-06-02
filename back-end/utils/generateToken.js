import jwt from 'jsonwebtoken'
import { ENV_VARS } from '../config/env.config.js';
import User from '../models/user.model.js';

export const generateTokenAndSetCookie = (userId, role, res) =>{
    // Tạo access token ( hết hạn sau 1h)
    const accessToken = jwt.sign({ userId, role }, ENV_VARS.JWT_SECRET, { expiresIn: '1h' });
    // Tạo refresh token ( hết hạn sau 7 ngày)
    const refreshToken = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: '7d' });

    // Lưu refresh token vào database
    User.findByIdAndUpdate(userId, { refreshToken }, { new: true });

    // Đặt access token vào cookie
    res.cookie('jwt-novel', accessToken, {
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in milliseconds
        httpOnly: true, // prevents client side JS from reading the cookie, 
        // prevents XSS attacks cross-site scripting attacks, make it not be accessed by JS
        sameSite: "strict", // cookie will only be sent in a first-party context
        // CSRF attacks, protect against cross-site request forgery
        secure: ENV_VARS.NODE_ENV === 'development', // cookie will only be sent in

        path: '/'  // This is important for the cookie to be sent only to the root path
    }); 
    // Đặt refresh token vào cookie
    res.cookie('jwt-refresh-novel', refreshToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in milliseconds
        httpOnly: true, // prevents client side JS from reading the cookie, 
        // prevents XSS attacks cross-site scripting attacks, make it not be accessed by JS
        sameSite: "strict", // cookie will only be sent in a first-party context
        // CSRF attacks, protect against cross-site request forgery
        secure: ENV_VARS.NODE_ENV === 'development', // cookie will only be sent in

        path: '/'  // This is important for the cookie to be sent only to the root path
    }); 
    return { accessToken, refreshToken };
}
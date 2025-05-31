import jwt from 'jsonwebtoken'
import { ENV_VARS } from '../config/envVars.config.js';

export const generateTokenAndSetCookie = (userId, res) =>{
    const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('jwt-novel', token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in milliseconds
        //expires: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        httpOnly: true, // prevents client side JS from reading the cookie, 
        // prevents XSS attacks cross-site scripting attacks, make it not be accessed by JS
        sameSite: "strict", // cookie will only be sent in a first-party context
        // CSRF attacks, protect against cross-site request forgery
        secure: ENV_VARS.NODE_ENV === 'development', // cookie will only be sent in
    });   // This is important for the cookie to be sent only to the root path
    return token;
}
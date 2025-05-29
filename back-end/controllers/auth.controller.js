import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
export const signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if(!email || !password || !username) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }
        if(password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }
        const existingUserByEmail = await User.findOne({ email: email });
        if(existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        const existingUserByUsername = await User.findOne({ username: username });
        if(existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];
        const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword,
            image: image,
        });
        if(newUser){
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                success: true,
                message: "User created successfully",
                user: {
                    ...newUser._doc,
                    password: "",
                },
            })
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message
        });
        console.log("Error in sign up" + error.message);
    }
}
export const login = async (req, res) => {
    try {
        const {email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid credentials"
            });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials (password)"
            });
        }
        
        if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: "Your account has been deactivated. Please contact support."
        });
        }
        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                ...user._doc,
                password: "",
            }
        })
        }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error logging in user",
            error: error.message
        });
        console.log("Error in login" + error.message);
    }
}
export const logout = async (req, res) => {
    try {
        res.clearCookie("jwt-novel");
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error logging out",
            error: error.message
        })
        console.log("Error in logout" + error.message);
    }
}
export async function authCheck(req, res) {
    try {
        //console.log("User is here: ", req.user);
        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
        console.log("Error in authCheck controller: ", error.message);
    }
}
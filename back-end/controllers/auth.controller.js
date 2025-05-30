import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { validateSignup, validateLogin } from "../utils/validator.js";
export const signup = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        // Validate input
        const { error } = validateSignup(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const existingUserByEmail = await User.findOne({ email: email }).lean();
        // Use .lean() to return a plain JavaScript object instead of a Mongoose document
        if(existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        const existingUserByUsername = await User.findOne({ username: username }).lean();
        // Use .lean() to return a plain JavaScript object instead of a Mongoose document
        if(existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }
        // Hash the password
        // Use bcrypt to hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a random profile picture
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
                    ...newUser.toObject(), // Convert Mongoose document to plain object
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

        // Validate input
        const { error } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
    
        const user = await User.findOne({ email: email }).select("+password").lean();
        // Use .lean() to return a plain JavaScript object instead of a Mongoose document
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
        // Kiểm tra xem người dùng có bị khóa hay không
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support."
            });
        }
        // Cập nhật lastLogin
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        // Generate token and set cookie
        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                ...user,
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
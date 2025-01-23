import {User} from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export const signup = async (req, res) =>
{
    try {

        const {email, password, username} = req.body;
        if(!email || !password || !username) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }
        if(password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }
        const existingUserByEmail = await User.findOne({email: email});
        if(existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }
        const existingUserByUsername = await User.findOne({username: username});
        if(existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: "User with this username already exists",
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];
        const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];
        const newUser = new User({
            email: email,
            password: hashedPassword,
            username: username,
            image: image,
        });
        
        generateTokenAndSetCookie(newUser._id, res);
        await newUser.save();
        return res.status(201).json(
            {
                success: true,
                message: "User created successfully",
                user: {
                    ...newUser._doc,
                    password: "",
                },
            }            
        );
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        }); 
        console.log("Error in signup controller: ", error.message);      
    }
}
export async function login(req, res) {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const user = await User.findOne({email: email});
        if(!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        if(!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        generateTokenAndSetCookie(user._id, res);
        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: "",
            },
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        }); 
        console.log("Error in login controller: ", error.message); 
        
    }
}
export async function logout(req, res) {
    try{
        res.clearCookie("jwt-novel");
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch(error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        }); 
        console.log("Error in logout controller: ", error.message); 
    }
}
export async function authCheck(req, res) {
    try {
        console.log("User is here: ", req.user);
        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
        console.log("Error in authCheck controller: ", error.message);
    }
}

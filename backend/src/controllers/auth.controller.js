import { sendWelcomeEmail } from "../Emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        const cleanName = typeof fullName === "string" ? fullName.trim() : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!cleanName || !cleanEmail || typeof password !== "string") {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (cleanName.length > 60) return res.status(400).json({ message: "Names must be 60 characters or fewer" });

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be atleast 6 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (user) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName: cleanName,
            email: cleanEmail,
            password: hashedPassword,
        });

        if (newUser) {
            const savedUser = await newUser.save();

            generateToken(newUser._id, res);

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });

            try {
                await sendWelcomeEmail(
                    savedUser.email,
                    savedUser.fullName,
                    ENV.CLIENT_URL
                );
            } catch (error) {}
        } else {
            return res.status(400).json({ message: "invalid user data" });
        }
    } catch (error) {
        console.error("Error in signup controller", error);
        return res.status(500).json({ message: "internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!cleanEmail || typeof password !== "string") {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);

        return res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error("Error in login controller", error);
        return res.status(500).json({ message: "internal server error" });
    }
};

export const logout = (_, res) => {
    res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
    return res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req,res) => {
try {
    const {profilePic} = req.body;
    if(!profilePic) return res.status(400).json({ message: "Profile pic is required"})

     const userId = req.user._id;   

     const uploadResponse = await cloudinary.uploader.upload(profilePic)

     const updateUser =  await User.findByIdAndUpdate(
        userId,
        {profilePic: uploadResponse.secure_url},
        {new: true}
     ).select("-password");

     res.status(200).json(updateUser);
} catch (error) {
    console.log("Error in updating profile" , error); 
    res.status(500).json({message: "Internal  server error"});
    
}
}

import { sendWelcomeEmail } from "../Emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import "dotenv/config";

export const signup = async (req,res) => {
const {fullName , email , password} = req.body;

try {
    if(!fullName || !email || !password) {
        return res.status(404).json({message : "All fields are required"});
    }

    if(password.length<6) {
        return res.status(400).json({message : "Password must be atleast 6 characters"});
    }

   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if(!emailRegex.test(email)) {
    return res.status(400).json({message : "Invalid email formate"})
   }

   const user = await User.findOne({email});
    if(user) return res.status(400).json({meassage: "email already exist"})

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = 
    await bcrypt.hash(password,salt)

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
    })

    if(newUser) {
        const savedUser = await newUser.save()
        generateToken(newUser._id,res);

        res.status(201).json({
            _id:newUser._id,
            fullName:newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic
        })

        try {
            await sendWelcomeEmail(savedUser.email,savedUser.fullName,process.env.CLIENT_URL);
        } catch (error) {
            
        }
    }

    else {
        res.status(400),json({message: "invalid user data"})
    }


} catch (error) {
    
}



}
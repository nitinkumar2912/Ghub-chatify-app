import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(404).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be atleast 6 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email formate" })
        }

        const user = await User.findOne({ email });
        if (user) return res.status(400).json({ meassage: "email already exist" })

        const salt = await bcrypt.genSalt(10)
        const hashedPassword =
            await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save()

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            })
        }

        else {
            res.status(400), json({ message: "invalid user data" })
        }


    } catch (error) {

    }



}

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = findOne({ email })
        if (!user) return res.status(400).json({ message: "Invalid credential" })


        const IsPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!IsPasswordCorrect) return res.status(400).json({ message: "Invalid credential" })

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });

    } catch (error) {

    }
}
export const logout = async (_, res) => { 
    res.cookie("jwt","",{maxAge : 0});
    res.status(200).json({ message: "Logged out successfully" });

};

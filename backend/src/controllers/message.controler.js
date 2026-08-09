import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req , res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password")

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getAllContacts:",error);
        res.status(500).json({message: "Server error"});
        
    }
}

export const getMessageByUserId = async (req,res) => {
    try {
        const myId = req.user._id;
        const {id: usertoChatId} = req.params;

        const message = await Message.find(
            {
                $or: [
                    {senderId: myId, receiverId: usertoChatId},
                    {senderId: usertoChatId, receiverId: myId}
                ]
            }
        );
        res.status(200).json(message)
    } catch (error) {
        console.log("Error in getMessages controller :",error.message);
        res.status(500).json({message: "Internal Server error"});
    }
}

export const sendMessage = async (req,res) => {
    try {
        const {text ,image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message ({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save()

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessages controller :",error.message);
        res.status(500).json({message: "Internal Server error"});

        
    }
}

export const getChatPartners = async (req,res) => {
    
}
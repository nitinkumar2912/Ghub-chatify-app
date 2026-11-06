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
        ).sort({ createdAt: 1 });
        const unreadIds = message
            .filter((item) => item.receiverId.equals(myId) && !item.isRead)
            .map((item) => item._id);
        if (unreadIds.length) {
            await Message.updateMany({ _id: { $in: unreadIds } }, { isRead: true });
            message.forEach((item) => {
                if (unreadIds.some((id) => id.equals(item._id))) item.isRead = true;
            });
            req.app.get("io").to(`user:${usertoChatId}`).emit("message:read", {
                messageIds: unreadIds.map((id) => id.toString()),
            });
        }
        res.status(200).json(message)
    } catch (error) {
        console.log("Error in getMessages controller :",error.message);
        res.status(500).json({message: "Internal Server error"});
    }
}

export const sendMessage = async (req,res) => {
    try {
        const {text = "",image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        const cleanText = typeof text === "string" ? text.trim() : "";
        if(!cleanText && !image ) {
            return res.status(400).json({message: "Text or image is required."});
        }
        if (cleanText.length > 2000) {
            return res.status(400).json({message: "Messages must be 2,000 characters or fewer."});
        }

        if(senderId.equals(receiverId)) {
            return res.status(400).json({message: "Cannot send message to yourself"})
        }

        const receiverExists = await User.exists({_id: receiverId});
        if(!receiverExists) {
            return res.status(404).json({message: "Receiver not found."});
        }

        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message ({
            senderId,
            receiverId,
            text: cleanText,
            image: imageUrl,
        });

        await newMessage.save();

        const serializedMessage = newMessage.toObject();
        const io = req.app.get("io");
        io.to(`user:${receiverId}`).emit("message:new", serializedMessage);
        io.to(`user:${senderId}`).emit("message:new", serializedMessage);

        res.status(201).json(serializedMessage);
    } catch (error) {
        console.log("Error in sendMessages controller :",error.message);
        res.status(500).json({message: "Internal Server error"});

        
    }
}

export const getChatPartners = async (req,res) => {
    try {
        const loggedInUserId = req.user._id;
        
        const messages = await Message.find({
            $or: [{senderId: loggedInUserId},{receiverId: loggedInUserId}],
        }).sort({ createdAt: -1 });

        const chatsByPartner = new Map();
        for (const message of messages) {
            const partnerId = message.senderId.equals(loggedInUserId)
                ? message.receiverId.toString()
                : message.senderId.toString();
            const entry = chatsByPartner.get(partnerId) || {
                lastMessage: message,
                unreadCount: 0,
            };
            if (message.receiverId.equals(loggedInUserId) && !message.isRead) {
                entry.unreadCount += 1;
            }
            chatsByPartner.set(partnerId, entry);
        }

        const chatPartnerIds = [...chatsByPartner.keys()];
        const users = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");
        const chats = users
            .map((user) => ({
                ...user.toObject(),
                ...chatsByPartner.get(user._id.toString()),
            }))
            .sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

        res.status(200).json(chats)
    } catch (error) {
        console.log("Error in getChatPartners: ",error.message);
        res.status(500).json({message: "Internal Server error"});
    }
}

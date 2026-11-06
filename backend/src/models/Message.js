import mongoose  from "mongoose";



 const messageSchema = new mongoose.Schema (
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,

        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,

        },
        text: {
            type: String,
            trim: true,
            maxLength: 2000,
        },
        image: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true}
);
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;

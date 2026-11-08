import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    clientMessageId: { type: String, default: null },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    reactions: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, emoji: String }],
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1, _id: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1, _id: -1 });
messageSchema.index(
  { senderId: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $type: "string" } } },
);
messageSchema.index({ text: "text" });

const Message = mongoose.model("Message", messageSchema);

export default Message;

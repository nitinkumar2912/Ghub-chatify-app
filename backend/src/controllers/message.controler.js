import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import {
  blockSchema,
  editMessageSchema,
  messageSchema,
  muteSchema,
  paginationSchema,
  reactionSchema,
  reportSchema,
  validationMessage,
} from "../lib/validation.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";
import User from "../models/User.js";

const CONTACT_FIELDS = "fullName profilePic username bio status lastSeen";
const idIsValid = (value) => mongoose.Types.ObjectId.isValid(value);
const asId = (value) => new mongoose.Types.ObjectId(value);

function messagePair(userId, otherUserId) {
  return {
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  };
}

export const getAllContacts = async (req, res) => {
  try {
    const me = req.user._id;
    const blockedIds = (req.user.blockedUsers || []).map((id) => id.toString());
    const contacts = await User.find({
      _id: { $nin: [me, ...blockedIds] },
      blockedUsers: { $ne: me },
    })
      .select(CONTACT_FIELDS)
      .sort({ fullName: 1 })
      .limit(500)
      .lean();
    return res.status(200).json(contacts);
  } catch (error) {
    console.error("Contact list failed:", error.message);
    return res.status(500).json({ message: "Could not load contacts" });
  }
};

export const getBlockedContacts = async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $in: req.user.blockedUsers || [] } })
      .select(CONTACT_FIELDS)
      .sort({ fullName: 1 })
      .lean();
    return res.status(200).json(contacts);
  } catch (error) {
    console.error("Blocked contact list failed:", error.message);
    return res.status(500).json({ message: "Could not load blocked people" });
  }
};

export const getMessageByUserId = async (req, res) => {
  const userId = req.user._id;
  const { id: otherUserId } = req.params;
  if (!idIsValid(otherUserId)) return res.status(400).json({ message: "Invalid conversation" });

  const pageResult = paginationSchema.safeParse(req.query);
  if (!pageResult.success)
    return res.status(400).json({ message: validationMessage(pageResult.error) });

  try {
    const alreadyBlocked = (req.user.blockedUsers || []).some(
      (blockedId) => blockedId.toString() === otherUserId,
    );
    const otherUser = await User.findOne({
      _id: otherUserId,
      blockedUsers: { $ne: userId },
    }).select("_id");
    if (!otherUser || alreadyBlocked)
      return res.status(404).json({ message: "This conversation is unavailable" });

    const filter = messagePair(userId, asId(otherUserId));
    if (pageResult.data.cursor) {
      const cursorMessage = await Message.findOne({
        _id: pageResult.data.cursor,
        ...messagePair(userId, asId(otherUserId)),
      })
        .select("createdAt")
        .lean();
      if (!cursorMessage) return res.status(400).json({ message: "Invalid message cursor" });
      filter.$and = [
        {
          $or: [
            { createdAt: { $lt: cursorMessage.createdAt } },
            { createdAt: cursorMessage.createdAt, _id: { $lt: cursorMessage._id } },
          ],
        },
      ];
    }

    const found = await Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(pageResult.data.limit + 1)
      .lean();
    const hasMore = found.length > pageResult.data.limit;
    const page = found.slice(0, pageResult.data.limit);
    const unreadIds = page
      .filter((message) => message.receiverId.equals(userId) && !message.isRead)
      .map((message) => message._id);

    if (unreadIds.length) {
      const readAt = new Date();
      await Message.updateMany(
        { _id: { $in: unreadIds }, receiverId: userId, isRead: false },
        { $set: { isRead: true, readAt, deliveredAt: readAt } },
      );
      page.forEach((message) => {
        if (unreadIds.some((id) => id.equals(message._id))) {
          message.isRead = true;
          message.readAt = readAt;
          message.deliveredAt ||= readAt;
        }
      });
      req.app
        .get("io")
        .to(`user:${otherUserId}`)
        .emit("message:read", {
          messageIds: unreadIds.map((id) => id.toString()),
          readAt,
        });
    }

    const nextCursor = hasMore ? page.at(-1)?._id : null;
    return res.status(200).json({
      messages: page.reverse(),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Conversation load failed:", error.message);
    return res.status(500).json({ message: "Could not load this conversation" });
  }
};

export const sendMessage = async (req, res) => {
  const { id: receiverId } = req.params;
  if (!idIsValid(receiverId)) return res.status(400).json({ message: "Invalid recipient" });
  const result = messageSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });

  const { text, image, clientMessageId } = result.data;
  const senderId = req.user._id;
  if (!text && !image)
    return res.status(400).json({ message: "Write a message or choose an image" });
  if (senderId.equals(receiverId))
    return res.status(400).json({ message: "You cannot message yourself" });
  if (req.user.blockedUsers?.some((id) => id.equals(receiverId))) {
    return res.status(403).json({ message: "This person is unavailable" });
  }

  try {
    const recipient = await User.findOne({
      _id: receiverId,
      blockedUsers: { $ne: senderId },
    }).select("_id");
    if (!recipient) return res.status(404).json({ message: "This person is unavailable" });

    if (clientMessageId) {
      const existing = await Message.findOne({ senderId, receiverId, clientMessageId }).lean();
      if (existing) return res.status(200).json(existing);
    }

    if (result.data.replyTo) {
      const repliedMessage = await Message.exists({
        _id: result.data.replyTo,
        ...messagePair(senderId, asId(receiverId)),
      });
      if (!repliedMessage)
        return res.status(400).json({ message: "Reply target is not in this conversation" });
    }

    let imageUrl;
    if (image) {
      const upload = await cloudinary.uploader.upload(image, {
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        max_file_size: 8_000_000,
      });
      imageUrl = upload.secure_url;
    }

    const io = req.app.get("io");
    const recipientIsOnline = (await io.in(`user:${receiverId}`).fetchSockets()).length > 0;
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      clientMessageId,
      replyTo: result.data.replyTo || null,
      deliveredAt: recipientIsOnline ? new Date() : null,
    });
    const serialized = message.toObject();
    io.to(`user:${receiverId}`).emit("message:new", serialized);
    io.to(`user:${senderId}`).emit("message:new", serialized);
    return res.status(201).json(serialized);
  } catch (error) {
    if (error.code === 11000 && clientMessageId) {
      const existing = await Message.findOne({ senderId, receiverId, clientMessageId }).lean();
      if (existing) return res.status(200).json(existing);
    }
    console.error("Message send failed:", error.message);
    return res
      .status(image ? 502 : 500)
      .json({ message: image ? "Could not upload this image" : "Could not send this message" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const userId = req.user._id;
    const blockedIds = req.user.blockedUsers || [];
    const partnerGroups = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      {
        $addFields: {
          partnerId: { $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"] },
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiverId", userId] }, { $eq: ["$isRead", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1, "lastMessage._id": -1 } },
    ]);

    const ids = partnerGroups.map((group) => group._id);
    const users = await User.find({
      _id: { $in: ids, $nin: blockedIds },
      blockedUsers: { $ne: userId },
    })
      .select(CONTACT_FIELDS)
      .lean();
    const byId = new Map(users.map((user) => [user._id.toString(), user]));
    const chats = partnerGroups.flatMap((group) => {
      const user = byId.get(group._id.toString());
      return user
        ? [{ ...user, lastMessage: group.lastMessage, unreadCount: group.unreadCount }]
        : [];
    });
    return res.status(200).json(chats);
  } catch (error) {
    console.error("Chat list failed:", error.message);
    return res.status(500).json({ message: "Could not load your conversations" });
  }
};

export const searchMessages = async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 2 || query.length > 80) {
    return res.status(400).json({ message: "Search must be between 2 and 80 characters" });
  }

  try {
    const blockedIds = (req.user.blockedUsers || []).map((id) => id.toString());
    const blockedByMeIds = await User.distinct("_id", { blockedUsers: req.user._id });
    const unavailableIds = [...new Set([...blockedIds, ...blockedByMeIds.map(String)])];
    const messages = await Message.find({
      $text: { $search: query },
      deletedAt: null,
      $or: [
        { senderId: req.user._id, receiverId: { $nin: unavailableIds } },
        { receiverId: req.user._id, senderId: { $nin: unavailableIds } },
      ],
    })
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(50)
      .lean();
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Message search failed:", error.message);
    return res.status(500).json({ message: "Could not search messages" });
  }
};

async function loadParticipantMessage(messageId, userId) {
  if (!idIsValid(messageId)) return null;
  const message = await Message.findOne({
    _id: messageId,
    $or: [{ senderId: userId }, { receiverId: userId }],
  });
  if (!message) return null;
  const otherUserId = message.senderId.equals(userId) ? message.receiverId : message.senderId;
  const [currentUser, otherUser] = await Promise.all([
    User.findById(userId).select("blockedUsers"),
    User.findOne({ _id: otherUserId, blockedUsers: { $ne: userId } }).select("_id"),
  ]);
  const blockedByMe = (currentUser?.blockedUsers || []).some((id) => id.equals(otherUserId));
  return otherUser && !blockedByMe ? message : null;
}

function emitMessageUpdate(req, message) {
  const io = req.app.get("io");
  const payload = message.toObject();
  io.to(`user:${message.senderId}`).emit("message:updated", payload);
  io.to(`user:${message.receiverId}`).emit("message:updated", payload);
}

export const editMessage = async (req, res) => {
  if (!idIsValid(req.params.messageId)) return res.status(400).json({ message: "Invalid message" });
  const result = editMessageSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });
  try {
    const message = await loadParticipantMessage(req.params.messageId, req.user._id);
    if (!message || !message.senderId.equals(req.user._id) || message.deletedAt)
      return res.status(404).json({ message: "Message not found" });
    message.text = result.data.text;
    message.editedAt = new Date();
    await message.save();
    emitMessageUpdate(req, message);
    return res.status(200).json(message);
  } catch (error) {
    console.error("Message edit failed:", error.message);
    return res.status(500).json({ message: "Could not edit this message" });
  }
};

export const deleteMessage = async (req, res) => {
  if (!idIsValid(req.params.messageId)) return res.status(400).json({ message: "Invalid message" });
  try {
    const message = await loadParticipantMessage(req.params.messageId, req.user._id);
    if (!message || !message.senderId.equals(req.user._id) || message.deletedAt)
      return res.status(404).json({ message: "Message not found" });
    message.text = "";
    message.image = undefined;
    message.deletedAt = new Date();
    message.editedAt = null;
    await message.save();
    emitMessageUpdate(req, message);
    return res.status(200).json(message);
  } catch (error) {
    console.error("Message delete failed:", error.message);
    return res.status(500).json({ message: "Could not delete this message" });
  }
};

export const toggleReaction = async (req, res) => {
  const result = reactionSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Choose a supported reaction" });
  try {
    const message = await loadParticipantMessage(req.params.messageId, req.user._id);
    if (!message || message.deletedAt)
      return res.status(404).json({ message: "Message not found" });
    const existingIndex = message.reactions.findIndex(
      (reaction) => reaction.userId.equals(req.user._id) && reaction.emoji === result.data.emoji,
    );
    if (existingIndex >= 0) message.reactions.splice(existingIndex, 1);
    else message.reactions.push({ userId: req.user._id, emoji: result.data.emoji });
    await message.save();
    emitMessageUpdate(req, message);
    return res.status(200).json(message);
  } catch (error) {
    console.error("Message reaction failed:", error.message);
    return res.status(500).json({ message: "Could not update this reaction" });
  }
};

export const togglePin = async (req, res) => {
  try {
    const message = await loadParticipantMessage(req.params.messageId, req.user._id);
    if (!message || message.deletedAt)
      return res.status(404).json({ message: "Message not found" });
    message.isPinned = !message.isPinned;
    await message.save();
    emitMessageUpdate(req, message);
    return res.status(200).json(message);
  } catch (error) {
    console.error("Message pin update failed:", error.message);
    return res.status(500).json({ message: "Could not update this pin" });
  }
};

export const setUserBlocked = async (req, res) => {
  const { id } = req.params;
  if (!idIsValid(id) || req.user._id.equals(id))
    return res.status(400).json({ message: "Invalid person" });
  const result = blockSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });
  try {
    const exists = await User.exists({ _id: id });
    if (!exists) return res.status(404).json({ message: "Person not found" });
    const isBlocked = result.data.blocked;
    await User.updateOne(
      { _id: req.user._id },
      isBlocked ? { $addToSet: { blockedUsers: asId(id) } } : { $pull: { blockedUsers: asId(id) } },
    );
    const updatedUser = await User.findById(req.user._id).select("blockedUsers").lean();
    return res.status(200).json({
      userId: id,
      blocked: isBlocked,
      blockedUsers: updatedUser?.blockedUsers || [],
    });
  } catch (error) {
    console.error("Block update failed:", error.message);
    return res.status(500).json({ message: "Could not update this person" });
  }
};

export const setUserMuted = async (req, res) => {
  const { id } = req.params;
  if (!idIsValid(id) || req.user._id.equals(id))
    return res.status(400).json({ message: "Invalid person" });
  const result = muteSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });
  try {
    const exists = await User.exists({ _id: id });
    if (!exists) return res.status(404).json({ message: "Person not found" });
    const muted = result.data.muted;
    await User.updateOne(
      { _id: req.user._id },
      muted ? { $addToSet: { mutedUsers: asId(id) } } : { $pull: { mutedUsers: asId(id) } },
    );
    const updatedUser = await User.findById(req.user._id).select("mutedUsers").lean();
    return res.status(200).json({
      userId: id,
      muted,
      mutedUsers: updatedUser?.mutedUsers || [],
    });
  } catch (error) {
    console.error("Mute update failed:", error.message);
    return res.status(500).json({ message: "Could not update notification settings" });
  }
};

export const reportUser = async (req, res) => {
  const { id } = req.params;
  if (!idIsValid(id) || req.user._id.equals(id))
    return res.status(400).json({ message: "Invalid person" });
  const result = reportSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });
  try {
    const exists = await User.exists({ _id: id });
    if (!exists) return res.status(404).json({ message: "Person not found" });
    await Report.create({
      reporterId: req.user._id,
      reportedUserId: asId(id),
      reason: result.data.reason,
    });
    return res.status(201).json({ message: "Thanks. Your report was received." });
  } catch (error) {
    console.error("User report failed:", error.message);
    return res.status(500).json({ message: "Could not submit this report" });
  }
};

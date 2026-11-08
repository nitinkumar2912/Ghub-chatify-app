import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  getAllContacts,
  getBlockedContacts,
  getChatPartners,
  getMessageByUserId,
  deleteMessage,
  editMessage,
  reportUser,
  searchMessages,
  setUserBlocked,
  setUserMuted,
  sendMessage,
  togglePin,
  toggleReaction,
} from "../controllers/message.controler.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "You’re sending requests too quickly. Please slow down." },
});

router.use(arcjetProtection, protectRoute, messageLimiter);
router.get("/contacts", getAllContacts);
router.get("/contacts/blocked", getBlockedContacts);
router.get("/chats", getChatPartners);
router.get("/search", searchMessages);
router.post("/contacts/:id/block", setUserBlocked);
router.post("/contacts/:id/mute", setUserMuted);
router.post("/contacts/:id/report", reportUser);
router.patch("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);
router.post("/:messageId/reactions", toggleReaction);
router.post("/:messageId/pin", togglePin);
router.get("/:id", getMessageByUserId);
router.post("/send/:id", sendMessage);

export default router;


import express from "express";
import { getAllContacts ,getChatPartners,getMessageByUserId , sendMessage } from "../controllers/message.controler.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/contacts",protectRoute,getAllContacts);
router.get("/chats",getChatPartners);
router.get("/:id",protectRoute,getMessageByUserId)


router.post("/send/:id" ,protectRoute, sendMessage);   

export default router;
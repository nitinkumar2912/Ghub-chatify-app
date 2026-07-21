
import express from "express";
import { getAllContacts } from "../controllers/message.controler.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/contacts",protectRoute,getAllContacts);
// router.get("/chats",getChatPartners);
// router.get(":id",getMessageByUserId)


// router.post("/send/:id" , sendMessage);   

export default router;
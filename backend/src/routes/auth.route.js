
import express from "express";
import { signup ,login,logout,updateProfile} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection); // agar next function call hoga then signup , login ,logut ,updateprofile chalenge

router.post("/signup" ,signup)   
router.post("/login" , login)   
router.post("/logout" , logout) 
router.put("/update-profile" , protectRoute ,updateProfile) 
router.get("/check",protectRoute,(req,res) => res.status(200).json(req.user))



export default router;
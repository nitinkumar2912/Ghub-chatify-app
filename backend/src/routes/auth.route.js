import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  login,
  logout,
  refresh,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signup,
  updateProfile,
  updateUserProfile,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please wait a few minutes." },
});
const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many recovery requests. Please try again later." },
});

router.use(arcjetProtection);
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refresh);
router.post("/verify-email", recoveryLimiter, verifyEmail);
router.post("/resend-verification", recoveryLimiter, resendVerification);
router.post("/forgot-password", recoveryLimiter, requestPasswordReset);
router.post("/reset-password", recoveryLimiter, resetPassword);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, updateProfile);
router.patch("/update-user-profile", protectRoute, updateUserProfile);
router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;

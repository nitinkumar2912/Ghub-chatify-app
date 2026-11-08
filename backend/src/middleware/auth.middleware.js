import Session from "../models/Session.js";
import User from "../models/User.js";
import { verifyAccessToken } from "../lib/utils.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

    const decoded = verifyAccessToken(token);
    if (decoded.sid) {
      const session = await Session.exists({
        _id: decoded.sid,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      });
      if (!session)
        return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "Unauthorized - User not found" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized - Invalid or expired session" });
  }
};

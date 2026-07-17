import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
  try {
    const decision = await aj.protect(req);

    // Request denied
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          message: "Rate limit exceeded. Please try again later.",
        });
      }

      if (decision.reason.isBot()) {
        return res.status(403).json({
          message: "Bot access denied.",
        });
      }

      return res.status(403).json({
        message: "Access denied by security policy.",
      });
    }

    // Check for spoofed bots
    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        error: "Spoofed bot detected",
        message: "Malicious bot activity detected.",
      });
    }

    // Allow the request
    next();
  } catch (error) {
    console.error("Arcjet Protection Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
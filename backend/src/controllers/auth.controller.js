import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { ENV } from "../lib/env.js";
import {
  clearAuthCookies,
  createOpaqueToken,
  createSession,
  hashOpaqueToken,
  revokeSession,
  rotateSession,
  verifyAccessToken,
} from "../lib/utils.js";
import {
  emailSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  validationMessage,
  verifyEmailSchema,
} from "../lib/validation.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../Emails/emailHandlers.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

function publicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    profilePic: user.profilePic,
    username: user.username,
    bio: user.bio,
    notificationPrefs: user.notificationPrefs,
    mutedUsers: user.mutedUsers || [],
    createdAt: user.createdAt,
  };
}

function createClientLink(path, token) {
  const base = ENV.CLIENT_URL.replace(/\/+$/, "");
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

export const signup = async (req, res) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });
  if (ENV.EMAIL_VERIFICATION_REQUIRED && (!ENV.RESEND_API_KEY || !ENV.EMAIL_FROM)) {
    return res.status(503).json({ message: "Email verification is temporarily unavailable" });
  }

  const { fullName, email, password } = result.data;
  try {
    const verification = createOpaqueToken();
    const user = await User.create({
      fullName,
      email,
      password: await bcrypt.hash(password, 12),
      emailVerified: false,
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    let verificationEmailSent = false;
    if (ENV.RESEND_API_KEY && ENV.EMAIL_FROM) {
      try {
        await sendVerificationEmail(
          email,
          fullName,
          createClientLink("/verify-email", verification.token),
        );
        verificationEmailSent = true;
      } catch (error) {
        console.error("Verification email could not be sent:", error.message);
      }
    }

    if (ENV.EMAIL_VERIFICATION_REQUIRED && !verificationEmailSent) {
      return res.status(503).json({
        message:
          "Your account was created, but the verification email could not be sent. Please request another link.",
      });
    }

    if (!ENV.EMAIL_VERIFICATION_REQUIRED) await createSession(user, res);
    return res.status(201).json({
      ...publicUser(user),
      requiresEmailVerification: ENV.EMAIL_VERIFICATION_REQUIRED,
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "An account with this email already exists" });
    console.error("Signup failed:", error.message);
    return res.status(500).json({ message: "Could not create your account" });
  }
};

export const login = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });

  try {
    const user = await User.findOne({ email: result.data.email });
    const validPassword = user && (await bcrypt.compare(result.data.password, user.password));
    if (!user || !validPassword)
      return res.status(401).json({ message: "Invalid email or password" });
    if (ENV.EMAIL_VERIFICATION_REQUIRED && !user.emailVerified) {
      return res.status(403).json({ message: "Please verify your email before signing in" });
    }

    await createSession(user, res);
    return res.status(200).json(publicUser(user));
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ message: "Could not sign in" });
  }
};

export const verifyEmail = async (req, res) => {
  const result = verifyEmailSchema.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({ message: "Verification link is invalid or expired" });
  try {
    const user = await User.findOne({
      emailVerificationTokenHash: hashOpaqueToken(result.data.token),
      emailVerificationExpiresAt: { $gt: new Date() },
      emailVerified: false,
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");
    if (!user) return res.status(400).json({ message: "Verification link is invalid or expired" });

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();
    if (ENV.RESEND_API_KEY && ENV.EMAIL_FROM) {
      sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL).catch((error) => {
        console.error("Welcome email could not be sent:", error.message);
      });
    }
    return res.status(200).json({ message: "Your email is verified. You can sign in now." });
  } catch (error) {
    console.error("Email verification failed:", error.message);
    return res.status(500).json({ message: "Could not verify this email" });
  }
};

export const resendVerification = async (req, res) => {
  const result = emailSchema.safeParse(req.body);
  if (!result.success)
    return res
      .status(202)
      .json({ message: "If the account needs verification, a link will be sent shortly." });
  try {
    const user = await User.findOne({ email: result.data.email, emailVerified: false });
    if (user && ENV.RESEND_API_KEY && ENV.EMAIL_FROM) {
      const token = createOpaqueToken();
      user.emailVerificationTokenHash = token.tokenHash;
      user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(
        user.email,
        user.fullName,
        createClientLink("/verify-email", token.token),
      );
    }
    return res
      .status(202)
      .json({ message: "If the account needs verification, a link will be sent shortly." });
  } catch (error) {
    console.error("Verification resend failed:", error.message);
    return res
      .status(202)
      .json({ message: "If the account needs verification, a link will be sent shortly." });
  }
};

export const requestPasswordReset = async (req, res) => {
  const result = emailSchema.safeParse(req.body);
  if (!result.success)
    return res
      .status(202)
      .json({ message: "If an account matches that address, a reset link will be sent shortly." });
  try {
    const user = await User.findOne({ email: result.data.email });
    if (user && ENV.RESEND_API_KEY && ENV.EMAIL_FROM) {
      const token = createOpaqueToken();
      user.passwordResetTokenHash = token.tokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendPasswordResetEmail(
        user.email,
        user.fullName,
        createClientLink("/reset-password", token.token),
      );
    }
    return res
      .status(202)
      .json({ message: "If an account matches that address, a reset link will be sent shortly." });
  } catch (error) {
    console.error("Password reset request failed:", error.message);
    return res
      .status(202)
      .json({ message: "If an account matches that address, a reset link will be sent shortly." });
  }
};

export const resetPassword = async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: validationMessage(result.error) });
  try {
    const user = await User.findOne({
      passwordResetTokenHash: hashOpaqueToken(result.data.token),
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return res.status(400).json({ message: "Reset link is invalid or expired" });

    user.password = await bcrypt.hash(result.data.password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    await Session.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    req.app.get("io").in(`user:${user._id}`).disconnectSockets(true);
    clearAuthCookies(res);
    return res
      .status(200)
      .json({ message: "Password updated. Please sign in with your new password." });
  } catch (error) {
    console.error("Password reset failed:", error.message);
    return res.status(500).json({ message: "Could not reset your password" });
  }
};

export const refresh = async (req, res) => {
  try {
    const rotated = await rotateSession(req.cookies?.refreshToken, res);
    if (!rotated) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    return res.status(204).end();
  } catch (error) {
    clearAuthCookies(res);
    console.error("Session refresh failed:", error.message);
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
};

export const logout = async (req, res) => {
  try {
    await revokeSession(req.cookies?.refreshToken, req.cookies?.jwt);
  } catch (error) {
    console.error("Logout cleanup failed:", error.message);
  }
  try {
    const accessToken = req.cookies?.jwt;
    if (accessToken) {
      const { sid } = verifyAccessToken(accessToken, { ignoreExpiration: true });
      if (sid) req.app.get("io").in(`session:${sid}`).disconnectSockets(true);
    }
  } catch {
    // Malformed access cookies are still cleared below.
  }
  clearAuthCookies(res);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  const profilePic = req.body?.profilePic;
  if (
    typeof profilePic !== "string" ||
    !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(profilePic) ||
    profilePic.length > 11_200_000
  ) {
    return res.status(400).json({ message: "Choose a JPEG, PNG, or WebP image under 8 MB" });
  }

  try {
    const upload = await cloudinary.uploader.upload(profilePic, {
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      max_file_size: 8_000_000,
      transformation: [{ width: 512, height: 512, crop: "limit" }],
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: upload.secure_url },
      { new: true, runValidators: true },
    ).select("-password");
    return res.status(200).json(publicUser(user));
  } catch (error) {
    console.error("Profile image update failed:", error.message);
    return res.status(502).json({ message: "Could not upload this image" });
  }
};

export const updateUserProfile = async (req, res) => {
  const updates = {};
  let unsetUsername = false;

  if (req.body.fullName !== undefined) {
    const name = String(req.body.fullName).trim();
    if (name.length < 1 || name.length > 60)
      return res.status(400).json({ message: "Name must be between 1 and 60 characters" });
    updates.fullName = name;
  }
  if (req.body.bio !== undefined) {
    const bio = String(req.body.bio).trim();
    if (bio.length > 200)
      return res.status(400).json({ message: "Bio must be under 200 characters" });
    updates.bio = bio;
  }
  if (req.body.username !== undefined) {
    const username = String(req.body.username).trim().toLowerCase();
    if (
      username &&
      (username.length < 3 || username.length > 30 || !/^[a-z0-9_]+$/.test(username))
    ) {
      return res
        .status(400)
        .json({ message: "Username must be 3-30 characters (letters, numbers, underscores)" });
    }
    if (username) updates.username = username;
    else unsetUsername = true;
  }
  if (req.body.notificationPrefs !== undefined && typeof req.body.notificationPrefs === "object") {
    const prefs = {};
    if (typeof req.body.notificationPrefs.sound === "boolean")
      prefs["notificationPrefs.sound"] = req.body.notificationPrefs.sound;
    if (typeof req.body.notificationPrefs.desktop === "boolean")
      prefs["notificationPrefs.desktop"] = req.body.notificationPrefs.desktop;
    if (typeof req.body.notificationPrefs.messagePreview === "boolean")
      prefs["notificationPrefs.messagePreview"] = req.body.notificationPrefs.messagePreview;
    Object.assign(updates, prefs);
  }

  if (!Object.keys(updates).length && !unsetUsername)
    return res.status(400).json({ message: "No changes to save" });

  try {
    const update = {};
    if (Object.keys(updates).length) update.$set = updates;
    if (unsetUsername) update.$unset = { username: 1 };
    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(publicUser(user));
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "That username is already taken" });
    console.error("Profile update failed:", error.message);
    return res.status(500).json({ message: "Could not update your profile" });
  }
};

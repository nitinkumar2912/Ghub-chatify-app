import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { ENV } from "./env.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cookiePolicy = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: ENV.COOKIE_SAME_SITE || (ENV.NODE_ENV === "production" ? "none" : "lax"),
  path: "/api/auth",
};

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashOpaqueToken(token) {
  return hashToken(token);
}

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("jwt", accessToken, {
    ...cookiePolicy,
    path: "/",
    maxAge: ACCESS_TTL_SECONDS * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookiePolicy,
    maxAge: REFRESH_TTL_MS,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("jwt", { ...cookiePolicy, path: "/" });
  res.clearCookie("refreshToken", cookiePolicy);
}

export async function createSession(user, res) {
  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  const session = await Session.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });
  const accessToken = jwt.sign(
    { userId: user._id.toString(), sid: session._id.toString() },
    ENV.JWT_SECRET,
    { expiresIn: ACCESS_TTL_SECONDS, algorithm: "HS256" },
  );
  setAuthCookies(res, accessToken, refreshToken);
}

export async function rotateSession(refreshToken, res) {
  if (!refreshToken) return false;
  const now = new Date();
  const session = await Session.findOneAndUpdate(
    { tokenHash: hashToken(refreshToken), revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now } },
    { new: false },
  );
  if (!session) return false;

  const user = await User.findById(session.userId).select("_id");
  if (!user) return false;
  await createSession(user, res);
  return true;
}

export async function revokeSession(refreshToken, accessToken) {
  const now = new Date();
  if (refreshToken) {
    await Session.updateOne(
      { tokenHash: hashToken(refreshToken), revokedAt: null },
      { $set: { revokedAt: now } },
    );
  }
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, ENV.JWT_SECRET, { algorithms: ["HS256"] });
      if (decoded.sid) {
        await Session.updateOne(
          { _id: decoded.sid, userId: decoded.userId, revokedAt: null },
          { $set: { revokedAt: now } },
        );
      }
    } catch {
      // Expired or malformed access cookies still get cleared by the caller.
    }
  }
}

export function verifyAccessToken(token, { ignoreExpiration = false } = {}) {
  return jwt.verify(token, ENV.JWT_SECRET, { algorithms: ["HS256"], ignoreExpiration });
}

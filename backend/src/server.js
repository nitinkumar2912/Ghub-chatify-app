import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Server } from "socket.io";
import { assertRequiredEnvironment, ENV } from "./lib/env.js";
import Message from "./models/Message.js";
import Session from "./models/Session.js";
import User from "./models/User.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

const app = express();
const httpServer = createServer(app);
mongoose.set("autoIndex", ENV.NODE_ENV !== "production");
const allowedOrigins = ENV.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(moduleDir, "../../frontend/dist");
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
});

app.set("io", io);
app.set("trust proxy", ENV.NODE_ENV === "production" ? 1 : false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "ws:", "wss:", ...allowedOrigins],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use((req, res, next) => {
  if (
    !safeMethods.has(req.method) &&
    req.headers.origin &&
    !allowedOrigins.includes(req.headers.origin)
  ) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }
  next();
});
app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  }),
);

app.get("/api/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "database_unavailable",
    database: databaseReady ? "connected" : "disconnected",
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.use(["/api/auth", "/api/messages"], (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "The chat database is unavailable. Check the backend MONGO_URI configuration.",
    });
  }
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found" }));

if (ENV.NODE_ENV === "production") {
  app.use(express.static(frontendDist, { maxAge: "1h", index: false }));
  app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
}

app.use((_req, res) => res.status(404).json({ message: "Not found" }));
app.use((error, _req, res, _next) => {
  console.error(
    JSON.stringify({ level: "error", message: error.message, time: new Date().toISOString() }),
  );
  if (res.headersSent) return;
  return res.status(error.status || 500).json({ message: "An unexpected server error occurred" });
});

io.use(async (socket, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return next(new Error("Chat database unavailable"));
    const tokenPair = (socket.handshake.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("jwt="));
    const token = tokenPair?.slice(4);
    if (!token) return next(new Error("Authentication required"));

    const { userId, sid } = jwt.verify(decodeURIComponent(token), ENV.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (sid) {
      const session = await Session.exists({
        _id: sid,
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      });
      if (!session) return next(new Error("Authentication required"));
    }
    const user = await User.findById(userId).select("_id blockedUsers");
    if (!user) return next(new Error("Authentication required"));

    socket.data.userId = user._id.toString();
    socket.data.sessionId = sid || null;
    socket.data.blockedUsers = user.blockedUsers.map((id) => id.toString());
    return next();
  } catch {
    return next(new Error("Authentication required"));
  }
});

async function broadcastPresence() {
  const onlineUsers = [
    ...new Set([...io.sockets.sockets.values()].map((socket) => socket.data.userId)),
  ];
  io.emit("presence:update", onlineUsers);
  const users = await User.find({ _id: { $in: onlineUsers } })
    .select("_id status lastSeen")
    .lean();
  io.emit("presence:details", users);
}

io.on("connection", async (socket) => {
  const userId = socket.data.userId;
  const userRoom = `user:${userId}`;
  socket.join(userRoom);
  if (socket.data.sessionId) socket.join(`session:${socket.data.sessionId}`);
  await User.updateOne({ _id: userId }, { $set: { status: "online" } });
  await broadcastPresence();

  try {
    const pending = await Message.find({ receiverId: userId, deliveredAt: null })
      .select("_id senderId")
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();
    if (pending.length) {
      const deliveredAt = new Date();
      const ids = pending.map((message) => message._id);
      await Message.updateMany({ _id: { $in: ids }, deliveredAt: null }, { $set: { deliveredAt } });
      const bySender = new Map();
      for (const message of pending) {
        const senderId = message.senderId.toString();
        bySender.set(senderId, [...(bySender.get(senderId) || []), message._id.toString()]);
      }
      for (const [senderId, messageIds] of bySender) {
        io.to(`user:${senderId}`).emit("message:delivered", { messageIds, deliveredAt });
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({ level: "warn", event: "pending_delivery_failed", message: error.message }),
    );
  }

  socket.on("typing:update", async ({ toUserId, isTyping } = {}) => {
    if (
      !mongoose.Types.ObjectId.isValid(toUserId) ||
      toUserId === userId ||
      socket.data.blockedUsers.includes(toUserId)
    )
      return;
    const now = Date.now();
    if (isTyping && now - (socket.data.lastTypingEvent || 0) < 250) return;
    socket.data.lastTypingEvent = now;
    const recipient = await User.findOne({ _id: toUserId, blockedUsers: { $ne: userId } }).select(
      "_id",
    );
    if (!recipient) return;
    socket.data.typingTo = isTyping ? toUserId : null;
    io.to(`user:${toUserId}`).emit("typing:update", { userId, isTyping: Boolean(isTyping) });
  });

  socket.on("message:read", async ({ withUserId, userId: legacySenderId } = {}) => {
    const senderId = withUserId || legacySenderId;
    if (!mongoose.Types.ObjectId.isValid(senderId) || senderId === userId) return;
    try {
      const unread = await Message.find({ senderId, receiverId: userId, isRead: false })
        .select("_id")
        .lean();
      if (!unread.length) return;
      const messageIds = unread.map((message) => message._id);
      const readAt = new Date();
      await Message.updateMany(
        { _id: { $in: messageIds }, receiverId: userId, isRead: false },
        { $set: { isRead: true, readAt, deliveredAt: readAt } },
      );
      io.to(`user:${senderId}`).emit("message:read", {
        messageIds: messageIds.map(String),
        readAt,
      });
    } catch (error) {
      console.error(
        JSON.stringify({ level: "warn", event: "read_receipt_failed", message: error.message }),
      );
    }
  });

  socket.on("disconnect", async () => {
    if (socket.data.typingTo) {
      io.to(`user:${socket.data.typingTo}`).emit("typing:update", { userId, isTyping: false });
    }
    const remainingSockets = await io.in(userRoom).fetchSockets();
    if (!remainingSockets.length) {
      const lastSeen = new Date();
      await User.updateOne({ _id: userId }, { $set: { status: "offline", lastSeen } });
      io.emit("presence:lastSeen", { userId, status: "offline", lastSeen });
    }
    await broadcastPresence();
  });
});

async function startServer() {
  assertRequiredEnvironment();
  httpServer.listen(ENV.PORT, () => {
    console.info(JSON.stringify({ level: "info", event: "server_listening", port: ENV.PORT }));
  });
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.info(JSON.stringify({ level: "info", event: "mongo_connected" }));
  } catch (error) {
    const reason = error.cause?.code || error.code || error.name;
    console.error(JSON.stringify({ level: "error", event: "mongo_connect_failed", reason }));
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    io.close();
    mongoose.disconnect().finally(() => process.exit(0));
  });
}

startServer();

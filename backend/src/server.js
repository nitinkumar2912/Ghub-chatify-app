import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import path from "path";
import mongoose from "mongoose";
import { ENV } from "./lib/env.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

const app = express();
const httpServer = createServer(app);
const allowedOrigin = ENV.CLIENT_URL || "http://localhost:5173";
const io = new Server(httpServer, {
  cors: { origin: allowedOrigin, credentials: true },
});

app.set("io", io);
app.use(express.json({ limit: "12mb" }));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(cookieParser());

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

app.get("/api/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "database_unavailable",
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

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
  });
}

io.use(async (socket, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next(new Error("Chat database unavailable"));
    }
    const cookieHeader = socket.handshake.headers.cookie || "";
    const tokenPair = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("jwt="));
    const token = tokenPair?.slice(4);
    if (!token) return next(new Error("Authentication required"));

    const { userId } = jwt.verify(decodeURIComponent(token), ENV.JWT_SECRET);
    const user = await User.findById(userId).select("_id");
    if (!user) return next(new Error("Authentication required"));

    socket.data.userId = user._id.toString();
    next();
  } catch {
    next(new Error("Authentication required"));
  }
});

function broadcastPresence() {
  const onlineUsers = [
    ...new Set([...io.sockets.sockets.values()].map((socket) => socket.data.userId)),
  ];
  io.emit("presence:update", onlineUsers);
}

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);
  broadcastPresence();

  socket.on("typing:update", ({ toUserId, isTyping } = {}) => {
    if (typeof toUserId !== "string" || toUserId === userId) return;
    socket.data.typingTo = isTyping ? toUserId : null;
    io.to(`user:${toUserId}`).emit("typing:update", {
      userId,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("message:read", async ({ userId: senderId } = {}) => {
    if (typeof senderId !== "string") return;
    try {
      const messages = await Message.find({
        senderId,
        receiverId: userId,
        isRead: false,
      }).select("_id");
      if (!messages.length) return;
      const messageIds = messages.map((message) => message._id.toString());
      await Message.updateMany({ _id: { $in: messageIds } }, { isRead: true });
      io.to(`user:${senderId}`).emit("message:read", { messageIds });
    } catch (error) {
      console.error("Could not mark messages as read:", error.message);
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.typingTo) {
      io.to(`user:${socket.data.typingTo}`).emit("typing:update", {
        userId,
        isTyping: false,
      });
    }
    broadcastPresence();
  });
});

async function startServer() {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    const reason = error.cause?.code || error.code || error.name;
    const message = String(error.message || "").toLowerCase();
    if (error.code === 8000 || message.includes("bad auth")) {
      console.error(
        "MongoDB authentication failed. Check the Atlas database user's username and password, and URL-encode reserved characters in the password."
      );
    } else if (reason === "ENOTFOUND") {
      console.error(
        "MongoDB host could not be resolved. Check the Atlas SRV hostname in backend/.env, cluster status, and DNS access."
      );
    } else {
      console.error(
        `MongoDB is unavailable (${reason}). Check backend/.env and confirm MONGO_URI and database network access.`
      );
    }
  }
}

startServer();

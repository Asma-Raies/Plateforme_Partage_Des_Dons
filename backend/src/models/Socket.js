// socket.js  — import and call setupSocket(httpServer) in server.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/* ── connected users map: userId → Set of socket ids ── */
const onlineUsers = new Map();

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /* ── Auth middleware: verify JWT on every socket connection ── */
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
    onlineUsers.get(uid).add(socket.id);

    /* join personal room so we can emit by userId */
    socket.join(`user:${uid}`);

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(uid);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(uid);
      }
    });

    /* join a conversation room for real-time chat */
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    /* typing indicator */
    socket.on("typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user_typing", {
        userId: uid,
        conversationId,
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user_stop_typing", {
        userId: uid,
        conversationId,
      });
    });
  });

  return io;
}

/* ── emitToUser: used by controllers to push real-time events ── */
let _io = null;
export function setIO(io) { _io = io; }
export function getIO()   { return _io; }

export function emitToUser(userId, event, data) {
  if (_io) _io.to(`user:${userId.toString()}`).emit(event, data);
}

export function emitToConversation(conversationId, event, data) {
  if (_io) _io.to(`conv:${conversationId.toString()}`).emit(event, data);
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}
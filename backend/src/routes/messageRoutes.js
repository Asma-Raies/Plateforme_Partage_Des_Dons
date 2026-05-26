import express from "express";
import {
  getConversations, getAvailableAssociations, getMessages,
  sendMessage, startConversation, deleteMessage, archiveConversation,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Conversations
router.get("/conversations", getConversations);
router.get("/associations/available", getAvailableAssociations);
router.post("/conversations/start", startConversation);
router.put("/conversations/:conversationId/archive", archiveConversation);

// Messages
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/send", sendMessage);
router.delete("/:messageId", deleteMessage);

export default router;

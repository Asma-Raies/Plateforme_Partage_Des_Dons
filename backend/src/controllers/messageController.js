import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { createNotification } from "../Services/Notificationservice.js";
import { emitToConversation, emitToUser } from "../models/Socket.js";

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const findConversation = (userAId, userBId) => ({
  $or: [
    { donor: userAId, association: userBId },
    { donor: userBId, association: userAId },
  ],
});

const getRecipientId = (conversation, userId) => {
  return conversation.donor.toString() === userId
    ? conversation.association.toString()
    : conversation.donor.toString();
};

/* ══════════════════════════════════════════════════════════
   GET CONVERSATIONS
══════════════════════════════════════════════════════════ */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const conversations = await Conversation.find({
      $or: [{ donor: userId }, { association: userId }],
      status: "active",
    })
      .populate("donor", "name email avatar role")
      .populate("association", "name email organizationName avatar role")
      .sort({ lastMessageAt: -1 });

    const enriched = conversations.map((conv) => {
      const obj = conv.toObject();
      obj.otherParticipant =
        conv.donor._id.toString() === userId ? obj.association : obj.donor;
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    console.error("getConversations error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   GET AVAILABLE ASSOCIATIONS
══════════════════════════════════════════════════════════ */
export const getAvailableAssociations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const associations = await User.find({ role: "association", status: "active" })
      .select("name email organizationName description avatar")
      .sort({ organizationName: 1 });

    const result = await Promise.all(
      associations.map(async (assoc) => {
        const existing = await Conversation.findOne(
          findConversation(userId, assoc._id.toString())
        );
        return {
          ...assoc.toObject(),
          hasConversation: !!existing,
          conversationId: existing?._id || null,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("getAvailableAssociations error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   GET MESSAGES
══════════════════════════════════════════════════════════ */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant =
      conversation.donor.toString() === userId ||
      conversation.association.toString() === userId;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "name role avatar organizationName")
      .sort({ createdAt: 1 });

    // Mark messages from the other person as read
    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    conversation.unreadCount = 0;
    await conversation.save();

    emitToConversation(conversationId, "messages_read", { conversationId, userId });

    res.json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   SEND MESSAGE
══════════════════════════════════════════════════════════ */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, content } = req.body;
    const senderId = req.user._id.toString();

    if (!content?.trim()) return res.status(400).json({ message: "Message content is required" });

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });

      const isParticipant =
        conversation.donor.toString() === senderId ||
        conversation.association.toString() === senderId;
      if (!isParticipant) return res.status(403).json({ message: "Not authorized" });
    } else {
      if (!recipientId) return res.status(400).json({ message: "recipientId is required" });

      conversation = await Conversation.findOne(findConversation(senderId, recipientId));

      if (!conversation) {
        const senderUser = await User.findById(senderId).select("role");
        const isDonor = senderUser.role === "donor";
        conversation = await Conversation.create({
          donor:       isDonor ? senderId : recipientId,
          association: isDonor ? recipientId : senderId,
          unreadCount: 0,
        });
      }
    }

    // ── Fetch sender info for required schema fields ──────
    const senderUser = await User.findById(senderId).select("name role organizationName");
    const senderName = senderUser.organizationName || senderUser.name;
    const senderRole = senderUser.role; // "donor" | "association"

    // Create message with all required fields
    const message = await Message.create({
      conversationId: conversation._id,   // ✅ matches schema field name
      sender:         senderId,
      senderName,                          // ✅ required by schema
      senderRole,                          // ✅ required by schema
      content:        content.trim(),
    });

    await message.populate("sender", "name role avatar organizationName _id");

    const recipientUserId = getRecipientId(conversation, senderId);

    // Update conversation
    conversation.lastMessage         = content.trim();
    conversation.lastMessageAt       = new Date();
    conversation.lastMessageSenderId = senderId;
    conversation.unreadCount         = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    const populatedConv = await Conversation.findById(conversation._id)
      .populate("donor",        "name email organizationName role avatar")
      .populate("association",  "name email organizationName role avatar");

    // Real-time
    emitToConversation(conversation._id.toString(), "new_message", {
      message: {
        _id:            message._id,
        conversationId: conversation._id,
        sender:         message.sender,
        senderName:     message.senderName,
        senderRole:     message.senderRole,
        content:        message.content,
        isRead:         false,
        createdAt:      message.createdAt,
      },
      conversationId: conversation._id,
    });

    emitToUser(recipientUserId, "conversation_updated", populatedConv);

    // Notification
    await createNotification({
      recipient: recipientUserId,
      sender:    senderId,
      type:      "new_message",
      title:     `New message from ${senderName}`,
      body:      content.trim().slice(0, 80) + (content.length > 80 ? "…" : ""),
      link:      `/messages`,
      meta:      { conversationId: conversation._id },
    });

    res.status(201).json({ message, conversation: populatedConv });
  } catch (err) {
    console.error("sendMessage error:", err.message, err.errors);
    res.status(500).json({ message: err.message, errors: err.errors });
  }
};

/* ══════════════════════════════════════════════════════════
   START CONVERSATION
══════════════════════════════════════════════════════════ */
export const startConversation = async (req, res) => {
  try {
    const { associationId, donorId: bodyDonorId } = req.body;

    // Support two directions:
    // Donor → Association: pass associationId
    // Association → Donor: pass donorId
    let donorId, assocId;
    if (req.user.role === "association") {
      if (!bodyDonorId) return res.status(400).json({ message: "donorId is required" });
      donorId = bodyDonorId;
      assocId = req.user._id.toString();
    } else {
      if (!associationId) return res.status(400).json({ message: "associationId is required" });
      donorId = req.user._id.toString();
      assocId = associationId;
    }

    let conversation = await Conversation.findOne(findConversation(donorId, assocId));

    if (!conversation) {
      conversation = await Conversation.create({
        donor:         donorId,
        association:   assocId,
        unreadCount:   0,
        lastMessageAt: new Date(),
      });
    }

    await conversation.populate([
      { path: "donor",       select: "name email avatar role" },
      { path: "association", select: "name email organizationName avatar role" },
    ]);

    res.status(201).json(conversation);
  } catch (err) {
    console.error("startConversation error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE MESSAGE
══════════════════════════════════════════════════════════ */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });

    emitToConversation(message.conversationId.toString(), "message_deleted", { messageId });

    await message.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   ARCHIVE CONVERSATION
══════════════════════════════════════════════════════════ */
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant =
      conversation.donor.toString() === userId ||
      conversation.association.toString() === userId;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    conversation.status = "archived";
    await conversation.save();
    res.json({ success: true });
  } catch (err) {
    console.error("archiveConversation error:", err);
    res.status(500).json({ message: err.message });
  }
};
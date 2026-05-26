// services/notificationService.js
// ─── Import this in every controller that needs to push notifications ───
import Notification from "../models/Notification.js";
import { emitToUser } from "../models/Socket.js";

/**
 * createNotification({ recipient, sender, type, title, body, link, meta })
 * Saves to DB and pushes via WebSocket instantly.
 */
export async function createNotification({
  recipient,
  sender = null,
  type,
  title,
  body,
  link = null,
  meta = {},
}) {
  try {
    const notif = await Notification.create({
      recipient,
      sender,
      type,
      title,
      body,
      link,
      meta,
      isRead: false,
    });

    // Push real-time to the recipient's socket room
    emitToUser(recipient, "new_notification", {
      _id:       notif._id,
      type:      notif.type,
      title:     notif.title,
      body:      notif.body,
      link:      notif.link,
      meta:      notif.meta,
      isRead:    false,
      createdAt: notif.createdAt,
    });

    return notif;
  } catch (err) {
    // Never crash the caller if notification fails
    console.error("Notification error:", err.message);
    return null;
  }
}

/**
 * notifyAdmins – shortcut to send the same notification to all admins
 */
export async function notifyAdmins({ sender, type, title, body, link, meta }) {
  try {
    const User = (await import("../models/User.js")).default;
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        createNotification({ recipient: a._id, sender, type, title, body, link, meta })
      )
    );
  } catch (err) {
    console.error("notifyAdmins error:", err.message);
  }
}
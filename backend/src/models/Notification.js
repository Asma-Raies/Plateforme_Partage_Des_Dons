// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String, required: true,
      enum: [
        "new_user_registered",
        "association_approved", "association_rejected",
        "money_donation_received", "money_donation_confirmed",
        "object_donation_received", "object_donation_confirmed",
        "object_donation_declined", "object_donation_completed",
        "appointment_rescheduled",
        "new_message",
        "claim_submitted", "review_submitted",
      ],
    },
    title:  { type: String, required: true },
    body:   { type: String, required: true },
    link:   { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
    meta:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5184000 }); // 60 days

export default mongoose.model("Notification", notificationSchema);
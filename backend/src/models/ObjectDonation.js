import mongoose from "mongoose";

const objectDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    association: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["clothes", "food", "furniture", "education", "health", "other"],
      required: true,
    },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    condition: { type: String, enum: ["new", "good", "used"], default: "good" },
    images: [{ url: String, publicId: String }],
    method: { type: String, enum: ["pickup", "dropoff"], required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    donorLocation: { lat: Number, lng: Number }, // Donor's location for drop-off (only for dropoff method)
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    qrCode: { type: String },
    qrCodeText: { type: String },
    moderatorNotes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("ObjectDonation", objectDonationSchema);

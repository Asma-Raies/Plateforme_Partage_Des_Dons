import mongoose from "mongoose";

const moneyDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "succeeded",
    },
    receiptSentAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

const MoneyDonation = mongoose.model("MoneyDonation", moneyDonationSchema);

export default MoneyDonation; // ← c'est ça qui manquait

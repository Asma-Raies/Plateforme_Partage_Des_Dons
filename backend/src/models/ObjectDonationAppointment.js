import mongoose from "mongoose";

const objectDonationAppointmentSchema = new mongoose.Schema(
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
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    itemNeedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    appointmentDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 400,
    },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
    },
    moderatorNotes: {
      type: String,
      default: "",
      maxlength: 400,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

objectDonationAppointmentSchema.index({ donor: 1, appointmentDate: -1 });
objectDonationAppointmentSchema.index({ association: 1, appointmentDate: -1 });
objectDonationAppointmentSchema.index({ campaign: 1 });

export default mongoose.model(
  "ObjectDonationAppointment",
  objectDonationAppointmentSchema,
);

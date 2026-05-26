// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["donor", "association"],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    title: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false, // admin must approve/publish
    },
    adminNote: {
      type: String,
      maxlength: 300,
    },
  },
  { timestamps: true }
);

// One review per user
reviewSchema.index({ author: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
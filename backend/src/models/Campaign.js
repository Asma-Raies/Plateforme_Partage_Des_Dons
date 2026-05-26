import mongoose from "mongoose";

const needItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "pcs" },
    received: { type: Number, default: 0 },
    description: { type: String },
    raised: { type: Number, default: 0 },
    donorsCount: { type: Number, default: 0 },
  },
  { _id: true },
);

const campaignSchema = new mongoose.Schema(
  {
    /* ── Identity ── */
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },
    slug: { type: String, unique: true, lowercase: true },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: [
        "education",
        "health",
        "food",
        "shelter",
        "clothes",
        "children",
        "elderly",
        "disaster",
        "animals",
        "other",
      ],
      required: true,
    },

    /* ── Owner ── */
    association: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ── Money goal ── */
    moneyGoal: { type: Number, default: 0 }, // 0 = no money needed
    moneyRaised: { type: Number, default: 0 },

    /* ── Object/material needs ── */
    needsObjects: { type: Boolean, default: false },
    objectNeeds: [needItemSchema], // list of needed items

    /* ── Media ── */
    coverImage: { type: String, default: null },
    images: [{ type: String }],

    /* ── Dates ── */
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date, required: [true, "Deadline is required"] },

    /* ── Location ── */
    location: { type: String, default: "" },
    wilaya: { type: String, default: "" },

    /* ── Status ── */
    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "active",
    },

    /* ── Priority ── */
    isUrgent: {
      type: Boolean,
      default: false,
    },

    /* ── Stats (denormalized for performance) ── */
    donorsCount: { type: Number, default: 0 },
    objectDonations: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Virtuals ── */
campaignSchema.virtual("moneyProgress").get(function () {
  if (!this.moneyGoal) return 0;
  return Math.min(Math.round((this.moneyRaised / this.moneyGoal) * 100), 100);
});

campaignSchema.virtual("daysLeft").get(function () {
  if (!this.deadline) return null;
  const diff = new Date(this.deadline) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

campaignSchema.virtual("isExpired").get(function () {
  return this.deadline && new Date(this.deadline) < new Date();
});

/* ── Auto-generate slug before save ── */
campaignSchema.pre("save", async function () {
  if (!this.isModified("title") && this.slug) return;
  const base = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const rand = Math.random().toString(36).slice(2, 7);
  this.slug = `${base}-${rand}`;
});

/* ── Indexes ── */
campaignSchema.index({ association: 1 });
campaignSchema.index({ status: 1, deadline: 1 });
campaignSchema.index({ category: 1 });

export default mongoose.model("Campaign", campaignSchema);

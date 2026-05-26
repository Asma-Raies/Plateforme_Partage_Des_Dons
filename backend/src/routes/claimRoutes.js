// backend/src/routes/claimRoutes.js
import express from "express";
import Claim from "../models/Claim.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// User (Donor or Association) routes
router.post("/", protect, async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;

    const claim = await Claim.create({
      user: req.user._id,
      role: req.user.role,
      category,
      subject,
      description,
      priority: priority || "medium",
    });

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully",
      claim,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my claims
router.get("/my", protect, async (req, res) => {
  try {
    const claims = await Claim.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin routes
router.get("/all", protect, authorize("admin"), async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate("user", "name email organizationName role")
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        ...(status === "resolved" && { resolvedAt: new Date() }),
      },
      { new: true }
    ).populate("user", "name email");

    if (!claim) return res.status(404).json({ message: "Claim not found" });

    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
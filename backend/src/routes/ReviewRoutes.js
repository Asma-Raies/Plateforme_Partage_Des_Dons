// routes/reviewRoutes.js
import express from "express";
import {
  getPublicReviews,
  upsertMyReview,
  getMyReview,
  deleteMyReview,
  getAllReviews,
  togglePublic,
  adminDeleteReview,
} from "../controllers/ReviewController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── PUBLIC (no auth needed) ──────────────────────────────────
router.get("/public", getPublicReviews);

// ── DONOR / ASSOCIATION (authenticated) ─────────────────────
router.get("/mine",   protect, getMyReview);
router.post("/mine",  protect, upsertMyReview);
router.delete("/mine",protect, deleteMyReview);

// ── ADMIN ────────────────────────────────────────────────────
router.get("/",                protect, authorize("admin"), getAllReviews);
router.patch("/:id/toggle",    protect, authorize("admin"), togglePublic);
router.delete("/:id",          protect, authorize("admin"), adminDeleteReview);

export default router;

// ── Add to your main server.js / app.js ─────────────────────
// import reviewRoutes from "./routes/reviewRoutes.js";
// app.use("/api/reviews", reviewRoutes);
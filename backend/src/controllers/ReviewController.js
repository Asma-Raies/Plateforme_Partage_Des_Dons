// controllers/reviewController.js
import Review from "../models/Review.js";
import { createNotification, notifyAdmins } from "../Services/Notificationservice.js";

export const getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isPublic: true })
      .populate("author", "name organizationName avatar role")
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const upsertMyReview = async (req, res) => {
  try {
    const { rating, title, content } = req.body;
    const existing = await Review.findOne({ author: req.user._id });
    if (existing) {
      existing.rating = rating; existing.title = title || ""; existing.content = content;
      await existing.save();
      return res.json({ review: existing, updated: true });
    }
    const review = await Review.create({ author: req.user._id, authorRole: req.user.role, rating, title: title || "", content, isPublic: false });
    await notifyAdmins({
      sender: req.user._id, type: "review_submitted",
      title: "New Review Submitted ⭐",
      body: `${req.user.name || req.user.organizationName} (${req.user.role}) submitted a ${rating}-star review.`,
      link: "/admin/reviews", meta: { reviewId: review._id, rating },
    });
    res.status(201).json({ review, updated: false });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getMyReview = async (req, res) => {
  try { const review = await Review.findOne({ author: req.user._id }); res.json({ review: review || null }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteMyReview = async (req, res) => {
  try { await Review.deleteOne({ author: req.user._id }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAllReviews = async (req, res) => {
  try {
    const { isPublic, role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (isPublic !== undefined) filter.isPublic = isPublic === "true";
    if (role && role !== "all") filter.authorRole = role;
    const reviews = await Review.find(filter).populate("author", "name organizationName avatar role email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const q = (search || "").toLowerCase();
    const filtered = q ? reviews.filter(r => (r.author?.name||"").toLowerCase().includes(q)||(r.author?.organizationName||"").toLowerCase().includes(q)||(r.content||"").toLowerCase().includes(q)) : reviews;
    const total = await Review.countDocuments(filter);
    res.json({ reviews: filtered, total });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const togglePublic = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate("author", "_id name role");
    if (!review) return res.status(404).json({ message: "Review not found" });
    review.isPublic  = !review.isPublic;
    review.adminNote = req.body.adminNote || review.adminNote;
    await review.save();
    if (review.author?._id) {
      await createNotification({
        recipient: review.author._id,
        type: "review_submitted",
        title: review.isPublic ? "Your Review Is Now Public 🌐" : "Your Review Was Hidden",
        body:  review.isPublic
          ? `Your review has been approved and is now visible on the public website.${review.adminNote ? ` Note: ${review.adminNote}` : ""}`
          : "Your review has been set to private by an admin.",
        link: review.author.role === "association" ? "/association/my-review" : "/donor/my-review",
        meta: { reviewId: review._id },
      });
    }
    res.json({ review });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const adminDeleteReview = async (req, res) => {
  try { await Review.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect); // all routes require auth

router.get("/",              getMyNotifications);
router.get("/unread-count",  getUnreadCount);
router.patch("/read-all",    markAllRead);
router.delete("/clear-all",  clearAllNotifications);
router.patch("/:id/read",    markOneRead);
router.delete("/:id",        deleteNotification);

export default router;


import express from 'express';
import User from '../models/User.js';
 import { rescheduleAppointment } from "../controllers/objectDonationController.js";
import { getAssociationDonations } from "../controllers/objectDonationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import multer from "multer";
import { confirmAppointment } from '../controllers/objectDonationController.js';
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
const router = express.Router();
 router.patch("/:id/reschedule", protect, authorize('association'), rescheduleAppointment);
//
// And for the association to list its own donations:
 router.get("/object-donations", protect, authorize('association'), getAssociationDonations);
//
router.patch('/object-appointments/:id/confirm', protect, authorize('association', 'admin'), confirmAppointment);

router.get('/', async (req, res) => {
  try {
    const associations = await User.find({
      role: 'association',
      status: 'active'
    }).select('organizationName name email');

    res.json({ associations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
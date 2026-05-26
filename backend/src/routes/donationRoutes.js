import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import {
  createObjectDonation,
  getMyObjectDonations,
  getObjectDonationById,
  confirmAppointment,
} from "../controllers/objectDonationController.js";

import {
  createPaymentIntent,
  stripeWebhook,
  getDonationHistory,
  downloadDonationReceipt,
  createObjectAppointment,
  getMyObjectAppointments,
  getAssociationObjectAppointments,
  scheduleObjectAppointmentByAssociation,
  scheduleAnyAppointmentByAssociation, // NEW
  getAssociationDonors,
  getDonorAllAppointments,
  getAssociationAllAppointments,
} from "../controllers/donationController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { createCampaignItemDonation } from "../controllers/campaignItemDonationController.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/webhook", stripeWebhook);

router.post("/create-intent", protect, authorize("donor"), createPaymentIntent);
router.get("/history", protect, authorize("donor"), getDonationHistory);

router.post("/object-appointments", protect, authorize("donor"), createObjectAppointment);
router.get("/object-appointments", protect, authorize("donor"), getMyObjectAppointments);

router.get(
  "/association/object-appointments",
  protect,
  authorize("association"),
  getAssociationObjectAppointments,
);

router.put(
  "/association/object-appointments/:id/schedule",
  protect,
  authorize("association"),
  scheduleObjectAppointmentByAssociation,
);

// NEW unified schedule endpoint for both models
router.put(
  "/association/all-appointments/:type/:id/schedule",
  protect,
  authorize("association"),
  scheduleAnyAppointmentByAssociation,
);

router.get("/:id/receipt", protect, authorize("donor"), downloadDonationReceipt);

router.post(
  "/object-donations",
  protect,
  authorize("donor"),
  upload.array("images", 5),
  createObjectDonation,
);

router.get("/my-object-donations", protect, authorize("donor"), getMyObjectDonations);
router.get("/object-donations/:id", protect, getObjectDonationById);

router.post(
  "/campaign-item",
  protect,
  upload.array("images", 5),
  createCampaignItemDonation,
);

// New routes
router.get("/association/donors", protect, authorize("association"), getAssociationDonors);
router.get("/my-all-appointments", protect, authorize("donor"), getDonorAllAppointments);
router.get("/association/all-appointments", protect, authorize("association"), getAssociationAllAppointments);

export default router;
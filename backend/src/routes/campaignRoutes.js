import express  from 'express';
import multer   from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

import {
  getCampaigns,
  getCampaign,
  getMyCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaignsAdmin,
  getAllCampaignsDonorActive,
  updateCampaignStatusAdmin,  // ← new
  deleteCampaignAdmin, 
} from '../controllers/Campaigncontroller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'donationconnect/campaigns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, height: 630, crop: 'fill' }],
  },
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = express.Router();

/* ── Public routes ── */
router.get('/',        getCampaigns);
router.get('/:id',     getCampaign);

/* ── Association routes ── */
router.get('/my/list',
  protect, authorize('association'),
  getMyCampaigns
);
router.post('/',
  protect, authorize('association'),
  upload.single('coverImage'),
  createCampaign
);
router.put('/:id',
  protect, authorize('association'),
  upload.single('coverImage'),
  updateCampaign
);
router.delete('/:id',
  protect, authorize('association'),
  deleteCampaign
);

/* ── Admin route ── */

router.get('/admin/all',
  protect, authorize('admin'),
  getAllCampaignsAdmin
);
router.get('/donor/all',
  protect, authorize('donor'),
  getAllCampaignsDonorActive
);
router.put('/admin/:id/status',    // ← change status (activate/pause/complete/cancel)
  protect, authorize('admin'),
  updateCampaignStatusAdmin
);
router.delete('/admin/:id',        // ← hard delete by admin
  protect, authorize('admin'),
  deleteCampaignAdmin
);

export default router;
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  updateProfile, 
  getProfile 
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
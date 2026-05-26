import express           from 'express';
import multer            from 'multer';
import path              from 'path';
import {
  register,
  registerAssociation,
  login,
  getMe,
  approveAssociation,
  rejectAssociation,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

/* ── Multer config (multiple files) ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, image, and Word files are allowed'));
  },
});

/* ── Public ── */
router.post('/register',             register);
router.post('/register-association', upload.array('documents', 10), registerAssociation); // up to 10 files
router.post('/login',                login);

/* ── Forgot / Reset password ── */
router.post('/forgot-password',   forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password',    resetPassword);

/* ── Authenticated ── */
router.get('/me', protect, getMe);

/* ── Admin only ── */
router.put('/approve/:id', protect, authorize('admin'), approveAssociation);
router.put('/reject/:id',  protect, authorize('admin'), rejectAssociation);

router.get('/associations', async (req, res) => {
  try {
    const associations = await User.find({
      role: 'association',
      status: 'active',
      isApproved: true,
    }).select('name organizationName description email phone addresses documents avatar');
    res.json({ associations });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
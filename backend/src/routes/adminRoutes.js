
import express from 'express';
import User    from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import ObjectDonation from '../models/ObjectDonation.js';   // ← Import your ObjectDonation model
import Campaign from '../models/Campaign.js';
import MoneyDonation from '../models/MoneyDonation.js';
import path from 'path';
import fs from 'fs';
const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/monthly-donations', async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const monthlyData = await MoneyDonation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
          },
          status: "succeeded"   // Only successful payments
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          totalAmount: { $sum: '$amount' }     // ← Real monetary value
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formattedData = monthNames.map((month, index) => {
      const found = monthlyData.find(item => item._id.month === index + 1);
      return {
        month,
        Donations: found ? Math.round(found.totalAmount) : 0   // rounded for clean chart
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching monthly donations' });
  }
});

/* ── GET /api/admin/category-breakdown ── */
router.get('/category-breakdown', async (req, res) => {
  try {
    const categoryData = await ObjectDonation.aggregate([
      {
        $match: {
          // status: { $in: ['confirmed', 'completed'] }   // uncomment when ready
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#8b5cf6'];

    const formatted = categoryData.map((item, index) => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      color: colors[index % colors.length]
    }));

    // If no data, return sample to avoid empty chart
    if (formatted.length === 0) {
      return res.json([
        { name: 'Clothes', value: 45, color: '#3b82f6' },
        { name: 'Food', value: 25, color: '#f59e0b' },
        { name: 'Education', value: 20, color: '#a855f7' },
        { name: 'Furniture', value: 10, color: '#22c55e' }
      ]);
    }

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching category breakdown' });
  }
});
/* ── GET /api/admin/stats ── */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalDonors, totalAssociations, pendingAssociations, activeAssociations] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'donor' }),
        User.countDocuments({ role: 'association' }),
        User.countDocuments({ role: 'association', status: 'pending' }),
        User.countDocuments({ role: 'association', status: 'active' }),
      ]);
    res.json({ totalUsers, totalDonors, totalAssociations, pendingAssociations, activeAssociations });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ── GET /api/admin/users  (search + filter + paginate) ── */
router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = {};
    if (role)   query.role   = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, count] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ users, count, page: Number(page), pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/download', async (req, res) => {
  try {
    const filePath = req.query.path; // e.g. "uploads/doc.pdf"
    if (!filePath) return res.status(400).json({ message: 'No path provided' });

    // Security: prevent directory traversal
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.join(process.cwd(), safePath);

    if (!fs.existsSync(absolute)) return res.status(404).json({ message: 'File not found' });

    res.download(absolute); // sets Content-Disposition: attachment
  } catch (err) {
    res.status(500).json({ message: 'Download error' });
  }
});
/* ── GET /api/admin/users/:id ── */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
 router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
   try {
     const { addresses, phone, ...rest } = req.body;
     const user = await User.findByIdAndUpdate(
       req.params.id,
       { ...(addresses && { addresses }), ...(phone && { phone }) },
       { new: true }
     ).select('-password');
     res.json({ user });
   } catch (err) {
    res.status(500).json({ message: 'Server error' });
   }
 });
/* ── DELETE /api/admin/users/:id ── */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ── GET /api/admin/pending-associations (for sidebar badge) ── */
router.get('/pending-associations', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'association', status: 'pending' });
    const associations = await User.find({ role: 'association', status: 'pending' }).select('-password').sort('-createdAt');
    res.json({ count, associations });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
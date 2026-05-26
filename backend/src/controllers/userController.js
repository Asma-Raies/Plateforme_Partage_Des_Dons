import User from '../models/User.js';

export const updateProfile = async (req, res) => {
  try {
    // 1. Check email uniqueness BEFORE touching the document
    if (req.body.email) {
      const emailExists = await User.findOne({
        email: req.body.email,
        _id: { $ne: req.user._id }, // exclude current user
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allowedUpdates = [
      'name', 'email', 'phone',
      'organizationName', 'description', 'addresses',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (error) {
    // Mongoose validation errors (e.g. missing address label)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error while updating profile',
      error: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

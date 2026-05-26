import jwt      from 'jsonwebtoken';
import crypto    from 'crypto';
import User      from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { createNotification, notifyAdmins } from "../Services/Notificationservice.js";

/* ── Generate JWT ── */
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: Number(process.env.JWT_EXPIRE) || '30d',
  });

/* ════════════════════════════════════════════
   REGISTER (donor)
════════════════════════════════════════════ */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role && role !== 'donor')
      return res.status(400).json({ message: 'Use /register-association for association accounts' });

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password,
      role: 'donor', status: 'active', isApproved: true,
    });

    await notifyAdmins({
      sender: user._id,
      type:   'new_user_registered',
      title:  'New User Registration',
      body:   `${user.name} just created a donor account.`,
      link:   '/admin/users',
      meta:   { userId: user._id, role: user.role },
    });

    sendEmail({
      to: user.email,
      subject: 'Welcome to DonationConnect 🎉',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#3b82f6">Welcome, ${user.name}!</h2>
          <p>Your donor account has been created successfully.</p>
          <p>You can now browse campaigns, donate money, and schedule object pickups.</p>
          <a href="${process.env.CLIENT_URL}/dashboard"
             style="display:inline-block;margin-top:16px;padding:12px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Go to Dashboard
          </a>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">— The DonationConnect Team</p>
        </div>
      `,
    }).catch(err => console.error('Welcome email failed:', err.message));

    return res.status(201).json({
      message: 'Account created successfully',
      token:   generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const registerAssociation = async (req, res) => {
  try {
    const { name, email, password, organizationName, description, addresses } = req.body;

    if (!name || !email || !password || !organizationName || !description)
      return res.status(400).json({ message: 'All fields are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'Email already registered' });

    // Require at least one uploaded document
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'At least one supporting document is required' });

    // Parse addresses (sent as JSON string from FormData)
    let parsedAddresses = [];
    if (addresses) {
      try {
        parsedAddresses = JSON.parse(addresses);
        if (!Array.isArray(parsedAddresses)) parsedAddresses = [];
      } catch {
        parsedAddresses = [];
      }
    }

    // Collect uploaded file paths
    const documentPaths = req.files.map(f => f.path);

    const user = await User.create({
      name,
      email,
      password,
      role:             'association',
      status:           'pending',
      isApproved:       false,
      organizationName,
      description,
      documents:        documentPaths,   // array of paths
      addresses:        parsedAddresses,
    });

    await notifyAdmins({
      sender: user._id,
      type:   'new_user_registered',
      title:  'New Association Registration',
      body:   `${organizationName} just submitted an association account request.`,
      link:   '/admin/associations',
      meta:   { userId: user._id, role: user.role },
    });

    // Email to association
    await sendEmail({
      to: user.email,
      subject: 'DonationConnect — Your application has been received',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1f2937">
          <div style="background:#3b82f6;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;font-size:22px;margin:0">🏛️ Application Received</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px">
            <h2 style="font-size:18px;margin:0 0 8px">Hello, ${name}!</h2>
            <p style="color:#6b7280;margin:0 0 20px">
              Thank you for registering <strong>${organizationName}</strong> on DonationConnect.
            </p>
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <p style="font-weight:600;color:#92400e;margin:0 0 6px">⏳ Your account is pending review</p>
              <p style="color:#78350f;font-size:14px;margin:0;line-height:1.6">
                Our admin team will review your application. This typically takes <strong>1–2 business days</strong>.
              </p>
            </div>
            <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center">
              Questions? <a href="mailto:support@donationconnect.tn" style="color:#3b82f6">support@donationconnect.tn</a>
            </p>
          </div>
        </div>
      `,
    });

    // Email to admin
    if (process.env.ADMIN_EMAIL) {
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `[Admin] New association registration: ${organizationName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto">
            <h2 style="color:#1f2937">New Association Registration</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              ${[['Organization', organizationName], ['Contact', name], ['Email', email],
                 ['Description', description], ['Documents', documentPaths.length + ' file(s)'],
                 ['Addresses', parsedAddresses.length + ' address(es)']].map(([k, v]) => `
                <tr>
                  <td style="padding:8px 12px;background:#f9fafb;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:140px">${k}</td>
                  <td style="padding:8px 12px;color:#1f2937;border-bottom:1px solid #e5e7eb">${v}</td>
                </tr>`).join('')}
            </table>
            <a href="${process.env.CLIENT_URL}/admin/associations"
               style="display:inline-block;margin-top:20px;padding:12px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Review in Admin Panel
            </a>
          </div>
        `,
      }).catch(err => console.error('Admin notification email failed:', err.message));
    }

    return res.status(201).json({
      message: 'Association registration submitted. Please check your email and wait for admin approval.',
    });
  } catch (err) {
    console.error('Register association error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.status === 'pending')
      return res.status(403).json({ message: 'Your association account is pending admin approval.', status: 'pending' });

    if (user.status === 'rejected')
      return res.status(403).json({ message: 'Your association application was not approved.', status: 'rejected' });

    return res.status(200).json({
      message: 'Login successful',
      token:   generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ════════════════════════════════════════════
   FORGOT PASSWORD — send 6-digit code
════════════════════════════════════════════ */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    // Always respond OK to avoid email enumeration
    if (!user) return res.status(200).json({ message: 'If this email is registered, a reset code has been sent.' });

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetPasswordCode    = code;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    await sendEmail({
      to:      user.email,
      subject: 'DonationConnect — Your password reset code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;color:#1f2937">
          <div style="background:#3b82f6;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;font-size:20px;margin:0">🔐 Password Reset</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px;text-align:center">
            <p style="color:#6b7280;margin:0 0 24px">Hello ${user.name}, use the code below to reset your password. It expires in <strong>15 minutes</strong>.</p>
            <div style="display:inline-block;background:#f0f9ff;border:2px dashed #3b82f6;border-radius:16px;padding:20px 40px;margin-bottom:24px">
              <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1e40af;font-family:monospace">${code}</span>
            </div>
            <p style="font-size:13px;color:#9ca3af">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ message: 'If this email is registered, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ════════════════════════════════════════════
   VERIFY RESET CODE
════════════════════════════════════════════ */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: 'Email and code are required' });

    const user = await User.findOne({ email }).select('+resetPasswordCode +resetPasswordExpires');
    if (!user || user.resetPasswordCode !== code)
      return res.status(400).json({ message: 'Invalid or expired code' });

    if (Date.now() > user.resetPasswordExpires)
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });

    return res.status(200).json({ message: 'Code verified successfully' });
  } catch (err) {
    console.error('Verify code error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ════════════════════════════════════════════
   RESET PASSWORD
════════════════════════════════════════════ */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword)
      return res.status(400).json({ message: 'Email, code and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email }).select('+password +resetPasswordCode +resetPasswordExpires');
    if (!user || user.resetPasswordCode !== code)
      return res.status(400).json({ message: 'Invalid or expired code' });

    if (Date.now() > user.resetPasswordExpires)
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });

    // Update password (pre-save hook will hash it)
    user.password             = newPassword;
    user.resetPasswordCode    = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendEmail({
      to:      user.email,
      subject: 'DonationConnect — Password changed successfully',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#10b981">✅ Password Updated</h2>
          <p>Hi ${user.name}, your password has been reset successfully.</p>
          <p>If you did not make this change, contact us immediately at 
             <a href="mailto:support@donationconnect.tn" style="color:#3b82f6">support@donationconnect.tn</a></p>
        </div>
      `,
    }).catch(err => console.error('Password change email failed:', err.message));

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ════════════════════════════════════════════
   ADMIN — APPROVE ASSOCIATION
════════════════════════════════════════════ */
export const approveAssociation = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'association') return res.status(400).json({ message: 'User is not an association' });

    user.status     = 'active';
    user.isApproved = true;
    await user.save();

    await createNotification({
      recipient: user._id,
      type:      'association_approved',
      title:     'Your Association Has Been Approved! 🎉',
      body:      'Congratulations! Your association account has been approved.',
      link:      '/association/dashboard',
    });

    await sendEmail({
      to:      user.email,
      subject: 'DonationConnect — Your association has been approved! ✅',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1f2937">
          <div style="background:#10b981;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;font-size:22px;margin:0">✅ Association Approved!</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px">
            <h2 style="margin:0 0 12px">Congratulations, ${user.name}!</h2>
            <p style="color:#6b7280;margin:0 0 20px">
              <strong>${user.organizationName}</strong> has been approved. Your account is now active.
            </p>
            <a href="${process.env.CLIENT_URL}/login"
               style="display:inline-block;padding:12px 28px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Login to your dashboard
            </a>
            <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center">— The DonationConnect Team</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Association approved and notified by email', user });
  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ════════════════════════════════════════════
   ADMIN — REJECT ASSOCIATION
════════════════════════════════════════════ */
export const rejectAssociation = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'rejected';
    await user.save();

    await createNotification({
      recipient: user._id,
      type:      'association_rejected',
      title:     'Association Application Update',
      body:      'Your association application was not approved.',
      link:      '/association/profile',
    });

    await sendEmail({
      to:      user.email,
      subject: 'DonationConnect — Update on your association application',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#1f2937">Application Update</h2>
          <p>Dear ${user.name}, after reviewing your application for <strong>${user.organizationName}</strong>,
          we were unable to approve it at this time.</p>
          ${reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px 18px;margin:16px 0">
            <p style="color:#dc2626;margin:0"><strong>Reason:</strong> ${reason}</p>
          </div>` : ''}
          <p>Contact us at <a href="mailto:support@donationconnect.tn" style="color:#3b82f6">support@donationconnect.tn</a></p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Association rejected and notified by email' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ════════════════════════════════════════════
   GET ME
════════════════════════════════════════════ */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
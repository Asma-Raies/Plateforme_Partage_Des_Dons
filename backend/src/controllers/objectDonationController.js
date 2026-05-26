import ObjectDonation from "../models/ObjectDonation.js";
import ObjectDonationAppointment from "../models/ObjectDonationAppointment.js";
import User from "../models/User.js";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";
import { assertAssociationSlotAvailable } from "../utils/associationAvailability.js";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createObjectDonation = async (req, res) => {
  try {
    const {
      associationId,
      category,
      description,
      quantity,
      condition,
      method,
      appointmentDate,
      timeSlot,
      donorLocation,
    } = req.body;

    await assertAssociationSlotAvailable({
      associationId,
      appointmentDate,
      timeSlot,
    });

    const donor = req.user._id;
    const association = await User.findById(associationId);
    if (!association || association.role !== "association") {
      return res.status(400).json({ message: "Invalid association" });
    }

    // Upload images to Cloudinary
    let imageUploads = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(async (file) => {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                { folder: "object-donations", resource_type: "image" },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              )
              .end(file.buffer);
          });
          return { url: result.secure_url, publicId: result.public_id };
        });
        imageUploads = await Promise.all(uploadPromises);
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ message: "Failed to upload images" });
      }
    }

    // Generate unique QR Code
    const qrText = `OD-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrText, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    const newDonation = await ObjectDonation.create({
      donor,
      association: associationId,
      category,
      description,
      quantity: Number(quantity),
      condition,
      images: imageUploads,
      method,
      appointmentDate: parsedDate,
      timeSlot,
      donorLocation: donorLocation ? JSON.parse(donorLocation) : null,
      status: "pending",
      qrCode: qrCodeDataUrl,
      qrCodeText: qrText,
    });

    res.status(201).json({
      success: true,
      message: "Object donation request submitted successfully!",
      donation: newDonation,
      appointmentDetails: {
        date: newDonation.appointmentDate.toISOString().split("T")[0],
        time: newDonation.timeSlot,
        method:
          newDonation.method === "pickup"
            ? "Association Pickup"
            : "Drop-off at Association",
      },
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════
   GET /api/donations/my-object-donations
   Returns BOTH regular object donations AND campaign item
   donations (ObjectDonationAppointment) in a unified shape.
══════════════════════════════════════════════════════════ */
export const getMyObjectDonations = async (req, res) => {
  try {
    // 1️⃣  Regular object donations
    const regularDonations = await ObjectDonation.find({ donor: req.user._id })
      .populate("association", "organizationName name phone email address")
      .sort({ createdAt: -1 })
      .lean();

    // Normalize regular donations
    const normalizedRegular = regularDonations.map((d) => ({
      _id:             d._id,
      type:            "object",           // ← tag so frontend can tell them apart if needed
      category:        d.category || "other",
      condition:       d.condition || "—",
      description:     d.description || "",
      quantity:        d.quantity,
      status:          d.status,
      appointmentDate: d.appointmentDate,
      timeSlot:        d.timeSlot,
      method:          d.method || "dropoff",
      images:          d.images || [],
      association:     d.association,
      campaign:        null,
      itemName:        null,
      moderatorNotes:  d.moderatorNotes || null,
      qrCodeText:      d.qrCodeText || null,
      createdAt:       d.createdAt,
    }));

    // 2️⃣  Campaign item donations (ObjectDonationAppointment)
    const campaignAppointments = await ObjectDonationAppointment.find({
      donor: req.user._id,
    })
      .populate("association", "organizationName name phone email address")
      .populate("campaign", "title")
      .sort({ createdAt: -1 })
      .lean();

    // Normalize campaign appointments — extract condition/category stored in notes
    // as a fallback, but prefer the dedicated fields if the model has them.
    const normalizedCampaign = campaignAppointments.map((apt) => {
      // Try to pull condition / category from notes string if not stored as fields
      const condMatch = apt.notes?.match(/Condition:\s*(\S+)/i);
      const catMatch  = apt.notes?.match(/Category:\s*(\S+)/i);
      const descMatch = apt.notes?.match(/Description:\s*(.+?)(?:\n|$)/i);

      return {
        _id:             apt._id,
        type:            "campaign",        // ← tag
        category:        apt.category  || catMatch?.[1]  || "other",
        condition:       apt.condition || condMatch?.[1] || "—",
        description:     apt.description || descMatch?.[1] || apt.itemName || "",
        quantity:        apt.quantity,
        status:          apt.status,
        appointmentDate: apt.appointmentDate,
        timeSlot:        apt.timeSlot,
        method:          apt.method || "dropoff",
        images:          apt.images || [],
        association:     apt.association,
        campaign:        apt.campaign,      // ← { _id, title }
        itemName:        apt.itemName,
        moderatorNotes:  apt.moderatorNotes || null,
        qrCodeText:      apt.qrCodeText || null,
        createdAt:       apt.createdAt,
      };
    });

    // 3️⃣  Merge and sort newest-first
    const allDonations = [...normalizedRegular, ...normalizedCampaign].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ donations: allDonations });
  } catch (err) {
    console.error("getMyObjectDonations error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getObjectDonationById = async (req, res) => {
  const donation = await ObjectDonation.findById(req.params.id)
    .populate("association", "organizationName name phone email address")
    .populate("donor", "name email");
  if (!donation) return res.status(404).json({ message: "Donation not found" });
  res.json(donation);
};

export const confirmAppointment = async (req, res) => {
  try {
    const { moderatorNotes, status = "confirmed" } = req.body;
    const { id } = req.params;
 
    // 1️⃣ Try regular ObjectDonation first
    let donation = await ObjectDonation.findById(id);
 
    if (donation) {
      donation = await ObjectDonation.findByIdAndUpdate(
        id,
        { status, moderatorNotes },
        { new: true }
      );
      return res.json({ success: true, donation, type: "object" });
    }
 
    // 2️⃣ Fallback: try ObjectDonationAppointment (campaign item)
    let appointment = await ObjectDonationAppointment.findById(id);
 
    if (appointment) {
      appointment = await ObjectDonationAppointment.findByIdAndUpdate(
        id,
        { status, moderatorNotes },
        { new: true }
      ).populate("donor", "name email")
       .populate("association", "organizationName name email")
       .populate("campaign", "title");
 
      return res.json({ success: true, donation: appointment, type: "campaign" });
    }
 
    // 3️⃣ Neither found
    return res.status(404).json({ message: "Donation not found" });
 
  } catch (err) {
    console.error("confirmAppointment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
 
/* ══════════════════════════════════════════════════════════
   PATCH /api/donations/object-donations/:id/reschedule
   Works for BOTH types.
══════════════════════════════════════════════════════════ */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, timeSlot, moderatorNotes } = req.body;
    const { id } = req.params;
 
    // Try ObjectDonation first
    let donation = await ObjectDonation.findById(id)
      .populate("donor", "name email")
      .populate("association", "organizationName name email");
 
    let isAppointment = false;
 
    if (!donation) {
      // Try ObjectDonationAppointment
      donation = await ObjectDonationAppointment.findById(id)
        .populate("donor", "name email")
        .populate("association", "organizationName name email");
      isAppointment = true;
    }
 
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }
 
    donation.appointmentDate = new Date(appointmentDate);
    donation.timeSlot        = timeSlot;
    if (moderatorNotes) donation.moderatorNotes = moderatorNotes;
    await donation.save();
 
    // Send email to donor
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
 
    const dateStr = donation.appointmentDate.toLocaleDateString("en-GB", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
 
    const assocName =
      donation.association?.organizationName ||
      donation.association?.name ||
      "the association";
 
    await transporter.sendMail({
      from: `"DonationConnect" <${process.env.EMAIL_USER}>`,
      to: donation.donor.email,
      subject: "📅 Your Donation Appointment Has Been Rescheduled",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:40px auto;color:#1e293b">
          <div style="background:#3b82f6;color:#fff;padding:28px 32px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:22px;font-weight:800">📅 Appointment Rescheduled</h1>
          </div>
          <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
            <p>Hi <strong>${donation.donor.name}</strong>,</p>
            <p>Your appointment with <strong>${assocName}</strong> has been rescheduled.</p>
            <div style="background:#eff6ff;border-radius:10px;padding:20px;margin:20px 0;border-left:4px solid #3b82f6">
              <p style="margin:4px 0;font-size:16px;font-weight:700;color:#1e3a8a">📅 ${dateStr}</p>
              <p style="margin:4px 0;font-size:15px;font-weight:600;color:#1d4ed8">🕐 ${timeSlot}</p>
            </div>
            ${moderatorNotes
              ? `<div style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0">
                   <p style="margin:0 0 6px;font-size:12px;color:#64748b;font-weight:600">Message from Association</p>
                   <p style="margin:0;font-size:14px;color:#374151">${moderatorNotes}</p>
                 </div>`
              : ""}
            <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:24px">Thank you — DonationConnect</p>
          </div>
        </div>
      `,
    });
 
    res.json({ success: true, donation });
  } catch (err) {
    console.error("rescheduleAppointment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
export const getAssociationDonations = async (req, res) => {
  try {
    // 1️⃣ Regular object donations
    const regularDonations = await ObjectDonation.find({ association: req.user._id })
      .populate("donor", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
 
    const normalizedRegular = regularDonations.map((d) => ({
      _id:             d._id,
      type:            "object",
      donor:           d.donor,
      category:        d.category || "other",
      condition:       d.condition || "—",
      description:     d.description || "",
      quantity:        d.quantity,
      status:          d.status,
      appointmentDate: d.appointmentDate,
      timeSlot:        d.timeSlot,
      method:          d.method || "dropoff",
      images:          d.images || [],
      donorLocation:   d.donorLocation || null,
      campaign:        null,
      itemName:        null,
      moderatorNotes:  d.moderatorNotes || null,
      qrCodeText:      d.qrCodeText || null,
      createdAt:       d.createdAt,
    }));
 
    // 2️⃣ Campaign item appointments for this association
    const campaignAppointments = await ObjectDonationAppointment.find({
      association: req.user._id,
    })
      .populate("donor",    "name email phone")
      .populate("campaign", "title")
      .sort({ createdAt: -1 })
      .lean();
 
    const normalizedCampaign = campaignAppointments.map((apt) => {
      const condMatch = apt.notes?.match(/Condition:\s*(\S+)/i);
      const catMatch  = apt.notes?.match(/Category:\s*(\S+)/i);
      const descMatch = apt.notes?.match(/Description:\s*(.+?)(?:\n|$)/i);
 
      return {
        _id:             apt._id,
        type:            "campaign",               // ← lets the frontend know
        donor:           apt.donor,
        category:        apt.category  || catMatch?.[1]  || "other",
        condition:       apt.condition || condMatch?.[1] || "—",
        description:     apt.description || descMatch?.[1] || apt.itemName || "",
        quantity:        apt.quantity,
        status:          apt.status,
        appointmentDate: apt.appointmentDate,
        timeSlot:        apt.timeSlot,
        method:          apt.method || "dropoff",
        images:          apt.images || [],
        donorLocation:   null,                     // campaign donations are always drop-off
        campaign:        apt.campaign,             // { _id, title }
        itemName:        apt.itemName,
        moderatorNotes:  apt.moderatorNotes || null,
        qrCodeText:      apt.qrCodeText || null,
        createdAt:       apt.createdAt,
      };
    });
 
    // 3️⃣ Merge and sort newest-first
    const allDonations = [...normalizedRegular, ...normalizedCampaign].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
 
    res.json({ donations: allDonations });
  } catch (err) {
    console.error("getAssociationDonations error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
/*export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, timeSlot, moderatorNotes } = req.body;

    const donation = await ObjectDonation.findById(req.params.id)
      .populate("donor", "name email")
      .populate("association", "organizationName name email");

    if (!donation) return res.status(404).json({ message: "Donation not found" });

    donation.appointmentDate = new Date(appointmentDate);
    donation.timeSlot        = timeSlot;
    if (moderatorNotes) donation.moderatorNotes = moderatorNotes;
    await donation.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const dateStr = donation.appointmentDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const assocName =
      donation.association?.organizationName ||
      donation.association?.name ||
      "the association";

    await transporter.sendMail({
      from: `"DonationConnect" <${process.env.EMAIL_USER}>`,
      to: donation.donor.email,
      subject: "📅 Your Donation Appointment Has Been Rescheduled",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"/></head>
        <body style="font-family:sans-serif;max-width:560px;margin:40px auto;color:#1e293b;background:#f8fafc">
          <div style="background:#3b82f6;color:#fff;padding:28px 32px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:22px;font-weight:800">📅 Appointment Rescheduled</h1>
            <p style="margin:6px 0 0;opacity:.85;font-size:13px">DonationConnect · Object Donation</p>
          </div>
          <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
            <p>Hi <strong>${donation.donor.name}</strong>,</p>
            <p style="color:#475569">Your donation appointment with <strong>${assocName}</strong> has been rescheduled.</p>
            <div style="background:#eff6ff;border-radius:10px;padding:20px;margin:20px 0;border-left:4px solid #3b82f6">
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#3b82f6;font-weight:700;letter-spacing:.05em">New Appointment</p>
              <p style="margin:4px 0;font-size:16px;font-weight:700;color:#1e3a8a">📅 ${dateStr}</p>
              <p style="margin:4px 0;font-size:15px;font-weight:600;color:#1d4ed8">🕐 ${timeSlot}</p>
              <p style="margin:4px 0;font-size:14px;color:#3b82f6">
                ${donation.method === "pickup" ? "🚚 Association Pickup" : "🏢 Drop-off at Association"}
              </p>
            </div>
            ${moderatorNotes
              ? `<div style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0">
                  <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:600;letter-spacing:.05em">Message from Association</p>
                  <p style="margin:0;font-size:14px;color:#374151">${moderatorNotes}</p>
                </div>`
              : ""}
            <p style="font-size:13px;color:#64748b">
              Your donation reference: <code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-family:monospace">${donation.qrCodeText}</code>
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="font-size:12px;color:#94a3b8;text-align:center">Thank you for your generosity — DonationConnect</p>
          </div>
        </body>
        </html>
      `,
    });

    res.json({ success: true, donation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};*/
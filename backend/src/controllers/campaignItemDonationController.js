// controllers/campaignItemDonationController.js
import { v2 as cloudinary } from "cloudinary";
import Campaign from "../models/Campaign.js";
import ObjectDonationAppointment from "../models/ObjectDonationAppointment.js";
import { createNotification } from "../Services/Notificationservice.js";
import sendEmail from "../utils/sendEmail.js";
import { assertAssociationSlotAvailable } from "../utils/associationAvailability.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── upload helper ── */
const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "campaign-item-donations", resource_type: "image" },
        (err, result) => {
          if (err) reject(err);
          else resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(fileBuffer);
  });

/* ══════════════════════════════════════════════════════════
   POST /api/donations/campaign-item
   Donor donates a specific item need from a campaign.
══════════════════════════════════════════════════════════ */
export const createCampaignItemDonation = async (req, res) => {
  try {
    const {
      campaignId,
      itemNeedId,
      itemName,
      quantity,
      category,     // ✅ now saved
      condition,    // ✅ now saved
      description,  // ✅ now saved
      message,
      appointmentDate,
      timeSlot,
    } = req.body;

    /* ── basic validation ── */
    if (!campaignId || !itemNeedId || !quantity)
      return res.status(400).json({ message: "campaignId, itemNeedId and quantity are required" });

    if (!appointmentDate || !timeSlot)
      return res.status(400).json({ message: "appointmentDate and timeSlot are required" });

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1)
      return res.status(400).json({ message: "Invalid quantity" });

    /* ── load campaign ── */
    const campaign = await Campaign.findById(campaignId).populate(
      "association",
      "_id name organizationName email"
    );
    if (!campaign || campaign.status !== "active")
      return res.status(400).json({ message: "Campaign not found or inactive" });

    /* ── check slot availability ── */
    await assertAssociationSlotAvailable({
      associationId: campaign.association._id,
      appointmentDate,
      timeSlot,
    });

    /* ── find the item need ── */
    const need = campaign.objectNeeds?.find((n) => n._id.toString() === String(itemNeedId));
    if (!need) return res.status(404).json({ message: "Item need not found in this campaign" });

    const remaining = Math.max(0, (need.quantity || 0) - (need.received || 0));
    if (remaining <= 0)
      return res.status(400).json({ message: "This item need is already fulfilled" });
    if (qty > remaining)
      return res.status(400).json({ message: `Quantity exceeds remaining need (${remaining})` });

    /* ── upload images to Cloudinary ✅ ── */
    let imageUploads = [];
    if (req.files && req.files.length > 0) {
      try {
        imageUploads = await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer)));
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    /* ── build combined datetime ── */
    const parsedDate = buildDateFromSlot(appointmentDate, timeSlot);

    /* ── create the appointment record ── */
    const appointment = await ObjectDonationAppointment.create({
      donor:           req.user._id,
      association:     campaign.association._id,
      campaign:        campaign._id,
      itemNeedId:      need._id,
      itemName:        itemName || need.name,
      quantity:        qty,

      // ✅ These three fields are now stored directly so getMyObjectDonations
      //    can read them without parsing the notes string.
      category:        category   || "other",
      condition:       condition  || "",
      description:     description || "",

      images:          imageUploads,   // ✅ images now persisted

      appointmentDate: parsedDate,
      timeSlot,
      method:          "dropoff",

      // Keep notes for any legacy reads / association dashboard display
      notes: [
        description ? `Description: ${description}` : "",
        message     ? `Message: ${message}`          : "",
        condition   ? `Condition: ${condition}`       : "",
        category    ? `Category: ${category}`         : "",
      ].filter(Boolean).join("\n"),

      status: "requested",
    });

    await appointment.populate("campaign",    "title");
    await appointment.populate("association", "name organizationName email");
    await appointment.populate("donor",       "name email");

    const assocName   = campaign.association.organizationName || campaign.association.name;
    const itemDisplay = `${qty}x ${need.name}`;

    /* ── notify association ── */
    await createNotification({
      recipient: campaign.association._id,
      sender:    req.user._id,
      type:      "object_donation_received",
      title:     "New Item Donation Request 📦",
      body:      `${req.user.name} wants to donate ${itemDisplay} for campaign "${campaign.title}".`,
      link:      "/association/appointments",
      meta:      { appointmentId: appointment._id, campaignId, itemName: need.name, quantity: qty },
    });

    /* ── notify donor ── */
    await createNotification({
      recipient: req.user._id,
      type:      "object_donation_confirmed",
      title:     "Donation Request Sent ✅",
      body:      `Your request to donate ${itemDisplay} has been sent to ${assocName}.`,
      link:      "/donor/object-donations-list",
      meta:      { appointmentId: appointment._id, campaignId },
    });

    /* ── email to association ── */
    if (campaign.association.email) {
      sendEmail({
        to:      campaign.association.email,
        subject: `📦 New Item Donation Request — ${campaign.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:auto;color:#1f2937">
            <div style="background:#10b981;padding:24px 28px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:20px">📦 New Item Donation</h1>
              <p style="color:#d1fae5;margin:6px 0 0;font-size:13px">${campaign.title}</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:28px">
              <p>Hello <strong>${assocName}</strong>,</p>
              <p><strong>${req.user.name}</strong> (${req.user.email}) wants to donate:</p>
              <div style="background:#f0fdf4;border-left:3px solid #10b981;padding:14px 18px;margin:16px 0;border-radius:0 10px 10px 0">
                <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#065f46">${itemDisplay}</p>
                <p style="margin:0;font-size:13px;color:#047857">Campaign need — ${need.name}</p>
                ${condition ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280">Condition: <strong>${condition}</strong></p>` : ""}
                ${category  ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280">Category: <strong>${category}</strong></p>`  : ""}
              </div>
              ${description ? `<div style="background:#f8fafc;padding:12px 16px;border-radius:8px;margin:12px 0"><p style="margin:0;font-size:13px;color:#374151"><strong>Description:</strong> ${description}</p></div>` : ""}
              ${message     ? `<div style="background:#f8fafc;padding:12px 16px;border-radius:8px;margin:12px 0"><p style="margin:0;font-size:13px;color:#374151"><strong>Message:</strong> ${message}</p></div>`     : ""}
              ${imageUploads.length > 0 ? `<p style="font-size:13px;color:#6b7280;margin:12px 0">${imageUploads.length} photo(s) attached to the request.</p>` : ""}
              <a href="${process.env.CLIENT_URL}/association/appointments"
                style="display:inline-block;margin-top:16px;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                Review in Dashboard →
              </a>
            </div>
          </div>
        `,
      }).catch((err) => console.error("Email error:", err.message));
    }

    return res.status(201).json({
      success: true,
      message: "Donation request submitted successfully",
      appointment,
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ message: err.message });
    }
    console.error("createCampaignItemDonation error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ── Build a proper Date that encodes both the date and the time slot ── */
function buildDateFromSlot(appointmentDate, timeSlot) {
  const base = new Date(appointmentDate);
  base.setHours(0, 0, 0, 0);

  const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hours      = parseInt(match[1], 10);
    const minutes  = parseInt(match[2], 10);
    const period   = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours  = 0;
    base.setHours(hours, minutes, 0, 0);
  }

  return base;
}
// controllers/donationController.js  — FULL UPDATED FILE
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import MoneyDonation from "../models/MoneyDonation.js";
import Campaign from "../models/Campaign.js";
import ObjectDonationAppointment from "../models/ObjectDonationAppointment.js";
import sendEmail, { sendReceiptEmail } from "../utils/sendEmail.js";
import { createNotification } from "../Services/Notificationservice.js";
import ObjectDonation from "../models/ObjectDonation.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ══════════════════════════════════════════════════════════
   CREATE PAYMENT INTENT  — donor makes a money donation
══════════════════════════════════════════════════════════ */
export const createPaymentIntent = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    const campaign = await Campaign.findById(campaignId).populate(
      "association",
      "name organizationName"
    );
    if (!campaign || campaign.status !== "active")
      return res.status(400).json({ message: "Campagne invalide" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      metadata: {
        campaignId: campaignId.toString(),
        donorId: req.user._id.toString(),
      },
    });

    await MoneyDonation.create({
      donor: req.user._id,
      campaign: campaignId,
      amount,
      stripePaymentIntentId: paymentIntent.id,
    });

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { moneyRaised: amount, donorsCount: 1 },
    });

    // ── Notify the association ─────────────────────────────
    await createNotification({
      recipient: campaign.association._id,
      sender:    req.user._id,
      type:      "money_donation_received",
      title:     "New Money Donation 💰",
      body:      `${req.user.name} donated ${amount} TND to your campaign "${campaign.title}".`,
      link:      `/association/campaigns`,
      meta:      { campaignId, amount, donorId: req.user._id },
    });

    // ── Notify the donor (confirmation) ───────────────────
    await createNotification({
      recipient: req.user._id,
      type:      "money_donation_confirmed",
      title:     "Donation Submitted ✅",
      body:      `Your donation of ${amount} TND to "${campaign.title}" was submitted successfully.`,
      link:      `/donor/history`,
      meta:      { campaignId, amount },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   STRIPE WEBHOOK
══════════════════════════════════════════════════════════ */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const donation = await MoneyDonation.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "succeeded" },
      { new: true }
    ).populate("donor campaign");

    if (donation) {
      await Campaign.findByIdAndUpdate(donation.campaign._id, {
        $inc: { moneyRaised: donation.amount, donorsCount: 1 },
      });
      await sendReceiptEmail(donation);
    }
  }

  res.json({ received: true });
};

/* ══════════════════════════════════════════════════════════
   DONATION HISTORY
══════════════════════════════════════════════════════════ */
export const getDonationHistory = async (req, res) => {
  try {
    const donations = await MoneyDonation.find({ donor: req.user._id })
      .populate("campaign", "title moneyGoal moneyRaised")
      .sort("-createdAt");
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const downloadDonationReceipt = async (req, res) => {
  try {
    const donation = await MoneyDonation.findOne({
      _id: req.params.id,
      donor: req.user._id,
    })
      .populate("donor", "name email")
      .populate("campaign", "title");

    if (!donation) return res.status(404).json({ message: "Donation introuvable" });
    if (donation.status !== "succeeded")
      return res.status(400).json({ message: "Facture disponible apres confirmation du paiement" });

       const pdfBuffer = await generateReceiptPDFBuffer(donation);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=facture-don-${donation._id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateReceiptPDFBuffer = (donation) =>
  new Promise((resolve, reject) => {
  //  const PDFDocument = require("pdfkit"); // already imported at top
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28; // A4 width in pt
    const H = 841.89;
    const TEAL   = "#0F6E56";
    const TEAL_L = "#E6F4F1";
    const SLATE  = "#1E293B";
    const MUTED  = "#64748B";
    const WHITE  = "#FFFFFF";
    const BORDER = "#E2E8F0";

    // ── Header band ─────────────────────────────────────────
    doc.rect(0, 0, W, 110).fill(TEAL);

    // Logo / brand text
    doc.font("Helvetica-Bold").fontSize(22).fillColor(WHITE)
       .text("DonationConnect", 50, 32, { align: "left" });
    doc.font("Helvetica").fontSize(10).fillColor("rgba(255,255,255,0.75)")
       .text("Official Donation Receipt", 50, 60);

    // Receipt number badge (right side of header)
    const ref = donation.stripePaymentIntentId || `DON-${donation._id}`;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
       .text(`REF: ${ref}`, W - 250, 38, { width: 200, align: "right" });
    const dateLabel = new Date(donation.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
    doc.font("Helvetica").fontSize(9).fillColor("rgba(255,255,255,0.75)")
       .text(dateLabel, W - 250, 56, { width: 200, align: "right" });

    // ── "Thank you" subheader ────────────────────────────────
    doc.rect(0, 110, W, 52).fill(TEAL_L);
    doc.font("Helvetica").fontSize(12).fillColor(TEAL)
       .text(`Thank you, ${donation.donor?.name || "Donor"} — your generosity makes a difference.`,
             50, 126, { width: W - 100, align: "center" });

    // ── White card area ─────────────────────────────────────
    const cardX = 40, cardY = 182, cardW = W - 80, cardH = 380;
    doc.roundedRect(cardX, cardY, cardW, cardH, 8).fill(WHITE)
       .roundedRect(cardX, cardY, cardW, cardH, 8).stroke(BORDER);

    // Section title
    doc.font("Helvetica-Bold").fontSize(11).fillColor(SLATE)
       .text("DONATION DETAILS", cardX + 24, cardY + 22);
    doc.moveTo(cardX + 24, cardY + 40).lineTo(cardX + cardW - 24, cardY + 40)
       .strokeColor(BORDER).lineWidth(0.5).stroke();

    // Rows
    const rows = [
      ["Donor Name",      donation.donor?.name  || "—"],
      ["Email",           donation.donor?.email || "—"],
      ["Campaign",        donation.campaign?.title || "—"],
      ["Amount",          `${donation.amount.toLocaleString()} TND`],
      ["Payment Date",    dateLabel],
      ["Payment Method",  "Credit / Debit Card (Stripe)"],
      ["Payment Status",  "Confirmed ✓"],
      ["Transaction Ref", ref],
    ];

    let y = cardY + 52;
    rows.forEach(([label, value], i) => {
      // Alternating stripe
      if (i % 2 === 0) {
        doc.rect(cardX + 1, y - 6, cardW - 2, 28).fill("#F8FAFC");
      }
      doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED)
         .text(label.toUpperCase(), cardX + 24, y, { width: 140 });
      doc.font("Helvetica").fontSize(10).fillColor(SLATE)
         .text(value, cardX + 174, y, { width: cardW - 200 });
      y += 36;
    });

    // ── Amount highlight box ────────────────────────────────
    const boxY = cardY + cardH + 20;
    doc.rect(cardX, boxY, cardW, 64).fill(TEAL)
       .roundedRect(cardX, boxY, cardW, 64, 6);
    doc.font("Helvetica").fontSize(11).fillColor("rgba(255,255,255,0.75)")
       .text("TOTAL DONATED", cardX, boxY + 14, { width: cardW, align: "center" });
    doc.font("Helvetica-Bold").fontSize(26).fillColor(WHITE)
       .text(`${donation.amount.toLocaleString()} TND`, cardX, boxY + 30, { width: cardW, align: "center" });

    // ── Legal note ─────────────────────────────────────────
    const noteY = boxY + 84;
    doc.rect(cardX, noteY, cardW, 56).fill(TEAL_L)
       .roundedRect(cardX, noteY, cardW, 56, 6);
    doc.font("Helvetica").fontSize(8).fillColor(TEAL)
       .text(
         "This receipt confirms your charitable donation to the campaign listed above via DonationConnect. " +
         "Please retain this document for your records. This is an automatically generated receipt and does not require a signature.",
         cardX + 20, noteY + 12, { width: cardW - 40, align: "center", lineGap: 2 }
       );

    // ── Footer ─────────────────────────────────────────────
    doc.rect(0, H - 48, W, 48).fill(TEAL);
    doc.font("Helvetica").fontSize(8).fillColor("rgba(255,255,255,0.65)")
       .text(
         `Generated on ${new Date().toLocaleString("en-GB")}  ·  DonationConnect  ·  https://donationconnect.org`,
         0, H - 28, { width: W, align: "center" }
       );

    doc.end();
  });
/* ══════════════════════════════════════════════════════════
   OBJECT APPOINTMENT — donor requests
══════════════════════════════════════════════════════════ */
export const createObjectAppointment = async (req, res) => {
  try {
    const { campaignId, itemNeedId, quantity, notes } = req.body;

    if (!campaignId || !itemNeedId || !quantity)
      return res.status(400).json({ message: "campaignId, itemNeedId et quantity sont obligatoires" });

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1)
      return res.status(400).json({ message: "Quantite invalide" });

    const campaign = await Campaign.findById(campaignId).populate("association", "_id name organizationName");
    if (!campaign || campaign.status !== "active")
      return res.status(400).json({ message: "Campagne invalide" });

    const need = campaign.objectNeeds.find((n) => n._id.toString() === String(itemNeedId));
    if (!need) return res.status(404).json({ message: "Item introuvable dans la campagne" });

    const remaining = Math.max(0, (need.quantity || 0) - (need.received || 0));
    if (remaining <= 0) return res.status(400).json({ message: "Cet item n'est plus requis" });
    if (qty > remaining) return res.status(400).json({ message: `Quantite superieure au besoin restant (${remaining})` });

    const appointment = await ObjectDonationAppointment.create({
      donor: req.user._id,
      association: campaign.association._id,
      campaign: campaign._id,
      itemNeedId: need._id,
      itemName: need.name,
      quantity: qty,
      notes: (notes || "").trim(),
      status: "requested",
    });

    await appointment.populate("campaign", "title location wilaya");
    await appointment.populate("association", "name organizationName email");
    await appointment.populate("donor", "name email");

    // ── Notify association of new object appointment request ──
    await createNotification({
      recipient: campaign.association._id,
      sender:    req.user._id,
      type:      "object_donation_received",
      title:     "New Object Donation Request 📦",
      body:      `${req.user.name} wants to donate ${qty}x ${need.name} for campaign "${campaign.title}".`,
      link:      `/association/appointments`,
      meta:      { appointmentId: appointment._id, campaignId, itemName: need.name, quantity: qty },
    });

    // ── Notify donor: request submitted ───────────────────────
    await createNotification({
      recipient: req.user._id,
      type:      "object_donation_confirmed",
      title:     "Donation Request Submitted ✅",
      body:      `Your request to donate ${qty}x ${need.name} has been sent to ${campaign.association.organizationName || campaign.association.name}.`,
      link:      `/donor/object-donations-list`,
      meta:      { appointmentId: appointment._id, campaignId },
    });

    res.status(201).json({ message: "Demande envoyee au moderateur de l'association", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyObjectAppointments = async (req, res) => {
  try {
    const appointments = await ObjectDonationAppointment.find({ donor: req.user._id })
      .populate("campaign", "title location wilaya")
      .populate("association", "name organizationName email")
      .sort("-createdAt");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAssociationObjectAppointments = async (req, res) => {
  try {
    const appointments = await ObjectDonationAppointment.find({ association: req.user._id })
      .populate("campaign", "title location wilaya")
      .populate("donor", "name email")
      .sort("-createdAt");
    const data = appointments.map((apt) => ({ ...apt.toObject(), donorName: apt.donor?.name || "Anonymous" }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   SCHEDULE OBJECT APPOINTMENT — association confirms/completes/cancels
══════════════════════════════════════════════════════════ */
export const scheduleObjectAppointmentByAssociation = async (req, res) => {
  try {
    const { status, appointmentDate, moderatorNotes, receivedQuantity } = req.body;
    const allowed = ["confirmed", "completed", "cancelled"];

    if (!allowed.includes(status))
      return res.status(400).json({ message: `Status invalide. Valeurs: ${allowed.join(", ")}` });

    const appointment = await ObjectDonationAppointment.findById(req.params.id)
      .populate("campaign", "title location wilaya objectNeeds")
      .populate("association", "_id name organizationName email")
      .populate("donor", "name email _id");

    if (!appointment) return res.status(404).json({ message: "Demande introuvable" });
    if (appointment.association._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Acces non autorise" });

    if (status === "confirmed") {
      const at = new Date(appointmentDate);
      if (!appointmentDate || Number.isNaN(at.getTime()) || at <= new Date())
        return res.status(400).json({ message: "appointmentDate futur requis pour confirmer" });
      appointment.appointmentDate = at;
    }

    if (status === "completed" && receivedQuantity) {
      const qty = Number(receivedQuantity) || 0;
      const campaign = appointment.campaign;
      if (campaign?.objectNeeds) {
        const needItem = campaign.objectNeeds.find((n) => n._id.toString() === appointment.itemNeedId.toString());
        if (needItem) { needItem.received = (needItem.received || 0) + qty; await campaign.save(); }
      }
    }

    appointment.status         = status;
    appointment.moderatorNotes = (moderatorNotes || "").trim();
    appointment.scheduledBy    = req.user._id;
    await appointment.save();

    // ── Send notification to donor based on new status ─────────
    const assocName = appointment.association.organizationName || appointment.association.name;
    const notifMap = {
      confirmed: {
        type:  "object_donation_confirmed",
        title: "Appointment Confirmed ✅",
        body:  `${assocName} confirmed your donation appointment for ${appointment.itemName}.`,
        link:  `/donor/object-donations-list`,
      },
      completed: {
        type:  "object_donation_completed",
        title: "Donation Completed 🎁",
        body:  `Your donation of ${appointment.quantity}x ${appointment.itemName} has been received by ${assocName}. Thank you!`,
        link:  `/donor/object-donations-list`,
      },
      cancelled: {
        type:  "object_donation_declined",
        title: "Appointment Cancelled",
        body:  `${assocName} cancelled your donation appointment for ${appointment.itemName}.${moderatorNotes ? ` Reason: ${moderatorNotes}` : ""}`,
        link:  `/donor/object-donations-list`,
      },
    };

    if (notifMap[status]) {
      await createNotification({
        recipient: appointment.donor._id,
        sender:    req.user._id,
        ...notifMap[status],
        meta: { appointmentId: appointment._id },
      });
    }

    // Also send email (existing logic)
    await sendDonorNotificationEmail(appointment);

    res.json({ message: "Rendez-vous mis a jour", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Email helper (unchanged) ── */
async function sendDonorNotificationEmail(appointment) {
  const donor       = appointment.donor;
  const campaign    = appointment.campaign;
  const association = appointment.association;
  let subject = "", html = "";

  if (appointment.status === "confirmed") {
    const dateLocal = new Date(appointment.appointmentDate).toLocaleString("fr-FR",{ weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit" });
    subject = `Votre demande de donation d'items confirmée — ${campaign.title}`;
    html = `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#333"><h2 style="color:#0F6E56">Demande de donation confirmée ✓</h2><p>Bonjour <strong>${donor.name}</strong>,</p><p>Votre demande a été <strong style="color:#0F6E56">confirmée</strong> par ${association.organizationName||association.name}.</p><div style="background:#f0fdf4;border-left:4px solid #0F6E56;padding:15px;margin:20px 0"><p style="margin:5px 0"><strong>Item:</strong> ${appointment.itemName}</p><p style="margin:5px 0"><strong>Quantité:</strong> ${appointment.quantity}</p><p style="margin:5px 0"><strong>Rendez-vous:</strong> ${dateLocal}</p>${appointment.moderatorNotes?`<p style="margin:5px 0"><strong>Notes:</strong> ${appointment.moderatorNotes}</p>`:""}</div></div>`;
  } else if (appointment.status === "cancelled") {
    subject = `Votre demande de donation d'items a été annulée`;
    html = `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#333"><h2 style="color:#7f1d1d">Demande annulée</h2><p>Bonjour <strong>${donor.name}</strong>,</p><p>Votre demande a été <strong style="color:#7f1d1d">annulée</strong> par ${association.organizationName||association.name}.</p>${appointment.moderatorNotes?`<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:20px 0"><p><strong>Raison:</strong> ${appointment.moderatorNotes}</p></div>`:""}</div>`;
  } else if (appointment.status === "completed") {
    subject = `Votre donation d'items a été complétée`;
    html = `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#333"><h2 style="color:#0F6E56">Donation complétée ✓</h2><p>Bonjour <strong>${donor.name}</strong>,</p><p>Votre donation a été <strong style="color:#0F6E56">reçue</strong> par ${association.organizationName||association.name}. Merci !</p></div>`;
  }

  if (subject && html) {
    try { await sendEmail({ to: donor.email, subject, html }); }
    catch (err) { console.error("Email error:", err.message); }
  }
}
/* ══════════════════════════════════════════════════════════
   GET ALL DONORS FOR ASSOCIATION (monetary + object)
   GET /api/donations/association/donors
══════════════════════════════════════════════════════════ */
export const getAssociationDonors = async (req, res) => {
  try {
    const assocId = req.user._id;

    // Monetary donors
    const MoneyDonation = (await import("../models/MoneyDonation.js")).default;
    const monetary = await MoneyDonation.find({ association: assocId, status: "completed" })
      .populate("donor", "_id name email avatar")
      .select("donor amount currency createdAt");

    // Object donation appointments (all statuses except cancelled)
    const objectDonations = await ObjectDonationAppointment.find({
      association: assocId,
      status: { $ne: "cancelled" },
    })
      .populate("donor", "_id name email avatar")
      .populate("campaign", "title")
      .select("donor campaign itemName quantity status appointmentDate createdAt");

    // Merge & deduplicate donors
    const donorMap = new Map();

    for (const d of monetary) {
      if (!d.donor) continue;
      const id = d.donor._id.toString();
      if (!donorMap.has(id)) {
        donorMap.set(id, {
          donor: d.donor,
          monetary: [],
          objects: [],
        });
      }
      donorMap.get(id).monetary.push({
        amount: d.amount,
        currency: d.currency,
        date: d.createdAt,
      });
    }

    for (const o of objectDonations) {
      if (!o.donor) continue;
      const id = o.donor._id.toString();
      if (!donorMap.has(id)) {
        donorMap.set(id, { donor: o.donor, monetary: [], objects: [] });
      }
      donorMap.get(id).objects.push({
        campaign: o.campaign?.title || "–",
        itemName: o.itemName,
        quantity: o.quantity,
        status: o.status,
        appointmentDate: o.appointmentDate,
        date: o.createdAt,
      });
    }

    const donors = Array.from(donorMap.values()).map((d) => ({
      ...d,
      totalMonetary: d.monetary.reduce((s, m) => s + (m.amount || 0), 0),
      donationCount: d.monetary.length + d.objects.length,
    }));

    // Sort by most recent activity
    donors.sort((a, b) => {
      const latestA = Math.max(
        ...[...a.monetary, ...a.objects].map((x) => new Date(x.date).getTime())
      );
      const latestB = Math.max(
        ...[...b.monetary, ...b.objects].map((x) => new Date(x.date).getTime())
      );
      return latestB - latestA;
    });

    res.json({ donors });
  } catch (err) {
    console.error("getAssociationDonors error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   GET DONOR APPOINTMENTS (all types)
   GET /api/donations/my-all-appointments
══════════════════════════════════════════════════════════ */
export const getDonorAllAppointments = async (req, res) => {
  try {
    const [campaignAppointments, directDonations] = await Promise.all([
      ObjectDonationAppointment.find({ donor: req.user._id })
        .populate("campaign", "title location wilaya coverImage")
        .populate("association", "name organizationName email avatar phone addresses")
        .sort({ createdAt: -1 }),

      ObjectDonation.find({ donor: req.user._id })
        .populate("association", "name organizationName email avatar phone addresses")
        .sort({ createdAt: -1 }),
    ]);

    const appointments = [
      ...campaignAppointments.map(normalizeCampaignAppointment),
      ...directDonations.map(normalizeDirectDonation).map((d) => ({
        ...d,
        status: d.normalizedStatus, // normalize pending -> requested for frontend filters
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const scheduleAnyAppointmentByAssociation = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, appointmentDate, moderatorNotes, receivedQuantity } = req.body;

    const allowed = ["confirmed", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(", ")}` });
    }

    if (type === "campaign") {
      req.params.id = id;
      return scheduleObjectAppointmentByAssociation(req, res);
    }

    if (type !== "direct") {
      return res.status(400).json({ message: "Invalid appointment type" });
    }

    const donation = await ObjectDonation.findById(id)
      .populate("association", "_id name organizationName email")
      .populate("donor", "_id name email");

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.association._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (status === "confirmed") {
      const at = appointmentDate ? new Date(appointmentDate) : donation.appointmentDate;

      if (!at || Number.isNaN(at.getTime()) || at <= new Date()) {
        return res.status(400).json({ message: "Future appointmentDate required" });
      }

      donation.appointmentDate = at;
    }

    donation.status = status;
    donation.moderatorNotes = (moderatorNotes || "").trim();
    await donation.save();

    res.json({
      message: "Appointment updated",
      appointment: {
        ...normalizeDirectDonation(donation),
        status: donation.status === "pending" ? "requested" : donation.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAssociationAllAppointments = async (req, res) => {
  try {
    const [campaignAppointments, directDonations] = await Promise.all([
      ObjectDonationAppointment.find({ association: req.user._id })
        .populate("campaign", "title location wilaya coverImage")
        .populate("donor", "name email avatar phone")
        .sort({ createdAt: -1 }),

      ObjectDonation.find({ association: req.user._id })
        .populate("donor", "name email avatar phone")
        .sort({ createdAt: -1 }),
    ]);

    const appointments = [
      ...campaignAppointments.map(normalizeCampaignAppointment),
      ...directDonations.map(normalizeDirectDonation).map((d) => ({
        ...d,
        status: d.normalizedStatus,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const normalizeCampaignAppointment = (apt) => ({
  ...apt.toObject(),
  sourceType: "campaign",
  sourceModel: "ObjectDonationAppointment",
  displayTitle: apt.itemName,
  description: apt.notes || "",
  normalizedStatus: apt.status,
  campaign: apt.campaign || null,
  donor: apt.donor || null,
  association: apt.association || null,
});

const normalizeDirectDonation = (donation) => ({
  ...donation.toObject(),
  sourceType: "direct",
  sourceModel: "ObjectDonation",
  displayTitle: `${donation.category?.charAt(0).toUpperCase()}${donation.category?.slice(1)} donation`,
  description: donation.description || "",
  normalizedStatus: donation.status === "pending" ? "requested" : donation.status,
  campaign: null,
  donor: donation.donor || null,
  association: donation.association || null,
});
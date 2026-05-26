// utils/associationAvailability.js
import ObjectDonation from "../models/ObjectDonation.js";
import ObjectDonationAppointment from "../models/ObjectDonationAppointment.js";

export const ALL_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

export const getAssociationAvailableSlots = async (associationId, date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [directDonations, campaignAppointments] = await Promise.all([
    // Direct donations: have an explicit timeSlot field
    ObjectDonation.find({
      association: associationId,
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ["cancelled", "completed"] },
    }).select("timeSlot"),

    // Campaign appointments: may have an explicit timeSlot field OR encode time in appointmentDate
    ObjectDonationAppointment.find({
      association: associationId,
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ["cancelled", "completed"] },
    }).select("appointmentDate timeSlot"),
  ]);

  const busySlots = new Set();

  // Direct donations — always use timeSlot field
  for (const d of directDonations) {
    if (d.timeSlot) busySlots.add(normalizeSlot(d.timeSlot));
  }

  // Campaign appointments — prefer explicit timeSlot, fall back to extracting from date
  for (const a of campaignAppointments) {
    if (a.timeSlot) {
      busySlots.add(normalizeSlot(a.timeSlot));
    } else if (a.appointmentDate) {
      // Legacy records: extract time from the stored datetime
      const extracted = extractSlotFromDate(a.appointmentDate);
      if (extracted) busySlots.add(extracted);
    }
  }

  return ALL_SLOTS.map((time) => ({
    time,
    available: !busySlots.has(normalizeSlot(time)),
  }));
};

export const assertAssociationSlotAvailable = async ({
  associationId,
  appointmentDate,
  timeSlot,
}) => {
  if (!associationId || !appointmentDate || !timeSlot) {
    const err = new Error("associationId, appointmentDate and timeSlot are all required");
    err.statusCode = 400;
    throw err;
  }

  const slots = await getAssociationAvailableSlots(associationId, appointmentDate);
  const normalized = normalizeSlot(timeSlot);
  const selected = slots.find((s) => normalizeSlot(s.time) === normalized);

  if (!selected || !selected.available) {
    const err = new Error(
      `The ${timeSlot} slot is no longer available for this association on that date. Please choose another time.`
    );
    err.statusCode = 400;
    throw err;
  }
};

/* ── helpers ── */

/**
 * Normalise a slot string so "9:00 AM", "09:00 AM", "09:00 am" all match.
 * Returns upper-case, zero-padded, e.g. "09:00 AM"
 */
function normalizeSlot(slot = "") {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return slot.trim().toUpperCase();
  const h = String(parseInt(match[1], 10)).padStart(2, "0");
  const m = match[2];
  const p = match[3].toUpperCase();
  return `${h}:${m} ${p}`;
}

/**
 * Extract a slot string from a Date object.
 * Returns null if the time doesn't correspond to a known slot.
 */
function extractSlotFromDate(date) {
  try {
    const dt = new Date(date);
    const raw = dt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const normalized = normalizeSlot(raw);
    return ALL_SLOTS.map(normalizeSlot).includes(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
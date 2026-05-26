import { useState, useEffect } from "react";
import api from "../../api/axios";

/* ══════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════ */
function StatCard({ label, value, color, icon }) {
  const colors = {
    amber:   { bg: "bg-amber-50",   text: "text-amber-500",   ring: "ring-amber-200"  },
    blue:    { bg: "bg-blue-50",    text: "text-blue-500",    ring: "ring-blue-200"   },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-500", ring: "ring-emerald-200"},
    violet:  { bg: "bg-violet-50",  text: "text-violet-500",  ring: "ring-violet-200" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className={`text-3xl font-extrabold tracking-tight ${c.text}`}>{value}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════════════ */
function Badge({ status }) {
  const map = {
    pending:     "bg-amber-100 text-amber-700",
    requested:   "bg-amber-100 text-amber-700",   // campaign donations start as "requested"
    confirmed:   "bg-blue-100 text-blue-700",
    completed:   "bg-emerald-100 text-emerald-700",
    declined:    "bg-red-100 text-red-600",
    cancelled:   "bg-slate-100 text-slate-500",
    rescheduled: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   IMAGE CAROUSEL LIGHTBOX
══════════════════════════════════════════════════════ */
function CarouselLightbox({ images, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const total = images.length;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  setCurrent(c => (c + 1) % total);
      if (e.key === "ArrowLeft")   setCurrent(c => (c - 1 + total) % total);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [total, onClose]);

  const src = (img) => img?.url || img;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition text-lg z-10">
        ✕
      </button>
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {current + 1} / {total}
      </p>
      <div className="relative flex items-center justify-center w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        {total > 1 && (
          <button onClick={() => setCurrent(c => (c - 1 + total) % total)}
            className="absolute left-0 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition z-10 -translate-x-1/2">‹</button>
        )}
        <img key={current} src={src(images[current])} alt={`photo-${current}`}
          className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl select-none"
          style={{ animation: "fadeIn .2s ease" }}/>
        {total > 1 && (
          <button onClick={() => setCurrent(c => (c + 1) % total)}
            className="absolute right-0 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition z-10 translate-x-1/2">›</button>
        )}
      </div>
      {total > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto max-w-lg px-2" onClick={e => e.stopPropagation()}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                i === current ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-100"}`}>
              <img src={src(img)} alt={`thumb-${i}`} className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(.97); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RESCHEDULE MODAL
══════════════════════════════════════════════════════ */
const TIMES = ["09:00 AM","10:00 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM"];
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }

function RescheduleModal({ donation, onClose, onSaved }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const orig  = donation.appointmentDate ? new Date(donation.appointmentDate) : new Date();

  const [calYear,  setCalYear]  = useState(orig.getFullYear());
  const [calMonth, setCalMonth] = useState(orig.getMonth());
  const [selDay,   setSelDay]   = useState(orig.getDate());
  const [selTime,  setSelTime]  = useState(donation.timeSlot || "");
  const [note,     setNote]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const daysInM   = getDaysInMonth(calYear, calMonth);
  const firstDay  = getFirstDay(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => calMonth === 0  ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0),  setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  const handleSave = async () => {
    if (!selDay || !selTime) { setError("Please pick a date and time."); return; }
    setLoading(true); setError("");
    try {
      const date = new Date(calYear, calMonth, selDay);
      const [time, period] = selTime.split(" ");
      let [hh, mm] = time.split(":").map(Number);
      if (period === "PM" && hh !== 12) hh += 12;
      if (period === "AM" && hh === 12) hh  = 0;
      date.setHours(hh, mm, 0, 0);

      // ✅ Same endpoint works for both types (backend now handles both)
      await api.patch(`/donations/object-donations/${donation._id}/reschedule`, {
        appointmentDate: date.toISOString(),
        timeSlot: selTime,
        moderatorNotes: note,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Reschedule Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">An email will be sent to the donor</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">New Date</p>
            <div className="border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">‹</button>
                <p className="text-sm font-semibold text-slate-800">{monthName}</p>
                <button onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">›</button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                  <div key={d} className="text-center text-[10px] text-slate-400 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({length:firstDay}).map((_,i) => <div key={"e"+i}/>)}
                {Array.from({length:daysInM},(_,i)=>i+1).map(day => {
                  const d    = new Date(calYear,calMonth,day);
                  const past = d < today;
                  const sel  = selDay === day && !past;
                  return (
                    <button key={day} type="button" disabled={past} onClick={()=>setSelDay(day)}
                      className={`aspect-square flex items-center justify-center text-xs rounded-lg transition
                        ${past ? "text-slate-300 cursor-not-allowed"
                               : sel ? "bg-emerald-500 text-white font-bold"
                                     : "hover:bg-emerald-50 text-slate-700 hover:text-emerald-600"}`}
                    >{day}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">New Time Slot</p>
            <div className="grid grid-cols-4 gap-2">
              {TIMES.map(t => (
                <button key={t} type="button" onClick={()=>setSelTime(t)}
                  className={`py-2 rounded-xl border text-xs font-medium transition
                    ${selTime===t ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                >{t}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1.5">Message to Donor <span className="text-slate-400 font-normal">(optional)</span></p>
            <textarea rows={3} placeholder="Reason for rescheduling..." value={note} onChange={e=>setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition resize-none placeholder-slate-400"/>
          </div>
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <span className="text-lg mt-0.5">📧</span>
            <p className="text-xs text-blue-700">An automatic email will be sent to the donor with the updated appointment details.</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
            <button onClick={handleSave} disabled={loading || !selDay || !selTime}
              className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading
                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
                : "Save & Notify Donor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DONATION DETAIL MODAL
══════════════════════════════════════════════════════ */
function DetailModal({ donation, onClose, onStatusChange }) {
  const [carouselIndex, setCarouselIndex] = useState(null);
  const [reschedule,    setReschedule]    = useState(false);
  const [actionLoad,    setActionLoad]    = useState(false);
  const [notes,         setNotes]         = useState(donation.moderatorNotes || "");

  const donor   = donation.donor || {};
  const appt    = donation.appointmentDate ? new Date(donation.appointmentDate) : null;
  const apptStr = appt ? appt.toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" }) : "—";

  const loc    = donation.donorLocation;
  const hasMap = donation.method === "pickup" && loc?.lat && loc?.lng;
  const mapsUrl  = hasMap ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : null;
  const embedUrl = hasMap ? `https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed` : null;

  const images = donation.images || [];

  /* ✅ handleAction works for both types — backend now auto-detects by ID */
  const handleAction = async (status) => {
    setActionLoad(true);
    try {
      await api.patch(`/associations/object-appointments/${donation._id}/confirm`, {
        status,
        moderatorNotes: notes,
      });
      onStatusChange(donation._id, status);
      onClose();
    } catch (e) {
      console.error("Action failed:", e.response?.data?.message || e.message);
    } finally {
      setActionLoad(false);
    }
  };

  /* ✅ Treat "requested" (campaign) same as "pending" for showing action buttons */
  const isPending = ["pending", "requested"].includes(donation.status);

  return (
    <>
      {carouselIndex !== null && (
        <CarouselLightbox images={images} startIndex={carouselIndex} onClose={() => setCarouselIndex(null)}/>
      )}
      {reschedule && (
        <RescheduleModal
          donation={donation}
          onClose={() => setReschedule(false)}
          onSaved={() => onStatusChange(donation._id, "rescheduled")}
        />
      )}

      <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                {(donor.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{donor.name || "Unknown Donor"}</h2>
                <p className="text-xs text-slate-400">{donor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={donation.status}/>
              {/* ✅ Campaign tag in header */}
              {donation.type === "campaign" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  📋 Campaign
                </span>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition ml-1">✕</button>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* ✅ Campaign info block */}
            {donation.campaign && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-1 flex items-center gap-2">
                  <span>📋</span> Campaign Donation
                </p>
                <p className="text-sm font-bold text-emerald-900">{donation.campaign.title}</p>
                {donation.itemName && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Item requested: <span className="font-semibold">{donation.itemName}</span>
                  </p>
                )}
              </div>
            )}

            {/* Appointment info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <span>📅</span> Appointment Details
                </p>
                {/* ✅ Reschedule button shows for both pending/requested/confirmed */}
                {(isPending || donation.status === "confirmed") && (
                  <button onClick={() => setReschedule(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 px-3 py-1.5 rounded-lg transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Reschedule
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide font-semibold mb-0.5">Date</p>
                  <p className="text-sm font-semibold text-blue-900">{apptStr}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide font-semibold mb-0.5">Time</p>
                  <p className="text-sm font-semibold text-blue-900">{donation.timeSlot || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide font-semibold mb-0.5">Method</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {donation.method === "pickup" ? "🚚 Association Pickup" : "🏢 Drop-off"}
                  </p>
                </div>
              </div>

              {hasMap && (
                <div className="mt-3 rounded-xl overflow-hidden border border-blue-200">
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-100">
                    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Donor Pickup Location
                    </p>
                    <a href={mapsUrl} target="_blank" rel="noreferrer"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition">
                      Open in Maps
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  </div>
                  <iframe title="donor-location" src={embedUrl} width="100%" height="200"
                    style={{ border:0, display:"block" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
                  <div className="px-3 py-2 bg-blue-50 flex items-center gap-1.5">
                    <p className="text-[11px] text-blue-600 font-mono">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
                  </div>
                </div>
              )}

              {donation.method === "dropoff" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2">
                  <span>🏢</span>
                  <span>Donor will drop off items at your association location.</span>
                </div>
              )}
            </div>

            {/* Donation details */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">📦 Donation Details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: "Category",  value: donation.category,  cap: true },
                  { label: "Quantity",  value: `${donation.quantity} item(s)` },
                  { label: "Condition", value: donation.condition,  cap: true },
                  { label: "Submitted", value: donation.createdAt ? new Date(donation.createdAt).toLocaleDateString("en-GB") : "—" },
                ].map(({ label, value, cap }) => (
                  <div key={label}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                    <p className={`text-sm font-semibold text-slate-800 ${cap ? "capitalize" : ""}`}>{value || "—"}</p>
                  </div>
                ))}
                {donation.description && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Description</p>
                    <p className="text-sm text-slate-700">{donation.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photos */}
            {images.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  🖼️ Item Photos{" "}
                  <span className="text-slate-400 font-normal text-xs">({images.length} photo{images.length > 1 ? "s" : ""})</span>
                </p>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group mb-2"
                  onClick={() => setCarouselIndex(0)}>
                  <img src={images[0]?.url || images[0]} alt="main"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"/>
                  {images.length > 1 && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <div className="bg-white/90 text-slate-800 text-sm font-bold px-4 py-2 rounded-full">
                        View all {images.length} photos
                      </div>
                    </div>
                  )}
                  {images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      1 / {images.length}
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1, 5).map((img, i) => {
                      const realIndex = i + 1;
                      const isLast    = realIndex === 4 && images.length > 5;
                      return (
                        <button key={realIndex} onClick={() => setCarouselIndex(realIndex)}
                          className="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-emerald-400 transition relative group">
                          <img src={img?.url || img} alt={`thumb-${realIndex}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          {isLast && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">+{images.length - 5}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">Click any photo to open full viewer</p>
              </div>
            )}

            {/* QR code */}
            {donation.qrCodeText && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-bold text-lg">⬛</div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">QR Reference</p>
                  <p className="text-sm font-mono font-semibold text-slate-700">{donation.qrCodeText}</p>
                </div>
              </div>
            )}

            {/* Moderator notes */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Notes / Feedback to Donor</p>
              <textarea rows={3} placeholder="Add internal notes or feedback for the donor..."
                value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition resize-none placeholder-slate-400"/>
            </div>

            {/* ✅ Actions: isPending covers both "pending" and "requested" */}
            {isPending && (
              <div className="flex gap-3 pt-1">
                <button onClick={() => handleAction("declined")} disabled={actionLoad}
                  className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Decline
                </button>
                <button onClick={() => handleAction("confirmed")} disabled={actionLoad}
                  className="flex-[2] py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-40 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Accept Donation
                </button>
              </div>
            )}
            {donation.status === "confirmed" && (
              <button onClick={() => handleAction("completed")} disabled={actionLoad}
                className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition shadow-md disabled:opacity-40 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   DONATION CARD (list item)
══════════════════════════════════════════════════════ */
function DonationCard({ donation, onClick }) {
  const donor   = donation.donor || {};
  const appt    = donation.appointmentDate ? new Date(donation.appointmentDate) : null;
  const apptStr = appt ? appt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const catIcons = { clothes:"👕", food:"🍱", furniture:"🛋️", education:"📚", health:"🩺", other:"📦" };

  return (
    <div onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0 group-hover:bg-emerald-200 transition">
            {(donor.name||"?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{donor.name || "Unknown"}</p>
            <p className="text-xs text-slate-400">{donor.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge status={donation.status}/>
          {/* ✅ Campaign pill on the card */}
          {donation.type === "campaign" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
              📋 Campaign
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg capitalize">
          <span>{catIcons[donation.category] || "📦"}</span>
          {/* ✅ Show item name for campaign donations */}
          {donation.itemName || donation.category} · {donation.quantity} item(s)
        </span>
        {donation.condition && donation.condition !== "—" && (
          <span className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize ${
            donation.condition==="new"  ? "bg-emerald-50 text-emerald-600" :
            donation.condition==="good" ? "bg-blue-50 text-blue-600" :
            "bg-slate-100 text-slate-600"}`}>
            {donation.condition}
          </span>
        )}
        {donation.campaign?.title && (
          <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg truncate max-w-[180px]">
            📋 {donation.campaign.title}
          </span>
        )}
        {donation.images?.length > 0 && (
          <span className="text-xs font-medium bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg">
            🖼️ {donation.images.length} photo{donation.images.length>1?"s":""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-3">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          {apptStr}
        </span>
        {donation.timeSlot && (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {donation.timeSlot}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-emerald-500 font-semibold group-hover:gap-2 transition-all">
          View details
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function AssociationObjectDonations() {
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/associations/object-donations");
      setDonations(data.donations || data || []);
    } catch { setDonations([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleStatusChange = (id, newStatus) => {
    setDonations(prev => prev.map(d => d._id === id ? {...d, status: newStatus} : d));
  };

  /* Stats — count "requested" (campaign) with "pending" */
  const pending   = donations.filter(d => ["pending","requested"].includes(d.status)).length;
  const confirmed = donations.filter(d => d.status === "confirmed").length;
  const completed = donations.filter(d => d.status === "completed").length;
  const totalItems = donations.reduce((s,d) => s + (d.quantity || 0), 0);

  /* Filter + search */
  const STATUS_FILTERS = ["all","pending","confirmed","completed","declined"];
  const filtered = donations.filter(d => {
    // "pending" filter tab also shows "requested" campaign donations
    const matchStatus =
      filter === "all" ||
      (filter === "pending" && ["pending","requested"].includes(d.status)) ||
      d.status === filter;

    const q = search.toLowerCase();
    const matchSearch = !q ||
      (d.donor?.name||"").toLowerCase().includes(q) ||
      (d.donor?.email||"").toLowerCase().includes(q) ||
      (d.category||"").toLowerCase().includes(q) ||
      (d.description||"").toLowerCase().includes(q) ||
      (d.campaign?.title||"").toLowerCase().includes(q) ||
      (d.itemName||"").toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Object Donations</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage incoming donation requests from donors</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Pending Review" value={pending}    color="amber"   icon="⏳"/>
          <StatCard label="Accepted"       value={confirmed}  color="blue"    icon="✅"/>
          <StatCard label="Completed"      value={completed}  color="emerald" icon="🎁"/>
          <StatCard label="Total Items"    value={totalItems} color="violet"  icon="📦"/>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search by donor, item, campaign…"
              value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"/>
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition
                  ${filter===f ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="animate-spin w-8 h-8 mb-3 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <p className="text-sm">Loading donations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-sm font-medium">No donations found</p>
            <p className="text-xs mt-1">{filter!=="all" ? `No ${filter} requests` : "No donations yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <DonationCard key={d._id} donation={d} onClick={() => setSelected(d)}/>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          donation={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            setSelected(prev => prev?._id === id ? {...prev, status} : prev);
          }}
        />
      )}
    </div>
  );
}
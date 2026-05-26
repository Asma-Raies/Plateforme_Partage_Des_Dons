import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ══════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════ */
function Badge({ status }) {
  const map = {
    pending:     { cls: "bg-amber-100 text-amber-700",    label: "pending"      },
    requested:   { cls: "bg-amber-100 text-amber-700",    label: "requested"    },
    confirmed:   { cls: "bg-blue-100 text-blue-700",      label: "confirmed"    },
    scheduled:   { cls: "bg-yellow-100 text-yellow-700",  label: "scheduled"    },
    completed:   { cls: "bg-emerald-100 text-emerald-700",label: "completed"    },
    declined:    { cls: "bg-red-100 text-red-600",        label: "declined"     },
    cancelled:   { cls: "bg-slate-100 text-slate-500",    label: "cancelled"    },
    rescheduled: { cls: "bg-purple-100 text-purple-700",  label: "rescheduled"  },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════════
   CATEGORY ICON BOX
══════════════════════════════════════════════ */
const CAT_ICONS = {
  clothes:   { emoji: "👕", bg: "bg-emerald-100", text: "text-emerald-600" },
  food:      { emoji: "🍱", bg: "bg-orange-100",  text: "text-orange-600"  },
  furniture: { emoji: "🛋️", bg: "bg-amber-100",   text: "text-amber-600"   },
  education: { emoji: "📚", bg: "bg-blue-100",    text: "text-blue-600"    },
  health:    { emoji: "🩺", bg: "bg-rose-100",    text: "text-rose-600"    },
  toys:      { emoji: "🧸", bg: "bg-pink-100",    text: "text-pink-600"    },
  other:     { emoji: "📦", bg: "bg-slate-100",   text: "text-slate-600"   },
};

function CategoryIcon({ category }) {
  const c = CAT_ICONS[category?.toLowerCase()] || CAT_ICONS.other;
  return (
    <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-xl flex-shrink-0`}>
      {c.emoji}
    </div>
  );
}

/* ══════════════════════════════════════════════
   DETAIL MODAL  (donor view — read only)
══════════════════════════════════════════════ */
function DetailModal({ donation, onClose }) {
  const [imgIndex, setImgIndex] = useState(0);
  const images  = donation.images || [];
  const assoc   = donation.association || {};
  const appt    = donation.appointmentDate ? new Date(donation.appointmentDate) : null;
  const apptStr = appt
    ? appt.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "—";

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) setImgIndex(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft"  && images.length > 1) setImgIndex(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  const src = (img) => img?.url || img;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <CategoryIcon category={donation.category} />
            <div>
              <h2 className="text-base font-bold text-slate-800 capitalize">
                {donation.itemName || donation.category}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge status={donation.status} />
                {/* ✅ Campaign tag shown in header if applicable */}
                {donation.campaign && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    📋 Campaign
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
          >✕</button>
        </div>

        <div className="p-5 space-y-5">

          {/* Images carousel */}
          {images.length > 0 && (
            <div>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 mb-2">
                <img
                  key={imgIndex}
                  src={src(images[imgIndex])}
                  alt={`photo-${imgIndex}`}
                  className="w-full h-52 object-cover"
                  style={{ animation: "fadeIn .2s ease" }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition text-lg"
                    >‹</button>
                    <button
                      onClick={() => setImgIndex(i => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition text-lg"
                    >›</button>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      {imgIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                        i === imgIndex ? "border-emerald-500" : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={src(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ✅ Campaign info block — only for campaign donations */}
          {donation.campaign && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <span>📋</span> Campaign Donation
              </p>
              <p className="text-sm font-bold text-emerald-900">{donation.campaign.title}</p>
              {donation.itemName && (
                <p className="text-xs text-emerald-600 mt-1">
                  Item: <span className="font-semibold">{donation.itemName}</span>
                </p>
              )}
            </div>
          )}

          {/* Donation info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">📦 Donation Info</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Category",  value: donation.category,  cap: true },
                { label: "Quantity",  value: `${donation.quantity} item(s)` },
                { label: "Condition", value: donation.condition,  cap: true },
                { label: "Submitted", value: donation.createdAt ? new Date(donation.createdAt).toLocaleDateString("en-GB") : "—" },
              ].map(({ label, value, cap }) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                  <p className={`text-sm font-semibold text-slate-700 ${cap ? "capitalize" : ""}`}>{value || "—"}</p>
                </div>
              ))}
              {donation.description && (
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Description</p>
                  <p className="text-sm text-slate-600">{donation.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointment */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span>📅</span> Appointment
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-blue-500 uppercase tracking-wide font-semibold mb-0.5">Date</p>
                <p className="text-sm font-semibold text-blue-900">{apptStr}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-500 uppercase tracking-wide font-semibold mb-0.5">Time</p>
                <p className="text-sm font-semibold text-blue-900">{donation.timeSlot || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-blue-500 uppercase tracking-wide font-semibold mb-0.5">Method</p>
                <p className="text-sm font-semibold text-blue-900">
                  {donation.method === "pickup" ? "🚚 Association Pickup" : "🏢 Drop-off at Association"}
                </p>
              </div>
            </div>
          </div>

          {/* Association */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>🏢</span> Association
            </p>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {assoc.organizationName || assoc.name || "—"}
            </p>
            {assoc.email && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {assoc.email}
              </p>
            )}
            {assoc.phone && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                {assoc.phone}
              </p>
            )}
          </div>

          {/* Moderator notes */}
          {donation.moderatorNotes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Note from Association</p>
              <p className="text-sm text-amber-800">{donation.moderatorNotes}</p>
            </div>
          )}

          {/* QR Code */}
          {donation.qrCodeText && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">⬛</div>
              <div>
                <p className="text-xs text-slate-400 font-medium">QR Reference</p>
                <p className="text-sm font-mono font-semibold text-slate-700">{donation.qrCodeText}</p>
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   DONATION ROW CARD
══════════════════════════════════════════════ */
function DonationRow({ donation, onClick }) {
  const assoc = donation.association || {};
  const appt  = donation.appointmentDate ? new Date(donation.appointmentDate) : null;

  const showScheduled = ["confirmed", "scheduled"].includes(donation.status) && appt;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition-all">
      {/* Icon */}
      <CategoryIcon category={donation.category} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-base font-bold text-slate-800 capitalize">
            {/* ✅ Show item name for campaign donations, category for regular */}
            {donation.itemName || donation.category}
          </span>
          <Badge status={donation.status} />
          {/* ✅ Campaign pill */}
          {donation.campaign && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              📋 Campaign
            </span>
          )}
        </div>

        <p className="text-sm text-slate-500 truncate mb-2">
          {donation.description || donation.itemName || "—"}
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-slate-400">
            Qty: <span className="font-semibold text-slate-600">{donation.quantity}</span>
          </span>
          {donation.condition && donation.condition !== "—" && (
            <span className="text-xs text-slate-400">
              Condition: <span className="font-semibold text-slate-600 capitalize">{donation.condition}</span>
            </span>
          )}
          {(assoc.organizationName || assoc.name) && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="font-semibold text-slate-600">
                {assoc.organizationName || assoc.name}
              </span>
            </span>
          )}
          {/* ✅ Campaign title shown inline */}
          {donation.campaign?.title && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold truncate max-w-[160px]">
              📋 {donation.campaign.title}
            </span>
          )}
        </div>

        {showScheduled && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span className="text-xs font-semibold text-blue-500">
              Scheduled for {appt.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* View Details button */}
      <button
        onClick={onClick}
        className="flex-shrink-0 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition whitespace-nowrap"
      >
        View Details
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function DonorObjectDonations() {
  const navigate  = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState("all");

  useEffect(() => {
    api.get("/donations/my-object-donations")
      .then(r => {
        // ✅ Handle both { donations: [] } and plain [] responses
        const data = r.data;
        setDonations(Array.isArray(data) ? data : data?.donations || []);
      })
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  }, []);

  const FILTERS = ["all", "pending", "requested", "confirmed", "completed", "declined"];

  const filtered = donations.filter(d =>
    filter === "all" || d.status === filter
  );

  // Stats — treat "requested" (campaign) same as "pending" in counts
  const pending   = donations.filter(d => ["pending", "requested"].includes(d.status)).length;
  const confirmed = donations.filter(d => ["confirmed", "scheduled"].includes(d.status)).length;
  const completed = donations.filter(d => d.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Object Donations</h1>
            <p className="text-sm text-slate-400 mt-0.5">Your donated items history</p>
          </div>
          <button
            onClick={() => navigate("/donor/donate-objects")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New Donation
          </button>
        </div>

        {/* Mini stats */}
        {!loading && donations.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Pending",   value: pending,   color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-100" },
              { label: "Confirmed", value: confirmed, color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-100"  },
              { label: "Completed", value: completed, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100"},
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && donations.length > 0 && (
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4 overflow-x-auto">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition
                  ${filter === f ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              >{f}</button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin w-8 h-8 mb-3 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <p className="text-sm">Loading your donations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-base font-semibold text-slate-500">
              {filter !== "all" ? `No ${filter} donations` : "No donations yet"}
            </p>
            {filter === "all" && (
              <button
                onClick={() => navigate("/donor/donate-objects")}
                className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition"
              >
                Make your first donation →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <DonationRow
                key={d._id}
                donation={d}
                onClick={() => setSelected(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <DetailModal
          donation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
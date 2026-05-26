import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ── Status config ── */
const STATUS = {
  requested:  { label: "Pending",   cls: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-400",  icon: "⏳" },
  confirmed:  { label: "Confirmed", cls: "bg-blue-100 text-blue-700 border-blue-200",       dot: "bg-blue-500",   icon: "✅" },
  completed:  { label: "Completed", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: "🎉" },
  cancelled:  { label: "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200",    dot: "bg-slate-400",  icon: "❌" },
};

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

function Badge({ status }) {
  const s = STATUS[status] || STATUS.requested;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl mb-5">📅</div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">No appointments yet</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        {filter === "All"
          ? "When you donate items to campaigns, your appointments will appear here."
          : `No ${filter.toLowerCase()} appointments found.`}
      </p>
    </div>
  );
}

/* ── Detail drawer ── */
function AppointmentDrawer({ apt, onClose }) {
  if (!apt) return null;
  const s = STATUS[apt.status] || STATUS.requested;
  const assoc = apt.association || {};
  const campaign = apt.campaign || {};
  const apptDate = apt.appointmentDate ? new Date(apt.appointmentDate) : null;
  const createdAt = new Date(apt.createdAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >✕</button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium mb-1 uppercase tracking-wider">Appointment</p>
              <h2 className="text-white font-bold text-lg leading-tight">{apt.itemName}</h2>
              <p className="text-white/60 text-sm mt-0.5">{apt.quantity} {apt.quantity === 1 ? "unit" : "units"}</p>
            </div>
          </div>
          <div className="mt-4">
            <Badge status={apt.status} />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Campaign */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Campaign</p>
            <p className="font-bold text-slate-800 text-sm">{campaign.title || "—"}</p>
            {campaign.location && <p className="text-xs text-slate-400 mt-1">📍 {campaign.location}</p>}
          </div>

          {/* Association */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Association</p>
            <p className="font-bold text-slate-800 text-sm">{assoc.organizationName || assoc.name || "—"}</p>
            {assoc.email && <p className="text-xs text-slate-400 mt-0.5">✉️ {assoc.email}</p>}
            {assoc.phone && <p className="text-xs text-slate-400 mt-0.5">📞 {assoc.phone}</p>}
          </div>

          {/* Appointment Date */}
          {apptDate ? (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Appointment Date</p>
              <p className="font-bold text-blue-800 text-sm">
                {apptDate.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-xs text-blue-400 mt-0.5">
                {apptDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide mb-1">Appointment Date</p>
              <p className="text-sm text-amber-700 font-medium">Waiting for association to confirm a date</p>
            </div>
          )}

          {/* Notes */}
          {apt.notes && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-slate-600">{apt.notes}</p>
            </div>
          )}

          {/* Moderator Notes */}
          {apt.moderatorNotes && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-2">Association Response</p>
              <p className="text-sm text-emerald-800">{apt.moderatorNotes}</p>
            </div>
          )}

          {/* Submitted */}
          <p className="text-xs text-slate-400 text-center">
            Submitted {createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Appointment card ── */
function AppointmentCard({ apt, onClick }) {
  const s = STATUS[apt.status] || STATUS.requested;
  const apptDate = apt.appointmentDate ? new Date(apt.appointmentDate) : null;
  const assoc = apt.association || {};
  const campaign = apt.campaign || {};

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 p-5 text-left group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-slate-200 transition">
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{apt.itemName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{apt.quantity} unit{apt.quantity !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Badge status={apt.status} />
      </div>

      {/* Campaign */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide w-16 flex-shrink-0">Campaign</span>
        <span className="text-xs text-slate-600 font-medium truncate">{campaign.title || "—"}</span>
      </div>

      {/* Association */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide w-16 flex-shrink-0">Assoc.</span>
        <span className="text-xs text-slate-600 font-medium truncate">{assoc.organizationName || assoc.name || "—"}</span>
      </div>

      {/* Date row */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        {apptDate ? (
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            📅 {apptDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Date pending…</span>
        )}
        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition">View details →</span>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function DonorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/donations/my-all-appointments")
      .then(({ data }) => setAppointments(data.appointments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filterMap = { Pending: "requested", Confirmed: "confirmed", Completed: "completed", Cancelled: "cancelled" };
  const filtered = filter === "All"
    ? appointments
    : appointments.filter((a) => a.status === filterMap[filter]);

  /* stats */
  const stats = {
    total:     appointments.length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    pending:   appointments.filter((a) => a.status === "requested").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Appointments</h1>
            <p className="text-sm text-slate-400 mt-0.5">Track your object donation rendez-vous</p>
          </div>
          <button
            onClick={() => navigate("/donor/campaigns")}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse Campaigns
          </button>
        </div>
      </div>

      <div className="w-full px-6 py-6">
      

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((apt) => (
              <AppointmentCard key={apt._id} apt={apt} onClick={() => setSelected(apt)} />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && <AppointmentDrawer apt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
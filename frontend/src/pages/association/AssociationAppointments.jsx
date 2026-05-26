// pages/association/AssociationAppointments.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

/* ── Status config ── */
const STATUS = {
  requested:  { label: "Pending",    cls: "bg-amber-100 text-amber-700",    dot: "bg-amber-400",   icon: "⏳" },
  confirmed:  { label: "Confirmed",  cls: "bg-blue-100 text-blue-700",      dot: "bg-blue-500",    icon: "✅" },
  completed:  { label: "Completed",  cls: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500", icon: "🎁" },
  cancelled:  { label: "Cancelled",  cls: "bg-slate-100 text-slate-500",    dot: "bg-slate-300",   icon: "❌" },
};

function Badge({ status }) {
  const s = STATUS[status] || STATUS.requested;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════════
   MANAGE MODAL
══════════════════════════════════════════════ */
function ManageModal({ apt, onClose, onUpdate }) {
  const [status,           setStatus]           = useState(apt.status === "requested" ? "confirmed" : apt.status);
  const [appointmentDate,  setAppointmentDate]  = useState(apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().slice(0,16) : "");
  const [moderatorNotes,   setModeratorNotes]   = useState(apt.moderatorNotes || "");
  const [receivedQuantity, setReceivedQuantity] = useState(apt.quantity);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const today = new Date().toISOString().slice(0,16);

  const submit = async () => {
    if (status === "confirmed" && !appointmentDate) { setError("Please select a date and time."); return; }
    setLoading(true); setError("");
    const endpoint = apt.sourceType === "direct"
      ? `/donations/association/all-appointments/direct/${apt._id}/schedule`
      : `/donations/association/all-appointments/campaign/${apt._id}/schedule`;
    try {
      await api.put(endpoint, {
        status,
        appointmentDate: status === "confirmed" ? appointmentDate : undefined,
        moderatorNotes,
        receivedQuantity: status === "completed" ? receivedQuantity : undefined,
      });
      onUpdate(); onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update.");
    } finally { setLoading(false); }
  };

  const donor    = apt.donor    || {};
  const campaign = apt.campaign || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <p className="text-xs text-slate-400 font-medium">Manage appointment</p>
            <h2 className="text-base font-bold text-slate-800">{apt.itemName}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition ml-3 flex-shrink-0">✕</button>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Donor info */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
              {(donor.name||"?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{donor.name||"Unknown"}</p>
              <p className="text-xs text-slate-400 truncate">{donor.email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Qty</p>
              <p className="font-bold text-slate-800 text-sm">{apt.quantity}</p>
            </div>
          </div>

          {/* Source (campaign or direct) */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
              {apt.sourceType === "campaign" ? "Campaign" : "Donation Type"}
            </p>
            <p className="text-sm font-semibold text-slate-700">
              {apt.sourceType === "campaign" ? campaign.title||"—" : `${apt.category} · ${apt.method}`}
            </p>
          </div>

          {/* Donor notes */}
          {apt.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-semibold mb-1">Donor's message</p>
              <p className="text-sm text-blue-800">{apt.notes}</p>
            </div>
          )}

          {/* Status selector */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Update Status</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {val:"confirmed", label:"Confirm", icon:"✅"},
                {val:"completed", label:"Complete",icon:"🎁"},
                {val:"cancelled", label:"Cancel",  icon:"❌"},
              ].map(({val,label,icon})=>(
                <button key={val} onClick={()=>setStatus(val)}
                  className={`py-3 rounded-xl border-2 text-center transition ${
                    status===val ? "border-slate-700 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <div className="text-xl">{icon}</div>
                  <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Appointment date */}
          {status === "confirmed" && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">
                Appointment Date & Time <span className="text-red-400">*</span>
              </p>
              <input type="datetime-local" min={today} value={appointmentDate}
                onChange={e=>setAppointmentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"/>
              <p className="text-xs text-slate-400 mt-1">Donor will be notified of this date.</p>
            </div>
          )}

          {/* Received qty */}
          {status === "completed" && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Quantity actually received</p>
              <input type="number" min={1} max={apt.quantity} value={receivedQuantity}
                onChange={e=>setReceivedQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"/>
            </div>
          )}

          {/* Moderator notes */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1.5">
              Notes / Response to donor <span className="text-slate-400 font-normal">(optional)</span>
            </p>
            <textarea rows={3} value={moderatorNotes} onChange={e=>setModeratorNotes(e.target.value)}
              placeholder="e.g. Please bring items on Tuesday at 9:00 AM…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition resize-none placeholder-slate-400"/>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
            <button onClick={submit} disabled={loading}
              className="flex-[2] py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APPOINTMENT CARD (list row style)
══════════════════════════════════════════════ */
function AppointmentCard({ apt, onManage }) {
  const donor    = apt.donor    || {};
  const campaign = apt.campaign || {};
  const apptDate = apt.appointmentDate ? new Date(apt.appointmentDate) : null;
  const canManage= apt.status !== "completed" && apt.status !== "cancelled";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Donor avatar + info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
              {(donor.name||"?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{donor.name||"Unknown donor"}</p>
              <p className="text-xs text-slate-400 truncate">{donor.email}</p>
            </div>
          </div>
          <Badge status={apt.status}/>
        </div>

        {/* Item + qty tags */}
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
            📦 {apt.itemName}
          </span>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
            ×{apt.quantity}
          </span>
          {apt.sourceType === "campaign" && (
            <span className="text-xs font-medium bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg truncate max-w-[160px]">
              🎯 {campaign.title||"Campaign"}
            </span>
          )}
          {apt.sourceType === "direct" && (
            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg capitalize">
              🏢 {apt.method||"Direct"}
            </span>
          )}
        </div>

        {/* Date row */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3">
          {apptDate ? (
            <span className="flex items-center gap-1.5 font-semibold text-blue-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {apptDate.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
              {apt.timeSlot && ` · ${apt.timeSlot}`}
            </span>
          ) : (
            <span className="text-slate-400 italic">Date pending…</span>
          )}
          <span className="text-slate-300">
            {new Date(apt.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}
          </span>
        </div>
      </div>

      {/* Moderator notes preview */}
      {apt.moderatorNotes && (
        <div className="px-5 pb-3">
          <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 line-clamp-1">💬 {apt.moderatorNotes}</p>
        </div>
      )}

      {/* Action button */}
      {canManage && (
        <div className="px-5 pb-4">
          <button onClick={() => onManage(apt)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Manage Appointment
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function AssociationAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");
  const [managing,     setManaging]     = useState(null);
  const [toast,        setToast]        = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.get("/donations/association/all-appointments")
      .then(({data}) => setAppointments(data.appointments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 3000); };

  const filterMap = { Pending:"requested", Confirmed:"confirmed", Completed:"completed", Cancelled:"cancelled" };

  const filtered = appointments
    .filter(a => filter === "All" || a.status === filterMap[filter])
    .filter(a => {
      const q = search.toLowerCase();
      return !q ||
        (a.donor?.name||"").toLowerCase().includes(q) ||
        (a.itemName||"").toLowerCase().includes(q) ||
        (a.campaign?.title||"").toLowerCase().includes(q);
    });

  const pending   = appointments.filter(a => a.status === "requested").length;
  const confirmed = appointments.filter(a => a.status === "confirmed").length;
  const completed = appointments.filter(a => a.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage incoming donation drop-offs and pickups</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {label:"Total",     value:appointments.length, bg:"bg-white",       text:"text-slate-700", icon:"📋"},
          {label:"Pending",   value:pending,             bg:"bg-amber-50",    text:"text-amber-600",  icon:"⏳"},
          {label:"Confirmed", value:confirmed,           bg:"bg-blue-50",     text:"text-blue-600",   icon:"✅"},
          {label:"Completed", value:completed,           bg:"bg-emerald-50",  text:"text-emerald-600",icon:"🎁"},
        ].map(s=>(
          <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search by donor, item, campaign…"
            value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
          {["All","Pending","Confirmed","Completed","Cancelled"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                filter===f ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i=>(
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-100"/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-base font-semibold text-slate-500">
            {search ? "No results found" : filter!=="All" ? `No ${filter.toLowerCase()} appointments` : "No appointments yet"}
          </p>
          <p className="text-sm mt-1">
            {filter==="All" && !search ? "Appointments appear once donors submit requests." : ""}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(apt=>(
            <AppointmentCard key={apt._id} apt={apt} onManage={a=>setManaging(a)}/>
          ))}
        </div>
      )}

      {/* Manage modal */}
      {managing && (
        <ManageModal
          apt={managing}
          onClose={()=>setManaging(null)}
          onUpdate={()=>{ load(); showToast("Appointment updated"); }}
        />
      )}
    </div>
  );
}
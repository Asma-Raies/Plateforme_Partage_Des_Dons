import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ── Avatar ── */
function Avatar({ name, avatar, size = "md" }) {
  const sizes = { sm: "w-9 h-9 text-xs", md: "w-12 h-12 text-sm", lg: "w-14 h-14 text-base" };
  const colors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500"];
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (avatar) return <img src={avatar} className={`${sizes[size]} rounded-full object-cover`} alt={name} />;
  return (
    <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

/* ── Donor Drawer ── */
function DonorDrawer({ donor, onClose, onMessage }) {
  const { donor: d, monetary, objects, totalMonetary, donationCount } = donor;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" 
         style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)" }}
         onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
           style={{ maxHeight: "90vh", overflowY: "auto" }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-6 pb-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">✕</button>
          <div className="flex items-center gap-4">
            <Avatar name={d.name} avatar={d.avatar} size="lg" />
            <div>
              <h2 className="text-white font-extrabold text-lg">{d.name}</h2>
              <p className="text-white/60 text-sm">{d.email}</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[{ label: "Donations", value: donationCount },
              { label: "Monetary", value: monetary.length ? `${totalMonetary.toFixed(0)} DZD` : "—" },
              { label: "Objects", value: objects.length }].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-extrabold text-base">{s.value}</p>
                <p className="text-white/50 text-[10px] font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Monetary Donations */}
          {monetary.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">💰 Monetary Donations</p>
              <div className="space-y-2">
                {monetary.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <span className="text-sm font-semibold text-amber-800">{m.amount} {m.currency || "DZD"}</span>
                    <span className="text-xs text-amber-500">
                      {new Date(m.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      {" • "} {m.campaign ? `Campaign: ${m.campaign}` : "Direct"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Object Donations */}
          {objects.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">📦 Object Donations</p>
              <div className="space-y-2">
                {objects.map((o, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{o.quantity}× {o.itemName}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        o.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                        o.status === "cancelled" ? "bg-slate-200 text-slate-500" :
                        "bg-amber-100 text-amber-700"
                      }`}>{o.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">📋 {o.campaign || "Direct Donation"}</p>
                    {o.appointmentDate && <p className="text-xs text-blue-500 mt-0.5">📅 {new Date(o.appointmentDate).toLocaleDateString("en-GB")}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => onMessage(d)}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2">
            Message {d.name?.split(" ")[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Donor Card ── */
function DonorCard({ donor, onClick, onMessage }) {
  const { donor: d, monetary, objects, totalMonetary, donationCount } = donor;
  const latestDate = Math.max(...[...monetary, ...objects].map(x => new Date(x.date).getTime()));
  const hasMonetary = monetary.length > 0;
  const hasObjects  = objects.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md p-5 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <Avatar name={d.name} avatar={d.avatar} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-800 text-sm truncate">{d.name}</p>
          <p className="text-xs text-slate-400 truncate">{d.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {hasMonetary && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">💰 Monetary</span>}
            {hasObjects  && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📦 Objects</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-base font-extrabold text-slate-700">{donationCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Total</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-2.5 text-center">
          <p className="text-base font-extrabold text-amber-600">{totalMonetary > 0 ? Math.round(totalMonetary) : "—"}</p>
          <p className="text-[10px] text-slate-400 font-medium">DZD</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
          <p className="text-base font-extrabold text-blue-600">{objects.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Objects</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        Last donation: {isFinite(latestDate) ? new Date(latestDate).toLocaleDateString("en-GB") : "—"}
      </p>

      <div className="flex gap-2">
        <button onClick={onClick} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-xs font-bold hover:border-slate-300 transition">View Details</button>
        <button onClick={e => { e.stopPropagation(); onMessage(d); }} 
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5">
          Message
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AssociationDonorsList() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [messaging, setMessaging] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/donations/association/donors")
      .then(({ data }) => setDonors(data.donors || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleMessage = async donor => {
    setMessaging(true);
    try {
      const { data } = await api.post("/messages/conversations/start", { donorId: donor._id });
      navigate("/association/messages", { state: { conversationId: data._id } });
    } catch (err) {
      showToast(err.response?.data?.message || "Could not open conversation.");
    } finally {
      setMessaging(false);
    }
  };

  const filtered = donors
    .filter(d => {
      if (filter === "Monetary") return d.monetary.length > 0;
      if (filter === "Objects") return d.objects.length > 0;
      if (filter === "Campaign") return d.monetary.some(m => m.campaign) || d.objects.some(o => o.campaign);
      if (filter === "Direct") return d.monetary.every(m => !m.campaign) && d.objects.every(o => !o.campaign);
      return true;
    })
    .filter(d => {
      const q = search.toLowerCase();
      return !q || (d.donor.name || "").toLowerCase().includes(q) || (d.donor.email || "").toLowerCase().includes(q);
    });

  const totalMonetary = donors.reduce((s, d) => s + (d.totalMonetary || 0), 0);
  const totalObjects  = donors.reduce((s, d) => s + d.objects.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <div className="fixed top-5 right-5 z-[100] bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg">{toast}</div>}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-extrabold text-slate-900">Our Donors</h1>
          <p className="text-sm text-slate-400 mt-0.5">People who have donated to your campaigns or directly to the association</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl">🤝</div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Donors</p>
                <p className="text-2xl font-extrabold text-slate-800">{donors.length}</p>
              </div>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl">💰</div>
              <div>
                <p className="text-xs text-amber-500 font-medium">Total Raised</p>
                <p className="text-2xl font-extrabold text-amber-700">{Math.round(totalMonetary).toLocaleString()} DZD</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📦</div>
              <div>
                <p className="text-xs text-blue-500 font-medium">Object Donations</p>
                <p className="text-2xl font-extrabold text-blue-700">{totalObjects}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <div className="flex gap-2">
            {["All", "Monetary", "Objects", "Campaign", "Direct"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === f ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Donor Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-slate-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl mb-5">🤝</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {search ? "No donors match your search" : "No donors yet"}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {search ? "Try a different name or email." : "Once donors contribute to your campaigns or directly, they'll appear here."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(donor => (
              <DonorCard key={donor.donor._id} donor={donor}
                         onClick={() => setSelected(donor)}
                         onMessage={handleMessage} />
            ))}
          </div>
        )}
      </div>

      {/* Messaging overlay */}
      {messaging && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl shadow-lg text-center text-slate-800 font-bold">
            Opening conversation…
          </div>
        </div>
      )}

      {/* Donor Drawer */}
      {selected && (
        <DonorDrawer donor={selected} onClose={() => setSelected(null)} onMessage={handleMessage} />
      )}
    </div>
  );
}
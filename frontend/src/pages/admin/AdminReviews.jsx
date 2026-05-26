// pages/admin/AdminReviews.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

function StarDisplay({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={value >= s ? "#f59e0b" : "#e2e8f0"}>
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </div>
  );
}

function Avatar({ user }) {
  const name = user?.organizationName || user?.name || "?";
  const colors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (user?.avatar) return <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover"/>;
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {name[0].toUpperCase()}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [filter,    setFilter]    = useState("all");   // all | public | pending
  const [roleFilter,setRoleFilter]= useState("all");
  const [search,    setSearch]    = useState("");
  const [searchQ,   setSearchQ]   = useState("");
  const [toast,     setToast]     = useState(null);
  const [toggling,  setToggling]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [noteModal, setNoteModal] = useState(null); // { review }
  const [note,      setNote]      = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchQ), 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "public")  params.isPublic = true;
      if (filter === "pending") params.isPublic = false;
      if (roleFilter !== "all") params.role = roleFilter;
      if (search) params.search = search;

      const { data } = await api.get("/reviews", { params });
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, [filter, roleFilter, search]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleToggle = async (review) => {
    if (review.isPublic) {
      // publishing → no note needed, just toggle
      setToggling(review._id);
      try {
        await api.patch(`/reviews/${review._id}/toggle`);
        setReviews(prev => prev.map(r => r._id === review._id ? { ...r, isPublic: false } : r));
        showToast("Review set to private.");
      } catch { showToast("Failed.", "error"); }
      finally { setToggling(null); }
    } else {
      // making public → optional note
      setNoteModal(review);
      setNote(review.adminNote || "");
    }
  };

  const handlePublish = async () => {
    if (!noteModal) return;
    setToggling(noteModal._id);
    try {
      await api.patch(`/reviews/${noteModal._id}/toggle`, { adminNote: note });
      setReviews(prev => prev.map(r => r._id === noteModal._id ? { ...r, isPublic: true, adminNote: note } : r));
      showToast("Review published publicly! ✓");
      setNoteModal(null);
    } catch { showToast("Failed.", "error"); }
    finally { setToggling(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review permanently?")) return;
    setDeleting(id);
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      showToast("Review deleted.");
    } catch { showToast("Failed.", "error"); }
    finally { setDeleting(null); }
  };

  // stats
  const publicCount  = reviews.filter(r => r.isPublic).length;
  const pendingCount = reviews.filter(r => !r.isPublic).length;
  const avgRating    = reviews.length ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="p-6 min-h-screen bg-slate-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
        }`}>
          {toast.type === "error"
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Note/Publish modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Publish Review?</h3>
            <p className="text-sm text-slate-500 mb-4">This review will be visible to all website visitors.</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar user={noteModal.author} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{noteModal.author?.organizationName || noteModal.author?.name}</p>
                  <StarDisplay value={noteModal.rating} />
                </div>
              </div>
              <p className="text-sm text-slate-600 italic">"{noteModal.content}"</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Note <span className="text-slate-400 font-normal">(optional, visible to user)</span></label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                placeholder="e.g. Thank you for your review!"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setNoteModal(null)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handlePublish} disabled={!!toggling}
                className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40">
                {toggling ? "Publishing…" : "✓ Publish Publicly"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reviews Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review and publish user testimonials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reviews", value: reviews.length, bg: "bg-blue-50",    text: "text-blue-600",    icon: "⭐" },
          { label: "Published",     value: publicCount,    bg: "bg-emerald-50", text: "text-emerald-600", icon: "🌐" },
          { label: "Pending",       value: pendingCount,   bg: "bg-amber-50",   text: "text-amber-600",   icon: "⏳" },
          { label: "Avg Rating",    value: avgRating,      bg: "bg-violet-50",  text: "text-violet-600",  icon: "📊" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search by name or content…" value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {[["all","All"],["public","Published"],["pending","Pending"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === k ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>{l}</button>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {[["all","All Roles"],["donor","Donors"],["association","Associations"]].map(([k,l]) => (
            <button key={k} onClick={() => setRoleFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                roleFilter === k ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <svg className="animate-spin w-5 h-5 mr-2 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {reviews.map(r => (
              <div key={r._id} className="p-5 hover:bg-slate-50/60 transition">
                <div className="flex items-start gap-4">
                  <Avatar user={r.author} />

                  <div className="flex-1 min-w-0">
                    {/* Author + meta */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-slate-800">
                        {r.author?.organizationName || r.author?.name || "Unknown"}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        r.authorRole === "donor" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      }`}>{r.authorRole}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.isPublic ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{r.isPublic ? "🌐 Public" : "⏳ Pending"}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <StarDisplay value={r.rating} />
                      <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p>
                    </div>

                    {r.title && <p className="text-sm font-semibold text-slate-700 mb-1">"{r.title}"</p>}
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{r.content}</p>

                    {r.adminNote && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-600"><span className="font-semibold">Admin note:</span> {r.adminNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(r)}
                      disabled={toggling === r._id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        r.isPublic
                          ? "border border-amber-200 text-amber-600 hover:bg-amber-50"
                          : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                      } disabled:opacity-40`}
                    >
                      {toggling === r._id
                        ? <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        : r.isPublic
                          ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>Hide</>
                          : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Publish</>
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      disabled={deleting === r._id}
                      className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
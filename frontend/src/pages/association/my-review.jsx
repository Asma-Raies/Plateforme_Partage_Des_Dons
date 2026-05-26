// pages/shared/MyReview.jsx
// Used by both: /donor/my-review  AND  /association/my-review
import { useState, useEffect } from "react";
import api from "../../api/axios";

/* ── Star picker ── */
function StarPicker({ value, onChange, size = "lg" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "lg" ? "w-9 h-9" : "w-5 h-5";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`${sz} transition-transform hover:scale-110`}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full" fill={(hover || value) >= s ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ── Display stars (read-only) ── */
export function StarDisplay({ value, size = "sm" }) {
  const sz = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} viewBox="0 0 24 24" className={sz} fill={value >= s ? "#f59e0b" : "#e2e8f0"}>
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </div>
  );
}

const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };

export default function AssociationMyReview() {
  const [review,   setReview]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [confirm,  setConfirm]  = useState(false);

  const [form, setForm] = useState({ rating: 5, title: "", content: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get("/reviews/mine")
      .then(r => {
        if (r.data.review) {
          setReview(r.data.review);
          setForm({
            rating:  r.data.review.rating,
            title:   r.data.review.title  || "",
            content: r.data.review.content || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.content.trim()) { showToast("Please write your review.", "error"); return; }
    setSaving(true);
    try {
      const r = await api.post("/reviews/mine", form);
      setReview(r.data.review);
      setEditing(false);
      showToast(r.data.updated ? "Review updated!" : "Review submitted! Pending admin approval.");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete("/reviews/mine");
      setReview(null);
      setForm({ rating: 5, title: "", content: "" });
      setConfirm(false);
      showToast("Review deleted.");
    } catch {
      showToast("Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = () => {
    if (review) setForm({ rating: review.rating, title: review.title || "", content: review.content });
    setEditing(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">

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

      {/* Delete confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Review?</h3>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone. Your review will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Review</h1>
          <p className="text-slate-400 text-sm mt-1">Share your experience with DonationConnect</p>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm text-blue-700">Your review will be reviewed by our team before being published on the public website. You can only submit one review.</p>
        </div>

        {/* ── No review yet / Create form ── */}
        {!review && !editing && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">No review yet</h2>
            <p className="text-slate-500 text-sm mb-6">Tell others about your experience on DonationConnect</p>
            <button onClick={() => setEditing(true)}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm">
              ✍️ Write a Review
            </button>
          </div>
        )}

        {/* ── Write / Edit form ── */}
        {(editing || (!review && editing)) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-5">{review ? "Edit Your Review" : "Write Your Review"}</h2>

            {/* Rating */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your Rating</label>
              <div className="flex items-center gap-3">
                <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                {form.rating > 0 && (
                  <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                    {RATING_LABELS[form.rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Title <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="Summarize your experience in a few words"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Review <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={5}
                maxLength={1000}
                placeholder="Share your experience — what worked well, what could be improved..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{form.content.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                {saving
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
                  : review ? "Update Review" : "Submit Review"}
              </button>
            </div>
          </div>
        )}

        {/* ── Existing review display ── */}
        {review && !editing && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            {/* Status badge */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">Your Review</h2>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                review.isPublic
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${review.isPublic ? "bg-emerald-500" : "bg-amber-500"}`}/>
                {review.isPublic ? "Published publicly" : "Pending approval"}
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-3">
              <StarDisplay value={review.rating} size="lg" />
              <span className="text-sm font-semibold text-amber-600">{RATING_LABELS[review.rating]}</span>
            </div>

            {/* Title */}
            {review.title && (
              <h3 className="text-base font-bold text-slate-800 mb-2">"{review.title}"</h3>
            )}

            {/* Content */}
            <p className="text-sm text-slate-600 leading-relaxed mb-5">{review.content}</p>

            {/* Meta */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400">
                Submitted {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <div className="flex gap-2">
                <button onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
                <button onClick={() => setConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Admin note */}
            {review.adminNote && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-600 mb-0.5">Note from Admin</p>
                <p className="text-xs text-blue-700">{review.adminNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
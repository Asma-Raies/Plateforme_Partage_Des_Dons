import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

/* ─── Constants ─── */
const CATEGORIES = [
  { value: 'Payment Issue',         icon: '💳' },
  { value: 'Campaign Fraud',        icon: '🚨' },
  { value: 'Technical Problem',     icon: '⚙️' },
  { value: 'Account Issue',         icon: '👤' },
  { value: 'Donation Not Received', icon: '📦' },
  { value: 'Association Behavior',  icon: '🏢' },
  { value: 'Other',                 icon: '💬' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    icon: '🟢', active: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'medium', label: 'Medium', icon: '🟡', active: 'border-amber-400 bg-amber-50 text-amber-700'       },
  { value: 'high',   label: 'High',   icon: '🔴', active: 'border-red-400 bg-red-50 text-red-700'             },
];

/* ─── Badges ─── */
function StatusBadge({ status }) {
  const map = {
    pending:     { cls: 'bg-yellow-100 text-yellow-700', label: 'Pending'     },
    in_progress: { cls: 'bg-blue-100 text-blue-700',     label: 'In Progress' },
    resolved:    { cls: 'bg-emerald-100 text-emerald-700',label: 'Resolved'   },
    rejected:    { cls: 'bg-red-100 text-red-600',       label: 'Rejected'    },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    high:   'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[priority] || map.low}`}>
      {priority}
    </span>
  );
}

/* ─── Status Icon ─── */
function StatusIcon({ status }) {
  if (status === 'resolved') return (
    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  );
  if (status === 'rejected') return (
    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
  );
  if (status === 'in_progress') return (
    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
    </div>
  );
  // pending
  return (
    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
  );
}

/* ─── New Claim Modal ─── */
function NewClaimModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    category: 'Payment Issue',
    subject: '',
    description: '',
    priority: 'medium',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.subject.trim())     e.subject     = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/claims', form);
      onSuccess();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Failed to submit claim.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">New Claim</h2>
            <p className="text-xs text-slate-400 mt-0.5">We'll respond within 48 hours</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Category grid */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition text-left ${
                    form.category === cat.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition ${
                    form.priority === p.value ? p.active : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Subject <span className="text-red-400">*</span>
            </label>
            <input type="text" name="subject" value={form.subject} onChange={handleChange}
              placeholder="Brief title of your issue"
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition placeholder-slate-400 ${
                errors.subject ? 'border-red-300 focus:ring-red-300' : 'border-slate-200 focus:ring-blue-400'
              }`}
            />
            {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={4} maxLength={1000}
              placeholder="Please explain the issue in detail..."
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition resize-none placeholder-slate-400 ${
                errors.description ? 'border-red-300 focus:ring-red-300' : 'border-slate-200 focus:ring-blue-400'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              <p className="text-xs text-slate-400 ml-auto">{form.description.length}/1000</p>
            </div>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
            >
              {loading
                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Submit Claim</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function MyClaims() {
  const navigate = useNavigate();
  const [claims,     setClaims]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [filter,     setFilter]     = useState('all');
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/claims/my');
      setClaims(data?.claims || data || []);
    } catch { setClaims([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleSuccess = () => {
    setShowModal(false);
    fetchClaims();
    showToast('Claim submitted! Our team will respond within 48 hours.');
  };

  const STATUS_FILTERS = [
    { key: 'all',         label: 'All'         },
    { key: 'pending',     label: 'Pending'     },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved',    label: 'Resolved'    },
    { key: 'rejected',    label: 'Rejected'    },
  ];

  const filtered = claims.filter(c => filter === 'all' || c.status === filter);

  const getCatIcon = (cat) => CATEGORIES.find(c => c.value === cat)?.icon || '💬';

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewClaimModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Claims</h1>
            <p className="text-slate-400 text-sm mt-0.5">Submit and track your support requests</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Claim
        </button>
      </div>

      {/* ── Filter tabs ── */}
      {!loading && claims.length > 0 && (
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 overflow-x-auto w-fit">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filter === f.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >{f.label}</button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <svg className="animate-spin w-7 h-7 mb-3 text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Loading your claims…</p>
        </div>

      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-base font-semibold text-slate-500">
            {filter !== 'all' ? `No ${filter.replace('_', ' ')} claims` : 'No claims yet'}
          </p>
          {filter === 'all' && (
            <button onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
              Submit your first claim →
            </button>
          )}
        </div>

      ) : (
        <div className="space-y-3">
          {filtered.map(claim => (
            <div key={claim._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">

              {/* Top row */}
              <div className="flex items-start gap-3 mb-3">
                <StatusIcon status={claim.status} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-800 leading-snug mb-1.5">{claim.subject}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={claim.status} />
                    <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                      {getCatIcon(claim.category)} {claim.category}
                    </span>
                    <PriorityBadge priority={claim.priority} />
                    <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                      Submitted: {new Date(claim.createdAt).toLocaleDateString('en-US', { month:'numeric', day:'numeric', year:'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Your message:</p>
                <p className="text-sm text-slate-700 leading-relaxed">{claim.description}</p>
              </div>

              {/* Admin response */}
              {claim.adminNotes && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-blue-600 mb-1">Admin response:</p>
                  <p className="text-sm text-blue-700 leading-relaxed">{claim.adminNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
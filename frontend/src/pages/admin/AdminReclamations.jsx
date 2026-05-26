import { useState, useEffect } from 'react';
import api from '../../api/axios';

/* ── Badges ── */
function PriorityBadge({ priority }) {
  const map = {
    high:   'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[priority] || map.low}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:     'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved:    'bg-emerald-100 text-emerald-700',
    rejected:    'bg-red-100 text-red-600',
  };
  const labels = {
    pending:     'Pending',
    in_progress: 'In Progress',
    resolved:    'Resolved',
    rejected:    'Rejected',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  );
}

/* ── Avatar initials ── */
function Avatar({ user }) {
  const name = user?.name || user?.organizationName || '?';
  const colors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500'];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {name[0].toUpperCase()}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function AdminReclamations() {
  const [claims,        setClaims]        = useState([]);
  const [filter,        setFilter]        = useState('all');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [actionId,      setActionId]      = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchClaims(); }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/claims/all');
      setClaims(data);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (id, newStatus) => {
    setActionId(id + newStatus);
    try {
      await api.put(`/claims/${id}`, {
        status: newStatus,
        adminNotes: adminResponse || undefined,
      });
      setClaims(prev => prev.map(c =>
        c._id === id ? { ...c, status: newStatus, adminNotes: adminResponse || c.adminNotes } : c
      ));
      setShowModal(false);
      setAdminResponse('');
      setSelectedClaim(null);
      showToast(newStatus === 'resolved' ? 'Claim marked as resolved.' : `Status updated to ${newStatus.replace('_', ' ')}.`);
    } catch {
      showToast('Failed to update claim.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const openResolveModal = (claim) => {
    setSelectedClaim(claim);
    setAdminResponse(claim.adminNotes || '');
    setShowModal(true);
  };

  /* Filter */
  const STATUS_FILTERS = [
    { key: 'all',         label: 'All'         },
    { key: 'pending',     label: 'Pending'     },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved',    label: 'Resolved'    },
    { key: 'rejected',    label: 'Rejected'    },
  ];

  const filtered = claims.filter(c =>
    filter === 'all' || c.status === filter
  );

  /* Stats */
  const totalPending    = claims.filter(c => c.status === 'pending').length;
  const totalInProgress = claims.filter(c => c.status === 'in_progress').length;
  const totalResolved   = claims.filter(c => c.status === 'resolved').length;
  const totalHighPrio   = claims.filter(c => c.priority === 'high').length;

  /* ── RENDER ── */
  return (
    <div className="p-6 min-h-screen bg-slate-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.type === 'error'
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Resolve Modal */}
      {showModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Resolve Claim</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">"{selectedClaim.subject}"</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Response to user <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                  placeholder="Explain the resolution or next steps..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition resize-none placeholder-slate-400"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  onClick={() => updateClaimStatus(selectedClaim._id, 'resolved')}
                  disabled={!!actionId}
                  className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {actionId
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
                    : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Mark as Resolved</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reclamations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review and manage user claims</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending',       value: totalPending,    bg: 'bg-yellow-50', text: 'text-yellow-600', icon: '⏳' },
          { label: 'In Progress',   value: totalInProgress, bg: 'bg-blue-50',   text: 'text-blue-600',   icon: '🔄' },
          { label: 'Resolved',      value: totalResolved,   bg: 'bg-emerald-50',text: 'text-emerald-600',icon: '✅' },
          { label: 'High Priority', value: totalHighPrio,   bg: 'bg-red-50',    text: 'text-red-600',    icon: '🔴' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3 border border-white shadow-sm`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f.key
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
              {f.key === 'pending' && totalPending > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  filter === 'pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                }`}>{totalPending}</span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 self-center">
            {filtered.length} claim{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Claims list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <svg className="animate-spin w-7 h-7 mb-3 text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Loading claims…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-sm font-semibold text-slate-500">No claims found</p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')}
              className="mt-3 text-xs text-blue-500 hover:underline">Clear filter</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map(claim => (
              <div key={claim._id} className="p-5 hover:bg-slate-50/60 transition">
                <div className="flex items-start gap-4">

                  {/* Avatar */}
                  <Avatar user={claim.user} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="text-sm font-bold text-slate-800">
                        {claim.user?.name || claim.user?.organizationName || 'Unknown'}
                      </p>
                      <span className="text-xs text-slate-400">·</span>
                      <p className="text-xs text-slate-400">{claim.user?.email}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <PriorityBadge priority={claim.priority} />
                      <StatusBadge  status={claim.status} />
                      <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                        {claim.category}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto">
                        {new Date(claim.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                    </div>

                    {/* Subject */}
                    <p className="text-sm font-semibold text-slate-800 mb-1">{claim.subject}</p>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{claim.description}</p>

                    {/* Admin response */}
                    {claim.adminNotes && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Admin Response</p>
                        <p className="text-sm text-blue-700">{claim.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {claim.status === 'pending' && (
                      <button
                        onClick={() => updateClaimStatus(claim._id, 'in_progress')}
                        disabled={actionId === claim._id + 'in_progress'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition disabled:opacity-40"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Start Review
                      </button>
                    )}

                    {(claim.status === 'pending' || claim.status === 'in_progress') && (
                      <button
                        onClick={() => openResolveModal(claim)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        Resolve
                      </button>
                    )}

                    {claim.status !== 'rejected' && claim.status !== 'resolved' && (
                      <button
                        onClick={() => updateClaimStatus(claim._id, 'rejected')}
                        disabled={actionId === claim._id + 'rejected'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-40"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
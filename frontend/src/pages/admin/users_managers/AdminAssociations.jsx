import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const token = () => localStorage.getItem('token');

function UserAvatar({ user }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500'];
  const c = colors[(user?.name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-10 h-10 ${c} rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function AdminAssociations() {
  const navigate = useNavigate();
  const [assocs, setAssocs]     = useState([]);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [searchInput, setInput] = useState('');
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason]     = useState('');
  const [toast, setToast]       = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAssocs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ role: 'association' });
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    fetch(`http://localhost:5000/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token()}` },
    }).then(r => r.json())
      .then(d => setAssocs(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => { fetchAssocs(); }, [fetchAssocs]);

  const approve = async (id) => {
    setActionId(id + '_approve');
    await fetch(`http://localhost:5000/api/auth/approve/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token()}` },
    });
    showToast('✅ Association approved — email sent');
    setActionId('');
    fetchAssocs();
  };

  const reject = async () => {
    setActionId(rejectId + '_reject');
    await fetch(`http://localhost:5000/api/auth/reject/${rejectId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    showToast('Association rejected — email sent');
    setActionId(''); setRejectId(null); setReason('');
    fetchAssocs();
  };

  const STATUS_TABS = [
     { key: 'all',      label: 'All',      color: 'slate'   },
    { key: 'pending',  label: 'Pending',  color: 'amber'   },
    { key: 'active',   label: 'Active',   color: 'emerald' },
    { key: 'rejected', label: 'Rejected', color: 'red'     },
   
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Associations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review, approve or reject association accounts</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search associations…" value={searchInput} onChange={e => setInput(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-56" />
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading…
        </div>
      ) : assocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <p className="text-sm">No associations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assocs.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start gap-3">
                <UserAvatar user={a} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{a.organizationName || a.name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.email}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Contact: {a.name}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  a.status === 'active'   ? 'bg-emerald-100 text-emerald-700' :
                  a.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600'
                }`}>{a.status}</span>
              </div>

              {/* Description */}
              {a.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl">
                  {a.description}
                </p>
              )}

              {/* Document */}
              {a.document && (
                <a href={`http://localhost:5000/${a.document}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-700 font-medium transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  View submitted document
                </a>
              )}

              {/* Registered date */}
              <p className="text-xs text-slate-400">
                Registered {new Date(a.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-50">
                <button onClick={() => navigate(`/admin/users/${a._id}`)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  View Details
                </button>
                {a.status !== 'active' && (
                  <button onClick={() => approve(a._id)} disabled={actionId === a._id + '_approve'}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60">
                    {actionId === a._id + '_approve' ? '…' : '✓ Approve'}
                  </button>
                )}
                {a.status !== 'rejected' && (
                  <button onClick={() => { setRejectId(a._id); setReason(''); }}
                    className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition">
                    ✕ Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Reject Association</h3>
            <p className="text-sm text-slate-500 mb-4">Optionally provide a reason. The association will be notified by email.</p>
            <textarea rows={4} placeholder="Reason for rejection (optional)…"
              value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={reject} disabled={actionId === rejectId + '_reject'}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {actionId === rejectId + '_reject' ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
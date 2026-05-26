import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const token = () => localStorage.getItem('token');

const STATUS_COLOR = {
  active:    'bg-emerald-100 text-emerald-700',
  draft:     'bg-slate-100 text-slate-600',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

const CATEGORY_EMOJI = {
  education: '📚', health: '🏥', food: '🍞', shelter: '🏠',
  clothes: '👕', children: '👶', elderly: '👴', disaster: '🆘',
  animals: '🐾', other: '💛',
};

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, color }) {
  const palette = {
    blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-500'    },
    green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-500' },
    amber:  { bg: 'bg-amber-50',   icon: 'bg-amber-500'   },
    violet: { bg: 'bg-violet-50',  icon: 'bg-violet-500'  },
    red:    { bg: 'bg-red-50',     icon: 'bg-red-500'     },
  };
  const c = palette[color] || palette.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm`}>
      <div className={`${c.icon} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-0.5">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ value }) {
  const w = Math.min(value || 0, 100);
  const color = w >= 100 ? 'bg-emerald-500' : w >= 50 ? 'bg-blue-500' : 'bg-amber-400';
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${w}%` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function AdminCampaigns() {
  const navigate = useNavigate();

  const [campaigns,    setCampaigns]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatus]       = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [deleteId,     setDeleteId]     = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [actionId,     setActionId]     = useState('');
  const [toast,        setToast]        = useState('');
  const limit = 10;

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Fetch campaigns ── */
  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (statusFilter) params.set('status', statusFilter);
    if (search)       params.set('search', search);
    fetch(`http://localhost:5000/api/campaigns/admin/all?${params}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  /* ── Fetch campaign stats ── */
  useEffect(() => {
    fetch('http://localhost:5000/api/campaigns/admin/all?limit=1000', {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => {
        const all = d.campaigns || [];
        setStats({
          total:       d.total || 0,
          active:      all.filter(c => c.status === 'active').length,
          draft:       all.filter(c => c.status === 'draft').length,
          completed:   all.filter(c => c.status === 'completed').length,
          totalRaised: all.reduce((s, c) => s + (c.moneyRaised || 0), 0),
        });
      })
      .catch(console.error);
  }, []);

  /* ── Change campaign status ── */
  const changeStatus = async (id, newStatus) => {
    setActionId(id + newStatus);
    try {
      await fetch(`http://localhost:5000/api/campaigns/admin/${id}/status`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      showToast(`Campaign set to ${newStatus}`);
      fetchCampaigns();
    } catch (e) { console.error(e); }
    finally { setActionId(''); }
  };

  /* ── Delete campaign ── */
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:5000/api/campaigns/admin/${deleteId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setDeleteId(null);
      showToast('Campaign deleted');
      fetchCampaigns();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const pages = Math.ceil(total / limit);

  const STATUS_TABS = [
    { key: '',          label: 'All'       },
    { key: 'active',    label: 'Active'    },
    { key: 'draft',     label: 'Draft'     },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage all platform campaigns</p>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
        <StatCard label="Total Campaigns" value={stats?.total} color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>}
        />
        <StatCard label="Active" value={stats?.active} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard label="Draft" value={stats?.draft} color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>}
        />
        <StatCard label="Completed" value={stats?.completed} color="violet"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
        />
        <StatCard label="Total Raised (TND)" value={stats?.totalRaised?.toLocaleString()} color="red"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search by title or association…"
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition" />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => { setStatus(tab.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Clear */}
          {(searchInput || statusFilter) && (
            <button onClick={() => { setSearchInput(''); setStatus(''); setPage(1); }}
              className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="text-4xl mb-2">📋</span>
            <p className="text-sm">No campaigns found</p>
            {(searchInput || statusFilter) && (
              <button onClick={() => { setSearchInput(''); setStatus(''); }}
                className="mt-2 text-xs text-blue-500 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-5 py-3 text-left">Association</th>
                  <th className="px-5 py-3 text-left">Progress</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Deadline</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map(c => {
                  const progress = c.moneyGoal
                    ? Math.min(Math.round((c.moneyRaised / c.moneyGoal) * 100), 100)
                    : null;
                  const daysLeft = c.deadline
                    ? Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000))
                    : null;
                  const expired = daysLeft === 0;

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">

                      {/* Campaign */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                            {c.coverImage
                              ? <img src={c.coverImage} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-lg">
                                  {CATEGORY_EMOJI[c.category] || '💛'}
                                </div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate max-w-[180px]">{c.title}</p>
                            <p className="text-xs text-slate-400 capitalize">{c.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Association */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700 font-medium truncate max-w-[140px]">
                          {c.association?.organizationName || c.association?.name || '—'}
                        </p>
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-4">
                        {c.moneyGoal > 0 ? (
                          <div className="min-w-[120px]">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="font-medium text-slate-700">{c.moneyRaised?.toLocaleString()} TND</span>
                              <span className="text-slate-400">{progress}%</span>
                            </div>
                            <ProgressBar value={progress} />
                            <p className="text-xs text-slate-400 mt-0.5">
                              goal: {c.moneyGoal?.toLocaleString()} TND
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No money goal</span>
                        )}
                        {c.needsObjects && (
                          <span className="text-xs text-violet-600 font-medium mt-1 block">
                            + {c.objectNeeds?.length} object types
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[c.status]}`}>
                          {c.status}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="px-5 py-4">
                        <p className={`text-xs font-medium ${expired ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-slate-500'}`}>
                          {c.deadline ? new Date(c.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                        {daysLeft !== null && (
                          <p className={`text-xs mt-0.5 ${expired ? 'text-red-400' : 'text-slate-400'}`}>
                            {expired ? 'Expired' : `${daysLeft}d left`}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">

                          {/* View */}
                          <button onClick={() =>navigate(`/admin/campaigns/${c._id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition" title="View public page">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>

                          {/* Activate */}
                          {c.status !== 'active' && (
                            <button
                              onClick={() => changeStatus(c._id, 'active')}
                              disabled={actionId === c._id + 'active'}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition disabled:opacity-40" title="Set active">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </button>
                          )}

                          {/* Pause → draft */}
                          {c.status === 'active' && (
                            <button
                              onClick={() => changeStatus(c._id, 'draft')}
                              disabled={actionId === c._id + 'draft'}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition disabled:opacity-40" title="Pause (set draft)">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </button>
                          )}

                          {/* Complete */}
                          {c.status === 'active' && (
                            <button
                              onClick={() => changeStatus(c._id, 'completed')}
                              disabled={actionId === c._id + 'completed'}
                              className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition disabled:opacity-40" title="Mark completed">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                              </svg>
                            </button>
                          )}

                          {/* Cancel */}
                          {c.status !== 'cancelled' && c.status !== 'completed' && (
                            <button
                              onClick={() => changeStatus(c._id, 'cancelled')}
                              disabled={actionId === c._id + 'cancelled'}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-40" title="Cancel campaign">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                              </svg>
                            </button>
                          )}

                          {/* Delete */}
                          <button onClick={() => setDeleteId(c._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Pagination ── */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    ← Prev
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), page + 2)
                    .map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          p === page ? 'bg-blue-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>
                        {p}
                      </button>
                    ))}
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete campaign?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will permanently delete the campaign and all associated donation records.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
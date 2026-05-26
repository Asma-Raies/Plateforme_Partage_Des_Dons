import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLOR = {
  active:    'bg-emerald-100 text-emerald-700',
  draft:     'bg-slate-100 text-slate-600',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AssociationCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [toast,     setToast]     = useState('');
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    api.get('/campaigns/my/list')
      .then(({ data }) => setCampaigns(data.campaigns || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/campaigns/${deleteId}`);
      setDeleteId(null);
      showToast('Campaign deleted');
      fetchCampaigns();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const toggleStatus = async c => {
    const newStatus = c.status === 'active' ? 'draft' : 'active';
    try {
      await api.put(`/campaigns/${c._id}`, { status: newStatus });
      showToast(`Campaign ${newStatus === 'active' ? 'published' : 'set to draft'}`);
      fetchCampaigns();
    } catch (e) { console.error(e); }
  };

  const visible = campaigns
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Campaigns</h1>
          <p className="text-slate-500 text-sm mt-0.5">{campaigns.length} total campaigns</p>
        </div>
        <button onClick={() => navigate('/association/campaigns/create')}
          className="flex items-center gap-2 bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-600 transition shadow-md shadow-blue-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search campaigns…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {['all', 'active', 'draft', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-3">📋</span>
            <p className="font-medium text-slate-500">No campaigns found</p>
            {!search && filter === 'all' && (
              <button onClick={() => navigate('/campaigns/create')}
                className="mt-4 bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition">
                Create first campaign
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {visible.map(c => {
              const progress = c.moneyGoal ? Math.min(Math.round((c.moneyRaised / c.moneyGoal) * 100), 100) : 0;
              const daysLeft = c.deadline ? Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000)) : null;
              return (
                <div key={c._id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                      {c.coverImage
                        ? <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">📋</div>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800">{c.title}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                          <span className="text-xs text-slate-400 capitalize">{c.category}</span>
                          {daysLeft !== null && (
                            <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-slate-400'}`}>
                              {daysLeft === 0 ? 'Ended' : `${daysLeft}d left`}
                            </span>
                          )}
                        </div>
                        {/* Action icons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => navigate(`/association/campaigns/${c._id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition" title="View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          </button>
                          <button onClick={() => navigate(`/association/edit/${c._id}`)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => toggleStatus(c)}
                            className={`p-1.5 rounded-lg transition ${c.status === 'active' ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            title={c.status === 'active' ? 'Pause' : 'Publish'}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.status === 'active' ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"}/></svg>
                          </button>
                          <button onClick={() => setDeleteId(c._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">{c.description}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {c.moneyGoal > 0 && (
                          <span className="font-medium text-slate-700">
                            {c.moneyRaised.toLocaleString()} / {c.moneyGoal.toLocaleString()} TND
                            <span className="text-slate-400 font-normal ml-1">({progress}%)</span>
                          </span>
                        )}
                        <span>{c.donorsCount} donors</span>
                        {c.needsObjects && <span>{c.objectNeeds?.length} item types</span>}
                      </div>

                      {c.moneyGoal > 0 && (
                        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Delete campaign?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
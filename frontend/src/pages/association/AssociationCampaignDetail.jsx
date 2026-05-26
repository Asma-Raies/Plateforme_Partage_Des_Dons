import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLOR = {
  active:    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  draft:     { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  completed: { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  cancelled: { bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-500' },
};

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-2xl border ${accent || 'border-slate-100'} p-5 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AssociationCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    api.get(`/campaigns/${id}`)
      .then(({ data }) => setCampaign(data.campaign))
      .catch(() => showToast('Failed to load campaign', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStatus = async () => {
    const newStatus = campaign.status === 'active' ? 'draft' : 'active';
    try {
      await api.put(`/campaigns/${id}`, { status: newStatus });
      setCampaign(prev => ({ ...prev, status: newStatus }));
      showToast(`Campaign ${newStatus === 'active' ? 'published' : 'set to draft'}`);
    } catch { showToast('Failed to update status', 'error'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading campaign…
    </div>
  );

  if (!campaign) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <span className="text-4xl mb-3">❌</span>
      <p>Campaign not found.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 text-sm underline">Go back</button>
    </div>
  );

  const progress = campaign.moneyGoal
    ? Math.min(Math.round((campaign.moneyRaised / campaign.moneyGoal) * 100), 100)
    : 0;

  const now = new Date();
  const deadline = campaign.deadline ? new Date(campaign.deadline) : null;
  const isExpired = deadline && deadline < now;
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((deadline - now) / 86400000))
    : null;

  const statusStyle = STATUS_COLOR[campaign.status] || STATUS_COLOR.draft;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
          {toast.msg}
        </div>
      )}

      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/association/campaigns')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to campaigns
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/association/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Edit
          </button>
          <button onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition ${
              campaign.status === 'active'
                ? 'text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100'
                : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
            }`}>
            {campaign.status === 'active' ? '⏸ Set Draft' : '▶ Publish'}
          </button>
        </div>
      </div>

      {/* Cover */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-100 mb-6 shadow-md">
        {campaign.coverImage
          ? <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-6xl">📋</div>
        }
        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg tracking-wide">
              🔒 CAMPAIGN EXPIRED — Donations Closed
            </span>
          </div>
        )}
      </div>

      {/* Title + Status */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800 mb-1">{campaign.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}/>
              {campaign.status}
            </span>
            {campaign.category && (
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-500 capitalize">{campaign.category}</span>
            )}
            {campaign.isUrgent && (
              <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold">🚨 Urgent</span>
            )}
            {isExpired ? (
              <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-500 font-semibold">Expired</span>
            ) : daysLeft !== null ? (
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${daysLeft <= 3 ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                {daysLeft === 0 ? 'Last day!' : `${daysLeft} days left`}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label="Raised" value={`${(campaign.moneyRaised || 0).toLocaleString()} TND`}
          sub={campaign.moneyGoal ? `of ${campaign.moneyGoal.toLocaleString()} TND goal` : 'No goal set'}
          accent={campaign.moneyGoal && progress >= 100 ? 'border-emerald-200' : 'border-slate-100'} />
        <StatCard icon="🎯" label="Progress" value={`${progress}%`}
          sub={campaign.moneyGoal ? 'of funding goal' : 'No goal'} />
        <StatCard icon="🤝" label="Donors" value={(campaign.donorsCount || 0).toLocaleString()}
          sub="total contributions" />
        <StatCard icon="📅" label="Deadline"
          value={deadline ? deadline.toLocaleDateString('en-GB') : '—'}
          sub={isExpired ? 'Expired' : daysLeft !== null ? `${daysLeft} days remaining` : 'No deadline'}
          accent={isExpired ? 'border-red-200' : 'border-slate-100'} />
      </div>

      {/* Progress bar */}
      {campaign.moneyGoal > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Fundraising Progress</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>{(campaign.moneyRaised || 0).toLocaleString()} TND raised</span>
            <span>{campaign.moneyGoal.toLocaleString()} TND goal</span>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Description</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
      </div>

      {/* Location */}
      {(campaign.location || campaign.wilaya) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">📍 Location</h2>
          <p className="text-slate-700">{[campaign.location, campaign.wilaya].filter(Boolean).join(' — ')}</p>
        </div>
      )}

      {/* Object needs */}
      {campaign.needsObjects && campaign.objectNeeds?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">📦 Item Needs</h2>
          <div className="flex flex-wrap gap-2">
            {campaign.objectNeeds.map((item, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl">
                {typeof item === 'object' ? `${item.name} (${item.quantity})` : item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expired donation block notice */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-700">Donations are closed</p>
            <p className="text-sm text-red-500 mt-0.5">This campaign has passed its deadline. Donors can no longer submit donations.</p>
          </div>
        </div>
      )}
    </div>
  );
}
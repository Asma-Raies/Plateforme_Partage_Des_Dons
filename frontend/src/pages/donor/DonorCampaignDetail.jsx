import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CATEGORY_EMOJI = {
  education: '📚', health: '🏥', food: '🍞', shelter: '🏠',
  clothes: '👕', children: '👶', elderly: '👴', disaster: '🆘',
  animals: '🐾', other: '💛',
};
const STATUS_COLOR = {
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft:     'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
};

function ProgressRing({ value, size = 80, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const color = value >= 100 ? '#10b981' : value >= 50 ? '#3b82f6' : '#f59e0b';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px`, fontSize:14, fontWeight:700, fill:color }}>
        {value}%
      </text>
    </svg>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, accent }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0 gap-4">
      <span className="text-xs text-slate-400 uppercase tracking-wide flex-shrink-0 w-36 mt-0.5">{label}</span>
      <span className={`text-sm font-medium text-right flex-1 ${accent || 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

/* ── Needs Picker: shown when multiple items unfilled ── */
function NeedsPickerModal({ campaign, onClose, onSelectNeed }) {
  const needs = campaign.objectNeeds || [];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">What would you like to donate?</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{campaign.title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg transition">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {needs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-sm">No object needs listed.</p>
            </div>
          )}
          {needs.map((need) => {
            const remaining = Math.max(0, (need.quantity || 0) - (need.received || 0));
            const done = remaining === 0;
            const pct = need.quantity > 0 ? Math.min(((need.received || 0) / need.quantity) * 100, 100) : 0;
            return (
              <button
                key={need._id || need.name}
                disabled={done}
                onClick={() => !done && onSelectNeed(need)}
                className={`w-full text-left rounded-2xl p-4 border-2 transition ${
                  done
                    ? 'border-slate-100 bg-slate-50 opacity-55 cursor-not-allowed'
                    : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="font-bold text-slate-800 text-sm">{need.name}</p>
                  {done
                    ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">✅ Fulfilled</span>
                    : <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse">{remaining} needed</span>
                  }
                </div>
                <p className="text-xs text-slate-400 mb-2">{need.received || 0} / {need.quantity} {need.unit || 'units'}</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                </div>
                {!done && <p className="text-xs text-emerald-600 font-semibold mt-2">Tap to donate this item →</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function DonorCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNeedsPicker, setShowNeedsPicker] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'association' && campaign?.association?._id === user?.id;

  useEffect(() => {
    api.get(`/campaigns/${id}`)
      .then(({ data }) => setCampaign(data.campaign))
      .catch(() => setError('Campaign not found or failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
      <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading campaign…
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
      <span className="text-5xl mb-4">😕</span>
      <p className="text-lg font-medium text-slate-600">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 text-sm hover:underline">← Go back</button>
    </div>
  );

  const c = campaign;
  const progress = c.moneyGoal > 0
    ? Math.min(Math.round((c.moneyRaised / c.moneyGoal) * 100), 100)
    : null;
  const daysLeft = c.deadline
    ? Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000))
    : null;
  const expired = daysLeft === 0;

  const totalObjectsNeeded   = c.objectNeeds?.reduce((s, n) => s + Number(n.quantity  || 0), 0) || 0;
  const totalObjectsReceived = c.objectNeeds?.reduce((s, n) => s + Number(n.received  || 0), 0) || 0;
  const unfilledNeeds        = (c.objectNeeds || []).filter(n => (n.received || 0) < (n.quantity || 1));

  const canDonate        = user?.role === 'donor' && c.status === 'active' && !expired;
  const canDonateObjects = canDonate && c.needsObjects && unfilledNeeds.length > 0;

  /* Navigate to the full 4-step CampaignItemDonate page */
  const handleDonateObjectItem = (need) => {
    navigate('/donor/donate-campaign-item', { state: { campaign: c, need } });
  };

  const handleOpenObjectDonate = () => {
    if (unfilledNeeds.length === 1) {
      handleDonateObjectItem(unfilledNeeds[0]);
    } else {
      setShowNeedsPicker(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {showNeedsPicker && (
        <NeedsPickerModal
          campaign={c}
          onClose={() => setShowNeedsPicker(false)}
          onSelectNeed={(need) => { setShowNeedsPicker(false); handleDonateObjectItem(need); }}
        />
      )}

      {/* Hero */}
      <div className="relative w-full h-72 md:h-96 bg-slate-200 overflow-hidden">
        {c.coverImage
          ? <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">{CATEGORY_EMOJI[c.category] || '💛'}</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <button onClick={() => navigate(-1)}
          className="absolute top-5 left-5 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-white transition shadow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        {(isAdmin || isOwner) && (
          <div className="absolute top-5 right-5 flex gap-2">
            {isOwner && (
              <button onClick={() => navigate(`/campaigns/edit/${c._id}`)}
                className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-white transition shadow">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit
              </button>
            )}
            {isAdmin && (
              <button onClick={() => navigate('/admin/campaigns')}
                className="flex items-center gap-1.5 bg-blue-500 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-blue-600 transition shadow">
                Admin Panel
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[c.status]}`}>{c.status}</span>
            <span className="text-xs font-medium bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm capitalize">
              {CATEGORY_EMOJI[c.category]} {c.category}
            </span>
            {expired && c.status === 'active' && (
              <span className="text-xs font-semibold bg-red-500 text-white px-3 py-1 rounded-full">Expired</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow">{c.title}</h1>
          <p className="text-white/80 text-sm mt-1">
            by <span className="font-semibold text-white">{c.association?.organizationName || c.association?.name}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            <Section title="About this campaign" icon="📝">
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{c.description}</p>
            </Section>

            {c.needsObjects && c.objectNeeds?.length > 0 && (
              <Section title="Material needs" icon="📦">
                <div className="space-y-3">
                  {c.objectNeeds.map((need, i) => {
                    const pct       = need.quantity > 0 ? Math.min(Math.round(((need.received || 0) / need.quantity) * 100), 100) : 0;
                    const remaining = Math.max(0, (need.quantity || 0) - (need.received || 0));
                    const done      = remaining === 0;
                    return (
                      <div key={i} className={`rounded-2xl p-4 border-2 transition ${done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm">{need.name}</p>
                            {need.description && <p className="text-xs text-slate-400 mt-0.5">{need.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-800">
                                {need.received || 0}
                                <span className="text-xs font-normal text-slate-400">/{need.quantity} {need.unit}</span>
                              </p>
                              <p className="text-[10px] text-slate-400">{pct}% fulfilled</p>
                            </div>
                            {canDonate && !done && (
                              <button
                                onClick={() => handleDonateObjectItem(need)}
                                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm active:scale-95"
                              >
                                Donate
                              </button>
                            )}
                            {done && <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold">✅ Done</span>}
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{remaining} still needed</p>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Total received</span>
                    <span className="text-sm font-bold text-slate-800">{totalObjectsReceived} / {totalObjectsNeeded} items</span>
                  </div>

                  {canDonateObjects && (
                    <button
                      onClick={handleOpenObjectDonate}
                      className="w-full mt-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      📦 Donate an Object
                      <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unfilledNeeds.length} item{unfilledNeeds.length > 1 ? 's' : ''} needed
                      </span>
                    </button>
                  )}
                </div>
              </Section>
            )}

            <Section title="Association" icon="🏛️">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold flex-shrink-0">
                  {c.association?.organizationName?.[0] || c.association?.name?.[0] || 'A'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{c.association?.organizationName || c.association?.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{c.association?.email}</p>
                  {c.association?.description && <p className="text-sm text-slate-400 mt-2 line-clamp-3">{c.association.description}</p>}
                  {isAdmin && (
                    <button onClick={() => navigate(`/admin/users/${c.association?._id}`)} className="mt-3 text-xs text-blue-500 hover:underline font-medium">
                      View in admin panel →
                    </button>
                  )}
                </div>
              </div>
            </Section>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-700">Support this Campaign</h3>

              {c.moneyGoal > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-black text-slate-800">
                        {c.moneyRaised?.toLocaleString()}
                        <span className="text-sm font-normal text-slate-400 ml-1">TND</span>
                      </p>
                      <p className="text-xs text-slate-400">of {c.moneyGoal?.toLocaleString()} TND goal</p>
                    </div>
                    <ProgressRing value={progress} size={60} stroke={5} />
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-50 text-center">
                    <div>
                      <p className="text-base font-black text-slate-800">{c.donorsCount || 0}</p>
                      <p className="text-xs text-slate-400">Donors</p>
                    </div>
                    <div>
                      <p className={`text-base font-black ${expired ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-slate-800'}`}>
                        {daysLeft === 0 ? 'Ended' : `${daysLeft}d`}
                      </p>
                      <p className="text-xs text-slate-400">{daysLeft === 0 ? '' : 'left'}</p>
                    </div>
                  </div>
                </div>
              )}

              {c.moneyGoal > 0 && canDonate && <div className="border-t border-slate-100" />}

              {canDonate && c.moneyGoal > 0 && (
                <button
                  onClick={() => navigate(`/donor/donate/${c._id}`)}
                  className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  💙 Donate Money
                </button>
              )}

              {canDonateObjects && (
                <button
                  onClick={handleOpenObjectDonate}
                  className="w-full py-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  📦 Donate Objects
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unfilledNeeds.length}</span>
                </button>
              )}

              {!canDonate && (
                <div className="text-center py-2 text-xs text-slate-400">
                  {expired ? '⏰ This campaign has expired.' : c.status !== 'active' ? `Campaign is ${c.status}.` : ''}
                </div>
              )}
            </div>

            {c.moneyGoal === 0 && c.needsObjects && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Object Donations</h3>
                <div className="text-center py-2 mb-4">
                  <p className="text-3xl font-black text-slate-800">{c.objectDonations || 0}</p>
                  <p className="text-xs text-slate-400 mt-0.5">donations received</p>
                </div>
                {canDonateObjects && (
                  <button onClick={handleOpenObjectDonate} className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition shadow-md shadow-emerald-200">
                    📦 Donate Objects
                  </button>
                )}
              </div>
            )}

            <Section title="Campaign details" icon="📋">
              <InfoRow label="Status"     value={c.status.charAt(0).toUpperCase() + c.status.slice(1)} />
              <InfoRow label="Category"   value={`${CATEGORY_EMOJI[c.category]} ${c.category}`} />
              <InfoRow label="Start date" value={new Date(c.startDate || c.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })} />
              <InfoRow label="Deadline"   value={c.deadline ? new Date(c.deadline).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) : '—'} accent={expired ? 'text-red-500' : ''} />
              <InfoRow label="Days left"  value={daysLeft === 0 ? 'Campaign ended' : `${daysLeft} days`} accent={expired ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : ''} />
              <InfoRow label="Location"   value={c.location || '—'} />
              <InfoRow label="Wilaya"     value={c.wilaya   || '—'} />
            </Section>

            {c.needsObjects && c.objectNeeds?.length > 0 && (
              <Section title="Needs summary" icon="📊">
                <InfoRow label="Item types"       value={`${c.objectNeeds.length} types`} />
                <InfoRow label="Total needed"     value={`${totalObjectsNeeded} items`} />
                <InfoRow label="Total received"   value={`${totalObjectsReceived} items`} />
                <InfoRow label="Object donations" value={c.objectDonations || 0} />
              </Section>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
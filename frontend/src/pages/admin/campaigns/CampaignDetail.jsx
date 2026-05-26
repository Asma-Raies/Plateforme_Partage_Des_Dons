import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios';

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

/* ── Progress ring ── */
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
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px`, fontSize: 14, fontWeight: 700, fill: color }}>
        {value}%
      </text>
    </svg>
  );
}

/* ── Section wrapper ── */
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

/* ── Info row ── */
function InfoRow({ label, value, accent }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0 gap-4">
      <span className="text-xs text-slate-400 uppercase tracking-wide flex-shrink-0 w-36 mt-0.5">{label}</span>
      <span className={`text-sm font-medium text-right flex-1 ${accent || 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

export default function CampaignDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

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
  const totalObjectsNeeded   = c.objectNeeds?.reduce((s, n) => s + Number(n.quantity), 0) || 0;
  const totalObjectsReceived = c.objectNeeds?.reduce((s, n) => s + Number(n.received || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero cover ── */}
      <div className="relative w-full h-72 md:h-96 bg-slate-200 overflow-hidden">
        {c.coverImage ? (
          <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">
            {CATEGORY_EMOJI[c.category] || '💛'}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-5 left-5 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-white transition shadow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        {/* Admin / owner actions */}
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
              <button onClick={() => navigate(`/admin/campaigns`)}
                className="flex items-center gap-1.5 bg-blue-500 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-blue-600 transition shadow">
                Admin Panel
              </button>
            )}
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[c.status]}`}>
              {c.status}
            </span>
            <span className="text-xs font-medium bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm capitalize">
              {CATEGORY_EMOJI[c.category]} {c.category}
            </span>
            {expired && c.status === 'active' && (
              <span className="text-xs font-semibold bg-red-500 text-white px-3 py-1 rounded-full">
                Expired
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow">
            {c.title}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            by <span className="font-semibold text-white">
              {c.association?.organizationName || c.association?.name}
            </span>
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            <Section title="About this campaign" icon="📝">
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{c.description}</p>
            </Section>

            {/* Object needs */}
            {c.needsObjects && c.objectNeeds?.length > 0 && (
              <Section title="Material needs" icon="📦">
                <div className="space-y-3">
                  {c.objectNeeds.map((need, i) => {
                    const pct = need.quantity > 0
                      ? Math.min(Math.round(((need.received || 0) / need.quantity) * 100), 100)
                      : 0;
                    return (
                      <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{need.name}</p>
                            {need.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{need.description}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <span className="text-sm font-bold text-slate-700">
                              {need.received || 0}
                            </span>
                            <span className="text-xs text-slate-400">
                              /{need.quantity} {need.unit}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{pct}% fulfilled</p>
                      </div>
                    );
                  })}

                  {/* Objects summary */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm">
                    <span className="text-slate-500">Total items received</span>
                    <span className="font-bold text-slate-800">
                      {totalObjectsReceived} / {totalObjectsNeeded}
                    </span>
                  </div>
                </div>
              </Section>
            )}

            {/* Association info */}
            <Section title="Association" icon="🏛️">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold flex-shrink-0">
                  {c.association?.organizationName?.[0] || c.association?.name?.[0] || 'A'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{c.association?.organizationName || c.association?.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{c.association?.email}</p>
                  {c.association?.description && (
                    <p className="text-sm text-slate-400 mt-2 line-clamp-3">{c.association.description}</p>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => navigate(`/admin/users/${c.association?._id}`)}
                      className="mt-3 text-xs text-blue-500 hover:underline font-medium">
                      View in admin panel →
                    </button>
                  )}
                </div>
              </div>
            </Section>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Money progress card */}
            {c.moneyGoal > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">Fundraising Progress</h3>
                  <ProgressRing value={progress} size={64} stroke={6} />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {c.moneyRaised?.toLocaleString()}
                  <span className="text-sm font-normal text-slate-400 ml-1">TND</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  raised of {c.moneyGoal?.toLocaleString()} TND goal
                </p>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{c.donorsCount || 0}</p>
                    <p className="text-xs text-slate-400">Donors</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${expired ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-slate-800'}`}>
                      {daysLeft === 0 ? 'Ended' : `${daysLeft}`}
                    </p>
                    <p className="text-xs text-slate-400">{daysLeft === 0 ? '' : 'days left'}</p>
                  </div>
                </div>

                {/* Donate button (for donors) */}
                {user?.role === 'donor' && c.status === 'active' && !expired && (
                  <button
                    onClick={() => navigate(`/donate/${c._id}`)}
                    className="w-full mt-4 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition shadow-md shadow-blue-200">
                    💙 Donate Money
                  </button>
                )}
                {user?.role === 'donor' && c.needsObjects && c.status === 'active' && (
                  <button
                    onClick={() => navigate(`/donate/object/${c._id}`)}
                    className="w-full mt-2 py-3 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition">
                    📦 Donate Objects
                  </button>
                )}
              </div>
            )}

            {/* No money goal — just object donations */}
            {c.moneyGoal === 0 && c.needsObjects && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Object Donations</h3>
                <div className="text-center py-2">
                  <p className="text-2xl font-bold text-slate-800">{c.objectDonations || 0}</p>
                  <p className="text-xs text-slate-400 mt-0.5">donations received</p>
                </div>
                {user?.role === 'donor' && c.status === 'active' && (
                  <button
                    onClick={() => navigate(`/donate/object/${c._id}`)}
                    className="w-full mt-4 py-3 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition">
                    📦 Donate Objects
                  </button>
                )}
              </div>
            )}

            {/* Campaign details */}
            <Section title="Campaign details" icon="📋">
              <InfoRow label="Status"    value={c.status.charAt(0).toUpperCase() + c.status.slice(1)} />
              <InfoRow label="Category"  value={`${CATEGORY_EMOJI[c.category]} ${c.category}`} />
              <InfoRow label="Start date" value={new Date(c.startDate || c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <InfoRow label="Deadline"  value={c.deadline ? new Date(c.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} accent={expired ? 'text-red-500' : ''} />
              <InfoRow label="Days left" value={daysLeft === 0 ? 'Campaign ended' : `${daysLeft} days`} accent={expired ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : ''} />
              <InfoRow label="Location"  value={c.location || '—'} />
              <InfoRow label="Wilaya"    value={c.wilaya || '—'} />
              <InfoRow label="Created"   value={new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <InfoRow label="Updated"   value={new Date(c.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
            </Section>

            {/* Object needs summary */}
            {c.needsObjects && c.objectNeeds?.length > 0 && (
              <Section title="Needs summary" icon="📊">
                <InfoRow label="Item types"      value={`${c.objectNeeds.length} types`} />
                <InfoRow label="Total needed"    value={`${totalObjectsNeeded} items`} />
                <InfoRow label="Total received"  value={`${totalObjectsReceived} items`} />
                <InfoRow label="Object donations" value={c.objectDonations || 0} />
              </Section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
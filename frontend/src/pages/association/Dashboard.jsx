import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

function StatCard({ label, value, icon, color }) {
  const palette = {
    blue:   'bg-blue-50 text-blue-500',
    green:  'bg-emerald-50 text-emerald-500',
    violet: 'bg-violet-50 text-violet-500',
    amber:  'bg-amber-50 text-amber-500',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${palette[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function AssociationDashboard() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const [campaigns,        setCampaigns]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [statsFilterType,  setStatsFilterType]  = useState('all');
  const [dateRangeStart,   setDateRangeStart]   = useState('');
  const [dateRangeEnd,     setDateRangeEnd]     = useState('');
  const [selectedCampaigns,setSelectedCampaigns]= useState([]);

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    api.get('/campaigns/my/list')
      .then(({ data }) => setCampaigns(data.campaigns || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  /* ── Filtered campaigns ── */
  const getFiltered = () => {
    let f = [...campaigns];
    if (statsFilterType === 'campaign' && selectedCampaigns.length > 0)
      f = f.filter(c => selectedCampaigns.includes(c._id));
    else if (statsFilterType === 'date' && dateRangeStart) {
      const s = new Date(dateRangeStart);
      const e = dateRangeEnd ? new Date(dateRangeEnd) : new Date();
      f = f.filter(c => new Date(c.createdAt) >= s && new Date(c.createdAt) <= e);
    }
    return f;
  };

  const filtered = getFiltered();
  const stats = {
    total:       filtered.length,
    active:      filtered.filter(c => c.status === 'active').length,
    totalRaised: filtered.reduce((s, c) => s + (c.moneyRaised || 0), 0),
    totalDonors: filtered.reduce((s, c) => s + (c.donorsCount || 0), 0),
  };

  /* ── Chart data ── */
  const barData = [
    { name: 'Raised', amount: stats.totalRaised, fill: '#10b981' },
    { name: 'Goal',   amount: filtered.reduce((s, c) => s + (c.moneyGoal || 0), 0), fill: '#cbd5e1' },
  ];

  const lineData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const cutoff = new Date(d); cutoff.setHours(23, 59, 59);
    return {
      date: label,
      campaigns: filtered.filter(c => new Date(c.createdAt) <= cutoff).length,
      raised:    filtered.filter(c => new Date(c.createdAt) <= cutoff).reduce((s, c) => s + (c.moneyRaised || 0), 0),
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back, <span className="font-medium text-slate-700">{user?.organizationName || user?.name}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Campaigns" value={stats.total} color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>}
        />
        <StatCard label="Active" value={stats.active} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard label="Total Raised (TND)" value={stats.totalRaised.toLocaleString()} color="violet"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard label="Total Donors" value={stats.totalDonors} color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { key: 'all',      label: 'All' },
              { key: 'date',     label: '📅 By date' },
              { key: 'campaign', label: '📂 By campaign' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => { setStatsFilterType(tab.key); setDateRangeStart(''); setDateRangeEnd(''); setSelectedCampaigns([]); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statsFilterType === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {statsFilterType === 'date' && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={dateRangeStart} onChange={e => setDateRangeStart(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <span className="text-slate-400 text-xs">→</span>
              <input type="date" value={dateRangeEnd} onChange={e => setDateRangeEnd(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          )}
        </div>

        {statsFilterType === 'campaign' && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Select campaigns:</p>
            <div className="flex flex-wrap gap-2">
              {campaigns.map(c => (
                <label key={c._id}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border cursor-pointer transition ${
                    selectedCampaigns.includes(c._id)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}>
                  <input type="checkbox" className="hidden"
                    checked={selectedCampaigns.includes(c._id)}
                    onChange={e => setSelectedCampaigns(prev =>
                      e.target.checked ? [...prev, c._id] : prev.filter(id => id !== c._id)
                    )} />
                  {c.title.slice(0, 20)}{c.title.length > 20 ? '…' : ''}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaigns progress overview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-700">Campaigns overview</h3>
          <button onClick={() => navigate('/association/campaigns')}
            className="text-xs text-blue-500 hover:underline font-medium">View all →</button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-slate-400">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No campaigns match the current filter</p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {filtered.slice(0, 8).map(c => {
              const pct = c.moneyGoal ? Math.min(Math.round((c.moneyRaised / c.moneyGoal) * 100), 100) : 0;
              return (
                <div key={c._id} className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => navigate(`/campaigns/${c._id}`)}>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                    {c.coverImage
                      ? <img src={c.coverImage} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm">📋</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate flex-1">{c.title}</span>
                      <span className="text-xs font-bold text-slate-500 ml-2">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)' }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(c.moneyRaised || 0).toLocaleString()} / {(c.moneyGoal || 0).toLocaleString()} TND
                    </p>
                  </div>
                </div>
              );
            })}
            {filtered.length > 8 && (
              <p className="text-xs text-slate-400 text-center pt-1">+{filtered.length - 8} more campaigns</p>
            )}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Goal vs Raised</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {barData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Quick statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Avg. rate',
                value: (() => {
                  const withGoal = filtered.filter(c => c.moneyGoal > 0);
                  return withGoal.length
                    ? Math.round(withGoal.reduce((s, c) => s + (c.moneyRaised / c.moneyGoal) * 100, 0) / withGoal.length) + '%'
                    : '—';
                })(),
                bg: 'bg-blue-50', text: 'text-blue-700',
              },
              {
                label: 'Items received',
                value: filtered.reduce((s, c) => s + (c.objectNeeds?.reduce((a, n) => a + (n.received || 0), 0) || 0), 0),
                bg: 'bg-emerald-50', text: 'text-emerald-700',
              },
              {
                label: 'Items needed',
                value: filtered.reduce((s, c) => s + (c.objectNeeds?.reduce((a, n) => a + (n.quantity || 0), 0) || 0), 0),
                bg: 'bg-violet-50', text: 'text-violet-700',
              },
              {
                label: 'Avg. days left',
                value: (() => {
                  const withDl = filtered.filter(c => c.deadline);
                  return withDl.length
                    ? Math.round(withDl.reduce((s, c) => s + Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000)), 0) / withDl.length) + 'd'
                    : '—';
                })(),
                bg: 'bg-amber-50', text: 'text-amber-700',
              },
            ].map(({ label, value, bg, text }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Line chart — full width */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Campaign evolution (last 7 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="campaigns" stroke="#3b82f6" name="Campaigns created"
                strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="raised" stroke="#10b981" name="Total raised (TND)"
                strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
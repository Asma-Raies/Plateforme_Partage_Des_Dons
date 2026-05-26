import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLOR = {
  succeeded: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
  requested: 'bg-amber-100 text-amber-700',
};

function StatCard({ label, value, sub, icon, color }) {
  const p = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   ring: 'bg-blue-100'   },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-500',ring: 'bg-emerald-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  ring: 'bg-amber-100'  },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-500', ring: 'bg-violet-100' },
  }[color] || { bg: 'bg-blue-50', icon: 'text-blue-500', ring: 'bg-blue-100' };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 ${p.ring} rounded-xl flex items-center justify-center ${p.icon} mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-0.5">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-emerald-500 font-medium mt-1">{sub}</p>}
    </div>
  );
}

export default function DonorDashboard() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [donations,    setDonations]    = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [campaigns,    setCampaigns]    = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/donations/history').catch(() => ({ data: [] })),
      api.get('/donations/object-appointments').catch(() => ({ data: [] })),
      api.get('/campaigns?limit=3&sort=-createdAt').catch(() => ({ data: { campaigns: [] } })),
    ]).then(([d, a, c]) => {
      setDonations(d.data || []);
      setAppointments(a.data || []);
      setCampaigns(c.data?.campaigns || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalDonated    = donations.filter(d => d.status === 'succeeded').reduce((s, d) => s + (d.amount || 0), 0);
  const campaignCount   = new Set(donations.map(d => d.campaign?._id).filter(Boolean)).size;
  const objectDonations = appointments.length;
  const recentDonations = donations.slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-400">
      <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading dashboard…
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your impact and manage your donations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Donated" value={`${totalDonated.toLocaleString()} TND`}
          sub="+12% from last month" color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard label="Campaigns Supported" value={campaignCount}
          sub="Across multiple causes" color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>}
        />
        <StatCard label="Total Donations" value={donations.length}
          sub="Money & objects combined" color="violet"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
        />
        <StatCard label="Object Donations" value={objectDonations}
          sub="Items donated" color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Recent donations table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Recent Donations</h2>
            <button onClick={() => navigate('/donor/history')} className="text-xs text-blue-500 hover:underline font-medium">View All</button>
          </div>
          {recentDonations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <span className="text-4xl mb-2">💝</span>
              <p className="text-sm">No donations yet</p>
              <button onClick={() => navigate('/donor/campaigns')} className="mt-3 text-xs text-blue-500 hover:underline">Browse campaigns →</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDonations.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/campaigns/${d.campaign?._id}`)}>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800 truncate max-w-[180px]">{d.campaign?.title || 'Campaign'}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-emerald-600">{d.amount} TND</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[d.status] || 'bg-slate-100 text-slate-600'}`}>
                        {d.status === 'succeeded' ? 'Completed' : d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Appointments sidebar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">My Appointments</h2>
            <button onClick={() => navigate('/donor/appointments')} className="text-xs text-blue-500 hover:underline font-medium">View All</button>
          </div>
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 px-4 text-center">
              <span className="text-3xl mb-2">📅</span>
              <p className="text-sm">No appointments yet</p>
              <button onClick={() => navigate('/donor/donate-objects')} className="mt-3 text-xs text-blue-500 hover:underline">Donate objects →</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {appointments.slice(0, 4).map(a => (
                <div key={a._id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.itemName || 'Object donation'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400">{a.campaign?.title?.slice(0,20) || 'Campaign'}…</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status]}`}>{a.status}</span>
                  </div>
                  {a.appointmentDate && (
                    <p className="text-xs text-blue-500 font-medium mt-1">
                      📅 {new Date(a.appointmentDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-blue-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <h3 className="text-lg font-bold mb-1.5">Make a New Donation</h3>
          <p className="text-blue-100 text-sm mb-5">Support a cause that matters to you today</p>
          <button onClick={() => navigate('/donor/campaigns')}
            className="bg-white text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow-md">
            Donate Now
          </button>
        </div>

        <div className="bg-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <h3 className="text-lg font-bold mb-1.5">Donate Objects</h3>
          <p className="text-emerald-100 text-sm mb-5">Give items like clothes, food, or furniture</p>
          <button onClick={() => navigate('/donor/donate-objects')}
            className="bg-white text-emerald-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition shadow-md">
            Donate Items
          </button>
        </div>
      </div>
    </div>
  );
}
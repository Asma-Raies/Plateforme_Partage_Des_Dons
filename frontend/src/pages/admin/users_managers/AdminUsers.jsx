import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ NO import from Dashboard — only this local function
const token = () => localStorage.getItem('token');

const ROLE_COLOR = {
  donor:       'bg-blue-100 text-blue-700',
  association: 'bg-violet-100 text-violet-700',
  admin:       'bg-slate-200 text-slate-600',
};
const STATUS_COLOR = {
  active:   'bg-emerald-100 text-emerald-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
};

// ✅ StatCard is OUTSIDE AdminUsers — top-level component
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

// ✅ UserAvatar is OUTSIDE AdminUsers — top-level component
function UserAvatar({ user }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const palette  = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
  const c        = palette[(user?.name?.charCodeAt(0) || 0) % palette.length];
  return (
    <div className={`w-9 h-9 ${c} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ✅ AdminUsers is the only export — clean, no nested function declarations
export default function AdminUsers() {
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [users,       setUsers]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [role,        setRole]        = useState('');
  const [status,      setStatus]      = useState('');
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page,        setPage]        = useState(1);
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const limit = 10;

  // ── Fetch stats ──
  useEffect(() => {
    fetch('http://localhost:5000/api/admin/stats', {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  // ── Fetch users ──
  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (role)   params.set('role',   role);
    if (status) params.set('status', status);
    fetch(`http://localhost:5000/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.count || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, role, status, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Debounce search input ──
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Delete user ──
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:5000/api/admin/users/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setDeleteId(null);
      fetchUsers();
      fetch('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token()}` },
      }).then(r => r.json()).then(setStats).catch(() => {});
    } catch (e) { console.error(e); }
    finally     { setDeleting(false); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage all platform users</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          label="Total Users" value={stats?.totalUsers} color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <StatCard
          label="Donors" value={stats?.totalDonors} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>}
        />
        <StatCard
          label="Associations" value={stats?.totalAssociations} color="violet"
          sub={`${stats?.activeAssociations ?? 0} active`}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
        />
        <StatCard
          label="Pending Review" value={stats?.pendingAssociations} color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
       
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search by name or email…"
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition" />
        </div>

        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition min-w-[130px]">
          <option value="">All roles</option>
          <option value="donor">Donor</option>
          <option value="association">Association</option>
          <option value="admin">Admin</option>
        </select>

        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition min-w-[130px]">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        {(searchInput || role || status) && (
          <button onClick={() => { setSearchInput(''); setRole(''); setStatus(''); setPage(1); }}
            className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p className="text-sm">No users found</p>
            {(searchInput || role || status) && (
              <button onClick={() => { setSearchInput(''); setRole(''); setStatus(''); }}
                className="mt-2 text-xs text-blue-500 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={u} />
                        <div>
                          <p className="font-medium text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                          {u.organizationName && <p className="text-xs text-violet-500 mt-0.5">{u.organizationName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLOR[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[u.status]}`}>{u.status}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/admin/users/${u._id}`)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition">
                          View
                        </button>
                        {u.role !== 'admin' && (
                          <button onClick={() => setDeleteId(u._id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${p === page ? 'bg-blue-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
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
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete user?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This action is permanent and cannot be undone.</p>
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
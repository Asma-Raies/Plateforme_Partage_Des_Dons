import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const token = () => localStorage.getItem('token');
const BASE   = 'http://localhost:5000';

/* ── Helpers ── */
function Badge({ label, color }) {
  const map = {
    blue:   'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    green:  'bg-emerald-100 text-emerald-700',
    amber:  'bg-amber-100 text-amber-700',
    red:    'bg-red-100 text-red-600',
    slate:  'bg-slate-200 text-slate-600',
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${map[color] ?? map.slate}`}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 uppercase tracking-wide w-36 flex-shrink-0 mt-0.5">
        {label}
      </span>
      <span className="text-sm text-slate-700 font-medium flex-1 break-words">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Document download row ── */
function DocRow({ path, index }) {
  const fileName = path.split(/[\\/]/).pop() || `document-${index + 1}`;
  const ext      = fileName.split('.').pop()?.toLowerCase();
  const isPdf    = ext === 'pdf';
  const isImg    = ['jpg','jpeg','png','webp','gif'].includes(ext);

  const handleDownload = async () => {
    try {
      const res = await fetch(
        `${BASE}/api/admin/download?path=${encodeURIComponent(path)}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPdf ? 'bg-red-50' : isImg ? 'bg-blue-50' : 'bg-slate-100'}`}>
          {isPdf ? (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          ) : isImg ? (
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
          <p className="text-xs text-slate-400 uppercase">{ext} file</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {/* Preview */}
        <a
       href={`${BASE}/${path}`}
       
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-700"
          title="Preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </a>
        {/* Download */}
        <a
 onClick={handleDownload}
          className="p-2 rounded-lg hover:bg-blue-50 transition text-slate-500 hover:text-blue-600"
          title="Download"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ── Address card ── */
function AddressCard({ addr, index }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:border-slate-200 hover:shadow-sm transition">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-sm bg-blue-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-700">
          {addr.label || `Location ${index + 1}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {[
          ['Street',      addr.street],
          ['City',        addr.city],
          ['Country',     addr.country],
          ['Postal Code', addr.postalCode],
        ].map(([lbl, val]) =>
          val ? (
            <div key={lbl}>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{lbl}</p>
              <p className="text-sm text-slate-700 font-medium">{val}</p>
            </div>
          ) : null
        )}
      </div>
      {addr.location?.coordinates?.length === 2 && (
        <p className="text-xs text-slate-400 mt-3 font-mono">
          📍 {addr.location.coordinates[1].toFixed(5)}, {addr.location.coordinates[0].toFixed(5)}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
export default function AdminUserDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason]   = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [toast, setToast]             = useState({ msg: '', type: 'success' });

  const fetchUser = () => {
    setLoading(true);
    fetch(`${BASE}/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUser(); }, [id]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const approve = async () => {
    setActionLoading('approve');
    try {
      const r = await fetch(`${BASE}/api/auth/approve/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) throw new Error();
      showToast('✅ Association approved and notified by email');
      fetchUser();
    } catch {
      showToast('Failed to approve association', 'error');
    } finally { setActionLoading(''); }
  };

  const reject = async () => {
    setActionLoading('reject');
    try {
      const r = await fetch(`${BASE}/api/auth/reject/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!r.ok) throw new Error();
      showToast('Association rejected and notified by email');
      setShowRejectBox(false);
      fetchUser();
    } catch {
      showToast('Failed to reject association', 'error');
    } finally { setActionLoading(''); }
  };

  /* ── Derived ── */
  const roleColor   = { donor: 'blue', association: 'violet', admin: 'slate' };
  const statusColor = { active: 'green', pending: 'amber', rejected: 'red' };

  /* ── Loading / not found ── */
  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-400 py-24">
      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading user…
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-24">
      <p>User not found.</p>
      <button onClick={() => navigate(-1)} className="mt-3 text-blue-500 text-sm hover:underline">← Go back</button>
    </div>
  );

  const initials    = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const avatarColors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500'];
  const avatarColor  = avatarColors[(user.name?.charCodeAt(0) || 0) % avatarColors.length];

  /* Normalise documents — support both `document` (string) and `documents` (array) */
  const documents = Array.isArray(user.documents)
    ? user.documents
    : user.document
      ? [user.document]
      : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Back ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ══ LEFT COLUMN ══ */}
        <div className="lg:col-span-1 space-y-4">

          {/* Profile avatar card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            <div className={`w-20 h-20 ${avatarColor} rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg`}>
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full rounded-2xl object-cover" alt={user.name} />
                : initials}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
            {user.organizationName && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">{user.organizationName}</p>
            )}
            <p className="text-sm text-slate-400 mt-1 mb-3">{user.email}</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge label={user.role}   color={roleColor[user.role]}   />
              <Badge label={user.status} color={statusColor[user.status]} />
              {user.isApproved && (
                <Badge label="Approved" color="green" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              Member since{' '}
              {new Date(user.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Stats</p>
            {[
              { label: 'Addresses',  value: user.addresses?.length ?? 0 },
              { label: 'Documents',  value: documents.length },
              { label: 'Phone',      value: user.phone || '—' },
              { label: 'Approved',   value: user.isApproved ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-sm font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>

          {/* Association action buttons */}
          {user.role === 'association' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions</p>

              {user.status !== 'active' && (
                <button
                  onClick={approve}
                  disabled={actionLoading === 'approve'}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approve' ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : '✓'} Approve Association
                </button>
              )}

              {user.status !== 'rejected' && (
                <button
                  onClick={() => setShowRejectBox(!showRejectBox)}
                  className="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition"
                >
                  ✕ Reject Association
                </button>
              )}

              {showRejectBox && (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Reason for rejection (optional)…"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    onClick={reject}
                    disabled={actionLoading === 'reject'}
                    className="w-full py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
                  >
                    {actionLoading === 'reject' ? 'Rejecting…' : 'Confirm Rejection'}
                  </button>
                </div>
              )}

              {user.status === 'active' && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-xs text-emerald-700 font-medium">Account is active</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Account information */}
          <SectionCard title="Account Information">
            <InfoRow label="Full Name"  value={user.name} />
            <InfoRow label="Email"      value={user.email} />
            <InfoRow label="Phone"      value={user.phone} />
            <InfoRow label="Role"       value={user.role} />
            <InfoRow label="Status"     value={user.status} />
            <InfoRow label="Approved"   value={user.isApproved ? 'Yes' : 'No'} />
            <InfoRow label="Registered" value={new Date(user.createdAt).toLocaleString()} />
            <InfoRow label="Updated"    value={new Date(user.updatedAt).toLocaleString()} />
          </SectionCard>

          {/* Association-specific details */}
          {user.role === 'association' && (
            <SectionCard title="Association Details">
              <InfoRow label="Org. Name"   value={user.organizationName} />
              <InfoRow label="Description" value={user.description} />
            </SectionCard>
          )}

          {/* Addresses */}
          {user.addresses?.length > 0 && (
            <SectionCard title={`Locations · ${user.addresses.length}`}>
              <div className="space-y-3 mt-1">
                {user.addresses.map((addr, i) => (
                  <AddressCard key={addr._id ?? i} addr={addr} index={i} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <SectionCard title={`Submitted Documents · ${documents.length}`}>
              <div className="mt-1">
                {documents.map((path, i) => (
                  <DocRow key={i} path={path} index={i} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* No documents placeholder for associations */}
          {user.role === 'association' && documents.length === 0 && (
            <SectionCard title="Submitted Documents">
              <div className="py-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                No documents submitted yet.
              </div>
            </SectionCard>
          )}

          {/* Status timeline */}
          <SectionCard title="Status Timeline">
            <div className="space-y-3 mt-1">
              {[
                { label: 'Registered',   date: user.createdAt,  done: true,                      color: 'bg-blue-500' },
                { label: 'Email sent',   date: user.createdAt,  done: true,                      color: 'bg-blue-500' },
                { label: 'Under review', date: null,            done: user.role === 'association', color: 'bg-amber-500' },
                { label: 'Approved',     date: user.updatedAt,  done: user.isApproved,            color: 'bg-emerald-500' },
                { label: 'Active',       date: user.updatedAt,  done: user.status === 'active',   color: 'bg-emerald-600' },
              ].map(({ label, date, done, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${done ? color : 'bg-slate-200'}`} />
                  <span className={`text-sm flex-1 ${done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  {date && done && (
                    <span className="text-xs text-slate-400">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
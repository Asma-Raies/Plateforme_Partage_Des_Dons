import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const TYPE_ICONS = {
  new_user_registered:      '👤',
  association_approved:     '✅',
  association_rejected:     '❌',
  money_donation_received:  '💰',
  money_donation_confirmed: '💳',
  object_donation_received: '📦',
  object_donation_confirmed:'✅',
  object_donation_declined: '❌',
  object_donation_completed:'🎁',
  appointment_rescheduled:  '📅',
  new_message:              '💬',
  claim_submitted:          '📋',
  review_submitted:         '⭐',
  default:                  '🔔',
};

const TYPE_COLORS = {
  new_user_registered:      'bg-blue-50',
  association_approved:     'bg-emerald-50',
  association_rejected:     'bg-red-50',
  money_donation_received:  'bg-emerald-50',
  money_donation_confirmed: 'bg-blue-50',
  object_donation_received: 'bg-violet-50',
  object_donation_confirmed:'bg-emerald-50',
  object_donation_declined: 'bg-red-50',
  object_donation_completed:'bg-emerald-50',
  appointment_rescheduled:  'bg-amber-50',
  new_message:              'bg-blue-50',
  claim_submitted:          'bg-amber-50',
  review_submitted:         'bg-amber-50',
  default:                  'bg-slate-100',
};

function timeAgo(date) {
  const now  = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markOneRead,
    markAllRead,
    deleteOne,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter(n =>
    filter === 'all' || (filter === 'unread' && !n.isRead)
  );

  const handleClick = (notif) => {
    if (!notif.isRead) markOneRead(notif._id);
    if (notif.link)   navigate(notif.link);
  };

  /* ── stat counts ── */
  const totalCount  = notifications.length;
  const readCount   = notifications.filter(n => n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">Stay updated with your activity</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              Mark all read
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear all
            </button>
          )}
        </div>
      </div>

      

      {/* ── Filter tabs ── */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
        {[
          { key: 'all',    label: 'All' },
          { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === f.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <svg className="animate-spin w-7 h-7 mb-3 text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Loading notifications…</p>
        </div>

      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="text-5xl mb-4">🔔</span>
          <p className="text-base font-semibold text-slate-500">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm mt-1">We'll notify you when something important happens.</p>
        </div>

      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleClick(notif)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition group ${
                  !notif.isRead ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${TYPE_COLORS[notif.type] || TYPE_COLORS.default} flex items-center justify-center text-lg flex-shrink-0 mt-0.5`}>
                  {TYPE_ICONS[notif.type] || TYPE_ICONS.default}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-0.5">
                    <p className={`text-sm font-semibold leading-snug ${!notif.isRead ? 'text-slate-800' : 'text-slate-700'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>
                  
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"/>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); deleteOne(notif._id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition p-1 rounded-lg hover:bg-red-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
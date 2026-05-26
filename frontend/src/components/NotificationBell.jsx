import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
 
const TYPE_ICONS = {
  new_user_registered:      "👤",
  association_approved:     "✅",
  association_rejected:     "❌",
  money_donation_received:  "💰",
  money_donation_confirmed: "💳",
  object_donation_received: "📦",
  object_donation_confirmed:"✅",
  object_donation_declined: "❌",
  object_donation_completed:"🎁",
  appointment_rescheduled:  "📅",
  new_message:              "💬",
  claim_submitted:          "📋",
  review_submitted:         "⭐",
};
 
export function NotificationBell() {
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef   = useRef(null);
  const { notifications, unreadCount, loading, markOneRead, markAllRead, deleteOne, clearAll } = useNotifications();
 
  /* close on outside click */
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const handleClick = (notif) => {
    if (!notif.isRead) markOneRead(notif._id);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };
 
  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
 
      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold transition">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[11px] text-slate-400 hover:text-red-500 font-semibold transition">
                  Clear
                </button>
              )}
            </div>
          </div>
 
          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="text-4xl mb-2">🔔</span>
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition cursor-pointer group ${!n.isRead ? "bg-blue-50/40" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5 ${!n.isRead ? "bg-blue-100" : "bg-slate-100"}`}>
                    {TYPE_ICONS[n.type] || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${!n.isRead ? "text-slate-800" : "text-slate-600"}`}>{n.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("en-GB",{ day:"2-digit",month:"short" })} · {new Date(n.createdAt).toLocaleTimeString("en-GB",{ hour:"2-digit",minute:"2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"/>}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOne(n._id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition text-xs"
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
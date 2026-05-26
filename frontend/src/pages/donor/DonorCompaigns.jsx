import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const token = () => localStorage.getItem("token");

const CATEGORY_META = {
  education: { emoji: "📚", color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"     },
  health:    { emoji: "🏥", color: "bg-rose-100 text-rose-700",      dot: "bg-rose-500"     },
  food:      { emoji: "🍽️", color: "bg-orange-100 text-orange-700",  dot: "bg-orange-500"   },
  shelter:   { emoji: "🏠", color: "bg-amber-100 text-amber-700",    dot: "bg-amber-500"    },
  clothes:   { emoji: "👕", color: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500"  },
  children:  { emoji: "👶", color: "bg-pink-100 text-pink-700",      dot: "bg-pink-500"     },
  elderly:   { emoji: "👴", color: "bg-purple-100 text-purple-700",  dot: "bg-purple-500"   },
  disaster:  { emoji: "🆘", color: "bg-red-100 text-red-700",        dot: "bg-red-500"      },
  animals:   { emoji: "🐾", color: "bg-teal-100 text-teal-700",      dot: "bg-teal-500"     },
  other:     { emoji: "💛", color: "bg-slate-100 text-slate-600",    dot: "bg-slate-400"    },
};
const getCat = (c) => CATEGORY_META[c?.toLowerCase()] || CATEGORY_META.other;

const CATS = [
  { id: "all",       label: "All",       emoji: "✨" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "health",    label: "Health",    emoji: "🏥" },
  { id: "food",      label: "Food",      emoji: "🍽️" },
  { id: "shelter",   label: "Shelter",   emoji: "🏠" },
  { id: "clothes",   label: "Clothes",   emoji: "👕" },
  { id: "other",     label: "Other",     emoji: "💛" },
];

function ProgressBar({ value }) {
  const w = Math.min(value || 0, 100);
  const col = w >= 100 ? "bg-emerald-500" : w >= 60 ? "bg-blue-500" : w >= 30 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`${col} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   OBJECT NEEDS MODAL
   Shows all objectNeeds of a campaign and lets
   the donor start a DonateObjects flow pre-filled
───────────────────────────────────────────── */
function ObjectNeedsModal({ campaign, onClose, onDonate }) {
  const needs = campaign.objectNeeds || [];

  const getEmoji = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("food") || n.includes("meal"))   return "🍱";
    if (n.includes("cloth") || n.includes("shirt")) return "👕";
    if (n.includes("book") || n.includes("school")) return "📚";
    if (n.includes("medicine") || n.includes("med"))return "💊";
    if (n.includes("blanket") || n.includes("bed")) return "🛏️";
    if (n.includes("toy"))                          return "🧸";
    return "📦";
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Object Needs</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{campaign.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition ml-3 flex-shrink-0">✕</button>
        </div>

        {needs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm">No object needs listed for this campaign.</p>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {needs.map((need) => {
              const received = need.received || 0;
              const total    = need.quantity  || 1;
              const progress = Math.min((received / total) * 100, 100);
              const remaining = Math.max(0, total - received);
              const done = remaining === 0;

              return (
                <div key={need._id || need.name}
                  className={`border-2 rounded-2xl p-4 transition ${done ? "border-slate-100 bg-slate-50" : "border-slate-200 hover:border-emerald-300 bg-white"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl mt-0.5 flex-shrink-0">{getEmoji(need.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-slate-800 text-sm truncate">{need.name}</p>
                        {done
                          ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">✅ Fulfilled</span>
                          : remaining > 5
                            ? <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse">🔴 Urgent</span>
                            : null
                        }
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {received} / {total} {need.unit || "unit(s)"} received · <span className="font-semibold text-slate-600">{remaining} still needed</span>
                      </p>
                      <ProgressBar value={progress} />
                    </div>
                  </div>

                  {!done && (
                    <button
                      onClick={() => onDonate(campaign, need)}
                      className="mt-3 w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm shadow-emerald-200"
                    >
                      📦 Donate this item
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CAMPAIGN CARD
───────────────────────────────────────────── */
function CampaignCard({ campaign, onMoneyDonate, onObjectDonate }) {
  const [showNeeds, setShowNeeds] = useState(false);
  const cat      = getCat(campaign.category);
  const raised   = campaign.moneyRaised || 0;
  const goal     = campaign.moneyGoal   || 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  const daysLeft = campaign.deadline
    ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000))
    : null;
  const hasObjects = campaign.needsObjects && (campaign.objectNeeds || []).length > 0;
  const objectCount = (campaign.objectNeeds || []).length;
  const unfilledNeeds = (campaign.objectNeeds || []).filter(n => (n.received || 0) < (n.quantity || 1)).length;
const isExpired = daysLeft === 0;
  return (
    <>
      {showNeeds && (
        <ObjectNeedsModal
          campaign={campaign}
          onClose={() => setShowNeeds(false)}
          onDonate={(camp, need) => { setShowNeeds(false); onObjectDonate(camp, need); }}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
        {/* Cover */}
        <div className="relative h-44 bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
          {campaign.coverImage
            ? <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-30">{cat.emoji}</span>
              </div>
          }
          {/* Category pill */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cat.color} backdrop-blur-sm`}>
            <span>{cat.emoji}</span>
            <span className="capitalize">{campaign.category || "General"}</span>
          </div>
          {/* Days left */}
          {daysLeft !== null && (
            <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow ${
              daysLeft === 0 ? "bg-red-500 text-white" : daysLeft <= 7 ? "bg-amber-400 text-white" : "bg-white/90 text-slate-700"
            }`}>
              {daysLeft === 0 ? "Expired" : `${daysLeft}d left`}
            </div>
          )}
          {/* Object needs badge */}
          {hasObjects && unfilledNeeds > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded-full shadow">
              📦 {unfilledNeeds} item{unfilledNeeds > 1 ? "s" : ""} needed
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <p className="text-xs text-slate-400 font-medium mb-1 truncate">
            🏢 {campaign.association?.organizationName || campaign.association?.name || "Association"}
          </p>
          <h3 className="text-base font-bold text-slate-800 mb-1.5 line-clamp-2 leading-snug">{campaign.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{campaign.description}</p>

          {/* Progress */}
          {goal > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{raised.toLocaleString()} TND</span>
                <span>{Math.round(progress)}% of {goal.toLocaleString()} TND</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          {/* Action buttons */}
<div className={`grid gap-2 ${hasObjects ? "grid-cols-2" : "grid-cols-1"}`}>
  {/* Money donate */}
  <button
    onClick={() => !isExpired && onMoneyDonate(campaign._id)}
    disabled={isExpired}
    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shadow-blue-200
      ${isExpired
        ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
        : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}
  >
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    {isExpired ? "Expired" : "Donate Money"}
  </button>

  {/* Object donate */}
  {hasObjects && (
    <button
      onClick={() => !isExpired && setShowNeeds(true)}
      disabled={isExpired}
      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm relative
        ${isExpired
          ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
        }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
      {isExpired ? "Expired" : "Donate Objects"}
      {!isExpired && unfilledNeeds > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
          {unfilledNeeds}
        </span>
      )}
    </button>
  )}
</div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function DonorCampaigns() {
  const navigate = useNavigate();

  const [campaigns,  setCampaigns]  = useState([]);
  const [stats,      setStats]      = useState({ total: 0, active: 0, totalRaised: 0, withObjects: 0 });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [searchQ,    setSearchQ]    = useState("");
  const [cat,        setCat]        = useState("all");
  const [sort,       setSort]       = useState("newest");
  const [view,       setView]       = useState("grid"); // grid | list

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchQ), 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/campaigns?status=active&limit=200", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      const all  = data.campaigns || data || [];
      setCampaigns(all);
      setStats({
        total:       all.length,
        active:      all.filter(c => c.status === "active").length,
        totalRaised: all.reduce((s, c) => s + (c.moneyRaised || 0), 0),
        withObjects: all.filter(c => c.needsObjects && (c.objectNeeds || []).length > 0).length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* filter + sort */
  const filtered = campaigns
    .filter(c => {
      const matchCat = cat === "all" || (c.category || "").toLowerCase() === cat;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        (c.association?.organizationName || c.association?.name || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "newest")      return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")      return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "most-raised") return (b.moneyRaised || 0) - (a.moneyRaised || 0);
      if (sort === "progress") {
        const pa = a.moneyGoal ? (a.moneyRaised || 0) / a.moneyGoal : 0;
        const pb = b.moneyGoal ? (b.moneyRaised || 0) / b.moneyGoal : 0;
        return pb - pa;
      }
      return 0;
    });

  /* handlers */
  const handleMoneyDonate  = (campaignId) => navigate(`/donor/donate/${campaignId}`);
  const handleObjectDonate = (campaign, need) => {

    navigate("/donor/donate-campaign-item", {
    state: { campaign, need },
    });
  };

  const mapNeedToCategory = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("food") || n.includes("meal"))    return "food";
    if (n.includes("cloth") || n.includes("shirt"))  return "clothes";
    if (n.includes("book") || n.includes("school"))  return "education";
    if (n.includes("medicine") || n.includes("med")) return "health";
    if (n.includes("furniture") || n.includes("bed"))return "furniture";
    return "other";
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══ HERO HEADER ══ */}
      <div className="bg-white border-b border-slate-100 px-6 py-6">

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Browse Campaigns</h1>
            <p className="text-sm text-slate-400 mt-0.5">Support causes with money or physical items</p>
          </div>
         
        </div>



        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search campaigns, associations…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(""); setSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center text-white text-xs transition">✕</button>
          )}
        </div>

        {/* Category pills + Sort + View toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category scroll */}
          <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5">
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  cat === c.id
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                <span>{c.emoji}</span>{c.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most-raised">Most Raised</option>
            <option value="progress">By Progress</option>
          </select>

          {/* Grid / List toggle */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
            {[
              { key: "grid", icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
              { key: "list", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg> },
            ].map(v => (
              <button key={v.key} onClick={() => setView(v.key)}
                className={`px-3 py-1.5 transition ${view === v.key ? "bg-blue-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >{v.icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="px-6 py-6">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <svg className="animate-spin w-8 h-8 mb-3 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <p className="text-sm">Loading campaigns…</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-base font-semibold text-slate-500">No campaigns found</p>
            <p className="text-sm mt-1">Try changing the filter or search term</p>
            <button onClick={() => { setCat("all"); setSearchQ(""); }}
              className="mt-4 px-5 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition">
              Clear filters
            </button>
          </div>

        ) : view === "grid" ? (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(c => (
              <CampaignCard
                key={c._id}
                campaign={c}
                onMoneyDonate={handleMoneyDonate}
                onObjectDonate={handleObjectDonate}
              />
            ))}
          </div>

        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-3">
            {filtered.map(c => {
              const cat2    = getCat(c.category);
              const raised  = c.moneyRaised || 0;
              const goal    = c.moneyGoal   || 0;
              const progress= goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
              const daysLeft= c.deadline ? Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000)) : null;
              const hasObj  = c.needsObjects && (c.objectNeeds || []).length > 0;
              const unfilled= (c.objectNeeds || []).filter(n => (n.received||0) < (n.quantity||1)).length;
              const isExpired = daysLeft === 0;
              const [showNeeds, setShowNeeds] = useState(false);

              return (
                <div key={c._id}>
                  {showNeeds && (
                    <ObjectNeedsModal
                      campaign={c}
                      onClose={() => setShowNeeds(false)}
                      onDonate={(camp, need) => { setShowNeeds(false); handleObjectDonate(camp, need); }}
                    />
                  )}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    {/* Thumb */}
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-slate-100">
                      {c.coverImage
                        ? <img src={c.coverImage} alt="" className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-2xl">{cat2.emoji}</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat2.color}`}>{cat2.emoji} {c.category}</span>
                        {daysLeft !== null && daysLeft <= 7 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                            {daysLeft === 0 ? "Expired" : `${daysLeft}d left`}
                          </span>
                        )}
                        {hasObj && unfilled > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">📦 {unfilled} needed</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 text-sm truncate">{c.title}</p>
                      <p className="text-xs text-slate-400 truncate">🏢 {c.association?.organizationName || c.association?.name}</p>
                      {goal > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={progress} />
                          <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{Math.round(progress)}%</span>
                        </div>
                      )}
                    </div>

                 {/* Actions */}
<div className="flex gap-2 flex-shrink-0">
  <button
    onClick={() => !isExpired && handleMoneyDonate(c._id)}
    disabled={isExpired}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm
      ${isExpired ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
  >
    {isExpired ? "⛔ Expired" : "💳 Money"}
  </button>
  {hasObj && (
    <button
      onClick={() => !isExpired && setShowNeeds(true)}
      disabled={isExpired}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm relative
        ${isExpired ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
    >
      {isExpired ? "⛔ Expired" : "📦 Objects"}
      {!isExpired && unfilled > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unfilled}</span>
      )}
    </button>
  )}
</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
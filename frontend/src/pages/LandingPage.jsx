// pages/LandingPage.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

/* ═══════════════════════════════════════════════
   COUNT-UP HOOK  — triggers once element is visible
═══════════════════════════════════════════════ */
function useCountUp(target, duration = 2000) {
  const [count,   setCount]   = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || target === 0) return;
    let startTime = null;
    const raf = requestAnimationFrame(function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { ref, count };
}

/* ─── format big numbers ─── */
function fmtMoney(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M TND`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K TND`;
  return `${n} TND`;
}
function fmtCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K+`;
  return `${n}+`;
}

function StatItem({ target, label, color, format = 'count', duration = 2000 }) {
  const { ref, count } = useCountUp(target, duration);
  const display = format === 'money' ? fmtMoney(count) : fmtCount(count);
  return (
    <div ref={ref} className="flex flex-col gap-1">
      <span className={`text-3xl font-extrabold ${color}`}>{display}</span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STARS
═══════════════════════════════════════════════ */
function Stars({ value, size = 4 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} viewBox="0 0 24 24" className={`w-${size} h-${size}`} fill={value >= s ? '#f59e0b' : '#e2e8f0'}>
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════ */
function ProgressBar({ raised, goal }) {
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  const col = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-600' : pct >= 30 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 my-3 overflow-hidden">
      <div className={`${col} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════ */
function Avatar({ user }) {
  const name   = user?.organizationName || user?.name || '?';
  const colors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-teal-500'];
  const bg     = colors[name.charCodeAt(0) % colors.length];
  if (user?.avatar)
    return <img src={user.avatar} alt={name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white flex-shrink-0"/>;
  return (
    <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center text-white font-bold ring-2 ring-white flex-shrink-0 text-sm`}>
      {name[0].toUpperCase()}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COLOR HELPER (association cards)
═══════════════════════════════════════════════ */
const getColor = (name = '') => {
  const pool = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#14b8a6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return pool[Math.abs(h) % pool.length];
};

/* ═══════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════ */
const HOW_IT_WORKS = [
  { icon: '👥', bg: 'bg-blue-100',   title: '1. Choose a Campaign',  desc: 'Browse verified campaigns from trusted associations and find causes that resonate with you.' },
  { icon: '🎯', bg: 'bg-green-100',  title: '2. Make Your Donation', desc: 'Donate money securely or contribute physical items like clothes, food, or school supplies.' },
  { icon: '✅', bg: 'bg-purple-100', title: '3. Track Your Impact',   desc: "Receive real-time updates and see the difference your generosity makes in people's lives." },
];

const CATEGORY_EMOJI = {
  education:'📚', health:'🏥', food:'🍽️', shelter:'🏠',
  clothes:'👕', children:'👶', elderly:'👴', disaster:'🆘', other:'💛',
};

/* ═══════════════════════════════════════════════
   REVIEW CAROUSEL  — 1 featured + grid of rest
═══════════════════════════════════════════════ */
function ReviewCarousel({ reviews }) {
  const [idx, setIdx] = useState(0);
  const total = reviews.length;

  /* auto-advance */
  useEffect(() => {
    if (total <= 1) return;
    const iv = setInterval(() => setIdx(i => (i + 1) % total), 5000);
    return () => clearInterval(iv);
  }, [total]);

  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  const featured = reviews[idx];

  /* average rating — computed dynamically */
  const avg = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1);

  return (
    <div>
      {/* ── Aggregate badge ── */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-3 bg-white border border-blue-100 shadow-sm rounded-2xl px-6 py-3">
          <Stars value={parseFloat(avg)} size={5}/>
          <div className="h-4 w-px bg-gray-200"/>
          <span className="text-xl font-extrabold text-gray-800">{avg}</span>
          <span className="text-sm text-gray-400 font-medium">
            out of 5 · {total} review{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Featured card (auto-slides) ── */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="relative bg-white rounded-2xl p-8 shadow-md border border-blue-50">
          {/* nav arrows */}
          {total > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition text-lg">
                ‹
              </button>
              <button onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition text-lg">
                ›
              </button>
            </>
          )}
          <div className="px-6">
            <div className="text-blue-200 text-6xl font-serif leading-none mb-3">"</div>
            <Stars value={featured.rating} size={5}/>
            {featured.title && (
              <p className="text-base font-bold text-gray-800 mt-3 mb-2">"{featured.title}"</p>
            )}
            <p className="text-gray-600 leading-relaxed italic mb-6">{featured.content}</p>
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <Avatar user={featured.author}/>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {featured.author?.organizationName || featured.author?.name || 'Anonymous'}
                </p>
                <p className="text-gray-400 text-xs capitalize">
                  {featured.authorRole === 'association' ? '🏢 Association' : '💙 Donor'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* dot indicators */}
        {total > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? 'w-6 bg-blue-500' : 'w-2 bg-blue-200 hover:bg-blue-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Grid of other reviews ── */}
      {total > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.filter((_, i) => i !== idx).slice(0, 6).map((r, i) => (
            <div key={r._id || i} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-50">
              <Stars value={r.rating} size={4}/>
              {r.title && <p className="text-sm font-bold text-gray-800 mt-2 mb-1 line-clamp-1">"{r.title}"</p>}
              <p className="text-gray-500 text-sm italic leading-relaxed line-clamp-3 mb-4">{r.content}</p>
              <div className="flex items-center gap-2.5 border-t border-gray-50 pt-3">
                <Avatar user={r.author}/>
                <div>
                  <p className="font-semibold text-gray-800 text-xs">
                    {r.author?.organizationName || r.author?.name || 'Anonymous'}
                  </p>
                  <p className="text-gray-400 text-[11px] capitalize">
                    {r.authorRole === 'association' ? '🏢 Association' : '💙 Donor'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CAMPAIGN CAROUSEL  — 3 visible, slide by 1
═══════════════════════════════════════════════ */
function CampaignCarousel({ campaigns, onDonate }) {
  const [idx, setIdx] = useState(0);
  const total = campaigns.length;
  const visible = Math.min(3, total);

  useEffect(() => {
    if (total <= 3) return;
    const iv = setInterval(() => setIdx(i => (i + 1) % (total - 2)), 5000);
    return () => clearInterval(iv);
  }, [total]);

  const shown = Array.from({ length: visible }, (_, k) => campaigns[(idx + k) % total]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {shown.map((c, i) => {
          const raised   = c.moneyRaised || 0;
          const goal     = c.moneyGoal   || 0;
          const progress = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
          const daysLeft = c.deadline
            ? Math.max(0, Math.ceil((new Date(c.deadline) - new Date()) / 86400000))
            : null;
          const emoji = CATEGORY_EMOJI[c.category?.toLowerCase()] || '💛';

          return (
            <div key={c._id || i} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative h-52 bg-gradient-to-br from-blue-100 to-slate-200">
                {c.coverImage
                  ? <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">{emoji}</div>
                }
                {daysLeft !== null && (
                  <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                    daysLeft === 0 ? 'bg-red-500 text-white' : daysLeft <= 7 ? 'bg-amber-400 text-white' : 'bg-white/90 text-slate-700'
                  }`}>
                    {daysLeft === 0 ? 'Expired' : `${daysLeft}d left`}
                  </div>
                )}
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-blue-600 mb-1 block capitalize">
                  {emoji} {c.category || 'General'} · {c.association?.organizationName || c.association?.name || ''}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{c.title}</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">{c.description}</p>
                {goal > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-700 font-medium">
                      <span>{raised.toLocaleString()} TND</span>
                      <span className="text-gray-400">of {goal.toLocaleString()} TND</span>
                    </div>
                    <ProgressBar raised={raised} goal={goal}/>
                    <div className="flex justify-between text-xs text-gray-400 mb-4">
                      <span>{progress}% funded</span>
                      {daysLeft !== null && <span>{daysLeft}d left</span>}
                    </div>
                  </>
                )}
                <button onClick={() => onDonate(c._id)}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-sm">
                  Donate Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {total > 3 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: total - 2 }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === idx ? 'w-6 bg-blue-600' : 'w-2 bg-blue-200 hover:bg-blue-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ASSOCIATIONS GRID
═══════════════════════════════════════════════ */
function AssociationsGrid({ associations }) {
  const [page, setPage] = useState(0);
  const perPage    = 6;
  const totalPages = Math.ceil(associations.length / perPage);
  const visible    = associations.slice(page * perPage, page * perPage + perPage);

  if (!associations.length)
    return <div className="text-center py-16 text-gray-400"><span className="text-5xl mb-3 block">🏛️</span><p>No associations yet.</p></div>;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {visible.map((a, i) => {
          const name  = a.organizationName || a.name || '?';
          const color = getColor(name);
          const city  = a.addresses?.[0]?.city || a.addresses?.[0]?.country || null;
          return (
            <div key={a._id || i}
              className="group relative bg-white rounded-2xl overflow-hidden border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-1.5 w-full" style={{ background: color }}/>
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: color }}>
                    {name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-sky-700 transition-colors">{name}</h3>
                    {city && <p className="text-xs text-gray-400 mt-0.5">📍 {city}</p>}
                    <span className="inline-block mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Verified</span>
                  </div>
                </div>
                {a.description && <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{a.description}</p>}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-dashed border-gray-100">
                  {a.email && <span className="text-sky-700 font-medium truncate">{a.email}</span>}
                  <span className="text-gray-400 ml-auto flex items-center gap-1 text-sky-600 font-semibold group-hover:gap-2 transition-all">
                    See details →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
            className="w-10 h-10 rounded-full border border-sky-300 flex items-center justify-center text-xl text-gray-600 disabled:opacity-40 hover:bg-sky-50 transition">‹</button>
          <span className="text-sm text-gray-500 font-medium">Page {page+1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page===totalPages-1}
            className="w-10 h-10 rounded-full border border-sky-300 flex items-center justify-center text-xl text-gray-600 disabled:opacity-40 hover:bg-sky-50 transition">›</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();

  /* ── Data ── */
  const [campaigns,     setCampaigns]     = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [associations,  setAssociations]  = useState([]);
  const [stats,         setStats]         = useState({
    raised: 0, campaigns: 0, donors: 0, associations: 0,
  });

  const [campsLoading,  setCampsLoading]  = useState(true);
  const [revsLoading,   setRevsLoading]   = useState(true);
  const [assosLoading,  setAssosLoading]  = useState(true);

  /* ── Fetch Campaigns ── */
  useEffect(() => {
    axios.get('/campaigns?status=active&limit=6&sort=newest')
      .then(r => {
        const all  = r.data?.campaigns || r.data || [];
        const total= r.data?.total || all.length;
        const raised = all.reduce((s, c) => s + (c.moneyRaised || 0), 0);
        const donors = all.reduce((s, c) => s + (c.donorsCount  || 0), 0);
        setCampaigns(all.slice(0, 6));
        setStats(prev => ({
          ...prev,
          campaigns: total,
          raised:    raised,
          donors:    donors,
        }));
      })
      .catch(() => setCampaigns([]))
      .finally(() => setCampsLoading(false));
  }, []);

  /* ── Fetch Associations ── */
  useEffect(() => {
    axios.get('/auth/associations')
      .then(r => {
        const all = r.data?.associations || r.data?.users || r.data || [];
        setAssociations(all);
        setStats(prev => ({ ...prev, associations: all.length }));
      })
      .catch(() => setAssociations([]))
      .finally(() => setAssosLoading(false));
  }, []);

  /* ── Fetch Reviews ── */
  useEffect(() => {
    axios.get('/reviews/public')
      .then(r => setReviews(r.data?.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setRevsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ═══ NAVBAR ═══ */}
      <nav className="flex items-center justify-between px-16 py-4 bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💙</span>
          <span className="text-lg font-bold text-gray-900">DonationConnect</span>
        </div>
        <div className="flex items-center gap-7">
          <button onClick={() => navigate('/campaigns')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Campaigns</button>
          <a href="#about"    className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About</a>
          <a href="#reviews"  className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Reviews</a>
          <button onClick={() => navigate('/login')}  className="border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all">Login</button>
          <button onClick={() => navigate('/signup')} className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm">Sign Up</button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="flex items-center justify-between px-16 py-20 gap-10 min-h-[calc(100vh-65px)]">
        <div className="flex-1 max-w-2xl">
          <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            Trusted donation platform
          </span>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Make a Difference<br/>
            <span className="text-blue-600">Today</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mb-9">
            Support trusted associations and change lives through donations of money or essential items.
          </p>
          <div className="flex gap-4 mb-14 flex-wrap">
            <button onClick={() => navigate('/campaigns')}
              className="bg-blue-600 text-white font-semibold px-7 py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-md shadow-blue-200">
              Donate Now →
            </button>
            <button onClick={() => navigate('/signup')}
              className="border border-gray-300 text-gray-800 font-semibold px-7 py-3 rounded-lg hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5 transition-all">
              Get Started
            </button>
          </div>

          {/* ── Dynamic stats (count-up fires on scroll into view) ── */}
          <div className="flex gap-14 flex-wrap">
            <StatItem
              target={stats.raised || 2_500_000}
              label="Total Raised"
              color="text-blue-600"
              format="money"
              duration={2200}
            />
            <StatItem
              target={stats.campaigns || 500}
              label="Active Campaigns"
              color="text-green-600"
              format="count"
              duration={1800}
            />
            <StatItem
              target={stats.donors || 10_000}
              label="Donors"
              color="text-purple-600"
              format="count"
              duration={1600}
            />
          </div>
        </div>

        <div className="flex-1 flex justify-end">
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=700&q=80"
              alt="Hands together donation"
              className="w-full h-[600px] object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* ═══ FEATURED CAMPAIGNS ═══ */}
      <section id="campaigns" className="bg-gray-50 py-20 px-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Featured Campaigns</h2>
          <p className="text-gray-500 text-base">Support causes that matter to you</p>
        </div>

        {campsLoading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl mb-3 block">📭</span><p>No active campaigns yet.</p>
          </div>
        ) : (
          <CampaignCarousel
            campaigns={campaigns}
            onDonate={id => navigate(`/donor/donate/${id}`)}
          />
        )}

        <div className="text-center mt-12">
          <button onClick={() => navigate('/campaigns')}
            className="border border-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all">
            View All Campaigns →
          </button>
        </div>
      </section>

      {/* ═══ ASSOCIATIONS ═══ */}
      <section id="associations" className="py-20 px-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Our Active Associations</h2>
          <p className="text-gray-500 text-base">
            {stats.associations > 0
              ? `${stats.associations} verified organization${stats.associations !== 1 ? 's' : ''} making a real impact`
              : 'Verified organizations making a real impact'}
          </p>
        </div>

        {assosLoading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : (
          <AssociationsGrid associations={associations}/>
        )}
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="about" className="py-20 px-16 bg-gray-50">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 text-base">Three simple steps to make an impact</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto text-center">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-4">
              <div className={`${step.bg} w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm`}>{step.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section id="reviews" className="py-20 px-16 bg-blue-50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">What People Say</h2>
          <p className="text-gray-500 text-base">Real stories from our community</p>
        </div>

        {revsLoading ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <span className="text-5xl mb-3 block">⭐</span>
            <p className="text-base">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <ReviewCarousel reviews={reviews}/>
        )}

        <div className="text-center mt-12">
          <button onClick={() => navigate('/login')}
            className="border border-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all">
            Write a Review →
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-900 text-gray-400 px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-6xl mx-auto mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4"><span className="text-xl">💙</span><span className="text-white font-bold text-lg">DonationConnect</span></div>
            <p className="text-sm leading-relaxed">Connecting generous donors with trusted associations to make a lasting impact.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/campaigns')} className="hover:text-white transition-colors">Browse Campaigns</button></li>
              <li><a href="#about"   className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#reviews" className="hover:text-white transition-colors">Reviews</a></li>
              <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">Get Started</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">For Associations</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">Register Association</button></li>
              <li><button className="hover:text-white transition-colors">Verification Process</button></li>
              <li><button className="hover:text-white transition-colors">Guidelines</button></li>
              <li><button className="hover:text-white transition-colors">Support</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button className="hover:text-white transition-colors">Cookie Policy</button></li>
              <li><button className="hover:text-white transition-colors">Security</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-sm">
          © 2026 DonationConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
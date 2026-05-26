import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "education", label: "📚 Education" },
  { value: "health", label: "🏥 Health" },
  { value: "food", label: "🍞 Food" },
  { value: "shelter", label: "🏠 Shelter" },
  { value: "clothes", label: "👕 Clothes" },
  { value: "children", label: "👶 Children" },
  { value: "elderly", label: "👴 Elderly" },
  { value: "disaster", label: "🆘 Disaster" },
  { value: "animals", label: "🐾 Animals" },
  { value: "other", label: "💛 Other" },
];

function ProgressBar({ value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div
        className={`${colors[color]} h-1.5 rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function CampaignCard({ campaign, onClick }) {
  const progress = campaign.moneyGoal
    ? Math.min(
        Math.round((campaign.moneyRaised / campaign.moneyGoal) * 100),
        100,
      )
    : null;

  const daysLeft = campaign.deadline
    ? Math.max(
        0,
        Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000),
      )
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
    >
      {/* Cover image */}
      <div className="h-44 bg-slate-100 relative overflow-hidden">
        {campaign.coverImage ? (
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {CATEGORIES.find(
              (c) => c.value === campaign.category,
            )?.label?.split(" ")[0] || "💛"}
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-slate-700">
          {CATEGORIES.find((c) => c.value === campaign.category)?.label ||
            campaign.category}
        </span>
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {campaign.isUrgent && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              🚨 URGENT
            </span>
          )}
          {daysLeft !== null && daysLeft <= 7 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Association */}
        <p className="text-xs text-blue-500 font-medium mb-1.5">
          {campaign.association?.organizationName || campaign.association?.name}
        </p>

        <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {campaign.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {campaign.description}
        </p>

        {/* Object needs badges */}
        {campaign.needsObjects && campaign.objectNeeds?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {campaign.objectNeeds.slice(0, 3).map((n, i) => (
              <span
                key={i}
                className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium"
              >
                {n.name} ×{n.quantity}
              </span>
            ))}
            {campaign.objectNeeds.length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                +{campaign.objectNeeds.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Money progress */}
        {campaign.moneyGoal > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">
                {campaign.moneyRaised.toLocaleString()} TND raised
              </span>
              <span className="text-slate-400">
                of {campaign.moneyGoal.toLocaleString()} TND
              </span>
            </div>
            <ProgressBar
              value={progress}
              color={progress >= 100 ? "green" : "blue"}
            />
            <p className="text-xs text-slate-400 mt-1">{progress}% funded</p>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {campaign.donorsCount} donors
            </span>
            {campaign.objectDonations > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                {campaign.objectDonations} objects
              </span>
            )}
          </div>
          {daysLeft !== null && (
            <span
              className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-500" : "text-slate-400"}`}
            >
              {daysLeft === 0 ? "Ends today" : `${daysLeft} days left`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignsList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const limit = 9;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, sort });
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    api
      .get(`/campaigns?${params}`)
      .then(({ data }) => {
        setCampaigns(data.campaigns);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">Active Campaigns</h1>
          <p className="text-blue-100 text-base mb-6">
            Support causes that matter — donate money or physical objects
          </p>
          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search campaigns…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-7">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap flex-1">
            {CATEGORIES.slice(0, 6).map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCategory(c.value);
                  setPage(1);
                }}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition ${
                  category === c.value
                    ? "bg-blue-500 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                }`}
              >
                {c.label}
              </button>
            ))}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">More categories…</option>
              {CATEGORIES.slice(6).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="-createdAt">Newest first</option>
            <option value="deadline">Ending soon</option>
            <option value="-moneyRaised">Most funded</option>
            <option value="-donorsCount">Most donors</option>
          </select>

          <p className="text-sm text-slate-500 ml-auto">{total} campaigns</p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse">
                <div className="h-44 bg-slate-100 rounded-t-2xl" />
                <div className="p-5 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-lg font-medium">No campaigns found</p>
            <button
              onClick={() => {
                setCategory("");
                setSearch("");
                setSearchInput("");
              }}
              className="mt-3 text-sm text-blue-500 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((c) => (
                <CampaignCard
                  key={c._id}
                  campaign={c}
                  onClick={() => navigate(`/campaigns/${c._id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-white disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                      p === page
                        ? "bg-blue-500 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-white disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// pages/donor/CampaignItemDonate.jsx
// Route: /donor/donate-campaign-item
// Called from ObjectNeedsModal with state: { campaign, need }
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ─── helpers ─── */
const ITEM_EMOJI = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("food") || n.includes("meal") || n.includes("rice"))   return "🍱";
  if (n.includes("cloth") || n.includes("shirt") || n.includes("jacket")) return "👕";
  if (n.includes("book") || n.includes("school") || n.includes("pencil")) return "📚";
  if (n.includes("medicine") || n.includes("med") || n.includes("drug")) return "💊";
  if (n.includes("blanket") || n.includes("bed") || n.includes("pillow")) return "🛏️";
  if (n.includes("toy") || n.includes("game"))  return "🧸";
  if (n.includes("water") || n.includes("drink")) return "💧";
  if (n.includes("shoe") || n.includes("boot"))  return "👟";
  return "📦";
};

const CAT_OPTIONS = [
  { value: "clothes",   label: "Clothes",   emoji: "👕" },
  { value: "food",      label: "Food",      emoji: "🍱" },
  { value: "furniture", label: "Furniture", emoji: "🛋️" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "health",    label: "Health",    emoji: "💊" },
  { value: "toys",      label: "Toys",      emoji: "🧸" },
  { value: "other",     label: "Other",     emoji: "📦" },
];

const ALL_SLOTS = [
  "09:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "02:00 PM","03:00 PM","04:00 PM","05:00 PM",
];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white " +
  "placeholder-slate-400 transition";

/* ─── step indicator ─── */
function StepBar({ current }) {
  const steps = ["Item Info", "Details", "Schedule", "Confirm"];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((s, i) => {
        const done    = i + 1 < current;
        const active  = i + 1 === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done   ? "bg-emerald-500 text-white"
                : active ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                :          "bg-slate-200 text-slate-400"}`}>
                {done
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? "text-emerald-600" : done ? "text-slate-500" : "text-slate-400"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-20 h-0.5 mx-3 transition-all ${done ? "bg-emerald-500" : "bg-slate-200"}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── image dropzone ─── */
function ImageZone({ images, onChange }) {
  const ref = useRef();
  const onDrop = (e) => {
    e.preventDefault();
    onChange(prev => [...prev, ...Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))].slice(0,5));
  };
  const onPick = (e) => {
    onChange(prev => [...prev, ...Array.from(e.target.files)].slice(0,5));
    e.target.value = "";
  };
  const remove = (i) => onChange(prev => prev.filter((_,idx) => idx !== i));
  return (
    <div>
      <div onDrop={onDrop} onDragOver={e=>e.preventDefault()} onClick={() => ref.current.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer text-center">
        <input ref={ref} type="file" multiple accept="image/*" className="hidden" onChange={onPick}/>
        <div className="flex flex-col items-center gap-1.5">
          <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          <p className="text-sm font-medium text-slate-500">Click or drag images here</p>
          <p className="text-xs text-slate-400">Photos help the association verify items (optional)</p>
        </div>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover rounded-xl border border-slate-200"/>
              <button type="button" onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Availability calendar ─── */
function AvailabilityCalendar({ associationId, onSelectDate, onSelectSlot, selectedDate, selectedSlot }) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const [year,   setYear]   = useState(today.getFullYear());
  const [month,  setMonth]  = useState(today.getMonth());
  const [slots,  setSlots]  = useState([]);   // {time, available}[]
  const [slotLoading, setSlotLoading] = useState(false);
  // Map of "YYYY-MM-DD" → bool (false = day fully booked)
  const [dayAvailability, setDayAvailability] = useState({});
  const [monthLoading, setMonthLoading] = useState(false);

  const daysInM  = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  /* fetch full-month availability (one call per month view) */
  const fetchMonthAvailability = useCallback(async () => {
    if (!associationId) return;
    setMonthLoading(true);
    const map = {};
    try {
      // check each day in the month in parallel
      const days = Array.from({ length: daysInM }, (_, i) => i + 1);
      await Promise.all(
        days.map(async (day) => {
          const d = new Date(year, month, day);
          if (d < today) { map[`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`] = false; return; }
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          try {
            const { data } = await api.get(`/donations/campaign-item/slots/${associationId}?date=${dateStr}`);
            const hasAny = (data.available || []).some(s => s.available);
            map[dateStr] = hasAny;
          } catch { map[dateStr] = true; }
        })
      );
    } catch { /* ignore */ }
    setDayAvailability(map);
    setMonthLoading(false);
  }, [associationId, year, month, daysInM]);

  useEffect(() => { fetchMonthAvailability(); }, [fetchMonthAvailability]);

  /* fetch slots when a date is selected */
  useEffect(() => {
    if (!selectedDate || !associationId) return;
    setSlotLoading(true);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,"0")}-${String(selectedDate.getDate()).padStart(2,"0")}`;
    api.get(`/donations/campaign-item/slots/${associationId}?date=${dateStr}`)
      .then(({ data }) => setSlots(data.available || ALL_SLOTS.map(t=>({time:t,available:true}))))
      .catch(() => setSlots(ALL_SLOTS.map(t=>({time:t,available:true}))))
      .finally(() => setSlotLoading(false));
  }, [selectedDate, associationId]);

  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setMonth(0),  setYear(y=>y+1)) : setMonth(m=>m+1);

  const isFullyBooked = (day) => {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return dayAvailability[key] === false;
  };

  const isTodayOrPast = (day) => new Date(year, month, day) < today;

  const isSelected = (day) =>
    selectedDate?.getDate()===day &&
    selectedDate?.getMonth()===month &&
    selectedDate?.getFullYear()===year;

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{MONTHS[month]} {year}</p>
            {monthLoading && <svg className="animate-spin w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-[10px] text-slate-400 font-medium py-1">{d}</div>)}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({length:firstDay}).map((_,i) => <div key={"e"+i}/>)}
          {Array.from({length:daysInM},(_,i)=>i+1).map(day => {
            const past   = isTodayOrPast(day);
            const booked = !past && isFullyBooked(day);
            const sel    = isSelected(day);
            const disabled = past || booked;
            return (
              <button key={day} disabled={disabled}
                onClick={() => { onSelectDate(new Date(year, month, day)); onSelectSlot(""); }}
                className={`aspect-square flex items-center justify-center text-xs rounded-lg transition relative
                  ${past    ? "text-slate-200 cursor-not-allowed"
                  : booked  ? "text-slate-300 cursor-not-allowed bg-red-50 line-through decoration-red-200"
                  : sel     ? "bg-emerald-500 text-white font-bold ring-2 ring-emerald-300"
                  :           "hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-medium"}`}
              >
                {day}
                {/* green dot = available, shown when not past/booked/selected */}
                {!past && !booked && !sel && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"/>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"/>Available
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-200"/>Fully booked
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-200"/>Past
          </div>
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">
              Available times — {selectedDate.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short"})}
            </p>
            {slotLoading && <svg className="animate-spin w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(slots.length ? slots : ALL_SLOTS.map(t=>({time:t,available:true}))).map(s => (
              <button key={s.time} disabled={!s.available} onClick={() => onSelectSlot(s.time)}
                className={`py-2.5 rounded-xl border text-xs font-semibold transition flex flex-col items-center gap-0.5 ${
                  !s.available    ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                  : selectedSlot===s.time ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                  :                 "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {s.time}
                {!s.available && <span className="text-[9px] text-red-300 font-medium">Booked</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function CampaignItemDonate() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const campaign = state?.campaign;
  const need     = state?.need;

  const [step,      setStep]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [images,    setImages]    = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const remaining = Math.max(0, (need?.quantity || 1) - (need?.received || 0));

  const [form, setForm] = useState({
    quantity:  Math.min(1, remaining),
    category:  "other",
    condition: "good",
    description: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  /* step 3 — schedule */
  const [selDate, setSelDate] = useState(null);
  const [selSlot, setSelSlot] = useState("");

  useEffect(() => {
    if (!campaign || !need) navigate("/donor/campaigns");
  }, [campaign, need, navigate]);

  if (!campaign || !need) return null;

  const emoji = ITEM_EMOJI(need.name);
  const assocId = campaign.association?._id || campaign.association;

  /* ── validation ── */
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      const qty = Number(form.quantity);
      if (!Number.isFinite(qty) || qty < 1)  e.quantity = "Enter a valid quantity (min 1)";
      if (qty > remaining)                   e.quantity = `Maximum available: ${remaining}`;
    }
    if (s === 2) {
      if (!form.description.trim()) e.description = "Please describe the items you're donating";
    }
    if (s === 3) {
      if (!selDate) e.date = "Please select a date";
      if (!selSlot) e.slot = "Please select a time slot";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  /* ── submit ── */
  const submit = async () => {
  setLoading(true); setError("");
  try {
    const fd = new FormData();
    fd.append("campaignId",      campaign._id);
    fd.append("itemNeedId",      need._id);        // ← was "needItemId"
    fd.append("itemName",        need.name);
    fd.append("quantity",        form.quantity);
    fd.append("category",        form.category);
    fd.append("condition",       form.condition);
    fd.append("description",     form.description);
    fd.append("message",         form.message);
    fd.append("method",          "dropoff");
    fd.append("appointmentDate", selDate.toISOString());
    fd.append("timeSlot",        selSlot);          // ← required for availability check
    images.forEach(img => fd.append("images", img));
    await api.post("/donations/campaign-item", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setSubmitted(true);
  } catch (err) {
    setError(err.response?.data?.message || "Submission failed. Please try again.");
  } finally { setLoading(false); }
};

  /* ── Success screen ── */
  if (submitted) return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5">🎉</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1.5">Donation Submitted!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your donation of <strong>{form.quantity}× {need.name}</strong> has been sent to{" "}
          <strong>{campaign.association?.organizationName || campaign.association?.name}</strong>.
        </p>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2.5 mb-6">
          {[
            ["📋 Campaign", campaign.title],
            ["📦 Item",     `${form.quantity}× ${need.name}`],
            ["⭐ Condition", form.condition],
            ["📅 Date",     selDate?.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})],
            ["⏰ Time",     selSlot],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 w-28 flex-shrink-0">{label}</span>
              <span className="font-semibold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-6">The association will confirm your appointment. You'll receive a notification.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate("/donor/campaigns")}
            className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
            Campaigns
          </button>
          <button onClick={() => navigate("/donor/object-donations-list")}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-sm shadow-emerald-200">
            My Donations
          </button>
        </div>
      </div>
    </div>
  );

  /* ════ PAGE WRAPPER ════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back + Title */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Donate an Item</h1>
        <p className="text-slate-500 mb-8 text-sm">for campaign: <span className="font-semibold text-slate-700">{campaign.title}</span></p>

        {/* Need item header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl flex-shrink-0">{emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-0.5">You're donating</p>
            <h2 className="text-lg font-bold text-slate-900 truncate">{need.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-400">{need.received||0} / {need.quantity||1} {need.unit||"units"} received</span>
              <span className="text-xs font-bold text-emerald-600">{remaining} still needed</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-1.5 rounded-full transition-all"
                style={{width:`${Math.min(((need.received||0)/(need.quantity||1))*100,100)}%`}}/>
            </div>
          </div>
        </div>

        <StepBar current={step}/>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>{error}
          </div>
        )}

        {/* ──────────── STEP 1: Item Info ──────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
            <h3 className="text-base font-bold text-slate-800 mb-6">Item Information</h3>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Quantity <span className="text-red-400">*</span>
                <span className="text-slate-400 font-normal ml-1">(max {remaining})</span>
              </label>
              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setForm(f => ({...f, quantity: Math.max(1, Number(f.quantity)-1)}))}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center transition flex-shrink-0">
                  −
                </button>
                <input type="number" min={1} max={remaining} value={form.quantity}
                  onChange={e => setForm(f => ({...f, quantity: e.target.value}))}
                  className={`${inputCls} text-center text-lg font-bold`}/>
                <button type="button"
                  onClick={() => setForm(f => ({...f, quantity: Math.min(remaining, Number(f.quantity)+1)}))}
                  className="w-11 h-11 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-xl flex items-center justify-center transition flex-shrink-0">
                  +
                </button>
              </div>
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CAT_OPTIONS.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm(f => ({...f, category: c.value}))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                      form.category===c.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-emerald-300 text-slate-600"
                    }`}>
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs font-medium text-center leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="mb-7">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Condition</label>
              <div className="flex gap-2">
                {[
                  {value:"new",  label:"New",  desc:"Never used"},
                  {value:"good", label:"Good", desc:"Lightly used"},
                  {value:"used", label:"Used", desc:"Shows wear"},
                ].map(c => (
                  <button key={c.value} type="button" onClick={() => setForm(f => ({...f, condition: c.value}))}
                    className={`flex-1 py-3 px-2 rounded-xl border-2 transition text-center ${
                      form.condition===c.value ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                    }`}>
                    <p className="text-xs font-bold text-slate-800">{c.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={next}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-40"
            >Continue →</button>
          </div>
        )}

        {/* ──────────── STEP 2: Details & Photos ──────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
            <h3 className="text-base font-bold text-slate-800 mb-6">Details & Photos</h3>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Describe the items <span className="text-red-400">*</span>
              </label>
              <textarea rows={3}
                placeholder={`e.g. ${form.quantity} ${need.name} in ${form.condition} condition…`}
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                className={`${inputCls} resize-none`}/>
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Photos <span className="text-slate-400 font-normal">(optional — up to 5)</span>
              </label>
              <ImageZone images={images} onChange={setImages}/>
            </div>

            <div className="mb-7">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Message to association <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea rows={2}
                placeholder="Any special instructions or notes…"
                value={form.message}
                onChange={e => setForm(f => ({...f, message: e.target.value}))}
                className={`${inputCls} resize-none`}/>
            </div>

            <div className="flex gap-3">
              <button onClick={back}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">← Back</button>
              <button onClick={next}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md">Continue →</button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 3: Schedule (with availability) ──────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
            <h3 className="text-base font-bold text-slate-800 mb-1.5">Schedule Drop-off</h3>
            <p className="text-sm text-slate-400 mb-5">Only available dates are shown. Grayed out dates are fully booked.</p>

            <AvailabilityCalendar
              associationId={assocId}
              selectedDate={selDate}
              selectedSlot={selSlot}
              onSelectDate={setSelDate}
              onSelectSlot={setSelSlot}
            />

            {errors.date && <p className="text-xs text-red-500 mt-2">{errors.date}</p>}
            {errors.slot && <p className="text-xs text-red-500 mt-1">{errors.slot}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={back}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">← Back</button>
              <button onClick={next} disabled={!selDate || !selSlot}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                Review →
              </button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 4: Review & Confirm ──────────── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
            <h3 className="text-base font-bold text-slate-800 mb-5">Review & Confirm</h3>

            <div className="space-y-2.5 mb-6">
              {[
                ["📋", "Campaign",    campaign.title],
                ["🏢", "Association", campaign.association?.organizationName || campaign.association?.name || "—"],
                ["📦", "Item",        need.name],
                ["🔢", "Quantity",    `${form.quantity} ${need.unit||"unit(s)"}`],
                ["🏷️","Category",    CAT_OPTIONS.find(c => c.value===form.category)?.label || form.category],
                ["⭐", "Condition",   form.condition.charAt(0).toUpperCase()+form.condition.slice(1)],
                ["📅", "Date",        selDate?.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})],
                ["⏰", "Time",        selSlot],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <span className="text-sm text-slate-400 w-24 flex-shrink-0">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate">{value}</span>
                </div>
              ))}
              {form.description && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{form.description}</p>
                </div>
              )}
              {form.message && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs text-emerald-600 mb-1 font-semibold">Your message</p>
                  <p className="text-sm text-slate-700 italic">"{form.message}"</p>
                </div>
              )}
              {images.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-2">{images.length} photo{images.length>1?"s":""} attached</p>
                  <div className="flex gap-2 flex-wrap">
                    {images.map((img,i) => (
                      <img key={i} src={URL.createObjectURL(img)} alt="" className="w-14 h-14 object-cover rounded-lg border border-slate-200"/>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-6">
              <span className="text-sm flex-shrink-0 mt-0.5">ℹ️</span>
              <p className="text-xs text-blue-700 leading-relaxed">After submitting, the association will confirm your appointment. You'll receive a real-time notification once they respond.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
                <span>⚠️</span>{error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={back}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">← Back</button>
              <button onClick={submit} disabled={loading}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</>
                  : "Submit Donation 🎁"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
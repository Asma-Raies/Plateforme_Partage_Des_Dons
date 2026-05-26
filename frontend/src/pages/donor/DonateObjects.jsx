// pages/donor/DonateObjects.jsx
// CHANGED: Step 2 calendar replaced with AvailabilityCalendar (real slot availability)
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DonorLocationMap from "../../components/DonorLocationMap";

/* ══════════════════════════════════════════════
   STEP BAR
══════════════════════════════════════════════ */
function StepBar({ step }) {
  const steps = ["Object Details", "Book Appointment", "Confirmation"];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const done    = i + 1 < step;
        const current = i + 1 === step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done    ? "bg-emerald-500 text-white"
                : current ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                :           "bg-slate-200 text-slate-400"}`}>
                {done
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${current?"text-emerald-600":done?"text-slate-500":"text-slate-400"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-3 transition-all ${done?"bg-emerald-500":"bg-slate-200"}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   AVAILABILITY CALENDAR  (shared with CampaignItemDonate)
   Shows green dot = available, red strikethrough = fully booked
══════════════════════════════════════════════ */
const ALL_SLOTS = ["09:00 AM","10:00 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM"];
const MONTHS    = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS      = ["Su","Mo","Tu","We","Th","Fr","Sa"];
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDay(y,m)   { return new Date(y,m,1).getDay(); }

function AvailabilityCalendar({ associationId, selectedDate, selectedSlot, onSelectDate, onSelectSlot }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [slots, setSlots] = useState([]);
  const [slotLoading,  setSlotLoading]  = useState(false);
  const [dayAvail,     setDayAvail]     = useState({});
  const [monthLoading, setMonthLoading] = useState(false);

  const daysInM  = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const fetchMonthAvailability = useCallback(async () => {
    if (!associationId) return;
    setMonthLoading(true);
    const map = {};
    try {
      const days = Array.from({length:daysInM}, (_,i)=>i+1);
      await Promise.all(days.map(async (day) => {
        const d = new Date(year, month, day);
        const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        if (d < today) { map[key] = false; return; }
        try {
          const { data } = await api.get(`/donations/campaign-item/slots/${associationId}?date=${key}`);
          map[key] = (data.available || []).some(s => s.available);
        } catch { map[key] = true; }
      }));
    } catch { /**/ }
    setDayAvail(map);
    setMonthLoading(false);
  }, [associationId, year, month, daysInM]);

  useEffect(() => { fetchMonthAvailability(); }, [fetchMonthAvailability]);

  useEffect(() => {
    if (!selectedDate || !associationId) return;
    setSlotLoading(true);
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,"0")}-${String(selectedDate.getDate()).padStart(2,"0")}`;
    api.get(`/donations/campaign-item/slots/${associationId}?date=${key}`)
      .then(({data}) => setSlots(data.available || ALL_SLOTS.map(t=>({time:t,available:true}))))
      .catch(() => setSlots(ALL_SLOTS.map(t=>({time:t,available:true}))))
      .finally(() => setSlotLoading(false));
  }, [selectedDate, associationId]);

  const prevMonth = () => month===0  ? (setMonth(11),setYear(y=>y-1)) : setMonth(m=>m-1);
  const nextMonth = () => month===11 ? (setMonth(0), setYear(y=>y+1)) : setMonth(m=>m+1);

  const isBooked = (day) => {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return dayAvail[key] === false;
  };
  const isPast   = (day) => new Date(year,month,day) < today;
  const isSel    = (day) =>
    selectedDate?.getDate()===day &&
    selectedDate?.getMonth()===month &&
    selectedDate?.getFullYear()===year;

  return (
    <div className="space-y-4">
      {/* Calendar grid */}
      <div className="border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto bg-white">
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

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map(d=><div key={d} className="text-center text-[10px] text-slate-400 font-medium py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:daysInM},(_,i)=>i+1).map(day=>{
            const past   = isPast(day);
            const booked = !past && isBooked(day);
            const sel    = isSel(day);
            return (
              <button key={day} disabled={past||booked}
                onClick={()=>{ onSelectDate(new Date(year,month,day)); onSelectSlot(""); }}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition relative
                  ${past   ? "text-slate-300 cursor-not-allowed"
                  : booked ? "text-slate-300 cursor-not-allowed bg-red-50 line-through decoration-red-200 text-xs"
                  : sel    ? "bg-emerald-500 text-white font-bold"
                  :          "hover:bg-emerald-50 text-slate-700 hover:text-emerald-600"}`}>
                {day}
                {!past && !booked && !sel && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"/>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-400"/>Available</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-red-200"/>Fully booked</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-200"/>Past</div>
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">
              Time — {selectedDate.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short"})}
            </p>
            {slotLoading && <svg className="animate-spin w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(slots.length ? slots : ALL_SLOTS.map(t=>({time:t,available:true}))).map(s=>(
              <button key={s.time} disabled={!s.available} onClick={()=>onSelectSlot(s.time)}
                className={`py-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-0.5 transition ${
                  !s.available      ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                  : selectedSlot===s.time ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  :                   "border-slate-200 text-slate-600 hover:border-emerald-300"
                }`}>
                {s.time}
                {!s.available && <span className="text-[9px] text-red-300">Booked</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   QR CODE (canvas)
══════════════════════════════════════════════ */
function QRDisplay({ value, size = 160 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = size; canvas.width = s; canvas.height = s;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,s,s);
    const hash = value.split("").reduce((a,c)=>(a<<5)-a+c.charCodeAt(0),0);
    const cells = 21; const cellSize = Math.floor(s/(cells+2)); const offset = Math.floor((s-cells*cellSize)/2);
    const drawFinder = (x,y) => {
      ctx.fillStyle="#000"; ctx.fillRect(x,y,7*cellSize,7*cellSize);
      ctx.fillStyle="#fff"; ctx.fillRect(x+cellSize,y+cellSize,5*cellSize,5*cellSize);
      ctx.fillStyle="#000"; ctx.fillRect(x+2*cellSize,y+2*cellSize,3*cellSize,3*cellSize);
    };
    drawFinder(offset,offset); drawFinder(offset+(cells-7)*cellSize,offset); drawFinder(offset,offset+(cells-7)*cellSize);
    for(let row=0;row<cells;row++) for(let col=0;col<cells;col++){
      const inFinder=(row<8&&col<8)||(row<8&&col>=cells-8)||(row>=cells-8&&col<8);
      if(inFinder) continue;
      if((hash^(row*31+col*17))&1){ ctx.fillStyle="#000"; ctx.fillRect(offset+col*cellSize,offset+row*cellSize,cellSize-1,cellSize-1); }
    }
  }, [value, size]);
  return <canvas ref={canvasRef} style={{width:size,height:size,imageRendering:"pixelated"}}/>;
}

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const CATEGORIES = [
  {value:"clothes",   label:"Clothes",        icon:"👕"},
  {value:"food",      label:"Food",           icon:"🍱"},
  {value:"furniture", label:"Furniture",      icon:"🛋️"},
  {value:"education", label:"School Supplies",icon:"📚"},
  {value:"health",    label:"Medical",        icon:"🩺"},
  {value:"other",     label:"Other",          icon:"📦"},
];

/* ══════════════════════════════════════════════
   RECEIPT DOWNLOAD
══════════════════════════════════════════════ */
/* ══════════════════════════════════════════════
   RECEIPT DOWNLOAD  (PDF via jsPDF)
══════════════════════════════════════════════ */
async function downloadReceipt({ form, method, selectedDate, selectedTime, selectedAssoc, qrCode }) {
  // Dynamically import jsPDF (must be installed: npm install jspdf)
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  /* ── Header banner ── */
  doc.setFillColor(16, 185, 129);          // emerald-500
  doc.rect(0, 0, W, 90, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("Donation Receipt", W / 2, 44, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("DonationConnect", W / 2, 66, { align: "center" });

  /* ── White card area ── */
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(30, 110, W - 60, 380, 10, 10, "F");

  /* ── Section title ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);           // slate-800
  doc.text("Appointment & Donation Details", 54, 140);

  /* ── Divider ── */
  doc.setDrawColor(226, 232, 240);        // slate-200
  doc.setLineWidth(0.5);
  doc.line(54, 148, W - 54, 148);

  /* ── Rows ── */
  const rows = [
    ["Category",    form.category ? form.category.charAt(0).toUpperCase() + form.category.slice(1) : "—"],
    ["Quantity",    `${form.quantity} item(s)`],
    ["Condition",   form.condition ? form.condition.charAt(0).toUpperCase() + form.condition.slice(1) : "—"],
    ["Association", selectedAssoc?.organizationName || selectedAssoc?.name || "—"],
    ["Date",        dateStr],
    ["Time",        selectedTime || "—"],
    ["Method",      method === "pickup" ? "Association Pickup" : "Drop-off at Association"],
    ["Reference",   qrCode],
  ];

  let y = 170;
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);    // slate-50 stripe
      doc.rect(40, y - 14, W - 80, 28, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);      // slate-500
    doc.text(label, 54, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);         // slate-800
    doc.text(value, 200, y);
    y += 32;
  });

  /* ── Reference pill ── */
  doc.setFillColor(236, 253, 245);        // emerald-50
  doc.roundedRect(54, y + 6, W - 108, 32, 6, 6, "F");
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);          // emerald-600
  doc.text(`Ref: ${qrCode}`, W / 2, y + 26, { align: "center" });

  /* ── Footer ── */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);        // slate-400
  doc.text("Thank you for your generous donation — DonationConnect", W / 2, 520, { align: "center" });

  doc.save(`receipt-${qrCode}.pdf`);
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function DonateObjects() {
  const navigate = useNavigate();
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [associations,setAssociations]= useState([]);
  const [images,      setImages]      = useState([]);
  const [qrCode,      setQrCode]      = useState("");

  // Step 1
  const [form, setForm] = useState({ category:"", description:"", quantity:1, condition:"good", associationId:"" });

  // Step 2 — replaced manual calendar with AvailabilityCalendar
  const [method,      setMethod]      = useState("dropoff");
  const [selDate,     setSelDate]     = useState(null);
  const [selSlot,     setSelSlot]     = useState("");
  const [donorLocation, setDonorLocation] = useState(null);

  useEffect(() => {
    api.get("/associations")
      .then(r => setAssociations(r.data?.associations || r.data?.users || []))
      .catch(() => setAssociations([]));
  }, []);

  const step1Valid = form.category && form.description.trim() && form.quantity >= 1 && form.associationId;
  const step2Valid = !!selDate && !!selSlot && (method === "dropoff" || !!donorLocation);

  const selectedAssoc = associations.find(a => a._id === form.associationId);

  const handleSubmit = async () => {
    if (!step2Valid) { setError("Please select a date and time slot"); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("category",        form.category);
      fd.append("description",     form.description);
      fd.append("quantity",        form.quantity);
      fd.append("condition",       form.condition);
      fd.append("associationId",   form.associationId);
      fd.append("method",          method);
      fd.append("appointmentDate", selDate.toISOString());
      fd.append("timeSlot",        selSlot);
      if (donorLocation) fd.append("donorLocation", JSON.stringify(donorLocation));
      images.forEach(img => fd.append("images", img));
      const { data } = await api.post("/donations/object-donations", fd, { headers: {"Content-Type":"multipart/form-data"} });
      setQrCode(data.donation?.qrCodeText || `QR-${Date.now()}`);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Submission failed.");
    } finally { setLoading(false); }
  };

  const Page = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );

  /* ════ STEP 1 ════ */
  if (step === 1) return (
    <Page>
      <StepBar step={1}/>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">Donate Objects</h1>
      <p className="text-slate-500 mb-8">Share details about the items you'd like to donate</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Category <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat=>(
              <button key={cat.value} type="button" onClick={()=>setForm({...form,category:cat.value})}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.category===cat.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-emerald-300 text-slate-600"
                }`}>
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-red-400">*</span></label>
          <textarea rows={3} maxLength={500} placeholder="Describe the items (e.g. 'Winter jackets in good condition')"
            value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition resize-none placeholder-slate-400"/>
          <p className="text-xs text-slate-400 mt-1">{form.description.length}/500</p>
        </div>

        {/* Quantity + Condition */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity <span className="text-red-400">*</span></label>
            <input type="number" min={1} value={form.quantity}
              onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||1})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition <span className="text-red-400">*</span></label>
            <div className="flex gap-1 mt-3">
              {["new","good","used"].map(c=>(
                <button key={c} type="button" onClick={()=>setForm({...form,condition:c})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition border ${
                    form.condition===c ? "bg-emerald-500 text-white border-emerald-500" : "border-slate-200 text-slate-600 hover:border-emerald-300"
                  }`}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Upload Images <span className="text-slate-400 font-normal">(optional, max 5)</span></label>
          <div className="flex gap-3 flex-wrap">
            {images.map((img,i)=>(
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                <img src={URL.createObjectURL(img)} className="w-full h-full object-cover"/>
                <button onClick={()=>setImages(p=>p.filter((_,idx)=>idx!==i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">×</button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition">
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e=>setImages(p=>[...p,...Array.from(e.target.files)].slice(0,5))}/>
                <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                <span className="text-xs text-slate-400">Upload</span>
              </label>
            )}
          </div>
        </div>

        {/* Association selector */}
        <div className="mb-7">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Association <span className="text-red-400">*</span></label>
          <select value={form.associationId} onChange={e=>setForm({...form,associationId:e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition">
            <option value="">Choose an association</option>
            {associations.map(a=>(
              <option key={a._id} value={a._id}>{a.organizationName||a.name}</option>
            ))}
          </select>
          {selectedAssoc?.location && (
            <a target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent(selectedAssoc.location)}`}
              className="flex items-center gap-2 p-3 mt-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 hover:bg-blue-100 transition">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="font-medium">{selectedAssoc.location}</span>
              <span className="ml-auto text-blue-400">→ View on map</span>
            </a>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={()=>navigate("/donor/dashboard")}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
          <button onClick={()=>step1Valid&&setStep(2)} disabled={!step1Valid}
            className="flex-[2] py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            Continue to Book Appointment
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </button>
        </div>
      </div>
    </Page>
  );

  /* ════ STEP 2 ════ */
  if (step === 2) return (
    <Page>
      <StepBar step={2}/>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">Book Your Appointment</h1>
      <p className="text-slate-500 mb-8">Select a date and time — only available slots are shown</p>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        {/* Method */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Pickup Method <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {key:"pickup",  title:"Association Pickup", desc:"They come to collect from your location"},
              {key:"dropoff", title:"Drop-off",           desc:"You bring items to the association"},
            ].map(({key,title,desc})=>(
              <button key={key} type="button" onClick={()=>setMethod(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  method===key ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  {method===key && <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"/>}
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                </div>
                <p className="text-xs text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Availability calendar (replaces old manual calendar+TIMES grid) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Date & Time <span className="text-red-400">*</span></label>
          <AvailabilityCalendar
            associationId={form.associationId}
            selectedDate={selDate}
            selectedSlot={selSlot}
            onSelectDate={setSelDate}
            onSelectSlot={setSelSlot}
          />
          {selDate && selSlot && (
            <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              <p className="text-xs font-semibold text-emerald-700">
                {selDate.toLocaleDateString("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})} at {selSlot}
              </p>
            </div>
          )}
        </div>

        {/* Donor location map (pickup only) */}
        {method === "pickup" && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Your Pickup Location <span className="text-red-400">*</span></label>
            <DonorLocationMap onLocationChange={setDonorLocation} initialLocation={donorLocation}/>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={()=>setStep(1)}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">← Back</button>
          <button onClick={handleSubmit} disabled={!step2Valid||loading}
            className="flex-[2] py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
            {loading
              ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting…</span>
              : "Confirm Booking"}
          </button>
        </div>
      </div>
    </Page>
  );

  /* ════ STEP 3: CONFIRMATION ════ */
  const dateStr = selDate ? selDate.toISOString().split("T")[0] : "";
  return (
    <Page>
      <StepBar step={3}/>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Appointment Confirmed!</h1>
        <p className="text-slate-500 text-sm">Thank you for your generous donation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Appointment Details</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">Pending</span>
          </div>
          <div className="space-y-3">
            {[
              {label:"Date",   value:dateStr},
              {label:"Time",   value:selSlot},
              {label:"Method", value:method==="pickup"?"Association Pickup":"Drop-off at Association"},
            ].map(({label,value})=>(
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 flex-shrink-0">
                  {label==="Date"?"📅":label==="Time"?"⏰":"📍"}
                </div>
                <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* QR */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 self-start">QR Code</h3>
          <div className="bg-slate-50 rounded-xl p-3 mb-3"><QRDisplay value={qrCode} size={140}/></div>
          <p className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">{qrCode}</p>
          <p className="text-xs text-slate-400 text-center mt-2">Show at pickup/drop-off</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Donation Summary</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            {label:"Category",   value:form.category,  cap:true},
            {label:"Quantity",   value:`${form.quantity} item(s)`},
            {label:"Condition",  value:form.condition,  cap:true},
            {label:"Association",value:selectedAssoc?.organizationName||selectedAssoc?.name||"—"},
          ].map(({label,value,cap})=>(
            <div key={label}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className={`text-sm font-semibold text-slate-800 ${cap?"capitalize":""}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button onClick={()=>downloadReceipt({form,method,selectedDate:selDate,selectedTime:selSlot,selectedAssoc,qrCode})}
          className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download Receipt
        </button>
        <button onClick={()=>navigate("/donor/dashboard")}
          className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition shadow-md flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Go to Dashboard
        </button>
      </div>

      {/* What's next */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">What happens next?</h3>
        <div className="space-y-3">
          {["You'll receive an email confirmation with all details","The association will review and confirm within 24h","You'll get a reminder 24h before the appointment","Complete the donation and receive a confirmation"].map((text,i)=>(
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
              <p className="text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
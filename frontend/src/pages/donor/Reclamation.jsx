import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CATEGORIES = [
  { value: 'Payment Issue',          icon: '💳' },
  { value: 'Campaign Fraud',         icon: '🚨' },
  { value: 'Technical Problem',      icon: '⚙️' },
  { value: 'Account Issue',          icon: '👤' },
  { value: 'Donation Not Received',  icon: '📦' },
  { value: 'Association Behavior',   icon: '🏢' },
  { value: 'Other',                  icon: '💬' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    icon: '🟢', active: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'medium', label: 'Medium', icon: '🟡', active: 'border-amber-400 bg-amber-50 text-amber-700'       },
  { value: 'high',   label: 'High',   icon: '🔴', active: 'border-red-400 bg-red-50 text-red-700'             },
];

/* ── Success screen ── */
function SuccessScreen({ onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Claim Submitted!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-7">
          Our team will review your claim and respond within 48 hours. You can track the status from your dashboard.
        </p>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}

/* ── Main form ── */
export default function Reclamation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: 'Payment Issue',
    subject: '',
    description: '',
    priority: 'medium',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.subject.trim())     e.subject     = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/claims', form);
      setSuccess(true);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Failed to submit claim.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessScreen onBack={() => navigate(-1)} />;

  const selectedCat = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-medium transition mb-6 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Submit a Claim</h1>
          <p className="text-slate-400 text-sm mt-1">We take every report seriously and respond within 48 hours.</p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm text-blue-700">
            Please provide as much detail as possible so our team can investigate and resolve your issue quickly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Category ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition text-left ${
                    form.category === cat.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="truncate text-xs">{cat.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Priority ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                    form.priority === p.value ? p.active : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Subject + Description ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Brief title of your issue"
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition placeholder-slate-400 ${
                  errors.subject ? 'border-red-300 focus:ring-red-300' : 'border-slate-200 focus:ring-blue-400'
                }`}
              />
              {errors.subject && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {errors.subject}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                maxLength={1000}
                placeholder="Please explain the issue in detail — what happened, when it happened, and any relevant details..."
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition resize-none placeholder-slate-400 ${
                  errors.description ? 'border-red-300 focus:ring-red-300' : 'border-slate-200 focus:ring-blue-400'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description
                  ? <p className="flex items-center gap-1 text-xs text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {errors.description}
                    </p>
                  : <span/>
                }
                <p className="text-xs text-slate-400 ml-auto">{form.description.length}/1000</p>
              </div>
            </div>
          </div>

          {/* Summary pill */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <span className="text-xl">{selectedCat?.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-medium">Submitting as</p>
              <p className="text-sm font-semibold text-slate-700 truncate">{form.category}</p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
              form.priority === 'high'   ? 'bg-red-100 text-red-700' :
              form.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                           'bg-emerald-100 text-emerald-700'
            }`}>{form.priority} priority</span>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Submitting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Submit Claim
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
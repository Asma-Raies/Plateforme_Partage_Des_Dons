import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CATEGORIES = ['education', 'health', 'food', 'shelter', 'environment', 'orphans', 'elderly', 'disaster', 'other'];
const WILAYAS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba','Kairouan',
  'Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine','Monastir','Nabeul',
  'Sfax','Sidi Bouzid','Siliana','Sousse','Tataouine','Tozeur','Tunis','Zaghouan',
];

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', wilaya: '',
    location: '', moneyGoal: '', deadline: '',
    needsObjects: false, isUrgent: false, status: 'active',
    objectNeeds: [],
  });
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    api.get(`/campaigns/${id}`)
      .then(({ data }) => {
        const c = data.campaign;
        setForm({
          title: c.title || '',
          description: c.description || '',
          category: c.category || '',
          wilaya: c.wilaya || '',
          location: c.location || '',
          moneyGoal: c.moneyGoal || '',
          deadline: c.deadline ? c.deadline.slice(0, 10) : '',
          needsObjects: c.needsObjects || false,
          isUrgent: c.isUrgent || false,
          status: c.status || 'active',
          objectNeeds: c.objectNeeds || [],
        });
        if (c.coverImage) setPreview(c.coverImage);
      })
      .catch(() => showToast('Failed to load campaign', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, coverImageFile: file }));
    setPreview(URL.createObjectURL(file));
  };

  const addItem = () => {
    if (!newItem.name.trim()) return;
    set('objectNeeds', [...form.objectNeeds, { name: newItem.name.trim(), quantity: Number(newItem.quantity) || 1 }]);
    setNewItem({ name: '', quantity: '' });
  };

  const removeItem = idx => set('objectNeeds', form.objectNeeds.filter((_, i) => i !== idx));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required', 'error');

    setSaving(true);
    try {
      const fd = new FormData();
      const fields = ['title', 'description', 'category', 'wilaya', 'location', 'deadline', 'status'];
      fields.forEach(f => fd.append(f, form[f]));
      fd.append('moneyGoal', form.moneyGoal || 0);
      fd.append('needsObjects', form.needsObjects);
      fd.append('isUrgent', form.isUrgent);
      fd.append('objectNeeds', JSON.stringify(form.objectNeeds));
      if (form.coverImageFile) fd.append('coverImage', form.coverImageFile);

      await api.put(`/campaigns/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Campaign updated successfully!');
      setTimeout(() => navigate(`/association/campaigns/${id}`), 1500);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading…
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Campaign</h1>
          <p className="text-slate-400 text-sm mt-0.5">Update your campaign information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Cover Image</h2>
          <div
            onClick={() => fileRef.current.click()}
            className="relative w-full h-44 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition group">
            {preview
              ? <img src={preview} alt="cover" className="w-full h-full object-cover"/>
              : <div className="flex flex-col items-center justify-center h-full text-slate-400 group-hover:text-blue-400 transition">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-sm font-medium">Click to upload cover image</span>
                </div>
            }
            {preview && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition text-white text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-lg">Change image</span>
              </div>
            )}
          </div>
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFile}/>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h2>

          <Field label="Campaign Title" required>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              className={inputCls} placeholder="Enter campaign title"/>
          </Field>

          <Field label="Description" required>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} className={`${inputCls} resize-none`} placeholder="Describe your campaign…"/>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => set('isUrgent', !form.isUrgent)}
                className={`w-10 h-5 rounded-full transition ${form.isUrgent ? 'bg-orange-500' : 'bg-slate-200'} relative`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isUrgent ? 'translate-x-5' : ''}`}/>
              </div>
              <span className="text-sm text-slate-600 font-medium">Urgent campaign 🚨</span>
            </label>
          </div>
        </div>

        {/* Goal + Deadline + Location */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Goal & Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Money Goal (TND)" hint="Leave 0 for no monetary goal">
              <input type="number" min="0" value={form.moneyGoal} onChange={e => set('moneyGoal', e.target.value)}
                className={inputCls} placeholder="0"/>
            </Field>
            <Field label="Deadline" hint="Donations will be blocked after this date">
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className={inputCls} min={new Date().toISOString().slice(0, 10)}/>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Wilaya">
              <select value={form.wilaya} onChange={e => set('wilaya', e.target.value)} className={inputCls}>
                <option value="">Select wilaya</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label="Location / Address">
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                className={inputCls} placeholder="Street, city…"/>
            </Field>
          </div>
        </div>

        {/* Object needs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Item Donations</h2>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => set('needsObjects', !form.needsObjects)}
                className={`w-10 h-5 rounded-full transition ${form.needsObjects ? 'bg-blue-500' : 'bg-slate-200'} relative`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.needsObjects ? 'translate-x-5' : ''}`}/>
              </div>
              <span className="text-sm text-slate-600">Accept item donations</span>
            </label>
          </div>

          {form.needsObjects && (
            <div className="space-y-3">
              {form.objectNeeds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.objectNeeds.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-xl">
                      <span>{item.name} <span className="text-slate-400">×{item.quantity}</span></span>
                      <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500 transition">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" placeholder="Item name" value={newItem.name}
                  onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  className={`${inputCls} flex-1`} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}/>
                <input type="number" min="1" placeholder="Qty" value={newItem.quantity}
                  onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                  className={`${inputCls} w-20`}/>
                <button type="button" onClick={addItem}
                  className="px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition">
                  + Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition shadow-md shadow-blue-200 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
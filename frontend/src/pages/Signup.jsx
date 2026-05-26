import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

/* ─── tiny helpers ─── */
const cx = (...cls) => cls.filter(Boolean).join(" ");

function Shell({ children, wide = false }) {
  return (
    <div
      className="w-screen min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg,#dbeafe 0%,#eff6ff 45%,#d1fae5 100%)" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-gray-800 tracking-tight">DonationConnect</span>
      </div>
      <div className={cx("bg-white rounded-3xl shadow-xl shadow-blue-100/60 p-8 w-full", wide ? "max-w-2xl" : "max-w-md")}>
        {children}
      </div>
    </div>
  );
}

function StepBar({ step, total }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={cx("w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
            i + 1 <= step ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-400")}>
            {i + 1 < step ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : i + 1}
          </div>
          {i < total - 1 && <div className={cx("w-14 h-0.5 transition-all duration-500", i + 1 < step ? "bg-blue-500" : "bg-gray-200")} />}
        </div>
      ))}
    </div>
  );
}

function RoleCard({ selected, onClick, icon, title, desc }) {
  return (
    <button type="button" onClick={onClick}
      className={cx("w-full text-left p-5 rounded-2xl border-2 transition-all duration-200",
        selected ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100" : "border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50")}>
      <div className="flex items-start gap-3">
        <div className={cx("mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          selected ? "border-blue-500" : "border-gray-300")}>
          {selected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-gray-900">{title}</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white placeholder-gray-400 transition-all duration-200";

function Input(props) { return <input {...props} className={inputCls} />; }

function Spinner({ text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {text}
    </span>
  );
}

/* ─── Address card ─── */
const emptyAddress = () => ({ label: "", street: "", city: "", state: "", country: "", postalCode: "" });

function AddressCard({ index, address, onChange, onRemove, canRemove }) {
  const update = (field, val) => onChange(index, { ...address, [field]: val });
  return (
    <div className="border border-gray-200 rounded-2xl p-4 mb-3 bg-gray-50 relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Address {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)}
            className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition text-xs font-bold">✕</button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input placeholder="Label (e.g. Main Office, Pickup Point)*" value={address.label}
            onChange={e => update("label", e.target.value)} />
        </div>
        <Input placeholder="Street" value={address.street} onChange={e => update("street", e.target.value)} />
        <Input placeholder="City" value={address.city} onChange={e => update("city", e.target.value)} />
        <Input placeholder="State / Region" value={address.state} onChange={e => update("state", e.target.value)} />
        <Input placeholder="Country" value={address.country} onChange={e => update("country", e.target.value)} />
        <Input placeholder="Postal Code" value={address.postalCode} onChange={e => update("postalCode", e.target.value)} />
      </div>
    </div>
  );
}

/* ─── File upload zone ─── */
function FileZone({ files, onChange }) {
  const ref = useRef();
  const handleDrop = e => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onChange(prev => [...prev, ...dropped]);
  };
  const handlePick = e => {
    const picked = Array.from(e.target.files);
    onChange(prev => [...prev, ...picked]);
    e.target.value = "";
  };
  const remove = i => onChange(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => ref.current.click()}
        className="border-2 border-dashed border-blue-300 rounded-2xl p-6 bg-blue-50 hover:bg-blue-100 transition cursor-pointer text-center mb-3"
      >
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handlePick} />
        <div className="text-3xl mb-2">📎</div>
        <p className="text-sm font-medium text-blue-700">Click or drag files here</p>
        <p className="text-xs text-blue-500 mt-1">PDF, JPG, PNG, DOC — multiple files supported</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{f.name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                <div>
                  <p className="text-xs font-medium text-gray-800 truncate max-w-[200px]">{f.name}</p>
                  <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button type="button" onClick={() => remove(i)}
                className="w-5 h-5 rounded-full bg-red-100 text-red-400 text-xs flex items-center justify-center hover:bg-red-200 transition">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DONOR FORM (Step 2 – donor)
═══════════════════════════════════════════ */
function DonorForm({ onBack }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (form.password.length < 6) e.password = "Min. 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setServerError("");
    try {
      const { data } = await api.post("/auth/register", { name: form.name, email: form.email, password: form.password, role: "donor" });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => navigate("/donor/dashboard"), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h2>
      <p className="text-gray-500 text-sm">Redirecting to your dashboard…</p>
      <div className="mt-4 flex justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Your Details</h2>
      <p className="text-gray-500 text-sm text-center mb-6">Create your donor account — it's free</p>
      {serverError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{serverError}</div>}
      <form onSubmit={submit} noValidate>
        <Field label="Full Name" error={errors.name} required><Input type="text" placeholder="Amir Ben Ali" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email Address" error={errors.email} required><Input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Password" error={errors.password} required><Input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Confirm Password" error={errors.confirm} required><Input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /></Field>
        </div>
        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition">← Back</button>
          <button type="submit" disabled={loading} className="flex-[2] py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition shadow-md shadow-blue-200 disabled:opacity-60">
            {loading ? <Spinner text="Creating…" /> : "Create Account"}
          </button>
        </div>
      </form>
    </>
  );
}

/* ═══════════════════════════════════════════
   ASSOCIATION FORM (Step 2 – association)
═══════════════════════════════════════════ */
function AssocForm({ onBack }) {
  const [form, setForm] = useState({ organizationName: "", contactName: "", email: "", password: "", confirm: "", description: "" });
  const [errors, setErrors] = useState({});
  const [addresses, setAddresses] = useState([emptyAddress()]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateAddress = (i, updated) => setAddresses(prev => prev.map((a, idx) => idx === i ? updated : a));
  const removeAddress = i => setAddresses(prev => prev.filter((_, idx) => idx !== i));
  const addAddress = () => setAddresses(prev => [...prev, emptyAddress()]);

  const validate = () => {
    const e = {};
    if (!form.organizationName.trim()) e.organizationName = "Required";
    if (!form.contactName.trim()) e.contactName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.description.trim()) e.description = "Required";
    if (form.password.length < 6) e.password = "Min. 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    if (addresses.some(a => !a.label.trim())) e.addresses = "Each address must have a label";
    if (files.length === 0) e.files = "At least one document is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setServerError("");
    try {
      const fd = new FormData();
      fd.append("name", form.contactName);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("organizationName", form.organizationName);
      fd.append("description", form.description);
      fd.append("addresses", JSON.stringify(addresses));
      files.forEach(f => fd.append("documents", f));
      await api.post("/auth/register-association", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="text-center py-2">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
        <p className="text-sm font-medium text-amber-800 mb-1">📧 Check your inbox</p>
        <p className="text-sm text-amber-700">Confirmation sent to <strong>{form.email}</strong>. Pending admin review.</p>
      </div>
      {[["📝", "Application received", "Under review"], ["🔍", "Admin review", "1–2 business days"], ["✅", "Account activated", "Email notification"]].map(([icon, t, s]) => (
        <div key={t} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-2 text-left">
          <span>{icon}</span><div><p className="text-sm font-medium text-gray-800">{t}</p><p className="text-xs text-gray-500">{s}</p></div>
        </div>
      ))}
      <Link to="/login" className="block w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition text-center mt-4">Back to Login</Link>
    </div>
  );

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Association Details</h2>
      <p className="text-gray-500 text-sm text-center mb-6">Your account will be reviewed by our admin team</p>
      {serverError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{serverError}</div>}

      <form onSubmit={submit} noValidate>
        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Organization Name" error={errors.organizationName} required>
            <Input type="text" placeholder="Hands of Hope Tunisia" value={form.organizationName} onChange={e => setForm({ ...form, organizationName: e.target.value })} />
          </Field>
          <Field label="Contact Person" error={errors.contactName} required>
            <Input type="text" placeholder="Your full name" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
          </Field>
        </div>
        <Field label="Email Address" error={errors.email} required>
          <Input type="email" placeholder="contact@association.org" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Description" error={errors.description} required>
          <textarea rows={3} placeholder="Briefly describe your association's mission…" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className={cx(inputCls, "resize-none")} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Password" error={errors.password} required>
            <Input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Confirm Password" error={errors.confirm} required>
            <Input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </Field>
        </div>

        {/* Addresses */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Addresses <span className="text-red-400">*</span></label>
            <button type="button" onClick={addAddress}
              className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
              + Add Address
            </button>
          </div>
          {errors.addresses && <p className="text-xs text-red-500 mb-2">{errors.addresses}</p>}
          {addresses.map((addr, i) => (
            <AddressCard key={i} index={i} address={addr} onChange={updateAddress} onRemove={removeAddress} canRemove={addresses.length > 1} />
          ))}
        </div>

        {/* Documents */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Supporting Documents <span className="text-red-400">*</span>
            <span className="text-gray-400 font-normal ml-1">(PDF, images — multiple allowed)</span>
          </label>
          {errors.files && <p className="text-xs text-red-500 mb-2">{errors.files}</p>}
          <FileZone files={files} onChange={setFiles} />
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 flex gap-2 items-start">
          <span className="text-sm">⏳</span>
          <p className="text-xs text-amber-700">After submitting, your account will be <strong>pending review</strong>. An email will notify you once approved.</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition">← Back</button>
          <button type="submit" disabled={loading} className="flex-[2] py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition shadow-md shadow-blue-200 disabled:opacity-60">
            {loading ? <Spinner text="Submitting…" /> : "Submit for Review"}
          </button>
        </div>
      </form>
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN SIGNUP
═══════════════════════════════════════════ */
export default function Signup() {
  const [role, setRole] = useState("donor");
  const [step, setStep] = useState(1);

  if (step === 1) return (
    <Shell>
      <StepBar step={1} total={2} />
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Create an Account</h2>
      <p className="text-gray-500 text-sm text-center mb-7">Join our community and start making a difference</p>
      <p className="text-sm font-semibold text-gray-700 mb-3">I want to register as:</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <RoleCard selected={role === "donor"} onClick={() => setRole("donor")} icon="🙋" title="Donor" desc="Make donations to support causes" />
        <RoleCard selected={role === "association"} onClick={() => setRole("association")} icon="🏛️" title="Association" desc="Create campaigns and receive donations" />
      </div>
      {role === "association" && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 items-start">
          <span className="text-sm mt-0.5">ℹ️</span>
          <p className="text-xs text-amber-700">Association accounts require admin approval. You'll be notified by email once activated.</p>
        </div>
      )}
      <button onClick={() => setStep(2)} className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 active:scale-[0.98] transition-all shadow-md shadow-blue-200">
        Continue →
      </button>
      <p className="text-center mt-5 text-sm text-gray-500">Already have an account? <Link to="/login" className="text-blue-500 font-medium hover:underline">Login</Link></p>
    </Shell>
  );

  return (
    <Shell wide>
      <StepBar step={2} total={2} />
      {role === "donor"
        ? <DonorForm onBack={() => setStep(1)} />
        : <AssocForm onBack={() => setStep(1)} />
      }
      <p className="text-center mt-4 text-sm text-gray-500">Already have an account? <Link to="/login" className="text-blue-500 font-medium hover:underline">Login</Link></p>
    </Shell>
  );
}
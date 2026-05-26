import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white placeholder-gray-400 transition-all duration-200";

function Shell({ children }) {
  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg,#dbeafe 0%,#eff6ff 45%,#d1fae5 100%)" }}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-gray-800 tracking-tight">DonationConnect</span>
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/60 p-8 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading…
    </span>
  );
}

/* ── Step 1: Enter email ── */
function StepEmail({ onNext }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async e => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      onNext(email);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Forgot Password?</h2>
      <p className="text-gray-500 text-sm text-center mb-7">Enter your email and we'll send you a 6-digit verification code.</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
      <form onSubmit={submit} noValidate>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 active:scale-[0.98] transition-all shadow-md shadow-blue-200 disabled:opacity-60">
          {loading ? <Spinner /> : "Send Verification Code"}
        </button>
      </form>
      <p className="text-center mt-5 text-sm text-gray-500">
        Remembered it? <Link to="/login" className="text-blue-500 font-medium hover:underline">Back to Login</Link>
      </p>
    </>
  );
}

/* ── Step 2: Enter 6-digit code ── */
function StepCode({ email, onNext, onBack }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const refs = Array.from({ length: 6 }, () => null);
  const storeRef = (i, el) => { refs[i] = el; };

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) refs[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs[i - 1]?.focus();
  };

  const handlePaste = e => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      refs[5]?.focus();
    }
    e.preventDefault();
  };

  const submit = async e => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) { setError("Please enter the complete 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/verify-reset-code", { email, code: fullCode });
      onNext(fullCode);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResendLoading(true); setResendMsg("");
    try {
      await api.post("/auth/forgot-password", { email });
      setResendMsg("A new code has been sent to your email.");
      setCode(["", "", "", "", "", ""]);
    } catch {
      setResendMsg("Failed to resend. Try again.");
    } finally { setResendLoading(false); }
  };

  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Check Your Email</h2>
      <p className="text-gray-500 text-sm text-center mb-2">We sent a 6-digit code to</p>
      <p className="text-blue-600 font-semibold text-sm text-center mb-6 truncate">{email}</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
      {resendMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{resendMsg}</div>}

      <form onSubmit={submit} noValidate>
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => storeRef(i, el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white transition-all duration-200 text-gray-900"
            />
          ))}
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-all shadow-md shadow-blue-200 disabled:opacity-60">
          {loading ? <Spinner /> : "Verify Code"}
        </button>
      </form>

      <div className="flex items-center justify-between mt-5">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 hover:underline">← Change email</button>
        <button onClick={resend} disabled={resendLoading} className="text-sm text-blue-500 font-medium hover:underline disabled:opacity-50">
          {resendLoading ? "Sending…" : "Resend code"}
        </button>
      </div>
    </>
  );
}

/* ── Step 3: New password ── */
function StepReset({ email, code, onDone }) {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (form.password.length < 6) e.password = "Min. 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async ev => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true); setServerError("");
    try {
      await api.post("/auth/reset-password", { email, code, newPassword: form.password });
      onDone();
    } catch (err) {
      setServerError(err.response?.data?.message || "Reset failed. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Set New Password</h2>
      <p className="text-gray-500 text-sm text-center mb-7">Choose a strong password for your account.</p>
      {serverError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{serverError}</div>}
      <form onSubmit={submit} noValidate>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <div className="relative">
            <input type={showPwd ? "text" : "password"} placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className={inputCls + " pr-11"} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPwd
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input type="password" placeholder="Repeat new password"
            value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
            className={inputCls} />
          {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-all shadow-md shadow-blue-200 disabled:opacity-60">
          {loading ? <Spinner /> : "Reset Password"}
        </button>
      </form>
    </>
  );
}

/* ── Step 4: Success ── */
function StepSuccess() {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
      <p className="text-gray-500 text-sm mb-6">Your password has been updated successfully. You can now log in with your new credentials.</p>
      <Link to="/login" className="block w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition text-center shadow-md shadow-blue-200">
        Go to Login
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email 2=code 3=newpwd 4=done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  return (
    <Shell>
      {step === 1 && <StepEmail onNext={mail => { setEmail(mail); setStep(2); }} />}
      {step === 2 && <StepCode email={email} onNext={c => { setCode(c); setStep(3); }} onBack={() => setStep(1)} />}
      {step === 3 && <StepReset email={email} code={code} onDone={() => setStep(4)} />}
      {step === 4 && <StepSuccess />}
    </Shell>
  );
}
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "../../api/axios.js";
import { useDonorContext } from "../../contexts/DonorContext";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

function getInitials(name) {
  return name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "AS";
}

const CARD_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1e293b",
      fontFamily: "system-ui, sans-serif",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#ef4444" },
  },
};

/* ─── SUCCESS ─── */
function SuccessScreen({ campaign, amount, countdown, onNavigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Donation Successful!</h2>
        <p className="text-slate-500 text-sm mb-6">Thank you for your generosity.</p>
        <div className="bg-slate-50 rounded-2xl p-5 text-left mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Campaign</span>
            <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{campaign.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Organization</span>
            <span className="font-semibold text-slate-800">{campaign.association?.organizationName || "—"}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between">
            <span className="font-semibold text-slate-700">Total Donated</span>
            <span className="font-bold text-blue-600 text-lg">{amount} TND</span>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-600 flex-1">Redirecting in <strong>{countdown}s</strong></p>
          <div className="w-16 bg-blue-200 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${(countdown / 4) * 100}%` }} />
          </div>
        </div>
        <button onClick={onNavigate} className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm">
          Go to Dashboard →
        </button>
        <p className="text-xs text-slate-400 mt-3">A receipt has been sent to your email</p>
      </div>
    </div>
  );
}

/* ─── FORM ─── */
function CheckoutForm({ campaign }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { setActiveView } = useDonorContext();

  const QUICK = [25, 50, 100, 250];
  const [amount,     setAmount]     = useState(null);
  const [custom,     setCustom]     = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [message,    setMessage]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);
  const [countdown,  setCountdown]  = useState(4);
  const [cardFocus,  setCardFocus]  = useState(false);

  const finalAmt = showCustom ? (Number(custom) || 0) : (amount || 0);
  const raised   = campaign.moneyRaised || 0;
  const goal     = campaign.moneyGoal   || 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  useEffect(() => {
    if (success) {
      const iv = setInterval(() => {
        setCountdown(p => {
          if (p <= 1) { clearInterval(iv); navigate("/donor"); return 0; }
          return p - 1;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!finalAmt || finalAmt <= 0) { setError("Please select or enter an amount."); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post("/donations/create-intent", { campaignId: campaign._id, amount: finalAmt });
      const { error: stripeErr } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { name: "Donor" } },
      });
      if (stripeErr) { setError(stripeErr.message); return; }
      setTimeout(() => {
        localStorage.setItem("lastDonationTime", Date.now().toString());
        window.dispatchEvent(new Event("donationSuccess"));
      }, 500);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessScreen campaign={campaign} amount={finalAmt} countdown={countdown} onNavigate={() => navigate("/donor")} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-slate-50">

      {/* Breadcrumb nav */}
      <div className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center gap-2">
        <button onClick={() => { setActiveView?.("campaigns"); navigate(-1); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Campaigns
        </button>
        <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm text-slate-500 truncate max-w-xs">{campaign.title}</span>
      </div>

      {/* Page header */}
      <div className="text-center pt-10 pb-8 px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-1.5">Complete Your Donation</h1>
        <p className="text-slate-500 text-sm">{campaign.title}</p>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto px-4 pb-16 flex flex-col lg:flex-row gap-6 items-start">

          {/* ══ LEFT ══ */}
          <div className="flex-1 space-y-4">

            {/* Donation Details card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-5">Donation Details</h2>

              {/* Select Amount */}
              <p className="text-sm font-medium text-slate-600 mb-3">Select Amount</p>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {QUICK.map(v => (
                  <button key={v} type="button"
                    onClick={() => { setAmount(v); setShowCustom(false); setCustom(""); }}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      !showCustom && amount === v
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    {v} TND
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              {!showCustom ? (
                <button type="button"
                  onClick={() => { setShowCustom(true); setAmount(null); }}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition"
                >
                  Custom Amount
                </button>
              ) : (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">TND</span>
                  <input type="number" min="1" value={custom} onChange={e => setCustom(e.target.value)}
                    placeholder="Enter custom amount" autoFocus
                    className="w-full pl-14 pr-4 py-3.5 rounded-xl border-2 border-blue-400 bg-blue-50/40 text-slate-800 text-sm font-semibold focus:outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* Message */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">
                Message <span className="text-slate-400 font-normal text-sm">(Optional)</span>
              </h2>
              <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Leave a message of support..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition resize-none placeholder-slate-400"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Payment Method</h2>

              {/* Card selector pill */}
              <div className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3.5 mb-5 cursor-pointer select-none transition ${cardFocus ? "border-blue-500 bg-blue-50/30" : "border-blue-500 bg-blue-50/10"}`}>
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-semibold text-slate-700">Credit / Debit Card</span>
              </div>

              {/* Stripe card element */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Card Details</label>
                  <div className={`border-2 rounded-xl px-4 py-4 bg-slate-50 transition-all ${cardFocus ? "border-blue-400 bg-white shadow-sm" : "border-slate-200"}`}>
                    <CardElement options={CARD_STYLE} onFocus={() => setCardFocus(true)} onBlur={() => setCardFocus(false)} />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-3">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-slate-500">Your payment information is secure and encrypted</p>
              </div>

              {/* Test hint */}
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-600">
                  Test card: <strong className="font-mono">4242 4242 4242 4242</strong> · any future date · any CVV
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Donate button */}
            <button type="submit" disabled={loading || !stripe || finalAmt <= 0}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Processing…
                </>
              ) : `Donate ${finalAmt > 0 ? `${finalAmt} TND` : ""}`}
            </button>
          </div>

          {/* ══ RIGHT — Summary ══ */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-base font-semibold text-slate-800 mb-5">Donation Summary</h2>

              {/* Campaign + org */}
              <div className="space-y-4 mb-5 pb-5 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Campaign</p>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{campaign.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Organization</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {campaign.association?.logo
                        ? <img src={campaign.association.logo} alt="" className="w-full h-full object-cover"/>
                        : <span className="text-[9px] font-bold text-blue-600">{getInitials(campaign.association?.organizationName)}</span>
                      }
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{campaign.association?.organizationName || "—"}</p>
                  </div>
                </div>

                {/* Progress bar if has goal */}
                {goal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Raised</span>
                      <span className="font-semibold text-slate-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all ${progress >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-slate-400">
                      <span>{raised.toLocaleString()} TND</span>
                      <span>of {goal.toLocaleString()} TND</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amounts */}
              <div className="space-y-3 mb-5 pb-5 border-b border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Donation Amount</span>
                  <span className="font-semibold text-slate-800">{finalAmt > 0 ? `${finalAmt} TND` : "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Processing Fee</span>
                  <span className="font-semibold text-slate-800">0</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-5">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-blue-600">{finalAmt > 0 ? `${finalAmt} TND` : "0"}</span>
              </div>

              {/* 100% badge */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">100% goes to the cause</p>
                  <p className="text-xs text-emerald-600 mt-0.5">We cover all processing fees</p>
                </div>
              </div>

              {/* Trust list */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                {[
                  { icon: "🔒", text: "256-bit SSL encryption" },
                  { icon: "✅", text: "Verified organization" },
                  { icon: "📧", text: "Instant email receipt" },
                ].map(t => (
                  <div key={t.text} className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{t.icon}</span><span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── PAGE WRAPPER ─── */
export default function DonatePage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get(`/campaigns/${campaignId}`)
      .then(res => setCampaign(res.data?.campaign || null))
      .catch(() => navigate("/donor"))
      .finally(() => setLoading(false));
  }, [campaignId, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <svg className="animate-spin w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  if (!campaign) return null;

  if (!stripePromise) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
        <span className="text-5xl mb-4 block">⚠️</span>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Payments Unavailable</h2>
        <p className="text-sm text-slate-500 mb-6">Add <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">VITE_STRIPE_PUBLIC_KEY</code> to your environment file.</p>
        <button onClick={() => navigate("/donor")} className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm campaign={campaign} />
    </Elements>
  );
}
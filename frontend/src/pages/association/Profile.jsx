import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/users/profile";

const C = {
  navy:    "#0d1f4e",
  navy2:   "#162d6e",
  blue:    "#1e4db7",
  blueMid: "#2563eb",
  light:   "#e8eef8",
  border:  "#dce4f5",
  muted:   "#7a8fad",
  white:   "#ffffff",
  bg:      "#f4f7fc",
  success: "#1a6b3c",
  successBg: "#f0faf4",
  successBorder: "#a3d9b1",
  error:   "#c0392b",
  errorBg: "#fff5f5",
  errorBorder: "#f5c6c6",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Outfit:wght@300;400;500;600&display=swap');`;

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

/* ── Reusable components ── */
const Label = ({ children }) => (
  <p style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: "7px", fontFamily: "'Outfit', sans-serif" }}>
    {children}
  </p>
);

const Value = ({ children, large }) => (
  <p style={{ fontSize: large ? "17px" : "14px", fontWeight: large ? "600" : "400", color: C.navy, fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
    {children || "—"}
  </p>
);

const InputField = ({ multiline, rows, ...props }) => {
  const base = {
    width: "100%", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: "10px",
    color: C.navy, fontSize: "14px", fontFamily: "'Outfit', sans-serif", fontWeight: "400",
    padding: "11px 14px", outline: "none", transition: "border-color .2s, box-shadow .2s",
  };
  const focus = e => { e.target.style.borderColor = C.blueMid; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.1)`; };
  const blur  = e => { e.target.style.borderColor = C.border;  e.target.style.boxShadow = "none"; };
  if (multiline) return <textarea {...props} rows={rows || 4} style={{ ...base, resize: "vertical", minHeight: "100px" }} onFocus={focus} onBlur={blur} />;
  return <input {...props} style={base} onFocus={focus} onBlur={blur} />;
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.white, borderRadius: "18px", border: `1.5px solid ${C.border}`, padding: "32px", ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children, tag }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: C.navy, fontWeight: "500" }}>{children}</h2>
    {tag && <span style={{ background: C.light, color: C.navy2, fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 14px", borderRadius: "100px", fontFamily: "'Outfit', sans-serif" }}>{tag}</span>}
  </div>
);

const Divider = () => <div style={{ height: "1px", background: C.border }} />;

export default function AssociationProfile() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const [formData, setFormData] = useState({ name: "", organizationName: "", email: "", phone: "", description: "", addresses: [] });

useEffect(() => {
  const token = localStorage.getItem("token");
  const stored = JSON.parse(localStorage.getItem("user") || "null");

  if (!stored || stored.role !== "association" || !token) {
    navigate("/login");
    return;
  }

  // Fetch fresh data from DB instead of trusting localStorage
  axios
    .get("http://localhost:5000/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(({ data }) => {
      // Sync localStorage with fresh data
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setFormData({
        name: data.name || "",
        organizationName: data.organizationName || "",
        email: data.email || "",
        phone: data.phone || "",
        description: data.description || "",
        addresses: data.addresses || [],
      });
    })
    .catch(() => {
      // Token expired or invalid — fall back to localStorage or redirect
      navigate("/login");
    });
}, [navigate]);

  const addAddress = () => setFormData(p => ({
    ...p,
    addresses: [...p.addresses, { label: "", street: "", city: "", country: "Tunisia", postalCode: "", location: { type: "Point", coordinates: [10.1815, 36.8065] } }],
  }));

  const removeAddress = i => setFormData(p => ({ ...p, addresses: p.addresses.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setLoading(true); setError(""); setSuccess(false);
    for (let addr of formData.addresses) {
      if (!addr.label?.trim()) { setError("All addresses must have a label"); setLoading(false); return; }
    }
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(API, formData, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user); setIsEditing(false); setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally { setLoading(false); }
  };

  const handleCancel = () => {
    setFormData({ name: user.name || "", organizationName: user.organizationName || "", email: user.email || "", phone: user.phone || "", description: user.description || "", addresses: user.addresses || [] });
    setIsEditing(false); setError("");
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif", color: C.muted }}>
      Loading profile…
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* ── Navbar ── */}
      <nav style={{ background: C.navy, height: "58px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", background: C.blue, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", color: C.white, fontSize: "15px", fontWeight: "600" }}>A</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.06em" }}>Association Portal</span>
        </div>
        <button onClick={() => navigate("/association/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: "13px", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: "6px" }}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}>
          ← Dashboard
        </button>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 100%)`, padding: "52px 48px 80px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", alignItems: "center", gap: "28px" }}>
          {/* Org avatar — square for associations */}
          <div style={{ width: "84px", height: "84px", borderRadius: "16px", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.18)", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", color: C.white, fontWeight: "500", letterSpacing: "1px" }}>
              {getInitials(formData.organizationName || formData.name) || "ORG"}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>Association Profile</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,4vw,46px)", color: C.white, fontWeight: "400", lineHeight: 1.1 }}>
              {formData.organizationName || formData.name || "Your Organization"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{formData.email}</span>
              {user.isApproved
                ? <span style={{ background: "rgba(26,107,60,0.35)", color: "#7fff9e", fontSize: "11px", fontWeight: "600", padding: "3px 12px", borderRadius: "100px", letterSpacing: "0.06em" }}>Approved</span>
                : <span style={{ background: "rgba(180,140,0,0.3)", color: "#ffd96b", fontSize: "11px", fontWeight: "600", padding: "3px 12px", borderRadius: "100px", letterSpacing: "0.06em" }}>Pending</span>}
            </div>
          </div>

          {!isEditing && (
            <button onClick={() => setIsEditing(true)} style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: "10px", color: C.white, fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", padding: "11px 24px", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: "960px", margin: "-36px auto 0", padding: "0 48px 80px" }}>

        {success && (
          <div style={{ background: C.successBg, border: `1.5px solid ${C.successBorder}`, borderRadius: "12px", color: C.success, padding: "13px 20px", marginBottom: "20px", fontSize: "13px", fontWeight: "500" }}>
            ✓ Profile updated successfully
          </div>
        )}
        {error && (
          <div style={{ background: C.errorBg, border: `1.5px solid ${C.errorBorder}`, borderRadius: "12px", color: C.error, padding: "13px 20px", marginBottom: "20px", fontSize: "13px", fontWeight: "500" }}>
            ✕ {error}
          </div>
        )}

        {/* Row 1: Identity + Account */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>

          {/* Identity card */}
          <Card>
            <SectionTitle tag="Identity">Organization Info</SectionTitle>

            <div style={{ marginBottom: "20px" }}>
              <Label>Organization Name</Label>
              {isEditing ? <InputField type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} placeholder="Full organization name" /> : <Value large>{formData.organizationName}</Value>}
            </div>
            <Divider />
            <div style={{ margin: "20px 0" }}>
              <Label>Contact Person</Label>
              {isEditing ? <InputField type="text" name="name" value={formData.name} onChange={handleChange} /> : <Value>{formData.name}</Value>}
            </div>
            <Divider />
            <div style={{ margin: "20px 0" }}>
              <Label>Email Address</Label>
              {isEditing ? <InputField type="email" name="email" value={formData.email} onChange={handleChange} /> : <Value>{formData.email}</Value>}
            </div>
            <Divider />
            <div style={{ marginTop: "20px" }}>
              <Label>Phone Number</Label>
              {isEditing ? <InputField type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+216 XX XXX XXX" /> : <Value>{formData.phone}</Value>}
            </div>
          </Card>

          {/* Account overview */}
          <Card>
            <SectionTitle tag="Overview">Account</SectionTitle>
            {[
              { label: "Type", value: "Association" },
              { label: "Status", value: user.status === "active" ? "Active" : user.status, color: user.status === "active" ? C.success : C.error },
              { label: "Approval", value: user.isApproved ? "Approved" : "Pending Approval", color: user.isApproved ? C.success : "#a07000" },
              { label: "Locations", value: `${formData.addresses.length} address${formData.addresses.length !== 1 ? "es" : ""}` },
              { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "—" },
            ].map(({ label, value, color }, idx, arr) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0" }}>
                  <span style={{ fontSize: "13px", color: C.muted }}>{label}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: color || C.navy }}>{value}</span>
                </div>
                {idx < arr.length - 1 && <Divider />}
              </div>
            ))}
          </Card>
        </div>

        {/* About / Description */}
        <Card style={{ marginBottom: "18px" }}>
          <SectionTitle tag="About">Organization Description</SectionTitle>
          {isEditing
            ? <InputField multiline name="description" value={formData.description} onChange={handleChange} placeholder="Tell donors about your organization, its mission, and the impact it creates…" rows={5} />
            : <p style={{ fontSize: "14px", color: formData.description ? C.navy : C.muted, lineHeight: "1.75", fontFamily: "'Outfit', sans-serif", fontStyle: formData.description ? "normal" : "italic" }}>
                {formData.description || "No description provided."}
              </p>}
        </Card>

        {/* Locations */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: C.navy, fontWeight: "500" }}>Locations</h2>
            {isEditing && (
              <button onClick={addAddress} style={{ background: C.light, border: "none", borderRadius: "10px", color: C.navy2, fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "600", padding: "10px 20px", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = C.border}
                onMouseLeave={e => e.currentTarget.style.background = C.light}>
                + Add Location
              </button>
            )}
          </div>

          {formData.addresses.length === 0 ? (
            <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: "12px", padding: "44px", textAlign: "center", color: C.muted, fontSize: "13px" }}>
              No locations added yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {formData.addresses.map((addr, i) => (
                <div key={i} style={{ border: `1.5px solid ${C.border}`, borderRadius: "14px", padding: "24px 28px", background: C.bg, transition: "box-shadow .2s, border-color .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#b0c4e8"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(13,31,78,0.07)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    {isEditing
                      ? <InputField type="text" value={addr.label || ""} onChange={e => handleAddrChange(i, "label", e.target.value)} placeholder="Location label (e.g. Main Office)" style={{ maxWidth: "280px" }} />
                      : <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "8px", height: "8px", background: C.blue, borderRadius: "2px" }} />
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: "500", color: C.navy }}>{addr.label || "Untitled Location"}</span>
                        </div>}
                    {isEditing && (
                      <button onClick={() => removeAddress(i)} style={{ background: "#fff1f1", border: "1.5px solid #fcc", borderRadius: "8px", color: "#c0392b", fontFamily: "'Outfit',sans-serif", fontSize: "12px", fontWeight: "500", padding: "7px 16px", cursor: "pointer" }}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {[["Street", "street"], ["City", "city"], ["Country", "country"], ["Postal Code", "postalCode"]].map(([lbl, fld]) => (
                      <div key={fld}>
                        <Label>{lbl}</Label>
                        {isEditing
                          ? <InputField type="text" value={addr[fld] || ""} onChange={e => handleAddrChange(i, fld, e.target.value)} />
                          : <Value>{addr[fld]}</Value>}
                      </div>
                    ))}
                  </div>

                  {isEditing && addr.location?.coordinates && (
                    <p style={{ fontSize: "11px", color: C.muted, marginTop: "14px" }}>
                      Coordinates: {addr.location.coordinates[0]}, {addr.location.coordinates[1]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Save / Cancel */}
        {isEditing && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button onClick={handleCancel} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: "10px", color: C.navy, fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", padding: "12px 28px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} style={{ background: loading ? C.muted : C.navy, border: "none", borderRadius: "10px", color: C.white, fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "600", padding: "12px 32px", cursor: loading ? "not-allowed" : "pointer", transition: "background .2s" }}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
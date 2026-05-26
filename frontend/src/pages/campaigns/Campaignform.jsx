import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const CATEGORIES = [
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

const UNITS = [
  "pcs",
  "kg",
  "L",
  "boxes",
  "bags",
  "pairs",
  "sets",
  "meals",
  "units",
];

function Field({ label, required, error, hint, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition placeholder-slate-400 ${className}`}
    />
  );
}

export default function CampaignForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "education",
    moneyGoal: "",
    needsObjects: false,
    deadline: "",
    location: "",
    wilaya: "",
    status: "active",
    isUrgent: false,
  });

  const [objectNeeds, setObjectNeeds] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [errors, setErrors] = useState({});

  /* ── Load campaign for editing ── */
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/campaigns/${id}`)
      .then(({ data }) => {
        const c = data.campaign;
        setForm({
          title: c.title,
          description: c.description,
          category: c.category,
          moneyGoal: c.moneyGoal || "",
          needsObjects: c.needsObjects,
          deadline: c.deadline?.slice(0, 10) || "",
          location: c.location || "",
          wilaya: c.wilaya || "",
          status: c.status,
          isUrgent: c.isUrgent || false,
        });
        setObjectNeeds(c.objectNeeds || []);
        if (c.coverImage) setImagePreview(c.coverImage);
      })
      .catch(() => setError("Failed to load campaign"))
      .finally(() => setFetching(false));
  }, [id]);

  /* ── Object needs helpers ── */
  const addNeed = () =>
    setObjectNeeds((prev) => [
      ...prev,
      { name: "", quantity: 1, unit: "pcs", description: "" },
    ]);

  const updateNeed = (i, field, val) => {
    setObjectNeeds((prev) =>
      prev.map((n, idx) => (idx === i ? { ...n, [field]: val } : n)),
    );
  };

  const removeNeed = (i) =>
    setObjectNeeds((prev) => prev.filter((_, idx) => idx !== i));

  /* ── Image preview ── */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category) e.category = "Select a category";
    if (!form.deadline) e.deadline = "Deadline is required";
    if (form.deadline && new Date(form.deadline) < new Date())
      e.deadline = "Deadline must be in the future";
    if (form.moneyGoal && isNaN(Number(form.moneyGoal)))
      e.moneyGoal = "Must be a number";
    if (form.needsObjects && objectNeeds.length === 0)
      e.objectNeeds = "Add at least one needed item";
    if (form.needsObjects) {
      objectNeeds.forEach((n, i) => {
        if (!n.name.trim()) e[`need_${i}`] = "Item name required";
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("objectNeeds", JSON.stringify(objectNeeds));
      if (coverFile) fd.append("coverImage", coverFile);

      if (isEdit) {
        await api.put(`/campaigns/${id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/campaigns", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate("/association/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <svg
          className="animate-spin w-6 h-6 mr-2"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Loading campaign…
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "Edit Campaign" : "Create New Campaign"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isEdit
              ? "Update your campaign details"
              : "Fill in the details to launch your campaign"}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Cover Image ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Cover Image
            </h2>
            <label
              className={`flex flex-col items-center justify-center w-full rounded-2xl cursor-pointer transition-all overflow-hidden
              ${imagePreview ? "h-52" : "h-36 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"}`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">
                    Click to upload cover image
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    JPG, PNG, WebP — max 5MB
                  </p>
                </div>
              )}
            </label>
            {imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setCoverFile(null);
                }}
                className="mt-2 text-xs text-red-400 hover:text-red-600 transition"
              >
                Remove image
              </button>
            )}
          </div>

          {/* ── Basic Info ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Basic Information
            </h2>

            <Field label="Campaign Title" required error={errors.title}>
              <Input
                type="text"
                placeholder="e.g. School Supplies for 200 Children in Sfax"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {form.title.length}/120
              </p>
            </Field>

            <Field
              label="Description"
              required
              error={errors.description}
              hint="Explain what this campaign is for, who benefits, and how donations will be used"
            >
              <textarea
                rows={5}
                placeholder="Describe your campaign…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={2000}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition placeholder-slate-400 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {form.description.length}/2000
              </p>
            </Field>

            <Field label="Category" required error={errors.category}>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* ── Money Goal ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">
              Money Goal
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Leave empty if this campaign doesn't need monetary donations
            </p>

            <Field label="Goal Amount (TND)" error={errors.moneyGoal}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  TND
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.moneyGoal}
                  onChange={(e) =>
                    setForm({ ...form, moneyGoal: e.target.value })
                  }
                  className="pl-14"
                />
              </div>
            </Field>
          </div>

          {/* ── Object / Material Needs ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  Material / Object Needs
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  List specific items your association needs (clothes, food,
                  medicine…)
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${form.needsObjects ? "bg-blue-500" : "bg-slate-200"}`}
                  onClick={() =>
                    setForm((f) => ({ ...f, needsObjects: !f.needsObjects }))
                  }
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform shadow ${form.needsObjects ? "translate-x-5" : "translate-x-1"}`}
                  />
                </div>
                <span className="text-xs text-slate-600">Enable</span>
              </label>
            </div>

            {form.needsObjects && (
              <div className="mt-4 space-y-3">
                {errors.objectNeeds && (
                  <p className="text-xs text-red-500">{errors.objectNeeds}</p>
                )}
                {objectNeeds.map((need, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                  >
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="col-span-2">
                        <Input
                          type="text"
                          placeholder="Item name (e.g. Winter coats)"
                          value={need.name}
                          onChange={(e) =>
                            updateNeed(i, "name", e.target.value)
                          }
                        />
                        {errors[`need_${i}`] && (
                          <p className="text-xs text-red-500 mt-0.5">
                            {errors[`need_${i}`]}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={need.quantity}
                          onChange={(e) =>
                            updateNeed(i, "quantity", e.target.value)
                          }
                          className="w-20"
                        />
                        <select
                          value={need.unit}
                          onChange={(e) =>
                            updateNeed(i, "unit", e.target.value)
                          }
                          className="flex-1 px-2 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {UNITS.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Optional note (e.g. size 38-42, men's)"
                        value={need.description}
                        onChange={(e) =>
                          updateNeed(i, "description", e.target.value)
                        }
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeNeed(i)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addNeed}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add needed item
                </button>
              </div>
            )}
          </div>

          {/* ── Date & Location ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Date & Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Campaign Deadline" required error={errors.deadline}>
                <Input
                  type="date"
                  value={form.deadline}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                />
              </Field>
              <Field label="Wilaya / Region">
                <Input
                  type="text"
                  placeholder="e.g. Tunis, Sfax, Sousse"
                  value={form.wilaya}
                  onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Full Address / Location">
              <Input
                type="text"
                placeholder="Specific address or area"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
          </div>

          {/* ── Status ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Visibility
            </h2>
            <div className="flex gap-3">
              {["active", "draft"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border-2 ${
                    form.status === s
                      ? s === "active"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-400 bg-slate-100 text-slate-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {s === "active" ? "🟢 Publish now" : "📝 Save as draft"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Priority/Urgent ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-7">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Priority
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) =>
                  setForm({ ...form, isUrgent: e.target.checked })
                }
                className="w-5 h-5 rounded border-slate-300 text-red-500 focus:ring-red-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Mark as Urgent
                </p>
                <p className="text-xs text-slate-500">
                  Urgent campaigns get highlighted to attract more donors
                </p>
              </div>
            </label>
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-200 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  {isEdit ? "Saving…" : "Creating…"}
                </span>
              ) : isEdit ? (
                "✓ Save Changes"
              ) : (
                "🚀 Launch Campaign"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";
import { uploadOrderFile } from "../lib/imageUpload";
import { useAdmin } from "../contexts/AdminContext";

const PENDING_ORDER_KEY = "itc_pending_order";

/* ── Field type icon map ── */
const FIELD_ICONS = {
  text: "fa-pen-line",
  email: "fa-envelope",
  number: "fa-hashtag",
  textarea: "fa-align-left",
  image: "fa-image",
  file: "fa-file-arrow-up",
};

export default function ServiceForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = useParams();
  const { loading, findServiceById } = useAdmin();

  const [form, setForm] = useState({});
  const [filePreviews, setFilePreviews] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [resolvedService, setResolvedService] = useState(
    location.state?.service || null,
  );
  const [resolving, setResolving] = useState(
    !location.state?.service && !!serviceId,
  );

  /* ── Resolve service from URL param ── */
  useEffect(() => {
    if (!resolving || loading) return;
    const found = serviceId ? findServiceById(serviceId) : null;
    if (found) setResolvedService(found);
    setResolving(false);
  }, [resolving, loading, serviceId, findServiceById]);

  /* ── SEO meta ── */
  useEffect(() => {
    if (!resolvedService) return;
    const s = resolvedService;
    const title = `${s.name} | IFFY'S TECH EDU CONSULT`;
    const desc =
      s.description?.trim() ||
      `${s.name} — Premium service at IFFY'S TECH EDU CONSULT.`;
    const url = `${window.location.origin}${window.location.pathname}`;
    const image =
      s.image || `${window.location.origin}/android-chrome-512x512.png`;
    document.title = title;
    const setMeta = (sel, attr, name, content) => {
      let el = document.head.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:type"]', "property", "og:type", "product");
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      desc,
    );
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[name="twitter:url"]', "name", "twitter:url", url);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      desc,
    );
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
  }, [resolvedService]);

  /* ── File handling ── */
  const handleFileChange = async (fieldName, file) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) =>
        setFilePreviews((p) => ({ ...p, [fieldName]: e.target.result }));
      reader.readAsDataURL(file);
    } else {
      setFilePreviews((p) => ({ ...p, [fieldName]: file.name }));
    }
    setUploadErrors((p) => ({ ...p, [fieldName]: null }));
    setUploading((p) => ({ ...p, [fieldName]: true }));
    setForm((p) => ({ ...p, [fieldName]: null }));
    try {
      const publicUrl = await uploadOrderFile(file);
      setForm((p) => ({ ...p, [fieldName]: publicUrl }));
    } catch {
      setUploadErrors((p) => ({
        ...p,
        [fieldName]: "Upload failed. Please try again.",
      }));
      setFilePreviews((p) => ({ ...p, [fieldName]: null }));
    } finally {
      setUploading((p) => ({ ...p, [fieldName]: false }));
    }
  };

  /* ── Submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(uploading).some(Boolean)) {
      alert("Please wait for all files to finish uploading.");
      return;
    }
    const s = resolvedService;
    const pendingOrder = {
      serviceId: s.id,
      service: { id: s.id, name: s.name, price: s.price, fields: s.fields },
      formData: form,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pendingOrder));
    } catch {
      /* ignore */
    }
    navigate("/payment", { state: { pendingOrder } });
  };

  /* ── Loading / not found ── */
  if (loading || resolving) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Loading service…
          </p>
        </div>
      </div>
    );
  }

  if (!resolvedService) {
    navigate("/");
    return null;
  }

  const service = resolvedService;
  const anyUploading = Object.values(uploading).some(Boolean);
  const totalFields = service.fields?.length || 0;
  const filledFields = service.fields?.filter((f) => form[f.name]).length || 0;
  const progress =
    totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  /* ── Field renderer ── */
  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] " +
    "text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] " +
    "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(26,67,40,0.12)] " +
    "transition-all duration-200";

  const renderField = (field, index) => {
    const value = form[field.name] || "";
    const isUploading = uploading[field.name];
    const uploadError = uploadErrors[field.name];
    const preview = filePreviews[field.name];
    const isDone = !!form[field.name] && !isUploading;
    const onChange = (val) => setForm((p) => ({ ...p, [field.name]: val }));
    const icon = FIELD_ICONS[field.type] || "fa-pen-line";

    return (
      <div key={index} className="group">
        {/* Label row */}
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <span className="w-5 h-5 rounded-md bg-[var(--primary)] flex items-center justify-center shrink-0">
              <i className={`fas ${icon} text-[var(--secondary)] text-[9px]`} />
            </span>
            {field.name}
            {field.required && (
              <span className="text-[var(--danger)] text-xs font-bold">*</span>
            )}
          </label>
          {isDone && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
              <i className="fas fa-circle-check text-[10px]" /> Saved
            </span>
          )}
          {isUploading && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-500">
              <i className="fas fa-spinner fa-spin text-[10px]" /> Uploading…
            </span>
          )}
        </div>

        {/* Input by type */}
        {field.type === "textarea" && (
          <textarea
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder={`Enter ${field.name.toLowerCase()}…`}
            className={inputBase + " resize-none"}
          />
        )}

        {(field.type === "image" || field.type === "file") && (
          <div>
            <label
              className={`flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed
                cursor-pointer transition-all duration-200 py-7
                ${
                  isDone
                    ? "border-[var(--primary)] bg-[#e8f0eb]"
                    : isUploading
                      ? "border-[var(--border)] bg-[var(--background)] opacity-60 cursor-not-allowed"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[#f0f4f2]"
                }`}
            >
              <input
                type="file"
                accept={field.type === "image" ? "image/*" : undefined}
                required={field.required && !form[field.name]}
                onChange={(e) =>
                  handleFileChange(field.name, e.target.files[0])
                }
                disabled={isUploading}
                className="hidden"
              />
              {/* Image preview */}
              {field.type === "image" && preview && !isUploading && (
                <img
                  src={preview}
                  alt={field.name}
                  className="max-h-36 object-contain rounded-lg"
                />
              )}
              {/* File name */}
              {field.type === "file" && preview && !isUploading && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[var(--border)]">
                  <i className="fas fa-file text-[var(--primary)]" />
                  <span className="text-sm text-[var(--text)] font-medium truncate max-w-[200px]">
                    {preview}
                  </span>
                </div>
              )}
              {/* Placeholder */}
              {!preview && !isUploading && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center shadow-sm">
                    <i
                      className={`fas ${icon} text-[var(--primary)] text-lg`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {field.type === "image" ? "Upload image" : "Upload file"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {field.type === "image"
                        ? "JPG, PNG, WEBP"
                        : "Any format accepted"}
                    </p>
                  </div>
                </>
              )}
              {isUploading && (
                <div className="flex flex-col items-center gap-2">
                  <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
                  <p className="text-sm text-[var(--text-muted)]">Uploading…</p>
                </div>
              )}
              {isDone && !preview && (
                <p className="text-sm font-semibold text-[var(--primary)] flex items-center gap-2">
                  <i className="fas fa-circle-check" /> Uploaded — tap to change
                </p>
              )}
              {(preview || isDone) && (
                <p className="text-xs text-[var(--text-muted)]">
                  Tap to change
                </p>
              )}
            </label>
            {uploadError && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <i className="fas fa-circle-exclamation text-red-400 text-xs" />
                <p className="text-xs text-red-600 font-medium">
                  {uploadError}
                </p>
              </div>
            )}
          </div>
        )}

        {field.type === "number" && (
          <input
            type="number"
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}…`}
            className={inputBase}
          />
        )}

        {field.type === "email" && (
          <input
            type="email"
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`your@email.com`}
            className={inputBase}
          />
        )}

        {(field.type === "text" || !field.type) && (
          <input
            type="text"
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}…`}
            className={inputBase}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Dark top header ── */}
      <header className="bg-[var(--primary)]">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" />
            Back
          </button>
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm">
            <img
              src={IffysLogo}
              alt="IFFY'S TECH EDU CONSULT"
              className="h-9 object-contain"
            />
          </div>
          <div className="w-16" />
          {/* spacer */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-24">
        {/* ── Hero card: service summary ── */}
        <div className="bg-[var(--primary)] -mt-px pb-8 pt-0">
          <div className="bg-white/10 rounded-2xl border border-white/10 mx-4 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              {/* Service image */}
              {service.image && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-white/20">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold tracking-widest uppercase text-[var(--secondary)] opacity-80">
                    Order Form
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-white leading-tight truncate">
                  {service.name}
                </h1>
                {service.description && (
                  <p className="text-white/60 text-xs mt-1 line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-white/50 font-medium">Price</p>
                <p className="text-2xl font-extrabold text-[var(--secondary)] leading-tight">
                  {service.price}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {totalFields > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/60 font-medium">
                    Form completion
                  </span>
                  <span className="text-xs font-bold text-[var(--secondary)]">
                    {progress}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--secondary)] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Trust chips ── */}
        <div className="flex items-center gap-2 flex-wrap px-1 my-5">
          {[
            { icon: "fa-shield-halved", text: "Secure submission" },
            { icon: "fa-bolt-lightning", text: "Fast processing" },
            { icon: "fa-lock", text: "Data protected" },
          ].map((c) => (
            <div
              key={c.text}
              className="flex items-center gap-1.5 bg-white border border-[var(--border)] rounded-full px-3 py-1.5 shadow-sm"
            >
              <i
                className={`fas ${c.icon} text-[var(--primary)] text-[10px]`}
              />
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                {c.text}
              </span>
            </div>
          ))}
        </div>

        {/* ── Form card ── */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 pt-6 pb-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0">
              <i className="fas fa-list-check text-[var(--secondary)] text-sm" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text)] text-base">
                Fill in your details
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {totalFields} field{totalFields !== 1 ? "s" : ""} required —
                takes under 3 minutes
              </p>
            </div>
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {service.fields?.length > 0 ? (
              service.fields.map((field, i) => renderField(field, i))
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <i className="fas fa-circle-info text-2xl mb-2 block opacity-40" />
                <p className="text-sm">
                  No additional details required for this service.
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[var(--border)] pt-5">
              {/* Info note */}
              <div className="flex items-start gap-3 bg-[#e8f0eb] border border-[#c0d4c7] rounded-xl px-4 py-3 mb-5">
                <i className="fas fa-circle-info text-[var(--primary)] text-sm mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--primary)] leading-relaxed font-medium">
                  After submitting, you'll be taken to the payment page where
                  you can upload your proof of payment to confirm your order.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={anyUploading}
                className="w-full flex items-center justify-center gap-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
                  disabled:opacity-50 disabled:cursor-not-allowed text-white
                  py-4 rounded-xl font-bold text-base transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                {anyUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Uploading files…
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <i className="fas fa-arrow-right text-[var(--secondary)]" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[var(--text-muted)] mt-3">
                Your information is encrypted and never shared.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAdmin } from "../../contexts/AdminContext";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] " +
  "text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] " +
  "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(26,67,40,0.12)] " +
  "transition-all duration-200";

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center shrink-0">
          <i className={`fas ${icon} text-[var(--secondary)] text-sm`} />
        </div>
        <div>
          <h3 className="font-bold text-[var(--text)] text-sm leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-2">
        {icon && (
          <i className={`fas ${icon} text-[var(--primary)] text-[9px]`} />
        )}
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-[var(--text-muted)] mt-1.5">{hint}</p>
      )}
    </div>
  );
}

export default function SiteSettings() {
  const { siteSettings, updateSiteSettings, loading } = useAdmin();
  const [formData, setFormData] = useState(siteSettings);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (siteSettings) setFormData(siteSettings);
  }, [siteSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateSiteSettings(formData);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const setContact = (key, val) => setFormData((p) => ({ ...p, [key]: val }));
  const setSocial = (key, val) =>
    setFormData((p) => ({
      ...p,
      socialLinks: { ...p.socialLinks, [key]: val },
    }));
  const setPayment = (key, val) =>
    setFormData((p) => ({
      ...p,
      paymentDetails: { ...p.paymentDetails, [key]: val },
    }));

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Loading settings…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
            Settings
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Configure contact info, social links and payment details.
          </p>
        </div>

        {/* Success pill */}
        {success && (
          <div
            className="flex items-center gap-2 px-4 py-2 bg-[#e8f0eb] border border-[#c0d4c7]
            text-[var(--primary)] rounded-full text-sm font-bold animate-pulse"
          >
            <i className="fas fa-circle-check text-xs" />
            Saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Contact Information ── */}
        <SectionCard
          icon="fa-address-book"
          title="Contact Information"
          subtitle="Displayed on the homepage and contact section"
        >
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone Number" icon="fa-phone">
                <input
                  type="text"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setContact("phoneNumber", e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={inputCls}
                />
              </Field>
              <Field label="Email Address" icon="fa-envelope">
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setContact("email", e.target.value)}
                  placeholder="hello@example.com"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Office Address" icon="fa-location-dot">
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => setContact("address", e.target.value)}
                placeholder="Street, City, State"
                className={inputCls}
              />
            </Field>
            <Field label="Business Hours" icon="fa-clock">
              <input
                type="text"
                value={formData.businessHours || ""}
                onChange={(e) => setContact("businessHours", e.target.value)}
                placeholder="Mon – Sat: 8:00 AM – 8:00 PM"
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── WhatsApp ── */}
        <SectionCard
          icon="fa-whatsapp"
          title="WhatsApp"
          subtitle="Used for the floating chat button and community section"
        >
          <div className="space-y-4">
            <Field
              label="WhatsApp Number"
              icon="fa-mobile-screen"
              hint="Digits only — no spaces or dashes. e.g. 2348012345678"
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]">
                  +
                </span>
                <input
                  type="text"
                  value={formData.whatsappNumber || ""}
                  onChange={(e) => setContact("whatsappNumber", e.target.value)}
                  placeholder="2348012345678"
                  className={inputCls + " pl-7"}
                />
              </div>
            </Field>
            <Field
              label="WhatsApp Group / Channel Link"
              icon="fa-link"
              hint="This link appears in the 'Stay Updated' section on the homepage."
            >
              <input
                type="url"
                value={formData.whatsappGroupLink || ""}
                onChange={(e) =>
                  setContact("whatsappGroupLink", e.target.value)
                }
                placeholder="https://chat.whatsapp.com/..."
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── Social Media ── */}
        <SectionCard
          icon="fa-share-nodes"
          title="Social Media Links"
          subtitle="Shown in the footer and contact section"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                key: "facebook",
                label: "Facebook",
                icon: "fa-facebook-f",
                placeholder: "https://facebook.com/...",
              },
              {
                key: "whatsappChannel",
                label: "WhatsApp Channel",
                icon: "fa-whatsapp",
                placeholder: "https://whatsapp.com/channel/...",
              },
              {
                key: "instagram",
                label: "Instagram",
                icon: "fa-instagram",
                placeholder: "https://instagram.com/...",
              },
              {
                key: "tiktok",
                label: "TikTok",
                icon: "fa-tiktok",
                placeholder: "https://tiktok.com/@...",
              },
            ].map((s) => (
              <Field key={s.key} label={s.label}>
                <div className="relative">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6
                    bg-[var(--primary)] rounded-lg flex items-center justify-center pointer-events-none"
                  >
                    <i
                      className={`fab ${s.icon} text-[var(--secondary)] text-[9px]`}
                    />
                  </div>
                  <input
                    type="url"
                    value={formData.socialLinks?.[s.key] || ""}
                    onChange={(e) => setSocial(s.key, e.target.value)}
                    placeholder={s.placeholder}
                    className={inputCls + " pl-11"}
                  />
                </div>
              </Field>
            ))}
          </div>
        </SectionCard>

        {/* ── Payment Details ── */}
        <SectionCard
          icon="fa-building-columns"
          title="Payment Details"
          subtitle="Displayed on the payment page for bank transfers"
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Bank Name" icon="fa-landmark">
              <input
                type="text"
                value={formData.paymentDetails?.bankName || ""}
                onChange={(e) => setPayment("bankName", e.target.value)}
                placeholder="e.g. Zenith Bank"
                className={inputCls}
              />
            </Field>
            <Field label="Account Number" icon="fa-credit-card">
              <input
                type="text"
                value={formData.paymentDetails?.accountNumber || ""}
                onChange={(e) => setPayment("accountNumber", e.target.value)}
                placeholder="0123456789"
                className={inputCls}
              />
            </Field>
            <Field label="Account Name" icon="fa-user">
              <input
                type="text"
                value={formData.paymentDetails?.accountName || ""}
                onChange={(e) => setPayment("accountName", e.target.value)}
                placeholder="Business name"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Payment preview card */}
          {(formData.paymentDetails?.bankName ||
            formData.paymentDetails?.accountNumber) && (
            <div className="mt-4 bg-[var(--primary)] rounded-xl p-4">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                Preview
              </p>
              <div className="space-y-2">
                {[
                  { label: "Bank", value: formData.paymentDetails?.bankName },
                  {
                    label: "Account No.",
                    value: formData.paymentDetails?.accountNumber,
                  },
                  {
                    label: "Account Name",
                    value: formData.paymentDetails?.accountName,
                  },
                ].map(
                  (r) =>
                    r.value && (
                      <div
                        key={r.label}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-white/50 font-medium">
                          {r.label}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {r.value}
                        </span>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Save button ── */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-[var(--text-muted)]">
            Changes take effect immediately on the live site.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
              disabled:opacity-50 text-white px-8 py-3 rounded-xl text-sm font-bold
              transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin text-xs" /> Saving…
              </>
            ) : (
              <>
                <i className="fas fa-floppy-disk text-[var(--secondary)] text-xs" />{" "}
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

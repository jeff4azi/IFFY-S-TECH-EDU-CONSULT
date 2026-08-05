import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";
import { uploadOrderFile } from "../lib/imageUpload";

const PENDING_ORDER_KEY = "itc_pending_order";
const ORDER_IDS_KEY = "itc_order_ids";

function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n) =>
    Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `ITC-${rand(6)}-${rand(6)}`;
}

/* ── Step indicator ── */
function Step({ number, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
        ${done ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--secondary)]" : ""}
        ${active && !done ? "bg-[var(--secondary)] border-[var(--secondary)] text-white scale-110 ring-4 ring-[rgba(196,159,52,0.2)]" : ""}
        ${!active && !done ? "bg-white border-[var(--border)] text-[var(--text-muted)]" : ""}
      `}
      >
        {done ? <i className="fas fa-check text-[9px]" /> : number}
      </div>
      <span
        className={`text-[10px] font-semibold hidden sm:block
        ${active ? "text-[var(--secondary)]" : done ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteSettings, addOrder, loading: ctxLoading } = useAdmin();
  const fileInputRef = useRef(null);

  const [pendingOrder] = useState(() => {
    if (location.state?.pendingOrder) return location.state.pendingOrder;
    try {
      const saved = localStorage.getItem(PENDING_ORDER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ctxLoading && !pendingOrder) navigate("/");
  }, [ctxLoading, pendingOrder, navigate]);

  const settings = siteSettings || {
    whatsappNumber: "",
    paymentDetails: { bankName: "", accountNumber: "", accountName: "" },
  };

  const handleReceiptChange = (file) => {
    if (!file) return;
    setReceiptFile(file);
    setUploadError(null);
    setCreatedOrderId(null);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receiptFile || !pendingOrder) return;
    setUploading(true);
    setUploadError(null);
    setCreateError(null);
    try {
      const receiptUrl = await uploadOrderFile(receiptFile);
      setUploading(false);
      setCreating(true);
      const orderId = generateOrderId();
      const { error } = await addOrder({
        orderId,
        serviceId: pendingOrder.serviceId,
        formData: pendingOrder.formData,
        receiptUrl,
      });
      if (error) throw new Error(error.message);
      try {
        const existing = JSON.parse(
          localStorage.getItem(ORDER_IDS_KEY) || "[]",
        );
        if (!existing.includes(orderId))
          localStorage.setItem(
            ORDER_IDS_KEY,
            JSON.stringify([...existing, orderId]),
          );
        localStorage.removeItem(PENDING_ORDER_KEY);
      } catch {
        /* ignore */
      }
      setCreatedOrderId(orderId);
    } catch (err) {
      setUploadError(err.message || "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      setCreating(false);
    }
  };

  const handleCancelOrder = () => {
    localStorage.removeItem(PENDING_ORDER_KEY);
    navigate("/");
  };

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(createdOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (ctxLoading || !pendingOrder) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  const { service } = pendingOrder;
  const isProcessing = uploading || creating;
  const isComplete = !!createdOrderId;
  const currentStep = isComplete ? 3 : receiptFile ? 2 : 1;

  const buildWhatsAppMessage = () => {
    let msg = `Hello IFFY'S TECH EDU CONSULT!\n\nI have submitted my proof of payment.\n\nOrder ID: ${createdOrderId}\nService: ${service.name}`;
    Object.entries(pendingOrder.formData || {}).forEach(([k, v]) => {
      if (
        v &&
        typeof v === "string" &&
        !v.startsWith("http") &&
        !v.startsWith("data:")
      )
        msg += `\n${k}: ${v}`;
    });
    msg += "\n\nPlease verify my payment. Thank you!";
    return encodeURIComponent(msg);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Header ── */}
      <header className="bg-[var(--primary)]">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" /> Back
          </button>
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm">
            <img
              src={IffysLogo}
              alt="IFFY'S TECH EDU CONSULT"
              className="h-9 object-contain"
            />
          </div>
          <div className="w-16" />
        </div>

        {/* Step indicator */}
        <div className="max-w-lg mx-auto px-4 pb-6">
          <div className="relative flex items-start justify-between">
            {/* track */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/15 z-0" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-[var(--secondary)] z-0 transition-all duration-500"
              style={{
                width:
                  currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
              }}
            />
            {[
              { n: 1, label: "Transfer" },
              { n: 2, label: "Upload" },
              { n: 3, label: "Confirmed" },
            ].map((s) => (
              <div key={s.n} className="relative z-10">
                <Step
                  number={s.n}
                  label={s.label}
                  active={currentStep === s.n}
                  done={currentStep > s.n}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 -mt-0">
        {/* ── Service summary strip ── */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-4 mb-4 mt-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--background)] border border-[var(--border)] rounded-xl flex items-center justify-center shrink-0">
              <i className="fas fa-receipt text-[var(--primary)] text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Service
              </p>
              <p className="font-bold text-[var(--text)] text-sm truncate">
                {service.name}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Amount
            </p>
            <p className="text-xl font-extrabold text-[var(--primary)]">
              {service.price}
            </p>
          </div>
        </div>

        {/* ── Bank details card ── */}
        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-4 shadow-sm">
          <div className="bg-[var(--primary)] px-5 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center shrink-0">
              <i className="fas fa-building-columns text-white text-xs" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Bank Transfer Details
              </h2>
              <p className="text-[10px] text-white/60">
                Send exact amount to this account
              </p>
            </div>
          </div>

          <div className="p-5 space-y-0 divide-y divide-[var(--border)]">
            {[
              {
                icon: "fa-landmark",
                label: "Bank Name",
                value: settings.paymentDetails.bankName,
              },
              {
                icon: "fa-credit-card",
                label: "Account No.",
                value: settings.paymentDetails.accountNumber,
              },
              {
                icon: "fa-user",
                label: "Account Name",
                value: settings.paymentDetails.accountName,
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-center shrink-0">
                    <i
                      className={`fas ${icon} text-[var(--primary)] text-[10px]`}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {label}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--text)] text-right">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="mx-5 mb-5 flex items-start gap-2.5 bg-[#e8f0eb] border border-[#c0d4c7] rounded-xl px-4 py-3">
            <i className="fas fa-circle-info text-[var(--primary)] text-xs mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--primary)] font-medium leading-relaxed">
              Transfer the exact amount shown above, then upload a screenshot or
              photo of your receipt below.
            </p>
          </div>
        </div>

        {/* ── Success: order ID card ── */}
        {isComplete && (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-4 shadow-sm">
            {/* Green top bar */}
            <div className="h-1.5 bg-[var(--primary)] w-full" />
            <div className="p-5 text-center">
              <div className="w-16 h-16 bg-[#e8f0eb] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-circle-check text-[var(--primary)] text-3xl" />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--text)] mb-1">
                Order Confirmed!
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                Your receipt has been submitted. We'll verify your payment and
                update your order status shortly.
              </p>

              {/* Order ID box */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 mb-2">
                <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-widest mb-1.5">
                  Your Order ID
                </p>
                <p className="text-xl font-extrabold text-[var(--primary)] font-mono tracking-wider mb-2">
                  {createdOrderId}
                </p>
                <button
                  onClick={copyOrderId}
                  className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg
                    bg-white border border-[var(--border)] text-[var(--text-muted)]
                    hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                >
                  <i
                    className={`fas ${copied ? "fa-check" : "fa-copy"} text-[10px]`}
                  />
                  {copied ? "Copied!" : "Copy ID"}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] opacity-70">
                Save this ID — you'll need it to track your order.
              </p>
            </div>
          </div>
        )}

        {/* ── Receipt upload card ── */}
        {!isComplete && (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-4 shadow-sm">
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-9 h-9 bg-[var(--background)] border border-[var(--border)] rounded-xl flex items-center justify-center">
                <i className="fas fa-cloud-arrow-up text-[var(--primary)] text-sm" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">
                  Upload Proof of Payment{" "}
                  <span className="text-[var(--danger)]">*</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Screenshot or photo of your bank receipt
                </p>
              </div>
            </div>

            <div className="p-5">
              {/* Drop zone */}
              <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
                  ${
                    receiptFile
                      ? "border-[var(--primary)] bg-[#e8f0eb]"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[#f0f4f2]"
                  }
                  ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleReceiptChange(e.target.files[0])}
                  disabled={isProcessing}
                />

                {receiptPreview ? (
                  <div className="p-3">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="max-h-44 object-contain rounded-lg mx-auto block"
                    />
                    <p className="text-center text-xs text-[var(--primary)] font-semibold mt-2 flex items-center justify-center gap-1">
                      <i className="fas fa-check-circle text-[10px]" /> Tap to
                      change
                    </p>
                  </div>
                ) : receiptFile && !receiptPreview ? (
                  <div className="flex items-center gap-3 px-4 py-5">
                    <div className="w-10 h-10 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center shrink-0">
                      <i className="fas fa-file-pdf text-[var(--primary)] text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">
                        {receiptFile.name}
                      </p>
                      <p className="text-xs text-[var(--primary)] font-medium">
                        Tap to change
                      </p>
                    </div>
                    <i className="fas fa-circle-check text-[var(--primary)] text-lg shrink-0" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8 px-4">
                    <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-sm">
                      <i className="fas fa-cloud-arrow-up text-[var(--primary)] text-2xl" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[var(--text)]">
                        Tap to upload receipt
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        JPG, PNG or PDF — max 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <i className="fas fa-circle-exclamation text-red-400 text-sm shrink-0" />
                  <p className="text-xs text-red-600 font-medium">
                    {uploadError}
                  </p>
                </div>
              )}

              {createError && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <i className="fas fa-circle-exclamation text-red-400 text-sm shrink-0" />
                  <p className="text-xs text-red-600 font-medium">
                    {createError}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmitReceipt}
                disabled={!receiptFile || isProcessing}
                className="mt-4 w-full flex items-center justify-center gap-3 bg-[var(--primary)]
                  hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed
                  text-white py-4 rounded-xl font-bold text-sm transition-all
                  hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    {uploading ? "Uploading receipt…" : "Confirming order…"}
                  </>
                ) : (
                  <>
                    Submit Receipt &amp; Confirm Order
                    <i className="fas fa-arrow-right text-[var(--secondary)]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="space-y-3">
          {/* WhatsApp */}
          {isComplete ? (
            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${buildWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe57]
                text-white py-4 rounded-xl font-bold text-sm transition-all hover:shadow-lg"
            >
              <i className="fab fa-whatsapp text-lg" />
              Notify Us on WhatsApp
            </a>
          ) : (
            <div
              className="w-full flex items-center justify-center gap-3 bg-[var(--background)]
              border border-[var(--border)] text-[var(--text-muted)] py-4 rounded-xl
              font-semibold text-sm cursor-not-allowed select-none"
            >
              <i className="fab fa-whatsapp text-lg opacity-40" />
              Submit receipt first to notify us
            </div>
          )}

          {/* Track order */}
          <button
            onClick={() => navigate("/my-orders")}
            className="w-full flex items-center justify-center gap-2
              border-2 border-[var(--primary)] text-[var(--primary)]
              hover:bg-[var(--primary)] hover:text-white
              py-3.5 rounded-xl font-bold text-sm transition-all"
          >
            <i className="fas fa-bag-shopping text-sm" />
            Track My Order
          </button>

          {/* Cancel */}
          <button
            onClick={handleCancelOrder}
            className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--danger)] py-2 transition-colors"
          >
            Cancel order &amp; return home
          </button>
        </div>
      </main>
    </div>
  );
}

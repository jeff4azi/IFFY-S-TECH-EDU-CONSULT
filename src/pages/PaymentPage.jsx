import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";
import { uploadOrderFile } from "../lib/imageUpload";

const PENDING_ORDER_KEY = "ace_pending_order";
const ORDER_IDS_KEY = "ace_order_ids";

function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n) =>
    Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `ACE-${rand(6)}-${rand(6)}`;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteSettings, addOrder, loading: ctxLoading } = useAdmin();
  const fileInputRef = useRef(null);

  // ── Resolve pending order from navigation state or localStorage ──────────
  const [pendingOrder, setPendingOrder] = useState(() => {
    if (location.state?.pendingOrder) return location.state.pendingOrder;
    try {
      const saved = localStorage.getItem(PENDING_ORDER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── Receipt upload state ──────────────────────────────────────────────────
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // ── Order creation state ──────────────────────────────────────────────────
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Redirect home if there's genuinely nothing to work with
  useEffect(() => {
    if (!ctxLoading && !pendingOrder) {
      navigate("/");
    }
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
      // 1. Upload receipt to storage
      const receiptUrl = await uploadOrderFile(receiptFile);

      // 2. Generate order ID and create the order in the DB
      setUploading(false);
      setCreating(true);

      const orderId = generateOrderId();
      const { data, error } = await addOrder({
        orderId,
        serviceId: pendingOrder.serviceId,
        formData: pendingOrder.formData,
        receiptUrl,
      });

      if (error) throw new Error(error.message);

      // 3. Save order ID to localStorage for tracking
      try {
        const existing = JSON.parse(
          localStorage.getItem(ORDER_IDS_KEY) || "[]",
        );
        if (!existing.includes(orderId)) {
          localStorage.setItem(
            ORDER_IDS_KEY,
            JSON.stringify([...existing, orderId]),
          );
        }
        // Clear the pending order now that it's committed
        localStorage.removeItem(PENDING_ORDER_KEY);
      } catch {
        /* ignore storage errors */
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

  if (ctxLoading || !pendingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#4169E1]"></i>
      </div>
    );
  }

  const { service } = pendingOrder;
  const isProcessing = uploading || creating;
  const isComplete = !!createdOrderId;

  const buildWhatsAppMessage = () => {
    let msg = `Hello Ace Educational Consult!\n\nI have submitted my proof of payment.\n\nOrder ID: ${createdOrderId}\nService: ${service.name}`;
    Object.entries(pendingOrder.formData || {}).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "string" &&
        !value.startsWith("http") &&
        !value.startsWith("data:")
      ) {
        msg += `\n${key}: ${value}`;
      }
    });
    msg += "\n\nPlease verify my payment. Thank you!";
    return encodeURIComponent(msg);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img src={IffysLogo} alt="Ace Educational Consult" className="h-12" />
        </div>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-[#4169E1] hover:text-[#3658c9] mb-4 flex items-center gap-2 text-sm font-medium"
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>

        {/* ── Header card ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#4169E1]/10 rounded-xl flex items-center justify-center text-[#4169E1]">
              <i className="fas fa-credit-card"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Complete Payment
              </h1>
              <p className="text-xs text-gray-500">
                Upload your receipt to confirm your order
              </p>
            </div>
          </div>

          {/* Service summary */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-semibold text-gray-900 text-sm">
                {service.name}
              </p>
            </div>
            <p className="text-xl font-bold text-[#4169E1]">{service.price}</p>
          </div>

          {/* Order ID — shown only after creation */}
          {isComplete && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> Order Created
              </p>
              <p className="text-xs text-gray-500 mb-1">Your Order ID</p>
              <p className="font-bold text-gray-900 font-mono tracking-wide text-base">
                {createdOrderId}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Save this — you'll need it to track your order
              </p>
            </div>
          )}
        </div>

        {/* ── Payment details card ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fas fa-university text-[#4169E1]"></i>
            Bank Transfer Details
          </h2>
          <div className="space-y-2">
            {[
              { label: "Bank", value: settings.paymentDetails.bankName },
              {
                label: "Account No.",
                value: settings.paymentDetails.accountNumber,
              },
              {
                label: "Account Name",
                value: settings.paymentDetails.accountName,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
            <i className="fas fa-circle-info mt-0.5 shrink-0"></i>
            Transfer the exact amount above, then upload your bank receipt or
            screenshot below.
          </p>
        </div>

        {/* ── Receipt upload card ─────────────────────────────────────────── */}
        {!isComplete ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
              <i className="fas fa-receipt text-[#4169E1]"></i>
              Upload Proof of Payment <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Upload a screenshot or photo of your bank transfer receipt.
            </p>

            {/* Drop zone */}
            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer
                ${receiptFile ? "border-[#4169E1] bg-[#4169E1]/5" : "border-gray-200 hover:border-[#4169E1]/50 hover:bg-gray-50"}
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
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="max-h-40 object-contain rounded-lg mx-auto mb-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-cloud-arrow-up text-gray-400 text-xl"></i>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {receiptFile ? receiptFile.name : "Tap to choose file"}
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                </div>
              )}

              {receiptFile && !receiptPreview && (
                <p className="text-sm text-gray-700 font-medium flex items-center justify-center gap-2">
                  <i className="fas fa-file text-[#4169E1]"></i>
                  {receiptFile.name}
                </p>
              )}

              {receiptFile && (
                <p className="text-xs text-[#4169E1] mt-2">
                  Tap to change file
                </p>
              )}
            </div>

            {uploadError && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                <i className="fas fa-circle-exclamation"></i> {uploadError}
              </p>
            )}

            {/* Submit receipt button */}
            <button
              onClick={handleSubmitReceipt}
              disabled={!receiptFile || isProcessing}
              className="mt-4 w-full bg-[#4169E1] hover:bg-[#3658c9] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {uploading ? "Uploading receipt..." : "Creating order..."}
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Submit Receipt & Confirm Order
                </>
              )}
            </button>

            {createError && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                <i className="fas fa-circle-exclamation"></i> {createError}
              </p>
            )}
          </div>
        ) : (
          /* ── Success state ──────────────────────────────────────────────── */
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-circle-check text-green-500 text-2xl"></i>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Receipt Submitted!</h3>
            <p className="text-sm text-gray-600">
              Your order is now{" "}
              <span className="font-semibold text-[#4169E1]">
                pending verification
              </span>
              . We'll review your payment and update your order status shortly.
            </p>
          </div>
        )}

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* WhatsApp — disabled until order is created */}
          <a
            href={
              isComplete
                ? `https://wa.me/${settings.whatsappNumber}?text=${buildWhatsAppMessage()}`
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!isComplete}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all
              ${
                isComplete
                  ? "bg-[#25D366] hover:bg-[#1ebe57] text-white hover:shadow-lg"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
          >
            <i className="fab fa-whatsapp text-lg"></i>
            {isComplete
              ? "Continue on WhatsApp"
              : "Submit receipt first to notify us"}
          </a>

          <button
            onClick={() => navigate("/my-orders")}
            className="w-full flex items-center justify-center gap-2 border border-[#4169E1] text-[#4169E1] hover:bg-[#4169E1] hover:text-white py-3.5 rounded-xl font-semibold text-sm transition-all"
          >
            <i className="fas fa-receipt"></i>
            Track My Order
          </button>

          <button
            onClick={handleCancelOrder}
            className="w-full text-xs text-gray-400 hover:text-red-400 py-2 transition-colors"
          >
            Cancel order & return home
          </button>
        </div>
      </div>
    </div>
  );
}

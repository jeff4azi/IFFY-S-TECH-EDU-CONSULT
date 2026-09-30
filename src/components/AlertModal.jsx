import { useEffect, useRef } from "react";

const TYPES = {
  warning: { icon: "fa-triangle-exclamation", bg: "bg-amber-50", fg: "text-amber-600" },
  error: { icon: "fa-circle-exclamation", bg: "bg-red-50", fg: "text-red-500" },
  info: { icon: "fa-circle-info", bg: "bg-[#e8f0eb]", fg: "text-[var(--primary)]" },
  success: { icon: "fa-circle-check", bg: "bg-[#e8f0eb]", fg: "text-[var(--primary)]" },
};

/**
 * Custom replacement for window.alert().
 *
 * <AlertModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   title="Heads up"
 *   message="Something needs your attention."
 *   type="warning"            // warning | error | info | success
 *   buttonText="Got it"       // optional
 * />
 */
export default function AlertModal({
  isOpen,
  onClose,
  title = "Notice",
  message = "",
  type = "warning",
  buttonText = "Got it",
}) {
  const buttonRef = useRef(null);
  const t = TYPES[type] || TYPES.warning;

  useEffect(() => {
    if (!isOpen) return;
    buttonRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[var(--border)] shadow-xl w-full max-w-sm p-6 text-center"
      >
        <div
          className={`w-14 h-14 rounded-full ${t.bg} flex items-center justify-center mx-auto mb-4`}
        >
          <i className={`fas ${t.icon} text-2xl ${t.fg}`} />
        </div>
        <h3
          id="alert-modal-title"
          className="text-lg font-extrabold text-[var(--text)] mb-2"
        >
          {title}
        </h3>
        <p
          id="alert-modal-message"
          className="text-sm text-[var(--text-muted)] leading-relaxed mb-6"
        >
          {message}
        </p>
        <button
          ref={buttonRef}
          type="button"
          onClick={onClose}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-lg"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

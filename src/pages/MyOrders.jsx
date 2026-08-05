import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

const LS_KEY = "ace_order_ids";
const PENDING_ORDER_KEY = "ace_pending_order";

/* ─── status config uses CSS variables via Tailwind arbitrary values ─── */
const STATUS_CONFIG = {
  pending_verification: {
    label: "Verifying Payment",
    short: "Verifying",
    icon: "fa-file-invoice",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    bar: "bg-purple-500",
    glow: "shadow-[0_0_0_3px_rgba(168,85,247,0.15)]",
    description: "Your receipt is submitted and awaiting verification.",
    step: 1,
  },
  pending: {
    label: "Order Received",
    short: "Pending",
    icon: "fa-hourglass-half",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "bg-amber-400",
    glow: "shadow-[0_0_0_3px_rgba(251,191,36,0.15)]",
    description: "Your order has been received and is queued for processing.",
    step: 2,
  },
  processing: {
    label: "In Progress",
    short: "Processing",
    icon: "fa-gears",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    bar: "bg-blue-500",
    glow: "shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
    description: "Our team is actively working on your order.",
    step: 3,
  },
  completed: {
    label: "Completed",
    short: "Done",
    icon: "fa-circle-check",
    dot: "bg-[var(--primary)]",
    badge: "bg-[#e8f0eb] text-[var(--primary)] border border-[#c0d4c7]",
    bar: "bg-[var(--primary)]",
    glow: "shadow-[0_0_0_3px_rgba(26,67,40,0.15)]",
    description: "Your order has been completed successfully.",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    short: "Cancelled",
    icon: "fa-circle-xmark",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-600 border border-red-200",
    bar: "bg-red-400",
    glow: "shadow-[0_0_0_3px_rgba(248,113,113,0.15)]",
    description: "This order was cancelled. Contact us if you have questions.",
    step: 0,
  },
};

const STEPS = ["pending_verification", "pending", "processing", "completed"];

/* ─── Timeline progress ─── */
function StatusTimeline({ status }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 1;
  const cancelled = status === "cancelled";

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-xl border border-red-100">
        <i className="fas fa-ban text-red-400 text-sm" />
        <span className="text-sm text-red-500 font-medium">
          Order cancelled
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative flex items-center justify-between">
        {/* connecting track */}
        <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-[var(--border)] z-0" />
        <div
          className="absolute top-3.5 left-0 h-0.5 bg-[var(--primary)] z-0 transition-all duration-700"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const done = stepNum <= currentStep;
          const active = stepNum === currentStep;
          return (
            <div
              key={s}
              className="relative z-10 flex flex-col items-center gap-1.5"
              style={{ flex: 1 }}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                  ${
                    done
                      ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--secondary)]"
                      : "bg-white border-[var(--border)] text-[var(--text-muted)]"
                  }
                  ${active ? "ring-4 ring-[rgba(26,67,40,0.15)] scale-110" : ""}
                `}
              >
                {done && !active ? (
                  <i className="fas fa-check text-[9px]" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-[10px] font-semibold text-center leading-tight hidden sm:block
                ${active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
              >
                {STATUS_CONFIG[s].short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Deleted order card ─── */
function DeletedCard({ record, onRemove }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-[var(--border)] p-5 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--background)] rounded-xl flex items-center justify-center shrink-0">
          <i className="fas fa-file-circle-xmark text-[var(--text-muted)]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-muted)] font-mono">
            {record.orderId}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 opacity-70">
            This order no longer exists on our system.
          </p>
        </div>
      </div>
      <button
        onClick={() => onRemove(record.orderId)}
        className="text-[var(--border)] hover:text-[var(--danger)] transition-colors shrink-0 mt-0.5"
        title="Remove"
      >
        <i className="fas fa-trash-can text-sm" />
      </button>
    </div>
  );
}

/* ─── Main order card ─── */
function OrderCard({ record, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  if (record.deleted)
    return <DeletedCard record={record} onRemove={onRemove} />;

  const cfg =
    STATUS_CONFIG[record.order.status] || STATUS_CONFIG.pending_verification;
  const createdAt = record.order.created_at
    ? new Date(record.order.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const displayData = Object.entries(record.order.user_data || {}).filter(
    ([, v]) =>
      v &&
      typeof v === "string" &&
      !v.startsWith("data:") &&
      !v.startsWith("http"),
  );

  const deliverables = Array.isArray(record.order.deliverable_urls)
    ? record.order.deliverable_urls
    : [];

  return (
    <div
      className={`bg-white rounded-2xl border border-[var(--border)] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${cfg.glow}`}
    >
      {/* ── Top accent strip ── */}
      <div className={`h-1 w-full ${cfg.bar}`} />

      <div className="p-5">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Icon */}
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bar} text-white`}
            >
              <i className={`fas ${cfg.icon} text-base`} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[var(--text)] text-base leading-tight truncate">
                {record.order.service?.name || "Service"}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {record.orderId}
              </p>
              {createdAt && (
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 opacity-70">
                  <i className="fas fa-calendar-days text-[10px]" />
                  {createdAt}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${cfg.badge}`}
            >
              <i className={`fas ${cfg.icon} text-[10px]`} />
              {cfg.label}
            </span>
            <button
              onClick={() => onRemove(record.orderId)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--border)] hover:text-[var(--danger)] hover:bg-red-50 transition-all"
              title="Remove from list"
            >
              <i className="fas fa-trash-can text-xs" />
            </button>
          </div>
        </div>

        {/* ── Status message ── */}
        <div className="mt-3 px-3 py-2.5 bg-[var(--background)] rounded-xl border border-[var(--border)] flex items-start gap-2">
          <i
            className={`fas ${cfg.icon} text-xs mt-0.5 shrink-0`}
            style={{
              color:
                record.order.status === "completed"
                  ? "var(--primary)"
                  : undefined,
            }}
          />
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {cfg.description}
          </p>
        </div>

        {/* ── Progress timeline ── */}
        <StatusTimeline status={record.order.status} />

        {/* ── Order details toggle ── */}
        {displayData.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 border-[var(--primary)] flex items-center justify-center transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              >
                <i className="fas fa-chevron-down text-[8px] text-[var(--primary)]" />
              </div>
              {expanded ? "Hide details" : "View order details"}
            </button>

            {expanded && (
              <div className="mt-3 rounded-xl border border-[var(--border)] overflow-hidden">
                {displayData.map(([k, v], i) => (
                  <div
                    key={k}
                    className={`flex justify-between gap-3 px-4 py-2.5 text-sm
                      ${i % 2 === 0 ? "bg-[var(--background)]" : "bg-white"}`}
                  >
                    <span className="text-[var(--text-muted)] shrink-0 font-medium">
                      {k}
                    </span>
                    <span className="text-[var(--text)] font-semibold text-right break-all">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Deliverables (completed only) ── */}
        {record.order.status === "completed" && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fas fa-folder-open text-[var(--secondary)]" />
              Your Deliverables
            </p>
            {deliverables.length > 0 ? (
              <div className="space-y-2">
                {deliverables.map((item, i) => {
                  const url = typeof item === "string" ? item : item?.url;
                  const name =
                    typeof item === "string"
                      ? decodeURIComponent(
                          new URL(url).pathname.split("/").pop(),
                        )
                      : item?.name ||
                        decodeURIComponent(
                          new URL(url).pathname.split("/").pop(),
                        );
                  return (
                    <a
                      key={i}
                      href={url}
                      download={name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#e8f0eb] border border-[#c0d4c7] rounded-xl px-3 py-2.5
                        hover:bg-[var(--primary)] hover:border-[var(--primary)] group transition-all duration-200 w-full overflow-hidden"
                    >
                      <div className="w-8 h-8 bg-[var(--primary)] group-hover:bg-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                        <i className="fas fa-file-arrow-down text-[var(--secondary)] group-hover:text-[var(--primary)] text-sm transition-colors" />
                      </div>
                      <span className="text-sm text-[var(--primary)] group-hover:text-white font-semibold truncate flex-1 transition-colors">
                        {name}
                      </span>
                      <span className="text-xs font-bold text-[var(--primary)] group-hover:text-[var(--secondary)] shrink-0 flex items-center gap-1 transition-colors">
                        <i className="fas fa-download text-xs" />
                        <span className="hidden sm:inline">Download</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-white border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <i className="fas fa-hourglass-half text-[var(--text-muted)] text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    Files coming soon
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Your deliverable will appear here once ready.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── PAGE ─────────────────────── */
export default function MyOrders() {
  const navigate = useNavigate();

  const [pendingOrder, setPendingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(PENDING_ORDER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [orderIds, setOrderIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (orderIds.length === 0) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*, service:services(name), deliverable_urls")
        .in("order_id", orderIds);
      const foundIds = new Set((data || []).map((o) => o.order_id));
      const results = orderIds.map((id) =>
        foundIds.has(id)
          ? {
              orderId: id,
              order: data.find((o) => o.order_id === id),
              deleted: false,
            }
          : { orderId: id, order: null, deleted: true },
      );
      setRecords(results.reverse());
      setLoading(false);
    };
    fetchOrders();
  }, [orderIds]);

  const removeOrder = (id) => {
    const updated = orderIds.filter((oid) => oid !== id);
    setOrderIds(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setRecords((prev) => prev.filter((r) => r.orderId !== id));
  };

  const dismissPendingOrder = () => {
    localStorage.removeItem(PENDING_ORDER_KEY);
    setPendingOrder(null);
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    const id = manualId.trim().toUpperCase();
    if (!id) return;
    if (orderIds.includes(id)) {
      setManualError("This Order ID is already in your list.");
      return;
    }
    setManualLoading(true);
    setManualError("");
    const { data, error } = await supabase
      .from("orders")
      .select("*, service:services(name), deliverable_urls")
      .eq("order_id", id)
      .single();
    if (error || !data) {
      setManualError("Order not found. Please check the ID and try again.");
      setManualLoading(false);
      return;
    }
    const updated = [...orderIds, id];
    setOrderIds(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setRecords((prev) => [
      { orderId: id, order: data, deleted: false },
      ...prev,
    ]);
    setManualId("");
    setManualLoading(false);
  };

  const activeCount = records.filter(
    (r) =>
      !r.deleted &&
      r.order?.status !== "completed" &&
      r.order?.status !== "cancelled",
  ).length;
  const completedCount = records.filter(
    (r) => !r.deleted && r.order?.status === "completed",
  ).length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Dark header ── */}
      <header className="bg-[var(--primary)] text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-6">
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
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm font-semibold bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]
                px-4 py-2 rounded-full transition-colors text-white"
            >
              <i className="fas fa-plus text-xs" />
              New Order
            </button>
          </div>

          {/* Title + stats */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                  <i className="fas fa-bag-shopping text-white text-xs" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-white/60">
                  Order Tracker
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                My Orders
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Track your service requests in real time.
              </p>
            </div>

            {/* Mini stat pills */}
            {records.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold text-white">
                    {activeCount} active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-[var(--secondary)]" />
                  <span className="text-xs font-semibold text-white">
                    {completedCount} done
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 border border-white/10">
                  <i className="fas fa-layer-group text-white/60 text-[10px]" />
                  <span className="text-xs font-semibold text-white">
                    {records.length} total
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-2xl mx-auto px-4 -mt-2 pb-24">
        {/* ── Unfinished order banner ── */}
        {pendingOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 shadow-sm">
            <div className="flex items-start gap-3 justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fas fa-triangle-exclamation text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)] text-sm">
                    Unfinished Order
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    <span className="font-semibold">
                      {pendingOrder.service?.name}
                    </span>{" "}
                    — payment not yet submitted.
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPendingOrder}
                className="text-[var(--border)] hover:text-[var(--text-muted)] transition-colors mt-0.5"
              >
                <i className="fas fa-xmark text-sm" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() =>
                  navigate("/payment", { state: { pendingOrder } })
                }
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2.5 rounded-xl text-sm font-bold
                  transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-arrow-right text-xs" /> Continue to Payment
              </button>
              <button
                onClick={dismissPendingOrder}
                className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)]
                  hover:border-red-200 rounded-xl text-sm font-semibold transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ── Manual lookup ── */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[var(--background)] rounded-xl border border-[var(--border)] flex items-center justify-center">
              <i className="fas fa-magnifying-glass text-[var(--primary)] text-sm" />
            </div>
            <div>
              <p className="font-bold text-[var(--text)] text-sm">
                Look Up an Order
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Ordered on another device? Enter your Order ID.
              </p>
            </div>
          </div>
          <form onSubmit={handleManualLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ACE-LK3F9A-7X2M1P"
              value={manualId}
              onChange={(e) => {
                setManualId(e.target.value);
                setManualError("");
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]
                text-[var(--text)] text-sm font-mono placeholder:text-[var(--text-muted)] placeholder:font-sans
                focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(26,67,40,0.12)]
                transition-all"
            />
            <button
              type="submit"
              disabled={manualLoading || !manualId.trim()}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-40 text-white
                px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0"
            >
              {manualLoading ? (
                <i className="fas fa-spinner fa-spin text-sm" />
              ) : (
                <>
                  <i className="fas fa-search text-xs" /> Track
                </>
              )}
            </button>
          </form>
          {manualError && (
            <div className="flex items-center gap-2 mt-2.5 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <i className="fas fa-circle-exclamation text-red-400 text-xs" />
              <p className="text-red-600 text-xs font-medium">{manualError}</p>
            </div>
          )}
        </div>

        {/* ── Orders list ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center shadow-sm">
              <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
            </div>
            <p className="text-[var(--text-muted)] text-sm font-medium">
              Loading your orders…
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-[var(--background)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i className="fas fa-bag-shopping text-3xl text-[var(--text-muted)] opacity-40" />
            </div>
            <h3 className="text-lg font-extrabold text-[var(--text)] mb-1">
              No orders yet
            </h3>
            <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto mb-6">
              Orders you place will appear here automatically, or search using
              an Order ID above.
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
                text-white px-8 py-3 rounded-full font-bold text-sm transition-all hover:shadow-lg"
            >
              <i className="fas fa-rocket text-xs" />
              Browse Services
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <OrderCard
                key={record.orderId}
                record={record}
                onRemove={removeOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

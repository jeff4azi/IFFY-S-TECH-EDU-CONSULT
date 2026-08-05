import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import IffysLogo from "../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

const LS_KEY = "ace_order_ids";
const PENDING_ORDER_KEY = "ace_pending_order";

const STATUS_CONFIG = {
  pending_verification: {
    label: "Verifying",
    icon: "fa-file-invoice",
    badge: "bg-purple-100 text-purple-700 border border-purple-200",
    bar: "bg-purple-500",
    description:
      "Your payment receipt has been submitted and is awaiting verification by our team.",
    step: 1,
  },
  pending: {
    label: "Pending",
    icon: "fa-hourglass-half",
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
    bar: "bg-orange-400",
    description: "Your order has been received and is awaiting processing.",
    step: 2,
  },
  processing: {
    label: "Processing",
    icon: "fa-spinner",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    bar: "bg-blue-500",
    description: "We are actively working on your order.",
    step: 3,
  },
  completed: {
    label: "Completed",
    icon: "fa-circle-check",
    badge: "bg-green-100 text-green-700 border border-green-200",
    bar: "bg-green-500",
    description: "Your order has been completed successfully.",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    icon: "fa-circle-xmark",
    badge: "bg-red-100 text-red-700 border border-red-200",
    bar: "bg-red-400",
    description:
      "This order was cancelled. Please contact us if you have questions.",
    step: 0,
  },
};

const STEPS = ["pending_verification", "pending", "processing", "completed"];

function ProgressBar({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full w-full bg-red-400 rounded-full" />
        </div>
        <span className="text-xs text-red-500 font-medium">Cancelled</span>
      </div>
    );
  }
  const currentStep = STATUS_CONFIG[status]?.step ?? 1;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const done = stepNum <= currentStep;
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${done ? `${cfg.bar} text-white` : "bg-gray-200 text-gray-400"}`}
              >
                {done && stepNum < currentStep ? (
                  <i className="fas fa-check text-[10px]" />
                ) : (
                  stepNum
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-1 rounded-full ${stepNum < currentStep ? cfg.bar : "bg-gray-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {STEPS.map((s) => (
          <span
            key={s}
            className={`text-[10px] font-medium ${s === status ? "text-gray-800" : "text-gray-400"}`}
          >
            {STATUS_CONFIG[s].label.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ record, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  if (record.deleted) {
    return (
      <div className="bg-white rounded-2xl shadow border border-dashed border-gray-300 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              <i className="fas fa-file-circle-xmark text-lg" />
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">
                {record.orderId}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                This order no longer exists on our system
              </p>
            </div>
          </div>
          <button
            onClick={() => onRemove(record.orderId)}
            className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
            title="Remove from list"
          >
            <i className="fas fa-trash-can text-sm" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3 bg-gray-50 rounded-lg p-3">
          This order may have been removed by our team. If you believe this is
          an error, please contact us with your Order ID.
        </p>
      </div>
    );
  }

  const cfg =
    STATUS_CONFIG[record.order.status] || STATUS_CONFIG.pending_verification;
  const createdAt = record.order.created_at
    ? new Date(record.order.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // Filter out URLs and data URIs from display (they're files, not text)
  const displayData = Object.entries(record.order.user_data || {}).filter(
    ([, v]) =>
      v &&
      typeof v === "string" &&
      !v.startsWith("data:") &&
      !v.startsWith("http"),
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className={`h-1 w-full ${cfg.bar}`} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bar} text-white`}
            >
              <i className={`fas ${cfg.icon}`} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">
                {record.order.service?.name || "Service"}
              </p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {record.orderId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}
            >
              <i className={`fas ${cfg.icon} mr-1`} />
              {cfg.label}
            </span>
            <button
              onClick={() => onRemove(record.orderId)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              title="Remove from list"
            >
              <i className="fas fa-trash-can text-sm" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg px-4 py-2">
          {cfg.description}
        </p>

        <ProgressBar status={record.order.status} />

        {createdAt && (
          <p className="text-xs text-gray-400 mt-3">
            <i className="fas fa-calendar-days mr-1" />
            Placed on {createdAt}
          </p>
        )}

        {displayData.length > 0 && (
          <>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="mt-4 text-sm text-[#4169E1] font-medium flex items-center gap-1 hover:underline"
            >
              <i
                className={`fas fa-chevron-${expanded ? "up" : "down"} text-xs`}
              />
              {expanded ? "Hide details" : "View order details"}
            </button>
            {expanded && (
              <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-2">
                {displayData.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 text-sm">
                    <span className="text-gray-500 shrink-0">{k}</span>
                    <span className="text-gray-800 font-medium text-right break-all">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Deliverables ───────────────────────────────────────────────── */}
        {record.order.status === "completed" && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Your Files
            </p>
            {Array.isArray(record.order.deliverable_urls) &&
            record.order.deliverable_urls.length > 0 ? (
              <div className="space-y-2">
                {record.order.deliverable_urls.map((item, i) => {
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
                      className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 hover:bg-green-100 transition-colors w-full overflow-hidden"
                    >
                      <i className="fas fa-file-arrow-down text-green-600 shrink-0 text-sm"></i>
                      <span className="text-sm text-gray-800 font-medium truncate min-w-0 flex-1">
                        {name}
                      </span>
                      <span className="text-xs text-green-700 font-semibold shrink-0 flex items-center gap-1 pl-2">
                        <i className="fas fa-download text-xs"></i>
                        <span className="hidden sm:inline">Download</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 opacity-60 cursor-not-allowed">
                <i className="fas fa-clock text-gray-400"></i>
                <span className="text-sm text-gray-500">
                  File not available yet
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();

  // Check for an unsubmitted (pending) order saved in localStorage
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
      const results = orderIds.map((id) => {
        if (foundIds.has(id)) {
          return {
            orderId: id,
            order: data.find((o) => o.order_id === id),
            deleted: false,
          };
        }
        return { orderId: id, order: null, deleted: true };
      });
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

  return (
    <div className="min-h-screen bg-gray-50 py-24 overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-center mb-8">
          <img src={IffysLogo} alt="Ace Educational Consult" className="h-16" />
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-[#4169E1] hover:text-[#3658c9] mb-6 flex items-center gap-2 font-medium"
        >
          <i className="fas fa-arrow-left" /> Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">
            Track the status of your service requests
          </p>
        </div>

        {/* ── Unfinished order banner ────────────────────────────────────── */}
        {pendingOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <i className="fas fa-clock text-amber-500 text-lg" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    You have an unfinished order
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    <span className="font-medium">
                      {pendingOrder.service?.name}
                    </span>{" "}
                    — payment not yet submitted
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPendingOrder}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() =>
                  navigate("/payment", { state: { pendingOrder } })
                }
                className="flex-1 bg-[#4169E1] hover:bg-[#3658c9] text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-arrow-right"></i> Continue to Payment
              </button>
              <button
                onClick={dismissPendingOrder}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 rounded-xl text-sm font-medium transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Manual lookup */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <i className="fas fa-magnifying-glass text-[#4169E1]" />
            Look up an order
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Have an Order ID but placed your order on another device? Enter it
            here.
          </p>
          <form onSubmit={handleManualLookup} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. ACE-LK3F9A-7X2M1P"
              value={manualId}
              onChange={(e) => {
                setManualId(e.target.value);
                setManualError("");
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 text-sm font-mono"
            />
            <button
              type="submit"
              disabled={manualLoading || !manualId.trim()}
              className="bg-[#4169E1] hover:bg-[#3658c9] disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              {manualLoading ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                "Track"
              )}
            </button>
          </form>
          {manualError && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <i className="fas fa-circle-exclamation" /> {manualError}
            </p>
          )}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-16">
            <i className="fas fa-spinner fa-spin text-4xl text-[#4169E1] mb-4" />
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box-open text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
              Orders you place will appear here automatically, or look one up
              using its Order ID above.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg"
            >
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
      </div>
    </div>
  );
}

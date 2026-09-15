import { useState, useEffect, useCallback, useRef } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import { supabase } from "../../lib/supabase";
import { uploadDeliverable } from "../../lib/imageUpload";
import ConfirmModal from "../../components/ConfirmModal";
import { useLocation } from "react-router-dom";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  {
    key: "pending_verification",
    label: "Verifying",
    short: "Verifying",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    bar: "bg-purple-500",
  },
  {
    key: "pending",
    label: "Pending",
    short: "Pending",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "bg-amber-400",
  },
  {
    key: "processing",
    label: "Processing",
    short: "Processing",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    bar: "bg-blue-500",
  },
  {
    key: "completed",
    label: "Completed",
    short: "Completed",
    dot: "bg-[var(--primary)]",
    badge: "bg-[#e8f0eb] text-[var(--primary)] border border-[#c0d4c7]",
    bar: "bg-[var(--primary)]",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    short: "Cancelled",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-600 border border-red-200",
    bar: "bg-red-400",
  },
];

/* ── small reusable download button ── */
function DownloadBtn({ onClick, label = "Download", small = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
        text-white font-semibold rounded-lg transition-all
        ${small ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs"}`}
    >
      <i className="fas fa-download text-[var(--secondary)] text-[10px]" />
      {label}
    </button>
  );
}

export default function OrdersManager() {
  const { services, updateOrderStatus, deleteOrder, refreshOrderSummary } =
    useAdmin();
  const location = useLocation();

  const [activeStatus, setActiveStatus] = useState(
    () => location.state?.status ?? "pending_verification",
  );
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderIdToDelete, setOrderIdToDelete] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [emailAlerts, setEmailAlerts] = useState([]);

  /* ── fetch ── */
  const fetchOrders = useCallback(
    async (status, pageIndex, replace = false) => {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      pageIndex === 0 ? setFetching(true) : setLoadingMore(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_id, status, created_at, service_id, service:services(name)",
        )
        .eq("status", status)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!error && data) {
        setOrders((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageIndex);
      }
      setFetching(false);
      setLoadingMore(false);
    },
    [],
  );

  const fetchOrderDetail = async (orderId) => {
    const { data, error } = await supabase
      .from("orders")
      .select("user_data, receipt_url, deliverable_urls")
      .eq("id", orderId)
      .single();
    if (!error && data) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                user_data: data.user_data,
                receipt_url: data.receipt_url,
                deliverable_urls: data.deliverable_urls ?? [],
              }
            : o,
        ),
      );
    }
  };

  useEffect(() => {
    setOrders([]);
    setExpandedOrders({});
    setSearchOrderId("");
    fetchOrders(activeStatus, 0, true);
  }, [activeStatus, fetchOrders]);

  const handleRefresh = () => {
    setOrders([]);
    setExpandedOrders({});
    fetchOrders(activeStatus, 0, true);
    refreshOrderSummary();
  };

  const toggleExpand = (order) => {
    const isOpen = expandedOrders[order.id];
    setExpandedOrders((prev) => ({ ...prev, [order.id]: !isOpen }));
    if (!isOpen && order.user_data === undefined) fetchOrderDetail(order.id);
  };

  const handleStatusChange = async (order, newStatus) => {
    await updateOrderStatus(order.id, newStatus);
    if (newStatus !== activeStatus)
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    else
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
      );
    refreshOrderSummary();

    if (newStatus === "completed") {
      notifyCustomerOfCompletion(order);
    }
  };

  /* ── completion email side-effect ──
     Fires once, server-side (see /api/send-completion-email). Never blocks
     or reverts the status change itself — only surfaces a dismissible
     warning if the email couldn't go out. */
  const notifyCustomerOfCompletion = async (order) => {
    try {
      const res = await fetch("/api/send-completion-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.sent) {
        if (result.reason === "no_email") {
          pushEmailAlert(
            order,
            "was marked completed, but no customer email was found on file — the completion email was not sent.",
          );
        } else if (result.reason !== "already_sent") {
          pushEmailAlert(
            order,
            "was marked completed, but the completion email failed to send.",
          );
        }
      }
    } catch (err) {
      console.error("Error sending completion email:", err);
      pushEmailAlert(
        order,
        "was marked completed, but the completion email request failed.",
      );
    }
  };

  const pushEmailAlert = (order, message) => {
    setEmailAlerts((prev) => [
      ...prev,
      { id: `${order.id}-${Date.now()}`, orderCode: order.order_id, message },
    ]);
  };

  const dismissEmailAlert = (id) =>
    setEmailAlerts((prev) => prev.filter((a) => a.id !== id));

  const handleDeleteOrder = (id) => {
    setOrderIdToDelete(id);
    setIsConfirmModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (orderIdToDelete) {
      await deleteOrder(orderIdToDelete);
      setOrders((prev) => prev.filter((o) => o.id !== orderIdToDelete));
      setIsConfirmModalOpen(false);
      setOrderIdToDelete(null);
      refreshOrderSummary();
    }
  };

  const getServiceForOrder = (order) => {
    if (!order.service_id) return null;
    for (const list of Object.values(services)) {
      const found = list.find((s) => s.id === order.service_id);
      if (found) return found;
    }
    return null;
  };

  /* ── file helpers ── */
  const isStorageUrl = (v) =>
    typeof v === "string" &&
    (v.startsWith("https://") || v.startsWith("http://"));
  const isImageUrl = (v) =>
    isStorageUrl(v) && /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(v);
  const isBase64 = (v) => typeof v === "string" && v.startsWith("data:");
  const isBase64Img = (v) =>
    typeof v === "string" && v.startsWith("data:image");

  const downloadFromUrl = async (url, baseName) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download =
        decodeURIComponent(new URL(url).pathname.split("/").pop()) || baseName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(obj);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadBase64 = (dataUrl, baseName) => {
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch?.[1] || "";
    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "text/plain": "txt",
    };
    const ext = extMap[mime] || "bin";
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${baseName.replace(/\.[^.]+$/, "")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openLightbox = (url) => {
    setLightboxImage(url);
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = "";
  };

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape" && lightboxImage) closeLightbox();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [lightboxImage]);

  /* ── field renderer ── */
  const renderFieldValue = (fieldName, value) => {
    if (!value)
      return (
        <div
          key={fieldName}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-[var(--border)] last:border-0 gap-2"
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide sm:shrink-0 break-words">
            {fieldName}
          </span>
          <span className="text-xs text-[var(--text-muted)] italic">N/A</span>
        </div>
      );

    if (isImageUrl(value) || isBase64Img(value))
      return (
        <div
          key={fieldName}
          className="py-2 border-b border-[var(--border)] last:border-0"
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-2">
            {fieldName}
          </span>
          <img
            src={value}
            alt={fieldName}
            loading="lazy"
            className="max-h-40 object-contain rounded-xl border border-[var(--border)] cursor-zoom-in hover:opacity-90 transition-opacity mb-2"
            onClick={() => openLightbox(value)}
          />
          <DownloadBtn
            small
            onClick={() =>
              isImageUrl(value)
                ? downloadFromUrl(value, fieldName)
                : downloadBase64(value, fieldName)
            }
          />
        </div>
      );

    if (isStorageUrl(value) || isBase64(value))
      return (
        <div
          key={fieldName}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-[var(--border)] last:border-0 gap-2"
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            {fieldName}
          </span>
          <DownloadBtn
            small
            label="Download File"
            onClick={() =>
              isStorageUrl(value)
                ? downloadFromUrl(value, fieldName)
                : downloadBase64(value, fieldName)
            }
          />
        </div>
      );

    return (
      <div
        key={fieldName}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 border-b border-[var(--border)] last:border-0 gap-1 sm:gap-3"
      >
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide sm:shrink-0 break-words">
          {fieldName}
        </span>
        <span className="text-sm text-[var(--text)] font-medium text-left sm:text-right break-words min-w-0 w-full sm:w-auto">
          {value}
        </span>
      </div>
    );
  };

  /* ── deliverables panel ── */
  function DeliverablesPanel({ order }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [removing, setRemoving] = useState(null);

    const deliverables = Array.isArray(order.deliverable_urls)
      ? order.deliverable_urls
      : [];

    const saveDeliverables = async (updated) => {
      await supabase
        .from("orders")
        .update({ deliverable_urls: updated })
        .eq("id", order.id);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, deliverable_urls: updated } : o,
        ),
      );
    };

    const handleUpload = async (file) => {
      if (!file) return;
      setUploading(true);
      setUploadError(null);
      try {
        const item = await uploadDeliverable(file);
        await saveDeliverables([...deliverables, item]);
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const handleRemove = async (index) => {
      setRemoving(index);
      try {
        const item = deliverables[index];
        const url = typeof item === "string" ? item : item?.url;
        if (url?.includes("/order-files/")) {
          const match = url.match(/\/order-files\/(.+)$/);
          if (match)
            await supabase.storage.from("order-files").remove([match[1]]);
        }
        await saveDeliverables(deliverables.filter((_, i) => i !== index));
      } finally {
        setRemoving(null);
      }
    };

    return (
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
              <i className="fas fa-folder-open text-[var(--secondary)] text-[9px]" />
            </div>
            <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
              Deliverables
            </h4>
            {deliverables.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--text-muted)]">
                {deliverables.length}
              </span>
            )}
          </div>
          <label
            className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-lg
            border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white
            transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files[0])}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin text-[10px]" /> Uploading…
              </>
            ) : (
              <>
                <i className="fas fa-plus text-[10px]" /> Add File
              </>
            )}
          </label>
        </div>

        {uploadError && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <i className="fas fa-circle-exclamation text-red-400 text-xs" />
            <p className="text-xs text-red-600 font-medium">{uploadError}</p>
          </div>
        )}

        {deliverables.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-3 bg-[var(--background)] border border-dashed border-[var(--border)] rounded-xl">
            <i className="fas fa-inbox text-[var(--text-muted)] opacity-40 text-sm" />
            <p className="text-xs text-[var(--text-muted)]">
              No deliverables uploaded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {deliverables.map((item, i) => {
              const url = typeof item === "string" ? item : item?.url;
              const name =
                typeof item === "string"
                  ? decodeURIComponent(new URL(url).pathname.split("/").pop())
                  : item?.name ||
                    decodeURIComponent(new URL(url).pathname.split("/").pop());
              const isImg = isImageUrl(url) || isBase64Img(url);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5"
                >
                  {isImg ? (
                    <img
                      src={url}
                      alt={name}
                      className="w-9 h-9 object-cover rounded-lg border border-[var(--border)] cursor-zoom-in hover:opacity-80 transition-opacity shrink-0"
                      onClick={() => openLightbox(url)}
                    />
                  ) : (
                    <div className="w-9 h-9 bg-white border border-[var(--border)] rounded-lg flex items-center justify-center shrink-0">
                      <i className="fas fa-file text-[var(--primary)] text-sm" />
                    </div>
                  )}
                  <span className="text-sm text-[var(--text)] font-medium truncate flex-1 min-w-0">
                    {name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <DownloadBtn
                      small
                      label="DL"
                      onClick={() => downloadFromUrl(url, name)}
                    />
                    <button
                      onClick={() => handleRemove(i)}
                      disabled={removing === i}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400
                        hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-40"
                    >
                      {removing === i ? (
                        <i className="fas fa-spinner fa-spin text-xs" />
                      ) : (
                        <i className="fas fa-trash text-xs" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── filtered list ── */
  const visibleOrders = searchOrderId.trim()
    ? orders.filter((o) =>
        o.order_id?.toLowerCase().includes(searchOrderId.toLowerCase()),
      )
    : orders;

  const activeTab = STATUS_TABS.find((t) => t.key === activeStatus);

  /* ── render ── */
  return (
    <div className="min-w-0">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
            Orders
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage and update customer service orders
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={fetching}
          className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
            disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
        >
          <i
            className={`fas fa-rotate-right text-[var(--secondary)] text-xs ${fetching ? "fa-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ── Completion email alerts ── */}
      {emailAlerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {emailAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <i className="fas fa-triangle-exclamation text-amber-500 text-sm mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 font-medium flex-1">
                Order <span className="font-mono font-bold">{alert.orderCode}</span>{" "}
                {alert.message}
              </p>
              <button
                onClick={() => dismissEmailAlert(alert.id)}
                className="text-amber-500 hover:text-amber-700 shrink-0"
                aria-label="Dismiss"
              >
                <i className="fas fa-xmark text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Status tabs ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border
              ${
                activeStatus === tab.key
                  ? `${tab.badge} shadow-sm`
                  : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6
            bg-[var(--primary)] rounded-lg flex items-center justify-center pointer-events-none"
          >
            <i className="fas fa-magnifying-glass text-[var(--secondary)] text-[9px]" />
          </div>
          <input
            type="text"
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            placeholder="Search by order ID…"
            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[var(--border)]
              bg-white text-[var(--text)] text-sm placeholder:text-[var(--text-muted)]
              focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(26,67,40,0.12)]
              transition-all"
          />
        </div>
        {searchOrderId && (
          <button
            onClick={() => setSearchOrderId("")}
            className="px-4 py-2.5 bg-white border border-[var(--border)] hover:border-[var(--primary)]
              text-[var(--text-muted)] hover:text-[var(--primary)] rounded-xl text-sm font-bold transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {fetching ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-sm">
            <i className="fas fa-spinner fa-spin text-[var(--primary)] text-xl" />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Loading orders…
          </p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-16 text-center">
          <div
            className="w-16 h-16 bg-[var(--background)] border border-[var(--border)] rounded-2xl
            flex items-center justify-center mx-auto mb-4"
          >
            <i className="fas fa-inbox text-[var(--text-muted)] text-2xl opacity-40" />
          </div>
          <h3 className="font-bold text-[var(--text)] mb-1">No orders found</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {searchOrderId
              ? "No order matches that ID."
              : `No ${activeTab?.label.toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => {
            const service = getServiceForOrder(order);
            const isExpanded = expandedOrders[order.id];
            const tab = STATUS_TABS.find((t) => t.key === order.status);
            const date = new Date(order.created_at).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden
                  transition-all duration-200 hover:shadow-sm"
              >
                {/* Status accent bar */}
                <div
                  className={`h-0.5 w-full ${tab?.bar || "bg-[var(--border)]"}`}
                />

                {/* ── Header row ── */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4
                  cursor-pointer hover:bg-[var(--background)] transition-colors"
                  onClick={() => toggleExpand(order)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Status dot */}
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${tab?.dot || "bg-[var(--border)]"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[var(--text)] text-sm font-mono">
                          {order.order_id}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab?.badge}`}
                        >
                          {tab?.short}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] truncate mt-0.5">
                        {service?.name ||
                          order.service?.name ||
                          "Unknown service"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] opacity-60 mt-0.5">
                        {date}
                      </p>
                    </div>
                  </div>

                  {/* Actions — stop propagation */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order, e.target.value)
                      }
                      className="px-3 py-2 text-xs rounded-xl border border-[var(--border)]
                        bg-[var(--background)] text-[var(--text)] font-semibold
                        focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                    >
                      <option value="pending_verification">
                        Needs Verification
                      </option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl
                        bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all border border-red-100"
                    >
                      <i className="fas fa-trash-can text-xs" />
                    </button>
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-lg
                      bg-[var(--background)] border border-[var(--border)] transition-transform duration-200
                      ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <i className="fas fa-chevron-down text-[var(--text-muted)] text-[10px]" />
                    </div>
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] bg-[var(--background)] p-4 sm:p-5">
                    {order.user_data === undefined ? (
                      <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-4 justify-center">
                        <i className="fas fa-spinner fa-spin" /> Loading
                        details…
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-5 min-w-0">
                        {/* Left: customer details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
                              <i className="fas fa-user text-[var(--secondary)] text-[9px]" />
                            </div>
                            <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
                              Customer Details
                            </h4>
                          </div>
                          <div className="bg-white border border-[var(--border)] rounded-xl p-3 overflow-hidden">
                            {service?.fields?.length > 0
                              ? service.fields.map((f) =>
                                  renderFieldValue(
                                    f.name,
                                    order.user_data?.[f.name],
                                  ),
                                )
                              : Object.entries(order.user_data || {}).map(
                                  ([k, v]) => renderFieldValue(k, v),
                                )}
                          </div>
                        </div>

                        {/* Right: receipt + deliverables */}
                        <div className="min-w-0">
                          {/* Receipt */}
                          {order.receipt_url && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
                                  <i className="fas fa-receipt text-[var(--secondary)] text-[9px]" />
                                </div>
                                <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
                                  Proof of Payment
                                </h4>
                              </div>
                              <div className="bg-white border border-[var(--border)] rounded-xl p-3 space-y-2">
                                {isImageUrl(order.receipt_url) ? (
                                  <>
                                    <img
                                      src={order.receipt_url}
                                      alt="Receipt"
                                      loading="lazy"
                                      className="max-h-48 w-full object-contain rounded-lg border border-[var(--border)]
                                        cursor-zoom-in hover:opacity-90 transition-opacity"
                                      onClick={() =>
                                        openLightbox(order.receipt_url)
                                      }
                                    />
                                    <DownloadBtn
                                      label="Download Receipt"
                                      onClick={() =>
                                        downloadFromUrl(
                                          order.receipt_url,
                                          "receipt",
                                        )
                                      }
                                    />
                                  </>
                                ) : (
                                  <DownloadBtn
                                    label="Download Receipt"
                                    onClick={() =>
                                      downloadFromUrl(
                                        order.receipt_url,
                                        "receipt",
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Deliverables */}
                          <DeliverablesPanel order={order} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Load more ── */}
      {hasMore && !searchOrderId && !fetching && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchOrders(activeStatus, page + 1, false)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 bg-white border border-[var(--border)]
              hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text-muted)]
              px-8 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <i className="fas fa-spinner fa-spin text-xs" /> Loading…
              </>
            ) : (
              <>
                <i className="fas fa-chevron-down text-xs" /> Load more orders
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        >
          <div className="relative max-w-[92vw] max-h-[92vh]">
            <button
              onClick={closeLightbox}
              className="absolute -top-11 right-0 w-9 h-9 bg-white/15 hover:bg-white/25
                border border-white/20 rounded-xl flex items-center justify-center
                text-white transition-all"
              aria-label="Close"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-[92vw] max-h-[92vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ── Confirm delete modal ── */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setOrderIdToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
      />
    </div>
  );
}
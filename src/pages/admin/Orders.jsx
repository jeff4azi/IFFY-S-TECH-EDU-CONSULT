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
    label: "Needs Verification",
    badge: "bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
  },
  {
    key: "pending",
    label: "Pending",
    badge: "bg-orange-100 text-orange-800",
    dot: "bg-orange-400",
  },
  {
    key: "processing",
    label: "Processing",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-400",
  },
  {
    key: "completed",
    label: "Completed",
    badge: "bg-green-100 text-green-800",
    dot: "bg-green-500",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-400",
  },
];

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

  // ─── Lightbox State ──────────────────────────────────────────────────────
  const [lightboxImage, setLightboxImage] = useState(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

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

  const handleLoadMore = () => fetchOrders(activeStatus, page + 1, false);

  // ─── Expand ───────────────────────────────────────────────────────────────

  const toggleExpand = (order) => {
    const isOpen = expandedOrders[order.id];
    setExpandedOrders((prev) => ({ ...prev, [order.id]: !isOpen }));
    if (!isOpen && order.user_data === undefined) fetchOrderDetail(order.id);
  };

  // ─── Status update ────────────────────────────────────────────────────────

  const handleStatusChange = async (order, newStatus) => {
    await updateOrderStatus(order.id, newStatus);
    if (newStatus !== activeStatus) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
      );
    }
    refreshOrderSummary();
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

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

  // ─── Service lookup ───────────────────────────────────────────────────────

  const getServiceForOrder = (order) => {
    if (!order.service_id) return null;
    for (const list of Object.values(services)) {
      const found = list.find((s) => s.id === order.service_id);
      if (found) return found;
    }
    return null;
  };

  // ─── File helpers ─────────────────────────────────────────────────────────

  const isStorageUrl = (val) =>
    typeof val === "string" &&
    (val.startsWith("https://") || val.startsWith("http://"));
  const isImageUrl = (val) =>
    isStorageUrl(val) && /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(val);
  const isBase64 = (val) => typeof val === "string" && val.startsWith("data:");
  const isBase64Img = (val) =>
    typeof val === "string" && val.startsWith("data:image");

  const downloadFromUrl = async (url, baseName) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const urlFileName = decodeURIComponent(
        new URL(url).pathname.split("/").pop(),
      );
      link.href = objectUrl;
      link.download = urlFileName || baseName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadBase64 = (dataUrl, baseName) => {
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : "";
    const mimeMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/bmp": "bmp",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "text/plain": "txt",
      "text/csv": "csv",
    };
    const ext = mimeMap[mime] || "bin";
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${baseName.replace(/\.[^.]+$/, "")}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Lightbox handlers ──────────────────────────────────────────────────

  const openLightbox = (imageUrl) => {
    setLightboxImage(imageUrl);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = "";
  };

  const handleLightboxClick = (e) => {
    if (e.target === e.currentTarget) {
      closeLightbox();
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && lightboxImage) {
        closeLightbox();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [lightboxImage]);

  // ─── Field renderer ───────────────────────────────────────────────────────

  const renderFieldValue = (fieldName, value) => {
    if (!value)
      return (
        <div key={fieldName}>
          <span className="font-medium text-gray-700">{fieldName}:</span>
          <span className="ml-2 text-gray-400 italic">N/A</span>
        </div>
      );

    if (isImageUrl(value))
      return (
        <div key={fieldName} className="space-y-2">
          <span className="font-medium text-gray-700 block">{fieldName}:</span>
          <img
            src={value}
            alt={fieldName}
            loading="lazy"
            className="max-h-48 object-contain rounded-xl border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
            onClick={() => openLightbox(value)}
          />
          <button
            onClick={() => downloadFromUrl(value, fieldName)}
            className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Download
          </button>
        </div>
      );

    if (isStorageUrl(value))
      return (
        <div key={fieldName} className="space-y-1">
          <span className="font-medium text-gray-700 block">{fieldName}:</span>
          <button
            onClick={() => downloadFromUrl(value, fieldName)}
            className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Download File
          </button>
        </div>
      );

    if (isBase64Img(value))
      return (
        <div key={fieldName} className="space-y-2">
          <span className="font-medium text-gray-700 block">{fieldName}:</span>
          <img
            src={value}
            alt={fieldName}
            loading="lazy"
            className="max-h-48 object-contain rounded-xl border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
            onClick={() => openLightbox(value)}
          />
          <button
            onClick={() => downloadBase64(value, fieldName)}
            className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Download
          </button>
        </div>
      );

    if (isBase64(value))
      return (
        <div key={fieldName} className="space-y-1">
          <span className="font-medium text-gray-700 block">{fieldName}:</span>
          <button
            onClick={() => downloadBase64(value, fieldName)}
            className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Download File
          </button>
        </div>
      );

    return (
      <div key={fieldName}>
        <span className="font-medium text-gray-700">{fieldName}:</span>
        <span className="ml-2 text-gray-800 break-all">{value}</span>
      </div>
    );
  };

  // ─── Deliverables panel ───────────────────────────────────────────────────

  function DeliverablesPanel({ order }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [removing, setRemoving] = useState(null); // index being removed

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
        const updated = [...deliverables, item];
        await saveDeliverables(updated);
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
        // Delete from storage
        if (url && url.includes("/order-files/")) {
          const match = url.match(/\/order-files\/(.+)$/);
          if (match)
            await supabase.storage.from("order-files").remove([match[1]]);
        }
        const updated = deliverables.filter((_, i) => i !== index);
        await saveDeliverables(updated);
      } finally {
        setRemoving(null);
      }
    };

    const isDeliverableImage = (url) => {
      if (!url) return false;
      return isImageUrl(url) || isBase64Img(url);
    };

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Deliverable Files
          </h4>
          <label
            className={`flex items-center gap-1.5 text-xs font-medium text-[#4169E1] cursor-pointer hover:text-[#3658c9] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}
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
                <i className="fas fa-spinner fa-spin"></i> Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> Add File
              </>
            )}
          </label>
        </div>

        {uploadError && (
          <p className="text-red-500 text-xs mb-2 flex items-center gap-1">
            <i className="fas fa-circle-exclamation"></i> {uploadError}
          </p>
        )}

        {deliverables.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No deliverables uploaded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {deliverables.map((item, i) => {
              const url = typeof item === "string" ? item : item?.url;
              const name =
                typeof item === "string"
                  ? decodeURIComponent(new URL(url).pathname.split("/").pop())
                  : item?.name ||
                    decodeURIComponent(new URL(url).pathname.split("/").pop());
              const isImg = isDeliverableImage(url);
              
              return (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`${isImg ? 'fas fa-image' : 'fas fa-file'} text-[#4169E1] shrink-0 text-sm`}></i>
                    {isImg ? (
                      <img
                        src={url}
                        alt={name}
                        className="h-10 w-10 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                        onClick={() => openLightbox(url)}
                      />
                    ) : null}
                    <span className="text-sm text-gray-700 truncate">
                      {name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => downloadFromUrl(url, name)}
                      className="text-xs text-[#4169E1] hover:text-[#3658c9] font-medium px-2 py-1 rounded-lg hover:bg-[#4169E1]/10 transition-colors"
                    >
                      <i className="fas fa-download mr-1"></i>DL
                    </button>
                    <button
                      onClick={() => handleRemove(i)}
                      disabled={removing === i}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {removing === i ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
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

  // ─── Visible list ─────────────────────────────────────────────────────────

  const visibleOrders = searchOrderId.trim()
    ? orders.filter((o) =>
        o.order_id?.toLowerCase().includes(searchOrderId.toLowerCase()),
      )
    : orders;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">Orders Manager</h2>
        <button
          onClick={handleRefresh}
          disabled={fetching}
          className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#3658c9] disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <i className={`fas fa-rotate-right ${fetching ? "fa-spin" : ""}`}></i>{" "}
          Refresh
        </button>
      </div>

      {/* Status Pill Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
              activeStatus === tab.key
                ? `${tab.badge} border-transparent shadow-sm`
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${tab.dot}`}></span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchOrderId}
          onChange={(e) => setSearchOrderId(e.target.value)}
          placeholder="Search by order ID..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 text-sm"
        />
        {searchOrderId && (
          <button
            onClick={() => setSearchOrderId("")}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Order List */}
      {fetching ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-[#4169E1] mb-3"></i>
            <p className="text-gray-500 text-sm">Loading orders...</p>
          </div>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-lg text-center text-gray-400">
          <i className="fas fa-inbox text-5xl mb-4 block text-gray-200"></i>
          <p className="font-medium">
            {searchOrderId
              ? "No order matches that ID"
              : `No ${activeStatus} orders`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visibleOrders.map((order) => {
              const service = getServiceForOrder(order);
              const isExpanded = expandedOrders[order.id];
              const tab = STATUS_TABS.find((t) => t.key === order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Header row */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(order)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          #{order.order_id}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab?.badge || "bg-gray-100 text-gray-700"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {service?.name ||
                          order.service?.name ||
                          "Unknown service"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value)
                        }
                        className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#4169E1] bg-white"
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
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-xl text-sm transition-colors"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <i
                        className={`fas fa-chevron-${isExpanded ? "up" : "down"} text-gray-300 text-xs`}
                      ></i>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      {order.user_data === undefined ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                          <i className="fas fa-spinner fa-spin"></i> Loading
                          details...
                        </div>
                      ) : (
                        <>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Customer Details
                          </h4>
                          <div className="flex flex-col gap-3 text-sm">
                            {service?.fields?.length > 0
                              ? service.fields.map((field) =>
                                  renderFieldValue(
                                    field.name,
                                    order.user_data?.[field.name],
                                  ),
                                )
                              : Object.entries(order.user_data || {}).map(
                                  ([key, val]) => renderFieldValue(key, val),
                                )}
                          </div>

                          {/* Proof of Payment */}
                          {order.receipt_url && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Proof of Payment
                              </h4>
                              {isImageUrl(order.receipt_url) ? (
                                <div className="space-y-2">
                                  <img
                                    src={order.receipt_url}
                                    alt="Payment receipt"
                                    loading="lazy"
                                    className="max-h-64 object-contain rounded-xl border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                    onClick={() => openLightbox(order.receipt_url)}
                                  />
                                  <button
                                    onClick={() =>
                                      downloadFromUrl(
                                        order.receipt_url,
                                        "receipt",
                                      )
                                    }
                                    className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                  >
                                    <i className="fas fa-download"></i> Download
                                    Receipt
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    downloadFromUrl(
                                      order.receipt_url,
                                      "receipt",
                                    )
                                  }
                                  className="bg-[#4169E1] hover:bg-[#3658c9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                  <i className="fas fa-download"></i> Download
                                  Receipt
                                </button>
                              )}
                            </div>
                          )}

                          {/* Deliverables — always shown, admin can upload anytime */}
                          <DeliverablesPanel order={order} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && !searchOrderId && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white border border-gray-200 hover:border-[#4169E1] hover:text-[#4169E1] text-gray-600 px-8 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                  </>
                ) : (
                  "Load more orders"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={handleLightboxClick}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl font-light transition-colors"
              aria-label="Close lightbox"
            >
              ×
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

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

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
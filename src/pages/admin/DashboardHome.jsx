import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";

const STATUS_CFG = {
  pending_verification: {
    label: "Verifying",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  processing: {
    label: "Processing",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-[#e8f0eb] text-[var(--primary)] border border-[#c0d4c7]",
    dot: "bg-[var(--primary)]",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-400",
  },
};

function StatCard({ label, value, icon, iconBg, onClick, urgent }) {
  return (
    <button
      onClick={onClick}
      className={`group bg-white rounded-2xl border p-4 text-left transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
        ${
          urgent && value > 0
            ? "border-[var(--secondary)] shadow-[0_0_0_1px_var(--secondary)]"
            : "border-[var(--border)] hover:border-[var(--primary)]"
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0
          group-hover:scale-110 transition-transform`}
        >
          <i className={`fas ${icon} text-white text-sm`} />
        </div>
        {urgent && value > 0 && (
          <span className="w-2 h-2 bg-[var(--secondary)] rounded-full shrink-0 mt-1 animate-pulse" />
        )}
      </div>
      <p className="text-3xl font-extrabold text-[var(--text)] leading-none mb-1">
        {value}
      </p>
      <p className="text-xs text-[var(--text-muted)] font-medium leading-tight">
        {label}
      </p>
    </button>
  );
}

function OrderRow({ order, onClick }) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : null;
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background)] rounded-xl
        cursor-pointer transition-colors group"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
          {order.service?.name || "Unknown service"}
        </p>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          {order.order_id}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {date && (
          <span className="text-xs text-[var(--text-muted)] hidden sm:block">
            {date}
          </span>
        )}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, count, onViewAll, children, emptyText }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <i className={`fas ${icon} text-[var(--secondary)] text-[10px]`} />
          </div>
          <h3 className="font-bold text-[var(--text)] text-sm">{title}</h3>
          {count != null && (
            <span className="text-xs font-bold px-2 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--text-muted)]">
              {count}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)]
            flex items-center gap-1 transition-colors"
        >
          View all <i className="fas fa-arrow-right text-[9px]" />
        </button>
      </div>
      <div className="p-2">
        {children || (
          <p className="text-[var(--text-muted)] text-sm px-3 py-4">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { services, testimonials, contactMessages, orderSummary } = useAdmin();

  const totalServices = Object.values(services).reduce(
    (s, a) => s + a.length,
    0,
  );
  const pendingTestimonials = testimonials.filter((t) => !t.approved).length;
  const unreadMessages = contactMessages.filter((m) => !m.read).length;
  const { counts, recent } = orderSummary;

  const goToOrders = (status) =>
    navigate("/admin/orders", status ? { state: { status } } : undefined);

  /* ── stat cards config ── */
  const STATS = [
    /* row 1: urgent operational */
    {
      label: "Needs Verification",
      value: counts.pending_verification,
      icon: "fa-file-invoice",
      iconBg: "bg-purple-500",
      onClick: () => goToOrders("pending_verification"),
      urgent: true,
    },
    {
      label: "Pending Orders",
      value: counts.pending,
      icon: "fa-hourglass-half",
      iconBg: "bg-amber-500",
      onClick: () => goToOrders("pending"),
      urgent: true,
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      icon: "fa-envelope",
      iconBg: "bg-red-500",
      onClick: () => navigate("/admin/messages"),
      urgent: true,
    },
    {
      label: "Pending Reviews",
      value: pendingTestimonials,
      icon: "fa-star",
      iconBg: "bg-yellow-500",
      onClick: () => navigate("/admin/testimonials"),
      urgent: true,
    },
    /* row 2: informational */
    {
      label: "Processing",
      value: counts.processing,
      icon: "fa-gears",
      iconBg: "bg-blue-500",
      onClick: () => goToOrders("processing"),
    },
    {
      label: "Completed",
      value: counts.completed,
      icon: "fa-circle-check",
      iconBg: "bg-[var(--primary)]",
      onClick: () => goToOrders("completed"),
    },
    {
      label: "Cancelled",
      value: counts.cancelled,
      icon: "fa-circle-xmark",
      iconBg: "bg-red-400",
      onClick: () => goToOrders("cancelled"),
    },
    {
      label: "Total Orders",
      value: counts.total,
      icon: "fa-bag-shopping",
      iconBg: "bg-[var(--text-muted)]",
      onClick: () => goToOrders(null),
    },
    {
      label: "Total Services",
      value: totalServices,
      icon: "fa-layer-group",
      iconBg: "bg-[var(--secondary)]",
      onClick: () => navigate("/admin/services"),
    },
  ];

  return (
    <div className="min-w-0 overflow-x-hidden space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
            Overview
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {/* Quick action */}
        <button
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]
            text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
        >
          <i className="fas fa-bag-shopping text-[var(--secondary)] text-xs" />
          Manage Orders
        </button>
      </div>

      {/* ── Stat grid ── */}
      <div>
        {/* Urgent row label */}
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--danger)] rounded-full animate-pulse inline-block" />
          Requires Attention
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {STATS.slice(0, 4).map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
          Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {STATS.slice(4).map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      </div>

      {/* ── Orders sections ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard
          title="Needs Verification"
          icon="fa-file-invoice"
          count={recent.pending_verification?.length}
          onViewAll={() => goToOrders("pending_verification")}
          emptyText="No orders awaiting verification"
        >
          {recent.pending_verification?.length > 0 &&
            recent.pending_verification.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onClick={() => goToOrders("pending_verification")}
              />
            ))}
        </SectionCard>

        <SectionCard
          title="Pending Orders"
          icon="fa-hourglass-half"
          count={recent.pending?.length}
          onViewAll={() => goToOrders("pending")}
          emptyText="No pending orders"
        >
          {recent.pending?.length > 0 &&
            recent.pending.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onClick={() => goToOrders("pending")}
              />
            ))}
        </SectionCard>

        <SectionCard
          title="Processing"
          icon="fa-gears"
          count={recent.processing?.length}
          onViewAll={() => goToOrders("processing")}
          emptyText="No orders in progress"
        >
          {recent.processing?.length > 0 &&
            recent.processing.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onClick={() => goToOrders("processing")}
              />
            ))}
        </SectionCard>

        <SectionCard
          title="Recently Completed"
          icon="fa-circle-check"
          count={recent.completed?.length}
          onViewAll={() => goToOrders("completed")}
          emptyText="No completed orders yet"
        >
          {recent.completed?.length > 0 &&
            recent.completed.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onClick={() => goToOrders("completed")}
              />
            ))}
        </SectionCard>
      </div>

      {/* ── Recent messages ── */}
      <SectionCard
        title="Recent Messages"
        icon="fa-envelope"
        count={contactMessages.length}
        onViewAll={() => navigate("/admin/messages")}
        emptyText="No messages yet"
      >
        {contactMessages.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-1">
            {contactMessages.slice(0, 6).map((msg) => (
              <div
                key={msg.id}
                onClick={() => navigate("/admin/messages")}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--background)] rounded-xl
                  cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[var(--secondary)] text-xs font-bold">
                    {(msg.name || msg.fullName || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {msg.name || msg.fullName}
                    </p>
                    {!msg.read && (
                      <span className="w-2 h-2 bg-[var(--danger)] rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

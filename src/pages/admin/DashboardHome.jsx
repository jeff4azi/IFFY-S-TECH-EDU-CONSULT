import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";

export default function DashboardHome() {
  const navigate = useNavigate();
  const { services, testimonials, contactMessages, orderSummary } = useAdmin();

  const totalServices = Object.values(services).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const pendingTestimonials = testimonials.filter((t) => !t.approved).length;
  const unreadMessages = contactMessages.filter((m) => !m.read).length;

  const { counts, recent } = orderSummary;

  // Navigate to orders with a pre-selected status tab via router state
  const goToOrders = (status) =>
    navigate("/admin/orders", status ? { state: { status } } : undefined);

  const stats = [
    {
      label: "Total Services",
      value: totalServices,
      icon: "fa-briefcase",
      color: "bg-blue-500",
      onClick: () => navigate("/admin/services"),
    },
    {
      label: "Pending Testimonials",
      value: pendingTestimonials,
      icon: "fa-star",
      color: "bg-yellow-500",
      onClick: () => navigate("/admin/testimonials"),
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      icon: "fa-envelope",
      color: "bg-red-500",
      onClick: () => navigate("/admin/messages"),
    },
    {
      label: "Needs Verification",
      value: counts.pending_verification,
      icon: "fa-file-invoice",
      color: "bg-purple-500",
      onClick: () => goToOrders("pending_verification"),
    },
    {
      label: "Pending Orders",
      value: counts.pending,
      icon: "fa-hourglass-half",
      color: "bg-orange-500",
      onClick: () => goToOrders("pending"),
    },
    {
      label: "Processing Orders",
      value: counts.processing,
      icon: "fa-spinner",
      color: "bg-blue-400",
      onClick: () => goToOrders("processing"),
    },
    {
      label: "Completed Orders",
      value: counts.completed,
      icon: "fa-circle-check",
      color: "bg-green-500",
      onClick: () => goToOrders("completed"),
    },
    {
      label: "Cancelled Orders",
      value: counts.cancelled,
      icon: "fa-circle-xmark",
      color: "bg-red-400",
      onClick: () => goToOrders("cancelled"),
    },
    {
      label: "Total Orders",
      value: counts.total,
      icon: "fa-shopping-cart",
      color: "bg-indigo-500",
      onClick: () => goToOrders(null),
    },
  ];

  const statusConfig = {
    pending_verification: {
      label: "Needs Verification",
      badge: "bg-purple-100 text-purple-800",
    },
    pending: { label: "Pending", badge: "bg-orange-100 text-orange-800" },
    processing: { label: "Processing", badge: "bg-blue-100 text-blue-800" },
    completed: { label: "Completed", badge: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", badge: "bg-red-100 text-red-800" },
  };

  const OrderList = ({ title, orderList, emptyText, status }) => (
    <div className="bg-white rounded-2xl shadow-lg min-w-0 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => goToOrders(status)}
      >
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <span className="text-xs text-[#4169E1] font-medium flex items-center gap-1">
          View all <i className="fas fa-arrow-right text-[10px]"></i>
        </span>
      </div>
      <div className="px-4 md:px-6 pb-4 md:pb-6">
        {orderList.length === 0 ? (
          <p className="text-gray-500 text-sm">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {orderList.map((order) => (
              <div
                key={order.id}
                onClick={() => goToOrders(status)}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#4169E1]/5 rounded-xl gap-2 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 truncate font-medium">
                    {order.service?.name || "Unknown service"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {order.order_id}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusConfig[order.status]?.badge || "bg-gray-100 text-gray-800"}`}
                >
                  {statusConfig[order.status]?.label || order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-w-0 overflow-x-hidden">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Dashboard Overview
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map((stat, i) => (
          <button
            key={i}
            onClick={stat.onClick}
            className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#4169E1]/30 hover:-translate-y-0.5 transition-all text-left min-w-0 group"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div
                className={`w-9 h-9 md:w-11 md:h-11 ${stat.color} rounded-xl flex items-center justify-center text-white text-sm md:text-lg shrink-0 group-hover:scale-110 transition-transform`}
              >
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-gray-500 text-xs truncate leading-tight">
                  {stat.label}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Needs Verification — full width, most urgent */}
      <div className="mb-4">
        <OrderList
          title="Needs Verification"
          orderList={recent.pending_verification ?? []}
          emptyText="No orders awaiting verification"
          status="pending_verification"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <OrderList
          title="Pending Orders"
          orderList={recent.pending}
          emptyText="No pending orders"
          status="pending"
        />
        <OrderList
          title="Processing Orders"
          orderList={recent.processing}
          emptyText="No orders currently processing"
          status="processing"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <OrderList
          title="Completed Orders"
          orderList={recent.completed}
          emptyText="No completed orders yet"
          status="completed"
        />
        <OrderList
          title="Cancelled Orders"
          orderList={recent.cancelled}
          emptyText="No cancelled orders"
          status="cancelled"
        />
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden min-w-0">
        <div
          className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate("/admin/messages")}
        >
          <h3 className="text-base font-bold text-gray-900">Recent Messages</h3>
          <span className="text-xs text-[#4169E1] font-medium flex items-center gap-1">
            View all <i className="fas fa-arrow-right text-[10px]"></i>
          </span>
        </div>
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          {contactMessages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {contactMessages.slice(0, 6).map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => navigate("/admin/messages")}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#4169E1]/5 rounded-xl gap-2 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {msg.name || msg.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {msg.message}
                    </p>
                  </div>
                  {!msg.read && (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

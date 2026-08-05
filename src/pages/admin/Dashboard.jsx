import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";
import IffysLogo from "../../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

const NAV_ITEMS = [
  { path: "/admin/dashboard", name: "Dashboard", icon: "fa-gauge-high" },
  { path: "/admin/orders", name: "Orders", icon: "fa-bag-shopping" },
  { path: "/admin/messages", name: "Messages", icon: "fa-envelope" },
  { path: "/admin/services", name: "Services", icon: "fa-layer-group" },
  { path: "/admin/testimonials", name: "Testimonials", icon: "fa-star" },
  { path: "/admin/settings", name: "Settings", icon: "fa-sliders" },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoggedIn, logout, orderSummary, contactMessages, testimonials } =
    useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoggedIn) {
    navigate("/admin/login");
    return null;
  }

  const isActive = (path) => {
    if (path === "/admin/dashboard")
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard"
      );
    return location.pathname.startsWith(path);
  };

  /* notification dots */
  const unreadMessages = contactMessages.filter((m) => !m.read).length;
  const pendingTestimonials = testimonials.filter((t) => !t.approved).length;
  const pendingOrders =
    (orderSummary?.counts?.pending_verification ?? 0) +
    (orderSummary?.counts?.pending ?? 0);

  const badges = {
    "/admin/orders": pendingOrders || null,
    "/admin/messages": unreadMessages || null,
    "/admin/testimonials": pendingTestimonials || null,
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[var(--primary)]
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="bg-white rounded-xl px-3 py-1.5">
            <img
              src={IffysLogo}
              alt="IFFY'S TECH EDU CONSULT"
              className="h-8 object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/60 hover:text-white transition-colors ml-2"
          >
            <i className="fas fa-xmark text-lg" />
          </button>
        </div>

        {/* Admin label */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center shrink-0">
              <i className="fas fa-shield-halved text-white text-xs" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                Admin Panel
              </p>
              <p className="text-white/45 text-[10px] font-medium leading-tight">
                IFFY'S TECH EDU CONSULT
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const badge = badges[item.path];
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold
                  ${
                    active
                      ? "bg-[var(--secondary)] text-white shadow-sm"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
              >
                <i className={`fas ${item.icon} w-4 text-center text-sm`} />
                <span className="flex-1">{item.name}</span>
                {badge ? (
                  <span
                    className="w-5 h-5 bg-[var(--danger)] text-white text-[10px] font-bold
                    rounded-full flex items-center justify-center shrink-0"
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : active ? (
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full shrink-0" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: view site + logout */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
              text-white/60 hover:bg-white/8 hover:text-white transition-all"
          >
            <i className="fas fa-arrow-up-right-from-square w-4 text-center text-sm" />
            View Site
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
              text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all text-left"
          >
            <i className="fas fa-right-from-bracket w-4 text-center text-sm" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-64 min-w-0 flex flex-col">
        {/* Top bar */}
        <header
          className="bg-white border-b border-[var(--border)] px-4 md:px-6 h-14
          flex items-center justify-between sticky top-0 z-20 shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl
                text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--primary)] transition-all"
            >
              <i className="fas fa-bars text-base" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-[var(--text-muted)]">
              {/* Breadcrumb label */}
              {NAV_ITEMS.find((n) => isActive(n.path)) && (
                <>
                  <i className="fas fa-gauge-high text-[var(--primary)] text-xs" />
                  <span className="font-semibold text-[var(--text)]">
                    {NAV_ITEMS.find((n) => isActive(n.path))?.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification summary */}
            {pendingOrders > 0 && (
              <Link
                to="/admin/orders"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                  bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <i className="fas fa-circle-exclamation text-[10px]" />
                {pendingOrders} pending
              </Link>
            )}
            <div className="h-5 w-px bg-[var(--border)] mx-1" />
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--background)]
              border border-[var(--border)] rounded-xl"
            >
              <div className="w-6 h-6 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <i className="fas fa-user text-[var(--secondary)] text-[9px]" />
              </div>
              <span className="text-xs font-bold text-[var(--text)] hidden sm:block">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";
import IffysLogo from "../../assets/IFFYS-TECH EDU-CONSULT-LOGO.png";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoggedIn, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoggedIn) {
    navigate("/admin/login");
    return null;
  }

  const navItems = [
    { path: "/admin/dashboard", name: "Dashboard", icon: "fa-home" },
    { path: "/admin/orders", name: "Orders", icon: "fa-shopping-cart" },
    { path: "/admin/messages", name: "Contact Messages", icon: "fa-envelope" },
    { path: "/admin/services", name: "Services Manager", icon: "fa-briefcase" },
    { path: "/admin/testimonials", name: "Testimonials", icon: "fa-star" },
    { path: "/admin/settings", name: "Site Settings", icon: "fa-cog" },
  ];

  const isActive = (path) => {
    if (path === "/admin/dashboard") {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard"
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={IffysLogo}
              alt="Ace Educational Consult"
              className="h-9 shrink-0"
            />
            <span className="font-bold text-base truncate">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white text-xl shrink-0 ml-2"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  active
                    ? "bg-[#4169E1] text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <i className={`fas ${item.icon} w-4 text-center`}></i>
                <span>{item.name}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-gray-800">
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/50 transition-colors w-full text-left text-sm font-medium text-gray-300 hover:text-white"
            >
              <i className="fas fa-sign-out-alt w-4 text-center"></i>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 min-w-0">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-700 text-xl"
          >
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          <Link
            to="/"
            className="text-[#4169E1] hover:text-[#3658c9] font-medium text-sm"
          >
            View Site
          </Link>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

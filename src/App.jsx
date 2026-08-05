import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
const HomePage = lazy(() => import("./pages/HomePage"));
const ServiceForm = lazy(() => import("./pages/ServiceForm"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const MyOrders = lazy(() => import("./pages/MyOrders"));

// Admin pages — never shipped to regular visitors
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const DashboardHome = lazy(() => import("./pages/admin/DashboardHome"));
const SiteSettings = lazy(() => import("./pages/admin/Settings"));
const ServicesManager = lazy(() => import("./pages/admin/Services"));
const ContactMessages = lazy(() => import("./pages/admin/Messages"));
const TestimonialsManager = lazy(() => import("./pages/admin/Testimonials"));
const OrdersManager = lazy(() => import("./pages/admin/Orders"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#4169E1] mb-3"></i>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/service-form" element={<ServiceForm />} />
          <Route path="/service-form/:serviceId" element={<ServiceForm />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="settings" element={<SiteSettings />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="messages" element={<ContactMessages />} />
            <Route path="testimonials" element={<TestimonialsManager />} />
            <Route path="orders" element={<OrdersManager />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

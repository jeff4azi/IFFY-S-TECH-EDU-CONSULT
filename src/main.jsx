import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AdminProvider } from "./contexts/AdminContext";
import { OrderProvider } from "./contexts/OrderContext";

createRoot(document.getElementById("root")).render(
  <AdminProvider>
    <OrderProvider>
      <App />
    </OrderProvider>
  </AdminProvider>
);

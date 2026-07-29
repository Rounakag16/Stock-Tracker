import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import EmployeePage from "./pages/Employee";
import { AdminLayout } from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStockPage from "./pages/AdminStock";
import AdminWarehousesPage from "./pages/AdminWarehouses";
import AdminRequestsPage from "./pages/AdminRequests";
import AdminEmployeesPage from "./pages/AdminEmployees";
import AdminLogsPage from "./pages/AdminLogs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/employee" element={<EmployeePage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="stock" element={<AdminStockPage />} />
          <Route path="warehouses" element={<AdminWarehousesPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

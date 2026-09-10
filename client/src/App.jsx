import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
// Password recovery pages exist but aren't wired to real email delivery
// yet — see server/src/routes/auth.js for the matching disabled routes.
// import ForgotPasswordPage from "./pages/ForgotPassword";
// import ResetPasswordPage from "./pages/ResetPassword";
import EmployeePage from "./pages/Employee";
import { AdminLayout } from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStockPage from "./pages/AdminStock";
import AdminWarehousesPage from "./pages/AdminWarehouses";
import AdminRequestsPage from "./pages/AdminRequests";
import AdminEmployeesPage from "./pages/AdminEmployees";
import AdminLogsPage from "./pages/AdminLogs";
import AdminSettingsPage from "./pages/AdminSettings";
import AdminTagsPage from "./pages/AdminTags";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
        {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
        <Route path="/employee" element={<EmployeePage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="stock" element={<AdminStockPage />} />
          <Route path="warehouses" element={<AdminWarehousesPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

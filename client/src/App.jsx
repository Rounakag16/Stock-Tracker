import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import VerifyEmailPage from "./pages/VerifyEmail";
import TermsPage from "./pages/legal/Terms";
import PrivacyPage from "./pages/legal/Privacy";
import NotFoundPage from "./pages/NotFound";
import EmployeePage from "./pages/Employee";
import { AdminLayout } from "./components/AdminLayout";
import { RequireReadyAccount } from "./components/AccountGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStockPage from "./pages/AdminStock";
import AdminWarehousesPage from "./pages/AdminWarehouses";
import AdminRequestsPage from "./pages/AdminRequests";
import AdminEmployeesPage from "./pages/AdminEmployees";
import AdminLogsPage from "./pages/AdminLogs";
import AdminSettingsPage from "./pages/AdminSettings";
import AdminTagsPage from "./pages/AdminTags";
import AdminDailyPage from "./pages/AdminDaily";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="/employee"
            element={
              <RequireReadyAccount role="employee">
                <EmployeePage />
              </RequireReadyAccount>
            }
          />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="stock" element={<AdminStockPage />} />
            <Route path="warehouses" element={<AdminWarehousesPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="employees" element={<AdminEmployeesPage />} />
            <Route path="daily" element={<AdminDailyPage />} />
            <Route path="logs" element={<AdminLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="tags" element={<AdminTagsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

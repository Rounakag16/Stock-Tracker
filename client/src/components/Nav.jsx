import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { del } from "../lib/api";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/stock", label: "Stock", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/admin/requests", label: "Requests", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/admin/warehouses", label: "Warehouses", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/admin/employees", label: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/admin/logs", label: "Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

export function AdminNav({ username, companyName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  async function logout() {
    await del("/auth/login");
    navigate("/");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 bg-white border-r border-line">
        <div className="p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center">
              <svg className="w-5 h-5 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-ink truncate">{companyName || "Stock Tracker"}</h1>
              <p className="text-xs text-slate-500">Admin Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-line space-y-1">
          <p className="text-sm text-slate-600 px-4 mb-2">{username}</p>
          <button onClick={() => setShowPassword(true)} className="btn-ghost w-full justify-start">
            Change password
          </button>
          <button onClick={logout} className="btn-ghost w-full justify-start text-red-600">
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {adminLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[64px] ${
                  active ? "text-brand-600" : "text-slate-500"
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d={link.icon} />
                </svg>
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 bg-paper/85 backdrop-blur-lg border-b border-line">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <svg className="w-4 h-4 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-display font-bold text-ink">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPassword(true)} className="text-sm text-slate-600 font-medium px-3 py-1.5">
              Password
            </button>
            <button onClick={logout} className="text-sm text-red-600 font-medium px-3 py-1.5">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
    </>
  );
}

export function EmployeeNav({ username, companyName }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  async function logout() {
    await del("/auth/login");
    navigate("/");
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-lg border-b border-line">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <svg className="w-4 h-4 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <span className="font-display font-bold text-ink block leading-tight">{companyName || "Stock Tracker"}</span>
              <span className="text-xs text-slate-500">{username}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowPassword(true)} className="text-sm text-slate-600 font-medium px-2 py-1.5">
              Password
            </button>
            <button onClick={logout} className="text-sm text-red-600 font-medium px-2 py-1.5">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
    </>
  );
}

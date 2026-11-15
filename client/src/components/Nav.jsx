import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { NotificationBell } from "./NotificationBell";
import { del } from "../lib/api";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/stock", label: "Stock", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/admin/tags", label: "Tags", icon: "M7 7h.01M7 3h5.586a1 1 0 01.707.293l7.414 7.414a1 1 0 010 1.414l-7.586 7.586a1 1 0 01-1.414 0L4.293 12.293A1 1 0 014 11.586V6a3 3 0 013-3z" },
  { href: "/admin/requests", label: "Requests", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/admin/warehouses", label: "Warehouses", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/admin/employees", label: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/admin/daily", label: "Daily", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/logs", label: "Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/admin/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

// Phones get a 5-slot bottom bar: the four pages used most day-to-day plus a
// "More" button that opens a sheet with everything else. Nine tabs in a
// horizontally scrolling strip hid half the app off-screen.
const PRIMARY_MOBILE = ["/admin", "/admin/stock", "/admin/requests", "/admin/daily"];
const MORE_ICON = "M4 6h16M4 12h16M4 18h16";

function isActive(pathname, href) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ d, active, className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d={d} />
    </svg>
  );
}

function BrandMark({ size = "sm" }) {
  const box = size === "sm" ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl";
  const icon = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className={`${box} bg-brand-600 flex items-center justify-center shrink-0`}>
      <svg className={`${icon} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
  );
}

// Bottom sheet used for the "More" menu on phones. Locks page scroll while
// open and closes on backdrop tap or Escape.
function Sheet({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white border-t border-line shadow-xl p-3 pb-safe-3 max-h-[85vh] overflow-y-auto">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
        {children}
      </div>
    </div>
  );
}

function AccountActions({ username, onPassword, onLogout }) {
  return (
    <div className="border-t border-line mt-2 pt-2">
      {username && <p className="px-4 py-2 text-xs text-slate-500 truncate">Signed in as {username}</p>}
      <button onClick={onPassword} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
        Change password
      </button>
      <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
        Sign out
      </button>
    </div>
  );
}

export function AdminNav({ username, companyName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Close the sheet whenever the route changes.
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  async function logout() {
    await del("/auth/login");
    navigate("/");
  }

  const primary = adminLinks.filter((l) => PRIMARY_MOBILE.includes(l.href));
  const secondary = adminLinks.filter((l) => !PRIMARY_MOBILE.includes(l.href));
  const moreActive = secondary.some((l) => isActive(location.pathname, l.href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 bg-ink text-white">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BrandMark size="lg" />
              <div className="min-w-0">
                <h1 className="font-display font-bold text-white leading-tight break-words">{companyName || "Stock Tracker"}</h1>
                <p className="text-xs text-slate-400">Admin Portal</p>
              </div>
            </div>
            <NotificationBell align="left" tone="dark" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminLinks.map((link) => {
            const active = isActive(location.pathname, link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon d={link.icon} className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <p className="text-sm text-slate-400 px-4 mb-2 truncate">{username}</p>
          <button onClick={() => setShowPassword(true)} className="btn w-full justify-start text-slate-300 hover:bg-white/5 hover:text-white">
            Change password
          </button>
          <button onClick={logout} className="btn w-full justify-start text-red-300 hover:bg-white/5 hover:text-red-200">
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 bg-ink text-white pt-safe">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <p className="font-display font-bold text-white leading-tight truncate">{companyName || "Stock Tracker"}</p>
              <p className="text-[11px] text-slate-400 leading-tight">Admin</p>
            </div>
          </div>
          <NotificationBell tone="dark" />
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-line z-40 pb-safe">
        <div className="grid grid-cols-5">
          {primary.map((link) => {
            const active = isActive(location.pathname, link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] ${active ? "text-brand-700" : "text-slate-500"}`}
              >
                <NavIcon d={link.icon} active={active} />
                <span className="text-[11px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            aria-haspopup="dialog"
            className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] ${moreActive ? "text-brand-700" : "text-slate-500"}`}
          >
            <NavIcon d={MORE_ICON} active={moreActive} />
            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={showMore} onClose={() => setShowMore(false)}>
        <div className="grid grid-cols-3 gap-2">
          {secondary.map((link) => {
            const active = isActive(location.pathname, link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-4 text-sm font-medium ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <NavIcon d={link.icon} active={active} />
                {link.label}
              </Link>
            );
          })}
        </div>
        <AccountActions
          username={username}
          onPassword={() => {
            setShowMore(false);
            setShowPassword(true);
          }}
          onLogout={logout}
        />
      </Sheet>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
    </>
  );
}

export function EmployeeNav({ username, companyName }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  async function logout() {
    await del("/auth/login");
    navigate("/");
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-ink text-white pt-safe">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <p className="font-display font-bold text-white leading-tight truncate">{companyName || "Stock Tracker"}</p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">{username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Wider screens have room for plain buttons; phones get an account sheet. */}
            <button onClick={() => setShowPassword(true)} className="hidden sm:block text-sm text-slate-300 hover:text-white font-medium px-2 py-1.5 whitespace-nowrap">
              Password
            </button>
            <button onClick={logout} className="hidden sm:block text-sm text-red-300 hover:text-red-200 font-medium px-2 py-1.5 whitespace-nowrap">
              Sign out
            </button>
            <NotificationBell tone="dark" />
            <button
              onClick={() => setShowAccount(true)}
              className="sm:hidden p-2 rounded-lg hover:bg-white/10 text-slate-300"
              aria-label="Account"
            >
              <NavIcon d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={showAccount} onClose={() => setShowAccount(false)}>
        <AccountActions
          username={username}
          onPassword={() => {
            setShowAccount(false);
            setShowPassword(true);
          }}
          onLogout={logout}
        />
      </Sheet>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
    </>
  );
}

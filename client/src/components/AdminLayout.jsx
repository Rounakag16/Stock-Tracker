import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AdminNav } from "./Nav";
import { LoadingSpinner } from "./ui";
import { get } from "../lib/api";

export function AdminLayout() {
  const [status, setStatus] = useState("loading"); // loading | ok | denied
  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    get("/auth/login").then(({ data }) => {
      if (!data.user) {
        setStatus("denied");
        return;
      }
      if (data.user.role !== "admin") {
        setStatus("wrong-role");
        return;
      }
      setUsername(data.user.username);
      setCompanyName(data.user.companyName || "");
      setStatus("ok");
    });
  }, []);

  if (status === "loading") return <LoadingSpinner />;
  if (status === "denied") return <Navigate to="/" replace />;
  if (status === "wrong-role") return <Navigate to="/employee" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav username={username} companyName={companyName} />
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

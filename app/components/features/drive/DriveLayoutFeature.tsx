import React from "react";
import { Users, Shield } from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router";

export default function DriveLayoutFeature() {
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomerTab = location.pathname === "/app/drive" || location.pathname === "/app/drive/customer";
  const isInternalTab = location.pathname === "/app/drive/internal";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-140px)]">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => navigate("/app/drive/customer")}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition ${
            isCustomerTab
              ? "border-blue-600 text-blue-700 bg-blue-50/50"
              : "border-transparent text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Users size={16} /> Data Customer
        </button>
        <button
          onClick={() => navigate("/app/drive/internal")}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition ${
            isInternalTab
              ? "border-purple-600 text-purple-700 bg-purple-50/50"
              : "border-transparent text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Shield size={16} /> Internal Perusahaan
        </button>
      </div>
      <Outlet />
    </div>
  );
}

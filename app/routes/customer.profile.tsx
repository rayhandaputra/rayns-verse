import { useOutletContext, useNavigate, Form } from "react-router";
import { LogOut, Mail, Phone, User, Shield } from "lucide-react";
import Swal from "sweetalert2";

export default function CustomerProfile() {
  const { user, isDemo } = useOutletContext<{ user: any; isDemo: boolean }>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar?",
      text: "Yakin ingin keluar dari akun?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton: "bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs",
        cancelButton: "bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs mr-2",
        popup: "rounded-2xl",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      if (isDemo) {
        navigate("/login");
      } else {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/logout";
        document.body.appendChild(form);
        form.submit();
      }
    }
  };

  return (
    <div className="h-full flex flex-col px-5 py-6 overflow-y-auto">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1E434C] to-[#0097B2] flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {(user?.fullname || "U").charAt(0).toUpperCase()}
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">{user?.fullname || "Pelanggan"}</h2>
        <span className="text-xs text-slate-400 font-medium capitalize">{user?.role || "customer"}</span>
      </div>

      {/* Info Cards */}
      <div className="space-y-3 flex-1">
        <InfoRow icon={Mail} label="Email" value={user?.email || "-"} verified />
        <InfoRow icon={Phone} label="No. HP / WhatsApp" value={user?.phone || "-"} />
        <InfoRow icon={User} label="Nama Lengkap" value={user?.fullname || "-"} />
        <InfoRow icon={Shield} label="Status Akun" value={user?.is_active ? "Aktif" : "Nonaktif"} />
      </div>

      {/* Logout Button */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all active:scale-[0.98]"
        >
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, verified }: { icon: any; label: string; value: string; verified?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
      </div>
      {verified && (
        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded-lg border border-green-100">
          Verified
        </span>
      )}
    </div>
  );
}

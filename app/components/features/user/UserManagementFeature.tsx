import React, { useEffect, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useRevalidator,
  useSearchParams,
} from "react-router";
import { Edit2, Trash2, Shield, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { safeParseArray, uploadFile } from "~/utils/utils";
import { CustomDataTable } from "~/components/shared/table/CustomDataTable";
import { Button } from "~/components/ui/button";
import ModalShell from "~/components/modal/ModalShell";

export default function UserManagementFeature() {
  const actionData = useActionData() as any;
  const { usersData } = useLoaderData() as any;
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: cmsContentData, reload: reloadCmsContent } = useFetcherData({
    endpoint: nexus()
      .module("CMS_CONTENT")
      .action("get")
      .params({
        pagination: "true",
        type: "hero-section",
        page: 0,
        size: 1,
      })
      .build(),
  });

  const roles = [
    { label: "Semua", value: "" },
    { label: "Internal Team", value: "staff,admin,ceo,developer" },
    { label: "Customer", value: "customer" },
  ];

  const currentRole = searchParams.get("role") || "";
  const isLoading =
    navigation.state === "loading" || revalidator.state === "loading";

  const users = usersData?.data?.items || [];
  const [settings, setSettings] = useState<any>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerBackground = safeParseArray(
    cmsContentData?.data?.items?.[0]?.image_gallery
  )?.[0] as string | undefined;

  const { data: deleteData, load: submitDelete } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "Staff",
  });

  const { data: fetcherDataAction, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  useEffect(() => {
    if (actionData || fetcherDataAction) {
      if (actionData?.success || fetcherDataAction?.success) {
        setTimeout(() => {
          setIsModalOpen(false);
          reloadCmsContent()
          revalidator.revalidate();
        }, 0);
        toast.success("Berhasil", {
          description: actionData?.message || fetcherDataAction?.message || "Berhasil",
        });
      } else {
        toast.error("Terjadi Kesalahan", {
          description:
            actionData?.error_message || fetcherDataAction?.error_message || "Terjadi kesalahan. Hubungi Tim Teknis",
        });
      }
    }
  }, [actionData, fetcherDataAction]);

  useEffect(() => {
    if (deleteData?.success) {
      toast.success("User berhasil dihapus");
      revalidator.revalidate();
    } else if (deleteData?.success === false) {
      toast.error("Gagal menghapus user");
    }
  }, [deleteData]);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ role: "Staff", email: "", password: "", fullname: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      fullname: user.fullname,
      email: user.email,
      password: "",
      role: user.role || "Staff",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus data ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none",
        cancelButton:
          "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
        title: "text-lg font-semibold text-gray-800",
        htmlContainer: "text-gray-600",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      submitDelete({ id: id, deleted: 1 });
    }
  };

  const columns = [
    {
      name: "Nama Lengkap",
      selector: (row: any) => row.fullname,
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col py-2 font-bold text-gray-900">
          {row.fullname}
        </div>
      ),
    },
    {
      name: "Email",
      selector: (row: any) => row.email,
      sortable: true,
      cell: (row: any) => (
        <span className="text-gray-600 font-medium">{row.email}</span>
      ),
    },
    {
      name: "Role / Posisi",
      selector: (row: any) => row.role,
      sortable: true,
      cell: (user: any) => {
        const role = user.role?.toLowerCase() || "";
        const isCustomer = role === "customer";
        return (
          <div
            className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
              role === "ceo"
                ? "bg-purple-50 text-purple-700 border border-purple-100"
                : role === "developer"
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : isCustomer
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-gray-50 text-gray-700 border border-gray-100"
            }`}
          >
            <Shield size={12} className="opacity-70" /> {user.role || "-"}
          </div>
        );
      },
    },
    {
      name: "Aksi",
      width: "120px",
      cell: (user: any) => (
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
            <button
              title="Edit"
              onClick={() => handleEdit(user)}
              className="p-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded transition-all"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              title="Hapus"
              onClick={() => handleDelete(user.id)}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-1">
            Atur akses login untuk pegawai dan admin secara terpusat.
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-gray-900 border-gray-800 hover:bg-black text-white px-6 h-12 shadow-xl shadow-gray-200 rounded-2xl transition-all active:scale-95 flex items-center gap-2 group"
        >
          <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> 
          <span className="font-bold">Tambah User</span>
        </Button>
      </div>

      {/* Role Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => {
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                if (r.value) params.set("role", r.value);
                else params.delete("role");
                params.set("page", "0");
                return params;
              });
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              currentRole === r.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <CustomDataTable
        title="Daftar Pengguna"
        description="Kelola hak akses dan profil setiap pengguna sistem."
        totalData={usersData?.data?.total_items || 0}
        columns={columns}
        data={users}
        loading={isLoading}
        onSearch={(val) => {
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("search", val);
            params.set("page", "0");
            return params;
          });
        }}
        paginationServer
        paginationTotalRows={usersData?.data?.total_items || 0}
        onChangePage={(p) => {
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("page", (p - 1).toString());
            return params;
          });
        }}
        onChangeRowsPerPage={(s) => {
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("size", s.toString());
            params.set("page", "0");
            return params;
          });
        }}
      />

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Pengaturan Tampilan
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Background untuk Judul Landing Page & Nota.
        </p>

        <div className="flex items-center gap-4">
          <div className="w-48 h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden relative">
            {headerBackground ? (
              <img
                src={headerBackground}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">No Image</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Upload size={16} /> Upload Background
            </button>
            {(headerBackground || settings.headerBackground) && (
              <button
                onClick={() => {
                  submitAction({
                        intent: "update-settings",
                        id: cmsContentData?.data?.items?.[0]?.id,
                        headerBackground: "",
                      })
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg"
              >
                <Trash2 size={16} /> Hapus
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadFile(file);
                  setSettings({
                        ...settings,
                        headerBackground: url,
                      });
                      submitAction({
                        intent: "update-settings",
                        id: cmsContentData?.data?.items?.[0]?.id,
                        headerBackground: url,
                      })
                }
              }}
            />
          </div>
        </div>
      </div>

      <ModalShell open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Ubah Data Pengguna" : "Daftarkan Pengguna Baru"} size="md">
        <Form method="post" className="space-y-5" autoComplete="off">
          {editingId && <input type="hidden" name="id" value={editingId} />}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">
              Nama Lengkap
            </label>
            <input
              name="fullname"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={formData.fullname || ""}
              onChange={(e) =>
                setFormData({ ...formData, fullname: e.target.value })
              }
              required
              placeholder="Contoh: Budi Santoso"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Email
              </label>
              <input
                name="email"
                autoComplete="off"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="email@perusahaan.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="off"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                value={formData.password || ""}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingId}
                placeholder={editingId ? "Isi untuk ubah" : "********"}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">
              Posisi / Role
            </label>
            <div className="relative">
              <select
                name="role"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as any })
                }
              >
                <option value="staff">Staff (Absensi Only)</option>
                <option value="ceo">CEO (Full Access)</option>
                <option value="developer">Developer (Full Access)</option>
                <option value="admin">Admin</option>
                <option value="customer">Customer (Dashboard Order)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Shield size={16} className="text-gray-400" />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 px-1 leading-relaxed">
              * Perhatian: Staff hanya memiliki hak akses terbatas ke modul absensi dan tidak dapat melihat data finansial atau produksi.
            </p>
          </div>

          <div className="pt-6 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold text-gray-500 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-black text-white rounded-xl h-12 font-bold shadow-xl shadow-gray-100 transition-all active:scale-95"
            >
              {editingId ? "Update User" : "Simpan User"}
            </Button>
          </div>
        </Form>
      </ModalShell>
    </div>
  );
}

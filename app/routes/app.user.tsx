import {
  Form,
  useActionData,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import React, { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Trash2, X, Shield, Upload } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { API } from "~/lib/api";
import { AuthAPI } from "~/lib/api/modules/user_auth";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { requireAuth } from "~/lib/session.server";
import { safeParseArray } from "~/lib/utils";

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, ...payload } = data;

  try {
    let res: any = {};
    console.log("PAYLOAD => ", payload);
    if (request.method === "DELETE") {
      res = await API.USER.update({
        session: {},
        req: {
          body: {
            id,
            ...payload,
          } as any,
        },
      });
    }
    if (request.method === "POST") {
      if (id) {
        res = await API.USER.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
          },
        });

        // Update password if provided
        if (payload.password) {
          await AuthAPI.upsertAuth({
            user_id: id,
            email: payload.email,
            password: payload.password,
          });
        }
      } else {
        res = await API.USER.create({
          session: {},
          req: {
            body: {
              ...(payload as any),
              // Default role if not provided, though form provides it
              role: payload.role || "admin",
            },
          },
        });

        // Also create auth for new user if password provided
        if (res.success && res.user?.id && payload.password) {
          await AuthAPI.upsertAuth({
            user_id: res.user.id,
            email: payload.email,
            password: payload.password,
          });
        }
      }
    }

    if (!res.success) throw { error_message: res.message };

    return Response.json({
      success: true,
      message: res.message,
      user: res.user,
    });
  } catch (error: any) {
    console.log(error);
    return Response.json({
      success: false,
      error_message:
        error.error_message || error.message || "Terjadi kesalahan",
    });
  }
};

export default function UserManagementPage() {
  const actionData = useActionData() as any;

  // Fetch users with Nexus
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

  const { data: usersData, reload } = useFetcherData({
    endpoint: nexus()
      .module("USER")
      .action("get")
      .params({
        pagination: "true",
        page: 0,
        size: 100,
      })
      .build(),
  });

  const users = usersData?.data?.items || [];

  // Settings State
  const [settings, setSettings] = useState<any>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetcher for delete action
  const { data: deleteData, load: submitDelete } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State for form inputs to handle controlled values (optional but good for specific UI behavior)
  // We map 'username' UI concept to 'email' API concept
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "Staff",
  });

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setIsModalOpen(false);
        toast.success("Berhasil", {
          description: actionData.message || "Berhasil",
        });
        reload(); // Reload users data
      } else {
        toast.error("Terjadi Kesalahan", {
          description:
            actionData.error_message || "Terjadi kesalahan. Hubungi Tim Teknis",
        });
      }
    }
  }, [actionData]);

  useEffect(() => {
    if (deleteData?.success) {
      toast.success("User berhasil dihapus");
      reload();
    } else if (deleteData?.success === false) {
      toast.error("Gagal menghapus user");
    }
  }, [deleteData]);

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      fullname: user.fullname,
      email: user.email,
      password: "", // Don't show existing password
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

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ role: "Staff", email: "", password: "", fullname: "" });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Manajemen User</h2>
          <p className="text-gray-500 text-sm">
            Atur akses login untuk pegawai dan admin.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus size={16} /> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-6 py-3">Nama Lengkap</th>
              <th className="px-6 py-3">Username / Email</th>
              <th className="px-6 py-3">Password</th>
              <th className="px-6 py-3">Role / Posisi</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  {user.fullname}
                </td>
                <td className="px-6 py-3 text-gray-600">{user.email}</td>
                <td className="px-6 py-3 font-mono text-gray-400">••••••</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                      user.role === "CEO"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "Developer"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Shield size={10} /> {user.role}
                  </span>
                </td>
                <td className="px-6 py-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- SETTINGS SECTION --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Pengaturan Tampilan
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Background untuk Judul Landing Page & Nota.
        </p>

        <div className="flex items-center gap-4">
          <div className="w-48 h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden relative">
            {safeParseArray(
              cmsContentData?.data?.items?.[0]?.image_gallery
            )?.[0] ? (
              <img
                src={
                  safeParseArray(
                    cmsContentData?.data?.items?.[0]?.image_gallery
                  )?.[0]
                }
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
            {settings.headerBackground && (
              <button
                onClick={() => {}}
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
              onChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? "Edit User" : "Tambah User Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-gray-400" />
              </button>
            </div>
            <Form method="post" className="space-y-4">
              {editingId && <input type="hidden" name="id" value={editingId} />}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  name="fullname"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={formData.fullname || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  required
                  placeholder="Masukkan Nama Lengkap"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Username / Email
                  </label>
                  <input
                    name="email"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingId}
                    placeholder={editingId ? "Isi untuk ubah" : "********"}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Posisi / Role
                </label>
                <select
                  name="role"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                >
                  <option value="Staff">Staff (Absensi Only)</option>
                  <option value="CEO">CEO (Full Access)</option>
                  <option value="Developer">Developer (Full Access)</option>
                  <option value="Admin">Admin</option>
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  * Staff hanya bisa mengakses halaman absensi/kepegawaian.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Simpan
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

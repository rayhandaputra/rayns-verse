import { Folder, PencilLineIcon, Plus, PlusCircleIcon, Trash2, Trash2Icon, X } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { Modal } from "~/components/modal/Modal";
import SelectBasic from "~/components/select/SelectBasic";
import TableComponent from "~/components/table/Table";
import { TitleHeader } from "~/components/TitleHedaer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useModal } from "~/hooks/use-modal";
import { API } from "../lib/api";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const { page = 0, size = 10 } = Object.fromEntries(
    url.searchParams.entries()
  );
  try {
    const supplier = await API.PRODUCT_CATEGORY.get({
      session: {},
      req: {
        pagination: "true",
        page: 0,
        size: 50,
      } as any,
    });

    return {
      table: {
        ...supplier,
        page: 0,
        size: 50,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, default_drive_folders: rawFolders, ...payload } = data;

  // Parse default_drive_folders dari JSON string
  let default_drive_folders: string[] = [];
  try {
    default_drive_folders = JSON.parse(rawFolders || "[]");
  } catch {
    default_drive_folders = [];
  }

  try {
    let res: any = {};
    if (request.method === "DELETE") {
      res = await API.PRODUCT_CATEGORY.update({
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
      const body = { ...payload, default_drive_folders };
      if (id) {
        res = await API.PRODUCT_CATEGORY.update({
          session: {},
          req: { body: { id, ...body } as any },
        });
      } else {
        res = await API.PRODUCT_CATEGORY.create({
          session: {},
          req: { body: body as any },
        });
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

export default function ProductCategoryPage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const [modal, setModal] = useModal();
  const fetcher = useFetcher();

  // State lokal untuk edit default_drive_folders (tidak bisa pakai Form native untuk array)
  const [driveFolders, setDriveFolders] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState("");

  // Sync saat modal dibuka
  useEffect(() => {
    if (modal?.open) {
      const folders: string[] = (() => {
        const raw = modal?.data?.default_drive_folders;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try { return JSON.parse(raw); } catch { return []; }
      })();
      setDriveFolders(folders);
      setNewFolderInput("");
    }
  }, [modal?.open, modal?.data?.id]);

  const addFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed || driveFolders.includes(trimmed)) return;
    setDriveFolders(prev => [...prev, trimmed]);
    setNewFolderInput("");
  };

  const removeFolder = (idx: number) =>
    setDriveFolders(prev => prev.filter((_, i) => i !== idx));

  const handleDelete = async (data: any) => {
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
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss") },
        {
          method: "delete",
          action: "/app/product/category",
        }
      );
      toast.success("Berhasil", {
        description: "Berhasil menghapus Kategori Produk",
      });
    }
  };

  useEffect(() => {
    if (actionData) {
      setModal({ ...modal, open: false });

      if (actionData.success) {
        toast.success("Berhasil", {
          description: actionData.message,
        });
      } else {
        toast.error("Terjadi Kesalahan", {
          description:
            actionData.error_message || "Terjadi kesalahan. Hubungi Tim Teknis",
        });
      }
    }
  }, [actionData]);

  const columns = [
    {
      name: "No",
      width: "50px",
      cell: (_: any, index: number) => index + 1,
    },
    {
      name: "Nama",
      cell: (row: any) => (
        <span className="font-semibold text-gray-800">{row?.name || "-"}</span>
      ),
    },
    {
      name: "Deskripsi",
      cell: (row: any) => row?.description || "-",
    },
    {
      name: "Folder Drive Default",
      cell: (row: any) => {
        const folders: string[] = (() => {
          const raw = row?.default_drive_folders;
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          try { return JSON.parse(raw); } catch { return []; }
        })();
        if (folders.length === 0)
          return <span className="text-xs text-gray-300 italic">-</span>;
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {folders.map((f: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold rounded-full"
              >
                <Folder size={9} /> {f}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: "Aksi",
      cell: (row: any, index: number) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="text-blue-700 hover:text-blue-500"
            onClick={() =>
              setModal({
                ...modal,
                open: true,
                key: "update",
                data: row,
              })
            }
          >
            <PencilLineIcon className="w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-700 hover:text-red-500"
            onClick={() => handleDelete(row)}
          >
            <Trash2Icon className="w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TitleHeader
        title="Daftar Kategori Produk"
        description="Kelola kategori produk dan folder drive default yang otomatis dibuat saat pesanan masuk."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Produk", href: "/" },
              { label: "Kategori Produk", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() =>
              setModal({
                ...modal,
                open: true,
                key: "create",
                data: null,
              })
            }
          >
            <PlusCircleIcon className="w-4" />
            Kategori Baru
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <Modal
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Kategori Produk`}
        >
          <Form method="post" className="space-y-4">
            <input type="hidden" name="id" value={modal?.data?.id} />
            {/* Hidden field untuk driveFolders — dikontrol manual */}
            <input
              type="hidden"
              name="default_drive_folders"
              value={JSON.stringify(driveFolders)}
            />

            <div className="space-y-1">
              <Label>Nama Kategori</Label>
              <Input
                required
                type="text"
                name="name"
                placeholder="Masukkan Nama Kategori"
                defaultValue={modal?.data?.name}
              />
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input
                type="text"
                name="description"
                placeholder="Masukkan Deskripsi (opsional)"
                defaultValue={modal?.data?.description}
              />
            </div>

            {/* ── Default Drive Folders ─────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Folder size={14} className="text-amber-500" />
                Folder Drive Default
              </Label>
              <p className="text-[11px] text-gray-400">
                Folder-folder ini akan otomatis dibuat di Drive pelanggan saat pesanan dengan kategori ini masuk.
              </p>

              {/* Tags list */}
              {driveFolders.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                  {driveFolders.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 text-amber-800 text-xs font-medium rounded-full shadow-sm"
                    >
                      <Folder size={11} className="text-amber-400" />
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFolder(idx)}
                        className="ml-0.5 text-amber-400 hover:text-red-500 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add new folder input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nama folder baru... (tekan Enter atau klik +)"
                  value={newFolderInput}
                  onChange={e => setNewFolderInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFolder();
                    }
                  }}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addFolder}
                  className="shrink-0 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Plus size={16} />
                </Button>
              </div>

              {driveFolders.length === 0 && (
                <p className="text-xs text-gray-300 italic">Belum ada folder default.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                className="text-gray-600"
                onClick={() => setModal({ ...modal, open: false })}
              >
                Batal
              </Button>
              <Button
                size="sm"
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Simpan
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}

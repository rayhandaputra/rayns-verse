import React, { useEffect, useState } from "react";
import { Edit2, Folder, Plus, PlusCircleIcon, Trash2, X } from "lucide-react";
import { useFetcher, useLoaderData } from "react-router";
import { toast } from "sonner";
import Swal from "sweetalert2";
import moment from "moment";
import { useModal } from "~/hooks/use-modal";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import ModalShell from "~/components/modal/ModalShell";
import TableComponent from "~/components/shared/table/Table";

type DriveFolder = {
  name: string;
  is_card_front: boolean;
  is_card_back: boolean;
  is_lanyard: boolean;
  is_sablon_depan: boolean;
  is_sablon_belakang: boolean;
};

export default function ProductCategoryManager() {
  const { table } = useLoaderData<any>();
  const [modal, setModal] = useModal();
  const fetcher = useFetcher<any>();

  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [newFolderInput, setNewFolderInput] = useState("");

  useEffect(() => {
    if (modal?.open) {
      const parsed: any[] = (() => {
        const raw = modal?.data?.default_drive_folders;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      })();
      const folders: DriveFolder[] = parsed.map((item) =>
        typeof item === "string"
          ? {
              name: item,
              is_card_front: false,
              is_card_back: false,
              is_lanyard: false,
              is_sablon_depan: false,
              is_sablon_belakang: false,
            }
          : item
      );
      Promise.resolve().then(() => {
        setDriveFolders(folders);
        setNewFolderInput("");
      });
    }
  }, [modal?.open, modal?.data?.id, modal?.data?.default_drive_folders]);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setModal((prev) => ({ ...prev, open: false }));
        toast.success(fetcher.data.message || "Berhasil menyimpan kategori");
      } else if (fetcher.data.error_message) {
        toast.error(fetcher.data.error_message);
      }
    }
  }, [fetcher.data, setModal]);

  const addFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed || driveFolders.some((f) => f.name === trimmed)) return;
    setDriveFolders((prev) => [
      ...prev,
      {
        name: trimmed,
        is_card_front: false,
        is_card_back: false,
        is_lanyard: false,
        is_sablon_depan: false,
        is_sablon_belakang: false,
      },
    ]);
    setNewFolderInput("");
  };

  const removeFolder = (idx: number) =>
    setDriveFolders((prev) => prev.filter((_, i) => i !== idx));

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
        confirmButton: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg",
        cancelButton: "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss") },
        { method: "delete" }
      );
    }
  };

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
        let folders: any[] = [];
        const raw = row?.default_drive_folders;
        if (Array.isArray(raw)) folders = raw;
        else if (raw) {
          try {
            folders = JSON.parse(raw);
          } catch {
            folders = [];
          }
        }
        if (folders.length === 0)
          return <span className="text-xs text-gray-300 italic">-</span>;
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {folders.map((f: any, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold rounded-full"
              >
                <Folder size={9} /> {typeof f === "string" ? f : f.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: "Aksi",
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
            <button
              title="Edit"
              onClick={() =>
                setModal({ ...modal, open: true, key: "update", data: row })
              }
              className="p-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded transition-all"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              title="Hapus"
              onClick={() => handleDelete(row)}
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
    <>
      <div className="flex justify-end mb-4">
        <Button
          className="bg-blue-700 hover:bg-blue-600 text-white"
          onClick={() => setModal({ ...modal, open: true, key: "create", data: null })}
        >
          <PlusCircleIcon className="w-4 mr-2" />
          Kategori Baru
        </Button>
      </div>

      <TableComponent columns={columns} data={table} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <ModalShell
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Kategori Produk`}
        >
          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="id" value={modal?.data?.id} />
            <input
              type="hidden"
              name="default_drive_folders"
              value={JSON.stringify(driveFolders)}
            />

            <div className="space-y-1">
              <Label>Nama Kategori</Label>
              <Input
                required
                name="name"
                placeholder="Masukkan Nama Kategori"
                defaultValue={modal?.data?.name}
              />
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input
                name="description"
                placeholder="Masukkan Deskripsi (opsional)"
                defaultValue={modal?.data?.description}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Folder size={14} className="text-amber-500" />
                Folder Drive Default
              </Label>
              <p className="text-[11px] text-gray-400">
                Folder-folder ini akan otomatis dibuat di Drive pelanggan saat pesanan dengan kategori ini masuk.
              </p>

              {driveFolders.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto px-1">
                  {driveFolders.map((f, idx) => (
                    <div key={idx} className="border border-amber-200 bg-amber-50 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Folder size={12} className="text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-amber-800 flex-1">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFolder(idx)}
                          className="text-amber-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-4">
                        {([
                          { key: "is_card_front", label: "ID Card Depan" },
                          { key: "is_card_back", label: "ID Card Belakang" },
                          { key: "is_lanyard", label: "Lanyard" },
                          { key: "is_sablon_depan", label: "Sablon Depan" },
                          { key: "is_sablon_belakang", label: "Sablon Belakang" },
                        ] as const).map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded text-amber-500 shadow-sm"
                              checked={!!(f as any)[key]}
                              onChange={(e) => {
                                setDriveFolders((prev) =>
                                  prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    const reset = {
                                      is_card_front: false,
                                      is_card_back: false,
                                      is_lanyard: false,
                                      is_sablon_depan: false,
                                      is_sablon_belakang: false,
                                    };
                                    return { ...item, ...reset, [key]: e.target.checked };
                                  })
                                );
                              }}
                            />
                            <span className="text-[10px] text-gray-600 select-none">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nama folder baru..."
                  value={newFolderInput}
                  onChange={(e) => setNewFolderInput(e.target.value)}
                  onKeyDown={(e) => {
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
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setModal({ ...modal, open: false })}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6"
              >
                Simpan
              </Button>
            </div>
          </fetcher.Form>
        </ModalShell>
      )}
    </>
  );
}

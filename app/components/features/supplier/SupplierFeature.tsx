
import React from "react";
import { Edit2, PlusCircleIcon, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import ModalShell from "~/components/modal/ModalShell";
import TableComponent from "~/components/shared/table/Table";
import { TitleHeader } from "~/components/core/TitleHeader";
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { useSupplierLogic } from "./use-supplier-logic";

export default function SupplierFeature() {
  const {
    modal,
    setModal,
    table,
    isSubmitting,
    handleDelete,
    handleSubmit,
  } = useSupplierLogic();

  const columns = [
    { name: "No", width: "50px", cell: (_: any, index: number) => index + 1 },
    { name: "Nama", cell: (row: any) => row?.name || "-" },
    { name: "Telepon", cell: (row: any) => row?.phone || "-" },
    { name: "Alamat", cell: (row: any) => row?.address || "-" },
    {
      name: "Aksi",
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
            <button
              title="Edit"
              onClick={() => setModal({ ...modal, open: true, key: "update", data: row })}
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
    <div className="space-y-3">
      <TitleHeader
        title="Daftar Mitra Toko"
        description="Kelola data mitra toko Anda."
        breadcrumb={<AppBreadcrumb pages={[{ label: "Master Data", href: "/" }, { label: "Toko", active: true }]} />}
        actions={
          <Button className="bg-blue-700 hover:bg-blue-600 text-white" onClick={() => setModal({ ...modal, open: true, key: "create", data: null })}>
            <PlusCircleIcon className="w-4 mr-1" /> Toko Baru
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      <ModalShell open={modal?.open && (modal?.key === "create" || modal?.key === "update")} onClose={() => setModal({ ...modal, open: false })} title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Toko`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="id" value={modal?.data?.id || ""} />
          <div className="space-y-1">
            <Label>Nama Toko</Label>
            <Input required type="text" name="name" placeholder="Masukkan Nama Toko" defaultValue={modal?.data?.name} />
          </div>
          <div className="space-y-1">
            <Label>No Telepon</Label>
            <Input required type="text" name="phone" placeholder="Masukkan No Telepon" defaultValue={modal?.data?.phone} />
          </div>
          <div className="space-y-1">
            <Label>Alamat</Label>
            <Input required type="text" name="address" placeholder="Masukkan Alamat" defaultValue={modal?.data?.address} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" type="button" variant="outline" onClick={() => setModal({ ...modal, open: false })} disabled={isSubmitting}>Batal</Button>
            <Button size="sm" type="submit" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}

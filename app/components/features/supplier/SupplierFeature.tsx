
import React from "react";
import { PencilLineIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Modal } from "~/components/shared/modal/Modal";
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
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="text-blue-700" onClick={() => setModal({ ...modal, open: true, key: "update", data: row })}>
            <PencilLineIcon className="w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-red-700" onClick={() => handleDelete(row)}>
            <Trash2Icon className="w-4" />
          </Button>
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

      {(modal?.key === "create" || modal?.key === "update") && (
        <Modal open={modal?.open} onClose={() => setModal({ ...modal, open: false })} title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Toko`}>
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
        </Modal>
      )}
    </div>
  );
}

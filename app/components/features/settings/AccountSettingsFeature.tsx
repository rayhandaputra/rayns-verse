import React, { useEffect } from "react";
import { useLoaderData, useActionData, useFetcher, Form } from "react-router";
import { Edit2, PlusCircleIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import ModalShell from "~/components/modal/ModalShell";
import SelectBasic from "~/components/shared/select/SelectBasic";
import TableComponent from "~/components/shared/table/Table";
import { TitleHeader } from "~/components/core/TitleHeader";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useModal } from "~/hooks/use-modal";

interface AccountSettingsFeatureProps {
  tableData: any;
}

export default function AccountSettingsFeature({ tableData }: AccountSettingsFeatureProps) {
  const actionData: any = useActionData();
  const [modal, setModal] = useModal();
  const fetcher = useFetcher();

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
        confirmButton: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none",
        cancelButton: "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
        title: "text-lg font-semibold text-gray-800",
        htmlContainer: "text-gray-600",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted: 1 },
        { method: "delete" }
      );
      toast.success("Berhasil", { description: "Berhasil menghapus Akun Pengguna" });
    }
  };

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setModal({ ...modal, open: false });
        toast.success("Berhasil", { description: actionData.message });
      } else {
        toast.error("Terjadi Kesalahan", {
          description: actionData.error_message || "Terjadi kesalahan. Hubungi Tim Teknis",
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
      cell: (row: any) => row?.fullname || "-",
    },
    {
      name: "Email",
      cell: (row: any) => row?.email || "-",
    },
    {
      name: "Peran",
      cell: (row: any) => (
        <span className="capitalize">
          <Badge className="">{row?.role || "-"}</Badge>
        </span>
      ),
    },
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
        title="Daftar Akun Pengguna"
        description="Kelola data pengguna aplikasi Anda."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Pengaturan", href: "/" },
              { label: "Akun Pengguna", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => setModal({ ...modal, open: true, key: "create", data: null })}
          >
            <PlusCircleIcon className="w-4" />
            Pengguna
          </Button>
        }
      />

      <TableComponent columns={columns} data={tableData} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <ModalShell
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Akun Pengguna`}
        >
          <Form method="post" className="space-y-3">
            <input type="hidden" name="id" value={modal?.data?.id} />
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input required type="text" name="fullname" placeholder="Masukkan Nama Pengguna" defaultValue={modal?.data?.fullname} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input required type="email" name="email" placeholder="Masukkan Email Pengguna" defaultValue={modal?.data?.email} />
            </div>
            <div className="space-y-1">
              <Label>Peran</Label>
              <SelectBasic
                options={[
                  { label: "Super Admin", value: "super_admin" },
                  { label: "Admin", value: "admin" },
                  { label: "Pelanggan", value: "customer" },
                ]}
                defaultValue={modal?.data?.role || "admin"}
                placeholder="Pilih Peran"
                onChange={(value) => {
                  setModal({ ...modal, data: { ...modal?.data, role: value } });
                }}
              />
              <input type="hidden" name="role" value={modal?.data?.role || "admin"} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                name="password"
                placeholder={modal?.key === "create" ? "Masukkan Password" : "Isi jika ingin mengubah password"}
                required={modal?.key === "create"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" type="button" variant="outline" className="text-gray-600" onClick={() => setModal({ ...modal, open: false })}>Batal</Button>
              <Button size="sm" type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">Simpan</Button>
            </div>
          </Form>
        </ModalShell>
      )}
    </div>
  );
}

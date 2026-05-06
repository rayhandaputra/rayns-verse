import React from "react";
import { PencilLineIcon, PlusCircleIcon, Trash2Icon, Package, Search } from "lucide-react";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { toast } from "sonner";
import Swal from "sweetalert2";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import TableComponent from "~/components/shared/table/Table";

export const ProductPackageDashboard: React.FC = () => {
  const { table } = useLoaderData() as any;
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleDelete = async (data: any) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus paket ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton: "bg-red-600 text-white px-4 py-2 rounded-lg",
        cancelButton: "bg-gray-100 text-gray-700 px-4 py-2 rounded-lg ml-2",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss"), intent: "delete" },
        { method: "post" }
      );
      toast.success("Berhasil menghapus paket");
    }
  };

  const columns = [
    { name: "No", width: "50px", cell: (_: any, index: number) => index + 1 },
    { 
      name: "Paket", 
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{row?.name || "-"}</div>
            <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{row?.code || "-"}</div>
          </div>
        </div>
      )
    },
    { name: "Deskripsi", cell: (row: any) => <div className="text-sm text-gray-500 max-w-xs truncate">{row?.description || "-"}</div> },
    { 
      name: "Status", 
      cell: (row: any) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
          Aktif
        </span>
      )
    },
    {
      name: "Aksi",
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-600 hover:bg-blue-50 h-8 w-8"
            onClick={() => navigate(`/app/product/package/manage?id=${row?.id}`)}
          >
            <PencilLineIcon className="w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-rose-600 hover:bg-rose-50 h-8 w-8"
            onClick={() => handleDelete(row)}
          >
            <Trash2Icon className="w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Daftar Paket Produk</h2>
          <p className="text-xs text-gray-500">Kelola paket bundling produk</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          onClick={() => navigate(`/app/product/package/manage`)}
        >
          <PlusCircleIcon className="w-4" />
          Paket Baru
        </Button>
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="flex flex-row justify-between items-center px-6 py-4 border-b border-gray-50 bg-gray-50/10">
          <CardTitle className="text-lg font-bold">Produk Bundling</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10 pr-4 py-2 border rounded-full text-sm w-64 h-9"
              placeholder="Cari paket..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableComponent columns={columns} data={table} />
        </CardContent>
      </Card>
    </div>
  );
};

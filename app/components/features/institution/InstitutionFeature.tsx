
import React from "react";
import { Edit2, PlusCircleIcon, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import ModalShell from "~/components/modal/ModalShell";
import { CustomDataTable } from "~/components/shared/table/CustomDataTable";
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { useInstitutionLogic } from "./use-institution-logic";

export default function InstitutionFeature() {
  const {
    modal,
    setModal,
    table,
    isSubmitting,
    handleDelete,
    handleSubmit,
    isLoading,
    setSearchParams,
  } = useInstitutionLogic();

  const columns = [
    { 
      name: "No", 
      width: "70px", 
      cell: (_: any, index: number) => (
        <span className="font-medium text-gray-400">{(table?.page * table?.size) + index + 1}</span>
      )
    },
    { 
      name: "Nama Instansi", 
      selector: (row: any) => row?.name,
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-gray-900">{row?.name || "-"}</span>
          <span className="text-xs text-gray-400 uppercase tracking-wider">{row?.abbr || "-"}</span>
        </div>
      )
    },
    { 
      name: "Singkatan", 
      selector: (row: any) => row?.abbr,
      sortable: true,
      cell: (row: any) => (
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-xs">
          {row?.abbr || "-"}
        </div>
      )
    },
    {
      name: "Aksi",
      width: "120px",
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AppBreadcrumb pages={[{ label: "Master Data", href: "/" }, { label: "Instansi", active: true }]} />
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-xl px-5 h-10 transition-all active:scale-95" 
          onClick={() => setModal({ ...modal, open: true, key: "create", data: null })}
        >
          <PlusCircleIcon className="w-4 mr-2" /> Instansi Baru
        </Button>
      </div>

      <CustomDataTable
        title="Daftar Instansi"
        description="Kelola dan tinjau data instansi partner secara efisien."
        totalData={table?.total_items || 0}
        columns={columns}
        data={table?.items || []}
        loading={isLoading}
        tabs={[
          { label: "Semua", value: "all", count: table?.total_items || 0 },
          { label: "Aktif", value: "active" },
          { label: "Non-Aktif", value: "inactive" },
        ]}
        activeTab="all"
        onSearch={(val) => {
          setSearchParams((prev: any) => {
            const params = new URLSearchParams(prev);
            params.set("search", val);
            params.set("page", "0");
            return params;
          });
        }}
        paginationServer
        paginationTotalRows={table?.total_items || 0}
        onChangePage={(page) => {
          setSearchParams((prev: any) => {
            const params = new URLSearchParams(prev);
            params.set("page", (page - 1).toString());
            return params;
          });
        }}
        onChangeRowsPerPage={(size) => {
          setSearchParams((prev: any) => {
            const params = new URLSearchParams(prev);
            params.set("size", size.toString());
            params.set("page", "0");
            return params;
          });
        }}
      />

      <ModalShell
        open={modal?.open && (modal?.key === "create" || modal?.key === "update")}
        onClose={() => setModal({ ...modal, open: false })}
        title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Instansi`}
      >
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <input type="hidden" name="id" value={modal?.data?.id || ""} />
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold ml-1">Nama Instansi</Label>
            <Input 
              required 
              type="text" 
              name="name" 
              placeholder="Misal: Universitas Itera" 
              defaultValue={modal?.data?.name} 
              className="h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold ml-1">Singkatan / Abbr</Label>
            <Input 
              required 
              type="text" 
              name="abbr" 
              placeholder="Misal: ITERA" 
              defaultValue={modal?.data?.abbr} 
              className="h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              size="lg" 
              type="button" 
              variant="ghost" 
              className="rounded-xl px-10 h-11 text-gray-500 hover:bg-gray-50"
              onClick={() => setModal({ ...modal, open: false })} 
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              size="lg" 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 rounded-xl px-10 h-11 transition-all active:scale-95" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}

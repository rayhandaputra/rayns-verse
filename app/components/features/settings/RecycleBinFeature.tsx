import React, { useState, useMemo, useEffect } from "react";
import { Handshake, RecycleIcon, Trash2 } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router";
import { CustomDataTable } from "~/components/shared/table/CustomDataTable";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { safeParseObject } from "~/utils/utils";

export default function RecycleBinFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 0;
  const size = Number(searchParams.get("size")) || 10;
  const search = searchParams.get("search") || "";
  
  const [activeTab, setActiveTab] = useState("order");

  const categories = [{ value: "order", label: "Pesanan" }];

  const {
    data: orders,
    reload,
    loading: isLoading,
  } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        page,
        size,
        search,
        pagination: "true",
        deleted_on: "is_not_null",
      })
      .build(),
  });

  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData?.message);
      reload();
    }
  }, [actionData, reload]);

  const columns = useMemo(
    () => [
      {
        name: "Tgl. Order",
        selector: (row: any) => row.order_number,
        sortable: true,
        cell: (order: any) => (
          <div className="flex flex-col py-2">
            <span className="font-bold text-gray-900">
              {+order?.is_archive === 1 ? "Arsip" : order.order_number}
            </span>
            <span className="text-xs text-gray-500">
              {order?.order_date
                ? moment(order.order_date).format("DD MMM YYYY HH:mm")
                : "-"}
            </span>
          </div>
        ),
      },
      {
        name: "Instansi/Pemesan",
        selector: (row: any) => row.institution_name,
        sortable: true,
        cell: (order: any) => (
          <div className="py-2">
            <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              {order.institution_name}
              {+(order?.is_sponsor ?? 0) === 1 && (
                <span
                  title="Sponsor / Kerja Sama"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200"
                >
                  <Handshake size={10} className="mr-0.5" /> PARTNER
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {order.pic_name || "-"} ({order.pic_phone || "-"})
            </div>
          </div>
        ),
      },
      {
        name: "Dibuat Oleh",
        selector: (row: any) => row.created_on,
        sortable: true,
        cell: (order: any) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {safeParseObject(order.created_by)?.fullname ?? "-"}
            </span>
            <span className="text-[10px] text-gray-400">
              {moment(order.created_on).format("DD MMM YYYY HH:mm")}
            </span>
          </div>
        ),
      },
      {
        name: "Aksi",
        width: "100px",
        cell: (order: any) => (
          <div className="flex gap-2">
            <button
              title="Restore"
              onClick={() =>
                Swal.fire({
                  title: "Kembalikan Pesanan?",
                  text: `Yakin ingin mengembalikan pesanan ${order.order_number}?`,
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Ya, Kembalikan",
                  cancelButtonText: "Batal",
                  customClass: {
                    confirmButton: "bg-blue-600 text-white px-4 py-2 rounded-lg mr-2",
                    cancelButton: "bg-gray-100 text-gray-800 px-4 py-2 rounded-lg",
                  },
                  buttonsStyling: false,
                }).then((result) => {
                  if (result.isConfirmed) {
                    submitAction({
                      intent: "restore",
                      id: order.id,
                    });
                  }
                })
              }
              className="h-9 w-9 flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm shadow-blue-50"
            >
              <RecycleIcon size={16} />
            </button>
          </div>
        ),
      },
    ],
    [submitAction]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recycle Bin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan pulihkan data yang telah dihapus sebelumnya.
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-xl text-red-600">
            <Trash2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Storage Status</p>
            <p className="text-sm font-bold text-red-700">Data Terhapus: {orders?.data?.total_items || 0}</p>
          </div>
        </div>
      </div>

      <CustomDataTable
        title="Daftar Data Terhapus"
        description="Semua data yang dihapus akan tersimpan sementara di sini."
        totalData={orders?.data?.total_items || 0}
        columns={columns}
        data={orders?.data?.items || []}
        loading={isLoading}
        tabs={categories}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={(val) => {
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("search", val);
            params.set("page", "0");
            return params;
          });
        }}
        paginationServer
        paginationTotalRows={orders?.data?.total_items || 0}
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
    </div>
  );
}

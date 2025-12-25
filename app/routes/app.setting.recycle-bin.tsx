import { Handshake, RecycleIcon } from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import type { ActionFunction } from "react-router";
import { toast } from "sonner";
import Swal from "sweetalert2";
import DataTable, {
  TablePagination,
  type ColumnDef,
} from "~/components/ui/data-table";
import { useFetcherData, useModal } from "~/hooks";
import { API } from "~/lib/api";
import { nexus } from "~/lib/nexus-client";
import { requireAuth } from "~/lib/session.server";
import { safeParseObject } from "~/lib/utils";

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("intent");
  const id = formData.get("id") as string;

  if (actionType === "restore") {
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, deleted_on: null } },
    });
    return Response.json({
      success: res.success,
      message: res.success
        ? "Pesanan di kembalikan"
        : "Gagal mengembalikan pesanan",
    });
  }

  return Response.json({ success: false });
};

export default function RecycleBin() {
  const [activeTab, setActiveTab] = useState("order");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useModal();

  const categories: any[] = [{ value: "order", label: "Pesanan" }];

  const {
    data: orders,
    loading,
    reload,
  } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        page: page ? page - 1 : 0,
        size: 10,
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
  }, [actionData]);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Tgl. Order",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 font-medium",
        cell: (order) => (
          <div className="flex flex-col">
            <p className="font-semibold">
              {+order?.is_archive === 1 ? "Arsip" : order.order_number}
            </p>
            <p>
              {order?.order_date
                ? moment(order.order_date).format("DD MMM YYYY HH:mm")
                : "-"}
            </p>
          </div>
        ),
      },
      {
        key: "instansi",
        header: "Instansi/Pemesan",
        cellClassName: "max-w-[180px]",
        cell: (order) => (
          <>
            <div className="font-bold text-gray-900 flex items-center gap-2">
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
            <div className="text-xs text-gray-500">
              {order.pic_name || "-"} ({order.pic_phone || "-"})
            </div>
          </>
        ),
      },
      {
        key: "created_by",
        header: "Dibuat Oleh",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order) => (
          <div className="flex flex-col">
            <p className="text-xs">
              {safeParseObject(order.created_by)?.fullname ?? "-"}
            </p>
            <p className="text-[0.675rem]">
              {moment(order.created_on).format("DD MMM YYYY HH:mm")}
            </p>
          </div>
        ),
      },
      {
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order) => (
          <div className="flex justify-center gap-2 relative">
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
                    confirmButton: "bg-red-600 text-white",
                    cancelButton: "bg-gray-200 text-gray-800",
                  },
                }).then((result) => {
                  if (result.isConfirmed) {
                    submitAction({
                      intent: "restore",
                      id: order.id,
                    });
                  }
                })
              }
              className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
            >
              <RecycleIcon size={16} />
            </button>
          </div>
        ),
      },
    ],
    [orders]
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
          <p className="text-sm text-gray-500">
            Kelola data yang telah dihapus
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search & Tabs Section */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === cat.value
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                    : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={orders?.data?.items || []}
          getRowKey={(order, _index) => order.id}
          rowClassName={(order) => (order.finishedAt ? "bg-green-50/30" : "")}
          emptyMessage="Belum ada pesanan di kategori ini."
          minHeight="400px"
        />

        {/* Pagination */}
        <TablePagination
          currentPage={page || orders?.data?.current_page || 1}
          totalPages={orders?.data?.total_pages || 0}
          onPageChange={(page) => {
            setPage(page);
          }}
          className="mt-auto"
        />
      </div>
    </div>
  );
}

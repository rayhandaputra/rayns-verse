import React, { useState, useMemo, useEffect } from "react";
import type { Order } from "../types";
import { formatCurrency, formatFullDate, getWhatsAppLink } from "../constants";
import {
  Check,
  Trash2,
  Copy,
  FileText,
  MessageCircle,
  FolderOpen,
  Handshake,
  X,
} from "lucide-react";
import NotaView from "../components/NotaView";
import {
  DataTable,
  TablePagination,
  type ColumnDef,
} from "../components/ui/data-table";
import {
  useNavigate,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import moment from "moment";
import { getOrderLabel, safeParseArray } from "~/lib/utils";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { useModal } from "~/hooks";
import Swal from "sweetalert2";
import ModalSecond from "~/components/modal/ModalSecond";

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("action");
  const id = formData.get("id") as string;

  if (actionType === "delete") {
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, deleted: 1 } },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Pesanan dihapus" : "Gagal menghapus",
    });
  }

  if (actionType === "update_status") {
    const status = formData.get("status") as string;

    // Map UI status back to API status
    // let apiStatus = "ordered";
    // if (status === "selesai") apiStatus = "done";
    // else if (status === "sedang dikerjakan") apiStatus = "in_production";
    // else if (status === "pending") apiStatus = "ordered";

    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, status } },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Status diperbarui" : "Gagal memperbarui status",
    });
  }

  if (actionType === "update_review") {
    const rating = Number(formData.get("rating"));
    const review = formData.get("review") as string;

    // Only update if valid
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, rating, review } },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Ulasan diperbarui" : "Gagal memperbarui ulasan",
    });
  }

  if (actionType === "update_payment_proof") {
    const proof = formData.get("proof") as string;

    // Only update if valid
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, payment_proof: proof } },
    });
    return Response.json({
      success: res.success,
      message: res.success
        ? "Bukti pembayaran diperbarui"
        : "Gagal memperbarui bukti pembayaran",
    });
  }

  return Response.json({ success: false });
};

export default function OrderList() {
  const navigate = useNavigate();

  // Fetch orders with Nexus
  // ... existing code ...
  const onUpdateReview = (id: string, rating: number, review: string) => {
    submitAction({
      action: "update_review",
      id,
      rating: String(rating),
      review,
    });
  };
  const onUpdatePaymentProof = (id: string, proof: string) => {
    submitAction({
      action: "update_payment_proof",
      id,
      proof,
    });
  };

  // ... existing code ...

  const {
    data: orders,
    loading,
    reload,
  } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        page: 0,
        size: 10,
        pagination: "true",
      })
      .build(),
  });

  // const orders: Order[] = useMemo(() => {
  //   if (!ordersData?.data?.items) return [];

  //   return ordersData.data.items.map((item: any) => {
  //     const isKKN = item.notes?.includes("KKN") || false;
  //     const dpMatch = item.notes?.match(/DP:\s*(\d+)/);
  //     const dpAmount = dpMatch ? Number(dpMatch[1]) : 0;

  //     let statusPengerjaan: any = "pending";
  //     if (item.status === "done") statusPengerjaan = "selesai";
  //     else if (
  //       ["in_production", "process", "ready", "shipped"].includes(item.status)
  //     )
  //       statusPengerjaan = "sedang dikerjakan";

  //     let statusPembayaran: any = "Tidak Ada";
  //     if (item.payment_status === "paid") statusPembayaran = "Lunas";
  //     else if (item.payment_status === "down_payment") statusPembayaran = "DP";

  //     return {
  //       id: item.id,
  //       instansi: item.institution_name,
  //       singkatan: item.institution_abbr || "",
  //       jenisPesanan: getOrderLabel(item.order_type) || item.order_type,
  //       jumlah: Number(item.total_product || 0),
  //       deadline: item.deadline || "",
  //       statusPembayaran,
  //       dpAmount,
  //       domain: item.institution_domain || "",
  //       accessCode: item.order_number,
  //       statusPengerjaan,
  //       finishedAt: item.status === "done" ? item.modified_on : null,
  //       unitPrice: 0,
  //       totalAmount: Number(item.grand_total || 0),
  //       createdAt: item.created_on,
  //       isKKN,
  //       pjName: item.shipping_contact || "",
  //       pjPhone: item.shipping_contact || "",
  //       customItems: [],
  //       driveFolderId: "",
  //     };
  //   });
  // }, [ordersData]);

  const [viewMode, setViewMode] = useState<"reguler" | "kkn">("reguler");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showNota, setShowNota] = useState<string | null>(null);

  const [modal, setModal] = useModal();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  };

  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  const onUpdateStatus = (id: string, status: string) => {
    submitAction({ action: "update_status", id, status });
  };

  const onMarkDone = (id: string) => {
    submitAction({ action: "update_status", id, status: "done" });
  };

  const onDelete = (order: any) => {
    Swal.fire({
      title: "Hapus Pesanan?",
      text: `Yakin ingin menghapus pesanan ${order.institution_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-red-600 text-white",
        cancelButton: "bg-gray-200 text-gray-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ action: "delete", id: order.id });
      }
    });
  };

  // Reload orders after action
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      reload();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  const onOpenDrive = (folderId: string) => {
    // Trying to construct a valid drive link.
    // Assuming accessCode acts as identifier or we navigate to main drive page
    navigate(`/app/drive?folder_id=${folderId}`);
  };

  const getStatusColor = (status: string) => {
    if (status === "selesai")
      return "bg-green-100 text-green-700 border border-green-200";
    if (status === "sedang dikerjakan")
      return "bg-blue-100 text-blue-700 border border-blue-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const getFunctionalLink = (accessCode: string) =>
    `/public/drive-link/${accessCode}`;

  // Column definitions for DataTable
  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Tgl. Order",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 font-medium",
        cell: (order) => formatFullDate(order.created_on),
      },
      {
        key: "instansi",
        header: "Instansi/Pemesan",
        cellClassName: "max-w-[180px]",
        cell: (order) => (
          <>
            <div className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              {order.institution_name}
              {+(order?.is_sponsor ?? 0) === 1 && (
                <span
                  title="Sponsor / Kerja Sama"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200"
                >
                  <Handshake size={10} className="mr-0.5" /> SPONSOR
                </span>
              )}
            </div>
          </>
        ),
      },
      {
        key: "jenisPesanan",
        header: "Nama Item",
        cellClassName: "max-w-[150px]",
        cell: (order) => (
          <ul className="list-disc list-inside text-xs text-gray-600">
            {safeParseArray(order.order_items)?.length > 0
              ? safeParseArray(order.order_items)?.map(
                  (item: any, idx: number) => (
                    <li key={idx} className="truncate">
                      {item.product_name} ({item.qty})
                    </li>
                  )
                )
              : "-"}
          </ul>
        ),
      },
      {
        key: "jumlah",
        header: "Jumlah",
        cellClassName:
          "whitespace-nowrap text-center text-sm font-medium text-gray-900",
        cell: (order) => (
          <span>{safeParseArray(order.order_items)?.length}</span>
        ),
      },
      {
        key: "deadline",
        header: "Deadline",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 font-medium",
        cell: (order) => formatFullDate(order.deadline),
      },
      {
        key: "totalAmount",
        header: "Total Bayar",
        cellClassName: "whitespace-nowrap text-sm font-bold text-gray-900",
        cell: (order) => formatCurrency(order.total_amount ?? 0),
      },
      {
        key: "link",
        header: "Folder",
        cellClassName: "max-w-[120px]",
        cell: (order) => (
          // <div className="flex flex-col gap-2">
          //   {order.driveFolderId ? (
          //     <button
          //       onClick={() => onOpenDrive(order.driveFolderId!)}
          //       className="flex items-center justify-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-100 whitespace-nowrap"
          //     >
          //       <FolderOpen size={14} /> Buka
          //     </button>
          //   ) : (
          //     <span className="text-xs text-gray-400 italic">-</span>
          //   )}
          // </div>
          <div className="flex flex-col gap-2">
            {order.drive_folder_id ? (
              <button
                onClick={() => onOpenDrive(order.drive_folder_id!)}
                className="flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm w-fit"
              >
                <FolderOpen size={10} className="text-yellow-500" /> Buka
              </button>
            ) : (
              "-"
            )}
            <div className="flex items-center gap-1 group">
              <a
                href={`/public/drive-link/${order.institution_domain}`}
                className="truncate text-blue-600 hover:underline text-[10px] font-mono w-16"
              >
                link
              </a>
              <button
                onClick={() =>
                  copyToClipboard(
                    "kinau.id/public/drive-link/" + order.institution_domain
                  )
                }
                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
              >
                <Copy size={10} />
              </button>
            </div>
          </div>
        ),
      },
      {
        key: "statusPengerjaan",
        header: "Status Produksi",
        cell: (order) =>
          order.finishedAt ? (
            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
              <Check size={12} /> Selesai
            </span>
          ) : (
            <select
              className={`text-xs border rounded py-1 px-2 font-medium ${getStatusColor(order.status)} cursor-pointer`}
              value={order.status}
              onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
            >
              <option value="pending" className="bg-white text-gray-700">
                Pending
              </option>
              <option
                value="sedang dikerjakan"
                className="bg-white text-blue-700"
              >
                Proses
              </option>
              <option value="selesai" className="bg-white text-green-700">
                Selesai
              </option>
            </select>
          ),
      },
      {
        key: "statusPembayaran",
        header: "Status Pembayaran",
        cellClassName: "whitespace-nowrap",
        cell: (order) => (
          <>
            <span
              className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                order.payment_status === "paid"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : order.payment_status === "down_payment"
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              {order.payment_status === "down_payment" ? "DP" : "Lunas"}
            </span>
            {order.payment_status === "down_payment" && (
              <div className="text-xs mt-1 text-gray-500 font-medium">
                {formatCurrency(order.dp_amount)}
              </div>
            )}
          </>
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
              title="Nota"
              onClick={() =>
                setModal({
                  ...modal,
                  open: true,
                  type: "view_nota",
                  data: order,
                })
              }
              className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
            >
              <FileText size={16} />
            </button>
            <button
              title="Selesai"
              onClick={() => onMarkDone(order.id)}
              className="p-1.5 text-green-600 bg-green-50 rounded hover:bg-green-100 transition"
            >
              <Check size={16} />
            </button>
            <button
              title="Hapus"
              onClick={() => onDelete(order)}
              className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [orders]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* View Toggles */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setViewMode("reguler");
          }}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "reguler" ? "bg-gray-50 text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Reguler
        </button>
        <button
          onClick={() => {
            setViewMode("kkn");
          }}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "kkn" ? "bg-blue-50 text-blue-900 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Khusus KKN
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
        <div className="flex gap-4">
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
            }}
          >
            <option value="">Semua Tahun</option>
            {Array.from(
              { length: new Date().getFullYear() - 2017 + 1 },
              (_, i) => (new Date().getFullYear() - i).toString()
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name_az">Instansi (A-Z)</option>
            <option value="name_za">Instansi (Z-A)</option>
            <option value="product">Jenis Produk</option>
            <option value="payment">Status Bayar (Lunas-DP)</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Total: <b>{orders?.data?.total_items || 0}</b> Pesanan
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
        currentPage={orders?.data?.current_page || 1}
        totalPages={orders?.data?.total_pages || 0}
        onPageChange={(page) => {}}
        className="mt-auto"
      />

      {modal?.type === "view_nota" && (
        <ModalSecond
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title=""
          size="lg"
        >
          <NotaView
            order={modal?.data}
            isEditable={true}
            onReviewChange={(rating, review) =>
              onUpdateReview(modal?.data.id, rating, review)
            }
            onPaymentProofChange={(proof) =>
              onUpdatePaymentProof(modal?.data.id, proof)
            }
          />
        </ModalSecond>
      )}
    </div>
  );
}

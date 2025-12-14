import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import NotaView from "../components/NotaView";
import {
  DataTable,
  TablePagination,
  type ColumnDef,
} from "../components/ui/data-table";

interface OrderListProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order["statusPengerjaan"]) => void;
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDrive: (folderId: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders = [],
  onUpdateStatus,
  onMarkDone,
  onDelete,
  onOpenDrive,
}) => {
  const [viewMode, setViewMode] = useState<"reguler" | "kkn">("reguler");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showNota, setShowNota] = useState<string | null>(null);

  // Filter based on view mode (KKN vs Reguler)
  const baseList = orders.filter((o) =>
    viewMode === "kkn" ? o.isKKN : !o.isKKN
  );

  const years = Array.from(
    new Set(baseList.map((o) => new Date(o.createdAt).getFullYear()))
  ).sort((a: number, b: number) => b - a);

  const filteredOrders = baseList
    .filter((o) =>
      filterYear
        ? new Date(o.createdAt).getFullYear() === Number(filterYear)
        : true
    )
    .sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (sortBy === "name_az") return a.instansi.localeCompare(b.instansi);
      if (sortBy === "name_za") return b.instansi.localeCompare(a.instansi);
      if (sortBy === "payment") {
        const weight = (s: string) => (s === "Lunas" ? 3 : s === "DP" ? 2 : 1);
        return weight(b.statusPembayaran) - weight(a.statusPembayaran);
      }
      if (sortBy === "product")
        return a.jenisPesanan.localeCompare(b.jenisPesanan);
      return 0;
    });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const currentOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const getStatusColor = (status: string) => {
    if (status === "selesai")
      return "bg-green-100 text-green-700 border border-green-200";
    if (status === "sedang dikerjakan")
      return "bg-blue-100 text-blue-700 border border-blue-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const isSponsor = (o: Order) => {
    const txt = (o.instansi + o.jenisPesanan).toLowerCase();
    return (
      txt.includes("sponsor") ||
      txt.includes("media partner") ||
      txt.includes("kerja sama") ||
      o.totalAmount === 0
    );
  };

  const getFunctionalLink = (accessCode: string) => `?access=${accessCode}`;

  const NotaModal = ({ order }: { order: Order }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1"
          onClick={() => setShowNota(null)}
        >
          × Close
        </button>
        <NotaView order={order} />
      </div>
    </div>
  );

  // Column definitions for DataTable
  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Tanggal Dibuat",
        cellClassName: "whitespace-nowrap text-xs text-gray-500",
        cell: (order) => formatFullDate(order.createdAt),
      },
      {
        key: "instansi",
        header: "Instansi / Pemesan",
        cell: (order) => (
          <>
            <div className="font-bold text-gray-900 flex items-center gap-2">
              {order.instansi}
              {isSponsor(order) && (
                <span
                  title="Sponsor / Kerja Sama"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200"
                >
                  <Handshake size={10} className="mr-0.5" /> SPONSOR
                </span>
              )}
            </div>
            {order.customItems && order.customItems.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">
                  Item Tambahan:
                </span>
                <br />
                {order.customItems.map((ci, i) => (
                  <span key={i} className="block">
                    • {ci.name} ({ci.quantity})
                  </span>
                ))}
              </div>
            )}
          </>
        ),
      },
      {
        key: "pj",
        header: "PJ & Kontak",
        show: viewMode === "kkn",
        cellClassName: "whitespace-nowrap",
        cell: (order) => (
          <>
            <div className="font-medium text-gray-800">
              {order.pjName || "-"}
            </div>
            {order.pjPhone && (
              <a
                href={getWhatsAppLink(order.pjPhone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-green-50 px-2 py-0.5 rounded-full mt-1 border border-green-200"
              >
                <MessageCircle size={10} /> Chat WA
              </a>
            )}
          </>
        ),
      },
      {
        key: "deadline",
        header: "Deadline",
        cellClassName: "whitespace-nowrap text-gray-600 font-medium",
        cell: (order) => formatFullDate(order.deadline),
      },
      {
        key: "detail",
        header: "Detail",
        cell: (order) => (
          <>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold block w-fit mb-1">
              {order.jenisPesanan}
            </span>
            <div className="text-xs">
              Qty: <b>{order.jumlah}</b>
            </div>
          </>
        ),
      },
      {
        key: "pembayaran",
        header: "Pembayaran",
        cell: (order) => (
          <>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                order.statusPembayaran === "Lunas"
                  ? "bg-green-100 text-green-700"
                  : order.statusPembayaran === "DP"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {order.statusPembayaran}
            </span>
            {order.statusPembayaran === "DP" && (
              <div className="text-xs mt-1 text-gray-500">
                {formatCurrency(order.dpAmount)}
              </div>
            )}
          </>
        ),
      },
      {
        key: "link",
        header: "Link Upload",
        cellClassName: "max-w-[150px]",
        cell: (order) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 group">
              <a
                href={getFunctionalLink(order.accessCode)}
                className="truncate text-blue-600 hover:underline text-xs font-mono"
              >
                kinau.id/{order.accessCode}
              </a>
              <button
                onClick={() => copyToClipboard(order.domain)}
                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
              >
                <Copy size={12} />
              </button>
            </div>
            {order.driveFolderId && (
              <button
                onClick={() => onOpenDrive(order.driveFolderId!)}
                className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm"
              >
                <FolderOpen size={12} className="text-yellow-500" /> Buka Folder
              </button>
            )}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (order) =>
          order.finishedAt ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
              <Check size={12} /> Selesai
            </span>
          ) : (
            <select
              className={`text-xs border rounded py-1 px-2 font-medium ${getStatusColor(order.statusPengerjaan)}`}
              value={order.statusPengerjaan}
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
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cell: (order) => (
          <div className="flex justify-center gap-2 relative">
            <button
              title="Nota"
              onClick={() =>
                setShowNota(showNota === order.id ? null : order.id)
              }
              className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
            >
              <FileText size={16} />
            </button>
            {!order.finishedAt && (
              <button
                title="Selesai"
                onClick={() => onMarkDone(order.id)}
                className="p-1.5 text-green-600 bg-green-50 rounded hover:bg-green-100"
              >
                <Check size={16} />
              </button>
            )}
            <button
              title="Hapus"
              onClick={() => {
                if (confirm("Hapus pesanan ini?")) onDelete(order.id);
              }}
              className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
            >
              <Trash2 size={16} />
            </button>
            {showNota === order.id && <NotaModal order={order} />}
          </div>
        ),
      },
    ],
    [viewMode, showNota, onUpdateStatus, onMarkDone, onDelete, onOpenDrive]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* View Toggles */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setViewMode("reguler");
            setPage(1);
          }}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "reguler" ? "bg-gray-50 text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Reguler
        </button>
        <button
          onClick={() => {
            setViewMode("kkn");
            setPage(1);
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
              setPage(1);
            }}
          >
            <option value="">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
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
          Total: <b>{filteredOrders.length}</b> Pesanan
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={currentOrders}
        getRowKey={(order, _index) => order.id}
        rowClassName={(order) => (order.finishedAt ? "bg-green-50/30" : "")}
        emptyMessage="Belum ada pesanan di kategori ini."
        minHeight="400px"
      />

      {/* Pagination */}
      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-auto"
      />
    </div>
  );
};

export default OrderList;

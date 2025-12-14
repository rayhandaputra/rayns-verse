import React, { useMemo } from "react";
import type { HistoryEntry } from "../types";
import { DataTable, type ColumnDef } from "../components/ui/data-table";

interface HistoryListProps {
  history: HistoryEntry[];
}

const HistoryList: React.FC<HistoryListProps> = ({ history = [] }) => {
  // Column definitions for DataTable
  const columns: ColumnDef<HistoryEntry>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Nama Instansi",
        headerClassName: "px-6",
        cellClassName: "px-6 font-medium",
        cell: (h) => h.name,
      },
      {
        key: "abbr",
        header: "Singkatan",
        headerClassName: "px-6",
        cellClassName: "px-6",
        cell: (h) => h.abbr,
      },
      {
        key: "domainBase",
        header: "Base Domain",
        headerClassName: "px-6",
        cellClassName: "px-6 text-gray-500",
        cell: (h) => h.domainBase,
      },
      {
        key: "orderCount",
        header: "Jumlah Pesanan",
        headerClassName: "px-6",
        cellClassName: "px-6",
        cell: (h) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {h.orderCount} Order
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Riwayat Instansi</h2>
        <p className="text-gray-500 text-sm">
          Database instansi yang pernah memesan.
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={history}
        getRowKey={(h, index) => `${h.name}-${index}`}
        emptyMessage="Belum ada data"
        minHeight="200px"
      />
    </div>
  );
};

export default HistoryList;

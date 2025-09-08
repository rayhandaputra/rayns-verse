// components/CustomTable.tsx
"use client";

import React, { useEffect, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";

type PaginatedData<T> = {
  total_items: number;
  items: T[];
  current_page?: number;
  total_pages?: number;
};

type CustomTableProps<T> = {
  columns: TableColumn<T>[];
  data: PaginatedData<T>;
  responsive?: boolean; // jika true, gunakan mode mobile pada < md
  pagination?: boolean; // kontrol pagination DataTable
  className?: string;
};

export default function TableComponent<T>({
  columns,
  data,
  responsive = false,
  pagination = true,
  className = "",
}: CustomTableProps<T>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  if (!isClient) {
    return <div className="text-center py-4">Loading...</div>;
  }

  const hasData = data?.items?.length > 0;

  // Mode responsive (mobile)
  const isMobile =
    responsive && typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        {hasData ? (
          data.items.map((row, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-sm bg-white">
              {columns.map((col, cidx) => (
                <div key={cidx} className="flex justify-between py-1 text-sm">
                  <span className="font-medium">{col.name}:</span>
                  <span>
                    {typeof col.cell === "function"
                      ? col.cell(row, idx, col, String(idx))
                      : typeof col.selector === "string"
                        ? ((row as any)[col.selector] ?? "-")
                        : "-"}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">Tidak ada data</div>
        )}
      </div>
    );
  }

  // Mode Desktop
  if (hasData) {
    return (
      <DataTable
        className={className}
        columns={columns}
        data={data.items}
        highlightOnHover
        pagination={pagination}
      />
    );
  }

  // Fallback jika tidak ada data (desktop)
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="grid grid-cols-12 bg-gray-100 p-3 font-medium">
        {columns.map((col, idx) => (
          <div key={idx} className="col-span-2">
            {col.name}
          </div>
        ))}
      </div>
      <div className="text-center py-4 text-gray-500">Tidak ada data</div>
    </div>
  );
}

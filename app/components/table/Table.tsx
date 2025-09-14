// components/CustomTable.tsx
"use client";

import { InboxIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import DataTable, {
  type ExpanderComponentProps,
  type TableColumn,
} from "react-data-table-component";
import { useNavigate, useSearchParams } from "react-router";

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
  paginationDefaultPage?: number;
  paginationTotalRows?: number;
  onChangePage?: (page?: number, totalRows?: number) => void;
  onChangeRowsPerPage?: () => void;
  expandableRows?: boolean; // kontrol pagination DataTable
  expandableRowsData?: {
    name: string;
    cell: (row: any, index: number) => React.ReactNode;
  }[];
  className?: string;
};

export default function TableComponent<T>({
  columns,
  data,
  responsive = false,
  pagination = true,
  paginationDefaultPage,
  paginationTotalRows,
  onChangePage,
  onChangeRowsPerPage,
  expandableRows = false,
  expandableRowsData,
  className = "",
}: CustomTableProps<T>) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramsObject = Object.fromEntries(searchParams.entries());
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

  const ExpandedComponent: React.FC<ExpanderComponentProps<any>> = ({
    data,
  }) => {
    return (
      <div className="mb-6 w-full rounded-lg bg-white p-6 shadow">
        <h1 className="text-sm font-medium text-gray-400">Detail Prestasi</h1>
        <div className="mt-2 grid grid-cols-4 gap-3">
          {expandableRowsData?.map((val, index) => (
            <div className="border-b pb-2" key={index}>
              <p className="text-xs font-medium text-gray-500">
                {val?.name || ""}
              </p>
              <p className="text-xs font-medium text-gray-700">
                {typeof val?.cell === "function" ? val.cell(data, index) : "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mode Desktop
  if (hasData) {
    return (
      <DataTable
        className={className}
        columns={columns}
        data={data?.items ?? []}
        highlightOnHover
        pagination={pagination}
        paginationServer={pagination}
        paginationDefaultPage={
          (paginationDefaultPage ?? data?.current_page)
            ? (data?.current_page ?? 0) + 1
            : 1
        }
        paginationTotalRows={paginationTotalRows ?? data?.total_items}
        striped
        responsive
        onChangePage={
          onChangePage ??
          ((page: number, totalRows: number) => {
            navigate(
              `?${new URLSearchParams({ ...paramsObject, page: page - 1 } as any)}`
            );
          })
        }
        // onChangePage={(page: any, totalRows: any) => {
        //     const queryFilter = new URLSearchParams({
        //         ...table.filter,
        //         page: page - 1,
        //     }).toString();
        //     navigate(`?${queryFilter}`);
        // }}
        onChangeRowsPerPage={
          onChangeRowsPerPage ??
          ((currentRowsPerPage: number, currentPage: number) => {
            navigate(
              `?${new URLSearchParams({ ...paramsObject, page: 0, size: currentRowsPerPage } as any)}`
            );
          })
        }
        // onChangeRowsPerPage={(currentRowsPerPage: any, currentPage: any) => {
        //     const queryFilter = new URLSearchParams({
        //         ...table.filter,
        //         // page: currentPage,
        //         page: 0,
        //         size: currentRowsPerPage,
        //     }).toString();
        //     navigate(`?${queryFilter}`);
        // }}
        customStyles={{
          headCells: {
            style: {
              color: "white",
              paddingLeft: "10px",
              paddingRight: "10px",
              borderRadius: "15px",
            },
          },
          headRow: {
            style: {
              marginTop: "1rem",
              backgroundColor: "slategray",
              minHeight: "40px",
              borderRadius: "15px",
            },
          },
          rows: {
            style: {
              borderRadius: "15px",
            },
          },
          cells: {
            style: {
              paddingTop: "4px",
              paddingBottom: "4px",
              paddingLeft: "10px",
              paddingRight: "10px",
              borderRadius: "15px",
            },
          },
        }}
        expandableRows={expandableRows}
        expandableRowsComponent={ExpandedComponent}
        noDataComponent={
          <div className="flex items-center justify-center gap-2 p-6 text-gray-500">
            <InboxIcon className="h-8 w-8 text-gray-400" />
            <span>Tidak ada data yang ditemukan</span>
          </div>
        }
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

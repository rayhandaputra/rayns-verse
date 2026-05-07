import React from "react";
import DataTable from "react-data-table-component";
import type { TableColumn, TableStyles } from "react-data-table-component";
import { Search, Loader2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface CustomDataTableProps<T> {
  title?: string;
  description?: string;
  totalData?: number;
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  tabs?: { label: string; value: string; count?: number }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  filters?: React.ReactNode;
  pagination?: boolean;
  paginationServer?: boolean;
  paginationTotalRows?: number;
  onChangePage?: (page: number) => void;
  onChangeRowsPerPage?: (num: number, page: number) => void;
  className?: string;
}

export function CustomDataTable<T>({
  title,
  description,
  totalData,
  columns,
  data,
  loading = false,
  searchPlaceholder = "Cari data...",
  onSearch,
  tabs,
  activeTab,
  onTabChange,
  filters,
  pagination = true,
  paginationServer = false,
  paginationTotalRows,
  onChangePage,
  onChangeRowsPerPage,
  className,
}: CustomDataTableProps<T>) {
  
  const customStyles: TableStyles = {
    table: {
      style: {
        backgroundColor: "transparent",
      },
    },
    header: {
      style: {
        display: "none",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f9fafb",
        borderTopWidth: "1px",
        borderTopColor: "#e5e7eb",
        borderBottomWidth: "1px",
        borderBottomColor: "#e5e7eb",
        minHeight: "48px",
      },
    },
    headCells: {
      style: {
        fontSize: "0.75rem",
        fontWeight: "600",
        color: "#4b5563",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      },
    },
    cells: {
      style: {
        fontSize: "0.875rem",
        color: "#374151",
        paddingTop: "12px",
        paddingBottom: "12px",
      },
    },
    rows: {
      style: {
        minHeight: "64px",
        "&:not(:last-of-type)": {
          borderBottomStyle: "solid",
          borderBottomWidth: "1px",
          borderBottomColor: "#f3f4f6",
        },
        "&:hover": {
          backgroundColor: "#f9fafb",
        },
      },
    },
    pagination: {
      style: {
        borderTop: "none",
        color: "#6b7280",
        fontSize: "0.875rem",
      },
    },
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden", className)}>
      {/* Header Section */}
      {(title || totalData !== undefined) && (
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {totalData !== undefined && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3 py-1 text-sm font-medium rounded-full self-start md:self-center">
              Total: {totalData} data
            </Badge>
          )}
        </div>
      )}

      {/* Tabs Section */}
      {tabs && tabs.length > 0 && (
        <div className="px-6 border-b border-gray-100">
          <div className="flex overflow-x-auto no-scrollbar gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  "py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap relative",
                  activeTab === tab.value
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 w-full">
          {filters}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-lg"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-600">Memuat data...</span>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={data}
          customStyles={customStyles}
          pagination={pagination}
          paginationServer={paginationServer}
          paginationTotalRows={paginationTotalRows}
          onChangePage={onChangePage}
          onChangeRowsPerPage={onChangeRowsPerPage}
          responsive
          highlightOnHover
          noDataComponent={
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="bg-gray-50 p-4 rounded-full">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Data tidak ditemukan</p>
            </div>
          }
        />
      </div>
    </div>
  );
}

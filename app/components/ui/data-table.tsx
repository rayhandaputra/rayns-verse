import * as React from "react";
import { cn } from "~/lib/utils";

// Column definition type
export interface ColumnDef<T> {
  /** Unique key identifier for the column */
  key: string;
  /** Header label displayed in thead */
  header: React.ReactNode;
  /** Custom className for header th */
  headerClassName?: string;
  /** Render function for cell content */
  cell: (row: T, index: number) => React.ReactNode;
  /** Custom className for cell td */
  cellClassName?: string;
  /** Whether this column should be conditionally rendered */
  show?: boolean;
}

export interface DataTableProps<T> {
  /** Array of column definitions */
  columns: ColumnDef<T>[];
  /** Data array to render */
  data: T[];
  /** Function to get unique key for each row */
  getRowKey: (row: T, index: number) => string | number;
  /** Custom className for row, receives row data */
  rowClassName?: (row: T) => string;
  /** Empty state message when no data */
  emptyMessage?: React.ReactNode;
  /** Container className */
  className?: string;
  /** Table className */
  tableClassName?: string;
  /** Minimum height for table container */
  minHeight?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  rowClassName,
  emptyMessage = "Tidak ada data.",
  className,
  tableClassName,
  minHeight = "400px",
}: DataTableProps<T>) {
  // Filter visible columns
  const visibleColumns = columns.filter((col) => col.show !== false);
  const colCount = visibleColumns.length;

  return (
    <div className={cn("overflow-x-auto", className)} style={{ minHeight }}>
      <table className={cn("w-full text-sm text-left", tableClassName)}>
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="text-center py-8 text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={cn(
                  "border-b hover:bg-gray-50 transition",
                  rowClassName?.(row)
                )}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3", col.cellClassName)}
                  >
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Pagination component
export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "p-4 border-t border-gray-200 flex justify-center gap-2",
        className
      )}
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            "w-8 h-8 rounded-lg text-sm font-medium transition",
            currentPage === page
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default DataTable;

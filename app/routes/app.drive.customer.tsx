// app/routes/app.drive.customer.tsx
import React, { useState, useEffect } from "react";
import { Folder, FileText, Download } from "lucide-react";
import { useLoaderData, useNavigate, type LoaderFunction } from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import { DriveBreadcrumb } from "~/components/breadcrumb/DriveBreadcrumb";
import { toast } from "sonner";
import type { Order } from "~/types";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  orders: Order[];
  current_folder?: any;
}

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  const url = new URL(request.url);
  const { folder_id } = Object.fromEntries(url.searchParams.entries());

  const ordersRes = await API.ORDERS.get({
    session: { user, token },
    req: { query: { size: 100 } },
  });

  const detailFolder = await API.ORDER_UPLOAD.get_folder({
    session: { user, token },
    req: { query: { id: folder_id || "null", size: 1 } },
  });

  return Response.json({
    orders: ordersRes.items || [],
    current_folder: detailFolder?.items?.[0] ?? null,
  });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DriveCustomerPage() {
  const { orders, current_folder } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const query = useQueryParams();

  const {
    data: realFolders,
    loading: isLoading,
    reload: reloadRealFolders,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDER_UPLOAD")
      .action("get_folder")
      .params({
        page: 0,
        size: 100,
        order_number: "is_not_null",
        ...(query.folder_id && { folder_id: query.folder_id }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: realFiles,
    loading: isLoadingFiles,
    reload: reloadRealFiles,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDER_UPLOAD")
      .action("get_file")
      .params({
        page: 0,
        size: 100,
        order_number: "is_not_null",
        ...(query.folder_id
          ? { folder_id: query.folder_id }
          : { folder_id: "null" }),
      })
      .build(),
    autoLoad: true,
  });

  const handleOpenFolder = (folderId: string | number) => {
    navigate(`/app/drive/customer?folder_id=${folderId}`);
  };

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Validasi Awal
    if (!query?.folder_id) {
      toast.error("Tidak ada folder yang dipilih");
      return;
    }

    if (files.length === 0) {
      toast.error("Tidak ada file untuk diunduh");
      return;
    }

    setIsDownloading(true);
    const loadingToast = toast.loading("Menyiapkan dan mengompres file...");

    try {
      // 2. Eksekusi Request ke Server Action
      const res = await fetch(`/server/drive/${query?.folder_id}/download`, {
        method: "POST",
      });

      // 3. Penanganan Error dari Server
      if (!res.ok) {
        // Mencoba membaca pesan error dari body response (JSON)
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || errData.error || "Gagal mengunduh file dari server"
        );
      }

      // 4. Konversi Stream ke Blob
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("File ZIP kosong");

      // 5. Ekstraksi Nama File dari Content-Disposition Header
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `folder-${query?.folder_id}.zip`; // Nama default

      if (contentDisposition) {
        // Regex untuk mengambil nama file di dalam tanda kutip atau setelah 'filename='
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // 6. Proses Trigger Download di Browser
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;

      // Append ke body (penting untuk kompabilitas Firefox)
      document.body.appendChild(a);
      a.click();

      // 7. Cleanup & Notifikasi Sukses
      toast.success("Download berhasil dimulai", { id: loadingToast });

      // Beri jeda sedikit sebelum menghapus URL untuk memastikan browser menangkap kliknya
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 150);
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err.message || "Terjadi kesalahan saat mengunduh", {
        id: loadingToast,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  return (
    <>
      {/* Breadcrumbs */}
      <DriveBreadcrumb
        domain="customer"
        currentFolderId={current_folder?.id || query?.folder_id}
        rootFolderId={null}
        breadcrumbs={[
          ...(current_folder?.id
            ? [
                {
                  id: current_folder?.id,
                  name: current_folder?.folder_name,
                },
              ]
            : []),
        ]}
        onOpenFolder={(folderId) => handleOpenFolder(folderId!)}
      />

      {/* Download All Button - Only show when in a folder */}
      {query.folder_id && files.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/50">
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download
              size={16}
              className={isDownloading ? "animate-bounce" : ""}
            />
            <span>
              {isDownloading
                ? "Mengunduh..."
                : `Download Semua File (${files.length})`}
            </span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {folders.length === 0 && files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Folder size={64} className="mb-4 opacity-20" />
            <p>Tidak ada data customer</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Render Folders */}
            {folders.map((folder: any) => (
              <div
                key={folder.id}
                onDoubleClick={() => handleOpenFolder(folder.id)}
                className="group relative p-4 rounded-xl border bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-3 cursor-pointer transition-all"
              >
                <Folder size={48} className="text-blue-400 fill-blue-400" />
                <div className="text-center w-full">
                  <div
                    className="text-xs font-medium truncate w-full text-gray-700"
                    title={folder.folder_name}
                  >
                    {folder.folder_name}
                  </div>
                </div>
              </div>
            ))}

            {/* Render Files */}
            {files.map((file: any) => (
              <div
                key={file.id}
                onDoubleClick={() => window.open(file.file_url, "_blank")}
                className="group relative p-4 rounded-xl border bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-3 cursor-pointer transition-all"
              >
                <FileText size={40} className="text-blue-500" />
                <div className="text-center w-full">
                  <div
                    className="text-xs font-medium truncate w-full text-gray-700"
                    title={file.file_name}
                  >
                    {file.file_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

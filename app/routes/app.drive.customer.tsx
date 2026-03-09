// app/routes/app.drive.customer.tsx
import React, { useState, useEffect } from "react";
import { Folder, FileText, Download, Trash2 } from "lucide-react";
import { useLoaderData, useNavigate, type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import { DriveBreadcrumb } from "~/components/breadcrumb/DriveBreadcrumb";
import { toast } from "sonner";
import Swal from "sweetalert2";
// import type { Order } from "~/types";

// ============================================
// LOADER AND ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const authData = await requireAuth(request);
  // @ts-ignore
  const { user, token } = authData;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  try {
    if (intent === "delete_folder") {
      const result = await API.ORDER_UPLOAD.delete_folder({ session: { user, token }, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      return Response.json({ success: true, message: "Berhasil menghapus folder" });
    }
    else if (intent === "delete_file") {
      const result = await API.ORDER_UPLOAD.delete_file({ session: { user, token }, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      return Response.json({ success: true, message: "Berhasil menghapus file" });
    }
    else if (intent === "update_folder") {
      const purpose = formData.get("purpose") as string;
      const result = await API.ORDER_UPLOAD.create_single_folder({
        session: { user, token },
        req: { body: { id, purpose, folder_name: formData.get("folder_name") as string } }
      });
      console.log({
        session: { user, token },
        req: { body: { id, purpose, folder_name: formData.get("folder_name") as string } }
      })
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      return Response.json({ success: true, message: "Berhasil mengupdate folder" });
    }
  } catch (e: any) {
    return Response.json({ success: false, message: e.message || "Terjadi kesalahan" });
  }
  return Response.json({ success: false, message: "Aksi tidak ditermukan" });
};

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  const url = new URL(request.url);
  const { folder_id } = Object.fromEntries(url.searchParams.entries());

  const detailFolder = await API.ORDER_UPLOAD.get_folder({
    session: { user, token },
    req: { query: { id: folder_id || "null", size: 1 } },
  });

  return Response.json({
    current_folder: detailFolder?.items?.[0] ?? null,
  });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DriveCustomerPage() {
  const { current_folder } = useLoaderData();
  const navigate = useNavigate();
  const query = useQueryParams();
  const [sortBy, setSortBy] = useState("created_on:desc");

  const { data: actionDataFetcher, loading: loadingActionFetcher, load: submitAction } = useFetcherData({
    endpoint: "", method: "POST", autoLoad: false,
  });

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
        size: 500,
        required_order: "true",
        // order_number: "is_not_null",
        ...(query.folder_id ? { folder_id: query.folder_id } : { folder_id: "null" }),
        ...(sortBy && { sort: sortBy }),
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
        size: 500,
        required_order: "true",
        // order_number: "is_not_null",
        ...(query.folder_id
          ? { folder_id: query.folder_id }
          : { folder_id: "null" }),
        ...(sortBy && { sort: sortBy }),
      })
      .build(),
    autoLoad: true,
  });

  useEffect(() => {
    if (actionDataFetcher?.success) {
      toast.success(actionDataFetcher.message);
      reloadRealFolders();
      reloadRealFiles();
    } else if (actionDataFetcher?.success === false) {
      toast.error(actionDataFetcher.message);
    }
  }, [actionDataFetcher]);

  const onDeleteItem = (item: any, type: "folder" | "file") => {
    Swal.fire({
      title: `Hapus ${type === "folder" ? "Folder" : "File"}?`, text: `Yakin ingin menghapus ${type === "folder" ? item.folder_name : item.file_name}?`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
      customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
    }).then((result) => { if (result.isConfirmed) submitAction({ intent: `delete_${type}`, id: item?.id }); });
  };

  const handleUpdateFolderPurpose = (folder: any, purposeKey: string, isChecked: boolean) => {
    submitAction({
      intent: "update_folder",
      id: folder.id,
      folder_name: folder.folder_name,
      purpose: isChecked ? purposeKey : "other",
    });
  };

  const handleOpenFolder = (folderId: string | number) => {
    navigate(`/app/drive/customer?folder_id=${folderId}`);
  };

  const [isDownloading, setIsDownloading] = React.useState(false);

  // const handleDownloadAll = async (e: React.MouseEvent) => {
  //   e.preventDefault();

  //   // 1. Validasi Awal
  //   if (!query?.folder_id) {
  //     toast.error("Tidak ada folder yang dipilih");
  //     return;
  //   }

  //   if (files.length === 0) {
  //     toast.error("Tidak ada file untuk diunduh");
  //     return;
  //   }

  //   setIsDownloading(true);
  //   const loadingToast = toast.loading("Menyiapkan dan mengompres file...");

  //   try {
  //     // 2. Eksekusi Request ke Server Action
  //     const res = await fetch(`/server/drive/${query?.folder_id}/download`, {
  //       method: "POST",
  //     });

  //     // 3. Penanganan Error dari Server
  //     if (!res.ok) {
  //       // Mencoba membaca pesan error dari body response (JSON)
  //       const errData = await res.json().catch(() => ({}));
  //       throw new Error(
  //         errData.message || errData.error || "Gagal mengunduh file dari server"
  //       );
  //     }

  //     // 4. Konversi Stream ke Blob
  //     const blob = await res.blob();
  //     if (blob.size === 0) throw new Error("File ZIP kosong");

  //     // 5. Ekstraksi Nama File dari Content-Disposition Header
  //     const contentDisposition = res.headers.get("Content-Disposition");
  //     let filename = `folder-${query?.folder_id}.zip`; // Nama default

  //     if (contentDisposition) {
  //       // Regex untuk mengambil nama file di dalam tanda kutip atau setelah 'filename='
  //       const filenameMatch = contentDisposition.match(
  //         /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
  //       );
  //       if (filenameMatch && filenameMatch[1]) {
  //         filename = filenameMatch[1].replace(/['"]/g, "");
  //       }
  //     }

  //     // 6. Proses Trigger Download di Browser
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = filename;

  //     // Append ke body (penting untuk kompabilitas Firefox)
  //     document.body.appendChild(a);
  //     a.click();

  //     // 7. Cleanup & Notifikasi Sukses
  //     toast.success("Download berhasil dimulai", { id: loadingToast });

  //     // Beri jeda sedikit sebelum menghapus URL untuk memastikan browser menangkap kliknya
  //     setTimeout(() => {
  //       window.URL.revokeObjectURL(url);
  //       document.body.removeChild(a);
  //     }, 150);
  //   } catch (err: any) {
  //     console.error("Download error:", err);
  //     toast.error(err.message || "Terjadi kesalahan saat mengunduh", {
  //       id: loadingToast,
  //     });
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // };
  const handleDownloadAll = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!query?.folder_id) return toast.error("Folder ID tidak ditemukan");

    // Cara paling simpel & efektif:
    // Browser akan menganggap ini sebagai instruksi download file
    const downloadUrl = `/server/drive/${query.folder_id}/download`;

    // Membuka di tab baru sebentar lalu otomatis ter-close setelah download trigger
    // Atau langsung ubah location (aman karena ini attachment)
    window.location.href = downloadUrl;

    toast.success("Download dimulai... Periksa bar progres browser Anda.");
  };

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex justify-between items-center px-4 gap-2">
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

        <div>
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
          >
            <option value="created_on:desc">Terbaru</option>
            <option value="created_on:asc">Terlama</option>
            <option value="folder_name:asc">Folder (A-Z)</option>
            <option value="folder_name:desc">Folder (Z-A)</option>
          </select>
        </div>
      </div>

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
            {folders.map((folder: any) => (
              <div
                key={folder.id}
                className="group relative p-4 rounded-xl border bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-3 transition-all"
              >
                {/* Clickable Area for Folder Navigation */}
                <div
                  className="flex flex-col items-center gap-3 cursor-pointer w-full"
                  onDoubleClick={() => handleOpenFolder(folder.id)}
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

                {!folder.isSystem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(folder, "folder");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all hover:bg-red-100 z-10"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {/* Purpose Checkboxes - Only show if current_folder exists (meaning we are inside a main order folder) */}
                {query.folder_id && (
                  <div
                    className="w-full mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1"
                    onClick={(e) => e.stopPropagation()} // Prevent double click navigation when clicking checkboxes
                  >
                    {[
                      { key: "id_card_front", label: "ID Depan" },
                      { key: "id_card_back", label: "ID Belakang" },
                      { key: "lanyard", label: "Lanyard" },
                      { key: "sablon_depan", label: "Sablon Depan" },
                      { key: "sablon_belakang", label: "Sablon Belakang" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 w-3 h-3"
                          checked={folder.purpose === key}
                          onChange={(e) => handleUpdateFolderPurpose(folder, key, e.target.checked)}
                        />
                        <span className="text-[10px] text-gray-600">{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Render Files */}
            {files.map((file: any) => (
              <div
                key={file.id}
                onDoubleClick={() => window.open(file.file_url, "_blank")}
                className="group relative p-4 rounded-xl border bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-3 cursor-pointer transition-all"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(file, "file");
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all hover:bg-red-100"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
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

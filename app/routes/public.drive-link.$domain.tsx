// app/routes/public.drive-link.$domain.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import type { DriveItem, Order } from "../types";
import {
  Folder,
  FileImage,
  FileText,
  MoreVertical,
  Trash2,
  Edit2,
  FolderPlus,
  Upload,
  Scissors,
  Clipboard,
  HardDrive,
  Download,
  Check,
  X,
  Eye,
  Lock,
  AlertCircle,
  Link2OffIcon,
  Share2,
  MapPin,
} from "lucide-react";
import {
  useLoaderData,
  useFetcher,
  useParams,
  type LoaderFunction,
  type ActionFunction,
  useNavigate,
  type ClientLoaderFunction,
  useActionData,
} from "react-router";
import { API } from "~/lib/api";
import { toast } from "sonner";
import { getOptionalUser } from "~/lib/session.server";
import NotaView from "~/components/NotaView";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import ModalSecond from "~/components/modal/ModalSecond";
import { Button } from "~/components/ui/button";
import { DriveBreadcrumb } from "~/components/breadcrumb/DriveBreadcrumb";
import Swal from "sweetalert2";
import { safeParseObject } from "~/lib/utils";
import { sendTelegramLog } from "~/lib/telegram-log";
import { getGoogleMapsLink } from "~/constants";

export const loader: LoaderFunction = async ({ request, params }) => {
  const domain = params?.domain;
  const authData = await getOptionalUser(request);

  if (!domain) {
    throw new Response("Domain tidak ditemukan", { status: 404 });
  }

  const url = new URL(request.url);
  const { folder_id } = Object.fromEntries(url.searchParams.entries());

  try {
    // First, check if order exists with this domain/order_number
    const orderRes = await API.ORDERS.get({
      session: {}, // Public access
      req: {
        query: {
          // order_number: domain,
          ...(!domain?.includes("ORD")
            ? {
                institution_domain: domain,
              }
            : {
                order_number: domain,
              }),

          size: 1,
        },
      },
    });

    const detailFolder = await API.ORDER_UPLOAD.get_folder({
      session: {},
      req: { query: { id: folder_id || "null", size: 1 } },
    });

    return Response.json(
      {
        session: authData?.user || null,
        domain,
        orderData: orderRes?.items?.[0] ?? null,
        current_folder: detailFolder?.items?.[0] ?? null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Loader error:", error);
    sendTelegramLog("PUBLIC_DRIVE_LINK_LOADER_ERROR", {
      domain,
      error: error,
    });
    // Return empty state on error
    return Response.json(
      {
        session: authData?.user || null,
        domain,
        orderData: null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const domain = params.domain;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  const { folder_name, parent_id, order_number, ...payload } =
    Object.fromEntries(formData.entries());

  if (!domain) {
    return Response.json({ success: false, message: "Domain tidak ditemukan" });
  }

  let resMessage = "";

  try {
    // Delete folders
    if (intent === "create_folder") {
      const result = await API.ORDER_UPLOAD.create_single_folder({
        session: {},
        req: {
          body: {
            ...(id && { id }),
            folder_name,
            parent_id,
            order_number,
          },
        },
      });

      if (!result.success) {
        return Response.json({
          success: false,
          message: result.message || "Gagal menambahkan Folder",
        });
      }

      resMessage = "Berhasil menambahkan folder";
    }
    if (intent === "create_file") {
      const result = await API.ORDER_UPLOAD.create_single_file({
        session: {},
        req: { body: payload },
      });

      if (!result.success) {
        return Response.json({
          success: false,
          message: result.message || "Gagal menambahkan File",
        });
      }

      resMessage = "Berhasil menambahkan file";
    }
    if (intent === "delete_folder") {
      const folderResult = await API.ORDER_UPLOAD.delete_folder({
        session: {},
        req: {
          body: { id },
        },
      });

      if (!folderResult.success) {
        return Response.json({
          success: false,
          message: folderResult.message || "Gagal menghapus folder",
        });
      }

      resMessage = "Berhasil menghapus folder";
    }

    // Delete files
    if (intent === "delete_file") {
      const fileResult = await API.ORDER_UPLOAD.delete_file({
        session: {},
        req: {
          body: { id },
        },
      });

      if (!fileResult.success) {
        return Response.json({
          success: false,
          message: fileResult.message || "Gagal menghapus file",
        });
      }

      resMessage = "Berhasil menghapus file";
    }

    if (intent === "update_review") {
      const id = formData.get("id") as string;
      const rating = Number(formData.get("rating"));
      const review = formData.get("review") as string;

      const res = await API.ORDERS.update({
        session: {},
        req: { body: { id, rating, review } },
      });

      if (!res.success) {
        return Response.json({
          success: false,
          message: res.message || "Gagal mengirim ulasan",
        });
      }

      resMessage = "Berhasil mengirim ulasan";
    }

    if (intent === "update_payment_proof") {
      const id = formData.get("id") as string;
      const proof = formData.get("proof") as string;
      const res = await API.ORDERS.update({
        session: {},
        req: { body: { id, payment_proof: proof } },
      });
      if (!res.success) {
        return Response.json({
          success: false,
          message: res.message || "Gagal memperbarui bukti pembayaran",
        });
      }
      resMessage = "Berhasil memperbarui bukti pembayaran";
    }

    return Response.json({
      success: true,
      message: resMessage,
    });
  } catch (e: any) {
    console.error("Error deleting items:", e);
    sendTelegramLog("PUBLIC_DRIVE_LINK_ACTION_ERROR", {
      domain,
      error: e,
    });
    return Response.json({
      success: false,
      message: e.message || "Terjadi kesalahan saat menghapus",
    });
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function PublicDriveLinkPage() {
  const { domain, orderData, current_folder, session } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const query = useQueryParams();
  const [modal, setModal] = useModal();

  // Use query.folder_id as source of truth for currentFolderId
  const currentFolderId = query.folder_id || orderData?.drive_folder_id || null;

  // routes/public.layout.tsx atau di page terkait
  useEffect(() => {
    if (typeof window !== "undefined") {
      const CURRENT_VERSION = "v0.0.1";
      const savedVersion = localStorage.getItem("app_public_version");

      if (savedVersion !== CURRENT_VERSION) {
        localStorage.setItem("app_public_version", CURRENT_VERSION);
        // Membersihkan cache storage jika Anda menggunakan Service Worker
        if ("caches" in window) {
          caches.keys().then((names) => {
            for (const name of names) caches.delete(name);
          });
        }
        window.location.reload();
      }
    }
  }, []);

  // Fetch real-time data using nexus
  const {
    data: realFolders,
    loading: isLoadingFolders,
    reload: reloadRealFolders,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDER_UPLOAD")
      .action("get_folder")
      .params({
        page: 0,
        size: 100,
        order_number: orderData?.order_number,
        ...(currentFolderId && { folder_id: currentFolderId }),
      })
      .build(),
    autoLoad: !!orderData?.order_number,
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
        order_number: orderData?.order_number,
        ...(currentFolderId
          ? { folder_id: currentFolderId }
          : { folder_id: "null" }),
      })
      .build(),
    autoLoad: !!orderData?.order_number,
  });

  // reloadRealFolders();
  // reloadRealFiles();

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);

  const {
    data: actionDataFetcher,
    loading: loadingActionFetcher,
    load: submitAction,
  } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  const handleUpdateReview = (rating: number, review: string) => {
    submitAction({
      intent: "update_review",
      id: orderData.id,
      rating: String(rating),
      review,
    });
  };

  const onUpdatePaymentProof = (id: string, proof: string) => {
    submitAction({
      intent: "update_payment_proof",
      id,
      proof,
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current items from real-time data
  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  const confirmCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    submitAction({
      intent: "create_folder",
      folder_name: modal?.data?.folder_name,
      order_number: orderData?.order_number,
      parent_id: current_folder?.id || query?.folder_id || null,
    });
  };

  const handleRenameSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    submitAction({
      intent: "create_folder",
      id: modal?.data?.id,
      folder_name: modal?.data?.folder_name,
    });
  };

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files.length > 0) {
  //     const file = e.target.files[0];
  //     const ext = file.name.split(".").pop()?.toLowerCase();

  //     let mime = "file";
  //     if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
  //       mime = "image";
  //     if (["pdf", "doc", "docx", "xls", "xlsx"].includes(ext || ""))
  //       mime = "doc";

  //     setLoadingUpload(true);

  //     try {
  //       const uploadRes = await API.ASSET.upload(file);

  //       const newFilePayload = {
  //         file_type: mime,
  //         file_url: uploadRes.url,
  //         file_name: uploadRes.original_name,
  //         folder_id: currentFolderId || orderData?.drive_folder_id || null,
  //         level: currentFolderId ? 2 : 1,
  //         order_number: orderData?.order_number, // Associate with order_number
  //       };

  //       const result = await API.ORDER_UPLOAD.create_single_file({
  //         session: {},
  //         req: { body: newFilePayload },
  //       });
  //       if (!result.success) {
  //         throw new Error(result.message || "Gagal menambahkan file");
  //       }
  //       // submitAction({
  //       //   intent: "create_file",
  //       //   ...newFilePayload,
  //       // });

  //       // Reload real-time data
  //       reloadRealFolders();
  //       reloadRealFiles();

  //       setLoadingUpload(false);
  //       toast.success("Upload File berhasil");
  //       e.target.value = "";
  //     } catch (err: any) {
  //       setLoadingUpload(false);
  //       toast.error(err.message || "Upload gagal");
  //       console.error(err);
  //     }
  //   }
  // };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setLoadingUpload(true);

    // Helper untuk menentukan tipe mime
    const getMimeType = (fileName: string) => {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
      if (["pdf", "doc", "docx", "xls", "xlsx", "zip", "rar"].includes(ext))
        return "doc";
      return "file";
    };

    try {
      // Gunakan Promise.all untuk upload paralel
      const uploadPromises = files.map(async (file) => {
        try {
          // 1. Upload ke Storage/Server
          const uploadRes = await API.ASSET.upload(file);

          // 2. Siapkan Payload untuk Database
          const newFilePayload = {
            file_type: getMimeType(file.name),
            file_url: uploadRes.url,
            file_name: uploadRes.original_name || file.name,
            folder_id: currentFolderId || orderData?.drive_folder_id || null,
            level: currentFolderId ? 2 : 1,
            order_number: orderData?.order_number,
          };

          // 3. Simpan record ke Database
          const result = await API.ORDER_UPLOAD.create_single_file({
            session: {},
            req: { body: newFilePayload },
          });

          if (!result.success) throw new Error(result.message);

          return { success: true, fileName: file.name };
        } catch (err) {
          sendTelegramLog("PUBLIC_DRIVE_LINK_UPLOAD_ERROR_USER", {
            domain,
            orderData,
            current_folder,
            query,
            error: err,
          });
          return { success: false, fileName: file.name, error: err };
        }
      });

      const results = await Promise.all(uploadPromises);

      // Hitung statistik hasil
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      // Notifikasi hasil akhir
      if (failed === 0) {
        toast.success(`${successful} File berhasil diunggah`);
      } else {
        sendTelegramLog("PUBLIC_DRIVE_LINK_UPLOAD_FAILED", {
          domain,
          orderData,
          current_folder,
          query,
          results,
        });
        toast.warning(`${successful} Berhasil, ${failed} Gagal diunggah`);
      }

      // Refresh data
      reloadRealFolders();
      reloadRealFiles();
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem saat upload");
      console.error(err);
      sendTelegramLog("PUBLIC_DRIVE_LINK_UPLOAD_ERROR_USER", {
        domain,
        orderData,
        current_folder,
        query,
        error: err,
      });
    } finally {
      setLoadingUpload(false);
      e.target.value = ""; // Reset input agar bisa pilih file yang sama lagi
    }
  };

  const handleDelete = async (item: any, type: "folder" | "file") => {
    Swal.fire({
      title: `Hapus ${type === "folder" ? "Folder" : "File"}?`,
      text: `Yakin ingin menghapus ${type === "folder" ? "Folder" : "File"} ${type === "folder" ? item.folder_name : item.file_name}?`,
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
        submitAction({ intent: `delete_${type}`, id: item?.id });
      }
    });
  };

  const handleOpenFolder = (folderId: string) => {
    const url = `/public/drive-link/${domain}?folder_id=${folderId}`;
    navigate(url);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  // const handleDownloadAll = async (e: React.MouseEvent) => {
  //   e.preventDefault();

  //   const targetFolderId = query.folder_id || orderData?.drive_folder_id;

  //   // 1. Validasi Awal
  //   if (!targetFolderId) {
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
  //     const res = await fetch(`/server/drive/${targetFolderId}/download`, {
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
  //     let filename = `folder-${targetFolderId}.zip`; // Nama default

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
    const targetFolderId = query.folder_id || orderData?.drive_folder_id;
    if (!targetFolderId) return toast.error("Folder ID tidak ditemukan");

    // Cara paling simpel & efektif:
    // Browser akan menganggap ini sebagai instruksi download file
    const downloadUrl = `/server/drive/${targetFolderId}/download`;

    // Membuka di tab baru sebentar lalu otomatis ter-close setelah download trigger
    // Atau langsung ubah location (aman karena ini attachment)
    window.location.href = downloadUrl;

    toast.success("Download dimulai... Periksa bar progres browser Anda.");
  };

  const isNotFound = useMemo(() => {
    return !orderData?.order_number && !current_folder ? true : false;
  }, [orderData, current_folder]);

  useEffect(() => {
    if (isNotFound) {
      sendTelegramLog("PUBLIC_DRIVE_LINK_NOT_FOUND", {
        domain,
        orderData,
        current_folder,
        query,
      });
    }
  }, [isNotFound]);

  useEffect(() => {
    if (actionDataFetcher?.success) {
      toast.success(actionDataFetcher.message || "Berhasil");
      reloadRealFolders();
      reloadRealFiles();
      setModal({ ...modal, open: false, type: "", data: null });
    } else if (actionDataFetcher?.success === false) {
      toast.error(actionDataFetcher.message || "Gagal");
    }
  }, [actionDataFetcher]);

  // Render normal drive interface if order found
  return isNotFound ? (
    <NotFoundPage domain={domain} session={session} />
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header orderData={orderData} domain={domain} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col h-[calc(100vh-200px)]">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            // accept="*/*"
            accept="*/*,application/pdf,application/msword"
            multiple
          />

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() =>
                  setModal({ ...modal, open: true, type: "create_folder" })
                }
                disabled={loadingActionFetcher}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all hover:shadow-md"
              >
                <FolderPlus size={16} />
                <span>
                  {loadingActionFetcher ? "Membuat..." : "Folder Baru"}
                </span>
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                disabled={loadingUpload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:shadow-md"
              >
                <Upload size={16} />
                <span>{loadingUpload ? "Mengunggah..." : "Upload File"}</span>
              </button>
              {/* {clipboard && (
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-200 animate-pulse shadow-sm"
                >
                  <Clipboard size={16} /> Paste
                </button>
              )} */}
              {files.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download
                    size={16}
                    className={isDownloading ? "animate-bounce" : ""}
                  />
                  <span>
                    {isDownloading
                      ? "Mengunduh..."
                      : `Download All (${files.length})`}
                  </span>
                </button>
              )}
              <a
                href={getGoogleMapsLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <MapPin size={14} className="text-red-500" /> Lokasi Pengambilan
              </a>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setModal({
                    ...modal,
                    open: true,
                    type: "view_nota",
                    data: orderData,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all hover:shadow-md"
              >
                <FileText size={16} />
                <span>Lihat Nota</span>
              </button>
              <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                {realFolders?.data?.total_items + realFiles?.data?.total_items}{" "}
                Items
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <DriveBreadcrumb
            domain={domain}
            currentFolderId={current_folder?.id || query?.folder_id}
            rootFolderId={orderData?.drive_folder_id}
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

          {/* Content Area */}
          <div
            className="flex-1 overflow-y-auto p-4"
            onClick={() => setSelectedItem(null)}
          >
            {folders.length === 0 && files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <Folder size={64} className="mb-4 opacity-20" />
                <p>Folder ini kosong</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Folders */}
                {folders.map((folder: any) => {
                  const isSystem = folder.isSystem;
                  return (
                    <div
                      key={folder.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(folder.id);
                      }}
                      onDoubleClick={() => handleOpenFolder(folder?.id)}
                      className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
                        selectedItem === folder.id
                          ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                          : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                      }`} //${clipboard?.id === folder.id ? "opacity-50" : ""}
                    >
                      <Folder
                        size={48}
                        className="text-yellow-400 fill-yellow-400"
                      />

                      {modal?.type === "rename_folder" &&
                      modal?.data?.id === folder.id ? (
                        <input
                          autoFocus
                          className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5"
                          value={modal?.data?.folder_name}
                          onChange={(e) =>
                            setModal({
                              ...modal,
                              data: {
                                ...modal?.data,
                                folder_name: e.target.value,
                              },
                            })
                          }
                          onBlur={handleRenameSave}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleRenameSave()
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-center w-full">
                          <div
                            className="text-xs font-medium truncate w-full text-gray-700"
                            title={folder.folder_name}
                          >
                            {folder.folder_name}
                          </div>
                        </div>
                      )}

                      {!isSystem && (
                        <div
                          className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${
                            selectedItem === folder.id
                              ? "opacity-100 visible"
                              : "opacity-0 invisible group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(folder);
                        }}
                        className="p-1.5 hover:bg-gray-100 text-blue-600 border-b"
                      >
                        <Share2 size={12} />
                      </button> */}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({
                                ...modal,
                                open: true,
                                type: "rename_folder",
                                data: folder,
                              });
                            }}
                            className="p-1.5 hover:bg-gray-100 text-gray-600"
                          >
                            <Edit2 size={12} />
                          </button>

                          {/* <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCut(folder.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 text-orange-600"
                          >
                            <Scissors size={12} />
                          </button> */}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(folder, "folder");
                            }}
                            className="p-1.5 hover:bg-gray-100 text-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Files */}
                {files.map((file: any) => (
                  <div
                    key={file.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(file.id);
                    }}
                    onDoubleClick={() => window.open(file.file_url, "_blank")}
                    className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      selectedItem === file.id
                        ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                        : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <FileText size={40} className="text-blue-500" />

                    {/* Preview Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // handleOpenFolder(file.file_url);
                          setModal({
                            ...modal,
                            open: true,
                            type: "zoom_image",
                            data: file,
                          });
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-blue-600 pointer-events-auto hover:scale-110 transition-transform"
                      >
                        <Eye size={20} />
                      </button>
                    </div>

                    <div className="text-center w-full">
                      <div
                        className="text-xs font-medium truncate w-full text-gray-700"
                        title={file.file_name}
                      >
                        {file.file_name}
                      </div>
                    </div>

                    <div
                      className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${
                        selectedItem === file.id
                          ? "opacity-100 visible"
                          : "opacity-0 invisible group-hover:visible group-hover:opacity-100"
                      }`}
                    >
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({
                            ...modal,
                            open: true,
                            type: "rename_file",
                            data: file,
                          });
                        }}
                        className="p-1.5 hover:bg-gray-100 text-gray-600"
                      >
                        <Edit2 size={12} />
                      </button> */}

                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCut(file.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 text-orange-600"
                      >
                        <Scissors size={12} />
                      </button> */}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file, "file");
                        }}
                        className="p-1.5 hover:bg-gray-100 text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox Modal */}
          {modal?.type === "zoom_image" && (
            <div
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setModal({ ...modal, type: "", open: false })}
            >
              <button
                onClick={() => setModal({ ...modal, type: "", open: false })}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
              >
                <X size={32} />
              </button>
              <img
                src={modal?.data?.file_url}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
              />
            </div>
          )}

          {/* Footer Hint */}
          <FooterHint />

          {/* Nota Modal */}
          {modal?.type === "view_nota" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1 border border-gray-200"
                  onClick={() => setModal({ ...modal, type: "", open: false })}
                >
                  <X size={16} />
                </button>
                <NotaView
                  order={modal?.data}
                  isEditable={true}
                  onReviewChange={handleUpdateReview}
                  onPaymentProofChange={(proof) =>
                    onUpdatePaymentProof(orderData.id, proof)
                  }
                />
              </div>
            </div>
          )}

          {/* New Folder Modal */}
          {modal?.type === "create_folder" && (
            <ModalSecond
              open={modal?.open}
              onClose={() => setModal({ ...modal, type: "", open: false })}
              size="md"
              title="Buat Folder Baru"
              icon={<FolderPlus size={20} className="text-blue-600" />}
            >
              <form onSubmit={confirmCreateFolder}>
                <input
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Nama Folder..."
                  value={modal?.data?.folder_name || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal?.data, folder_name: e.target.value },
                    })
                  }
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() =>
                      setModal({ ...modal, type: "", open: false })
                    }
                    className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loadingActionFetcher}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check size={16} />
                    {loadingActionFetcher ? "Membuat..." : "Buat"}
                  </Button>
                </div>
              </form>
            </ModalSecond>
          )}
        </div>
      </div>
    </div>
  );
}

const Header = ({ orderData, domain }: { orderData: any; domain: string }) => {
  return (
    <>
      {/* Public Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                {/* <HardDrive size={24} className="text-white" /> */}
                <img
                  src="/head-icon-kinau.png"
                  alt="Kinau"
                  className="w-8 opacity-80"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Drive File Cetak
                </h1>
                <p className="text-sm text-gray-500">
                  {+orderData?.is_kkn === 1
                    ? `${`${orderData?.kkn_type?.toLowerCase() === "ppm" ? "Kelompok" : "Desa"} ${(safeParseObject(orderData?.kkn_detail) as any)?.value}`} - ${orderData?.kkn_source?.split("_")?.join(" ")?.toUpperCase()} ${(safeParseObject(orderData?.kkn_detail) as any)?.year ?? ""} - PERIODE ${orderData?.kkn_period}`
                    : +orderData?.is_personal === 1
                      ? `${orderData?.pic_name} (Perorangan)`
                      : `${orderData?.institution_name || "Shared Drive"} - ${orderData?.order_number}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock size={16} />
              <span>Public Access</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
const NotFoundPage = ({
  domain,
  session,
}: {
  domain: string;
  session: any;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Link2OffIcon size={40} className="text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Link Tidak Ditemukan
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-2">
              Maaf, link drive yang Anda akses tidak dapat ditemukan atau sudah
              tidak aktif.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Kode akses:{" "}
              <span className="font-mono font-semibold text-gray-700">
                {domain}
              </span>
            </p>

            {/* Suggestions */}
            <div className="w-full bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Kemungkinan penyebab:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Link sudah kadaluarsa atau tidak aktif</li>
                    <li>• Kode akses salah atau tidak valid</li>
                    <li>• Link telah dihapus oleh pemilik</li>
                    <li>• Pesanan tidak ditemukan dalam sistem</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="w-full">
              <a
                href={!session ? "/" : "/app/overview"}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <HardDrive size={16} />
                Kembali ke Halaman Utama
              </a>
            </div>

            {/* Support Text */}
            <p className="text-xs text-gray-500 mt-6">
              Butuh bantuan? Hubungi administrator untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
const FooterHint = () => {
  return (
    <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-center bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="flex items-center justify-center gap-4">
        <span className="flex items-center gap-1">
          <Eye size={12} />
          Klik ganda untuk membuka folder
        </span>
        <span className="hidden sm:inline text-gray-300">|</span>
        <span className="hidden sm:inline">
          Akses publik melalui shared link
        </span>
      </div>
    </div>
  );
};

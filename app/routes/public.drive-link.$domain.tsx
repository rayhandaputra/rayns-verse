// app/routes/public.drive-link.$domain.tsx
import React, { useState, useEffect, useRef } from "react";
import type { DriveItem } from "../types";
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
} from "lucide-react";
import {
  useLoaderData,
  useFetcher,
  useParams,
  type LoaderFunction,
  type ActionFunction,
  useNavigate,
} from "react-router";
import { API } from "~/lib/api";
import { toast } from "sonner";
import { getOptionalUser } from "~/lib/session.server";
import NotaView from "~/components/NotaView";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  items: DriveItem[];
  domain: string;
  orderFound: boolean;
  orderData?: any;
  session?: any;
}

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request, params }) => {
  const domain = params.domain;
  const authData = await getOptionalUser(request);

  if (!domain) {
    throw new Response("Domain tidak ditemukan", { status: 404 });
  }

  try {
    // First, check if order exists with this domain/order_number
    const orderRes = await API.ORDERS.get({
      session: {}, // Public access
      req: {
        query: {
          // order_number: domain, // Filter by order_number matching domain
          institution_domain: domain, // Filter by order_number matching domain
          size: 1,
        },
      },
    });

    // Check if order exists
    if (!orderRes.items || orderRes.items.length === 0) {
      // Order not found, return empty state
      return Response.json({
        session: authData?.user || null,
        items: [],
        domain,
        orderFound: false,
        orderData: null,
      });
    }

    const order = orderRes.items[0];

    // Fetch folders and files filtered by order_number
    const foldersRes = await API.ORDER_UPLOAD.get_folder({
      session: {}, // Public access, no auth needed
      req: {
        query: {
          size: 1000,
          order_number: order?.order_number, // Filter by order_number
          folder_id: order?.drive_folder_id,
        },
      },
    });

    const filesRes = await API.ORDER_UPLOAD.get_file({
      session: {},
      req: {
        query: {
          size: 1000,
          order_number: order?.order_number, // Filter by order_number
          folder_id: order?.drive_folder_id,
        },
      },
    });

    // Map to DriveItem
    const items: DriveItem[] = [];

    if (foldersRes.items) {
      foldersRes.items.forEach((f: any) => {
        items.push({
          id: String(f.id),
          parentId: f.parent_id ? String(f.parent_id) : null,
          name: f.folder_name,
          type: "folder",
          createdAt: f.created_at || new Date().toISOString(),
        });
      });
    }

    if (filesRes.items) {
      filesRes.items.forEach((f: any) => {
        items.push({
          id: String(f.id),
          parentId: f.folder_id ? String(f.folder_id) : null,
          name: f.file_name,
          type: "file",
          mimeType: f.file_type || "doc",
          size: "0 MB",
          createdAt: f.created_at || new Date().toISOString(),
        });
      });
    }

    return Response.json({
      session: authData?.user || null,
      items,
      domain,
      orderFound: true,
      orderData: order,
    });
  } catch (error: any) {
    console.error("Loader error:", error);
    // Return empty state on error
    return Response.json({
      items: [],
      domain,
      orderFound: false,
      orderData: null,
    });
  }
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request, params }) => {
  const domain = params.domain;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (!domain) {
    return Response.json({ success: false, message: "Domain tidak ditemukan" });
  }

  if (intent === "sync_state") {
    const stateStr = formData.get("state") as string;
    const orderNumber = formData.get("order_number") as string;
    const state = stateStr ? JSON.parse(stateStr) : [];

    const foldersToSync = state
      .filter((i: any) => i.type === "folder")
      .map((f: any) => ({
        id: f.id && f.id.startsWith("KEY") ? undefined : f.id,
        folder_name: f.name,
        parent_id: f.parentId || null,
        order_number: orderNumber, // Associate with order_number
      }));

    try {
      const result = await API.ORDER_UPLOAD.create({
        session: {},
        req: {
          body: { folders: foldersToSync },
        },
      });

      if (!result.success) {
        return Response.json({
          success: false,
          message: result.message || "Sync gagal",
        });
      }

      return Response.json({ success: true });
    } catch (e: any) {
      console.error("Error syncing state:", e);
      return Response.json({
        success: false,
        message: e.message || "Terjadi kesalahan",
      });
    }
  }

  if (intent === "delete_items") {
    const itemsStr = formData.get("items") as string;
    const items = itemsStr ? JSON.parse(itemsStr) : [];

    if (items.length === 0) {
      return Response.json({
        success: false,
        message: "Tidak ada item yang akan dihapus",
      });
    }

    try {
      // Separate folders and files
      const folderIds = items
        .filter(
          (item: any) => item.type === "folder" && !item.id.startsWith("KEY")
        )
        .map((item: any) => item.id);

      const fileIds = items
        .filter(
          (item: any) => item.type === "file" && !item.id.startsWith("KEY")
        )
        .map((item: any) => item.id);

      // Delete folders
      if (folderIds.length > 0) {
        const folderResult = await API.ORDER_UPLOAD.bulk_delete_folders({
          session: {},
          req: {
            body: { ids: folderIds },
          },
        });

        if (!folderResult.success) {
          return Response.json({
            success: false,
            message: folderResult.message || "Gagal menghapus folder",
          });
        }
      }

      // Delete files
      if (fileIds.length > 0) {
        const fileResult = await API.ORDER_UPLOAD.bulk_delete_files({
          session: {},
          req: {
            body: { ids: fileIds },
          },
        });

        if (!fileResult.success) {
          return Response.json({
            success: false,
            message: fileResult.message || "Gagal menghapus file",
          });
        }
      }

      return Response.json({
        success: true,
        message: `Berhasil menghapus ${items.length} item`,
      });
    } catch (e: any) {
      console.error("Error deleting items:", e);
      return Response.json({
        success: false,
        message: e.message || "Terjadi kesalahan saat menghapus",
      });
    }
  }

  if (intent === "update_review") {
    const id = formData.get("id") as string;
    const rating = Number(formData.get("rating"));
    const review = formData.get("review") as string;

    try {
      const res = await API.ORDERS.update({
        session: {},
        req: { body: { id, rating, review } },
      });

      if (res.success) {
        return Response.json({
          success: true,
          message: "Ulasan berhasil dikirim. Terima kasih!",
        });
      } else {
        return Response.json({
          success: false,
          message: res.message || "Gagal mengirim ulasan",
        });
      }
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Terjadi kesalahan",
      });
    }
  }

  if (intent === "update_payment_proof") {
    const id = formData.get("id") as string;
    const proof = formData.get("proof") as string;

    console.log({ id, payment_proof: proof });
    // Only update if valid
    const res = await API.ORDERS.update({
      session: {},
      req: { body: { id, payment_proof: proof } },
    });
    return Response.json({
      success: res.success,
      message: res.success
        ? "Bukti pembayaran diperbarui"
        : "Gagal memperbarui bukti pembayaran",
    });
  }

  return Response.json({ success: true });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function PublicDriveLinkPage() {
  const {
    items: initialItems,
    domain,
    orderFound,
    orderData,
    session,
  } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const params = useParams();
  const navigate = useNavigate();
  const query = useQueryParams();

  // Use query.folder_id as source of truth for currentFolderId
  const currentFolderId = query.folder_id || orderData?.drive_folder_id || null;

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

  const [items, setItems] = useState<DriveItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Handle fetcher responses with auto reload
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success === false) {
        toast.error(fetcher.data.message || "Operasi gagal");
      } else if (fetcher.data.success === true) {
        if (fetcher.data.message) {
          toast.success(fetcher.data.message);
        }
        // Reload data after successful operation
        reloadRealFolders();
        reloadRealFiles();
        fetcher.load(window.location.pathname + window.location.search);
      }
    }
  }, [fetcher.data, fetcher.state]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{
    id: string;
    op: "cut" | "copy";
  } | null>(null);

  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [showNota, setShowNota] = useState(false);

  const handleUpdateReview = (rating: number, review: string) => {
    if (!orderData) return;
    fetcher.submit(
      {
        intent: "update_review",
        id: orderData.id,
        rating: String(rating),
        review,
      },
      { method: "post" }
    );
  };

  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

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
  const currentItems = [...folders, ...files];

  // Sort: Folders first, then new to old
  currentItems.sort((a, b) => {
    const aType = a.folder_name ? "folder" : "file";
    const bType = b.folder_name ? "folder" : "file";
    if (aType === bType) {
      const aDate = new Date(a.created_at || a.createdAt).getTime();
      const bDate = new Date(b.created_at || b.createdAt).getTime();
      return bDate - aDate;
    }
    return aType === "folder" ? -1 : 1;
  });

  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = currentFolderId;

    while (curr) {
      const folder = items.find((i) => i.id === curr);
      if (folder) {
        crumbs.unshift({ id: folder.id, name: folder.name });
        curr = folder.parentId;
      } else {
        curr = null;
      }
    }
    return crumbs;
  };

  const syncState = (newItems: DriveItem[]) => {
    setItems(newItems);

    // Filter and map items for sync
    const itemsToSync = newItems.map((item) => ({
      id: item.id,
      name: item.name,
      parentId: item.parentId,
      type: item.type,
      mimeType: item.mimeType,
      createdAt: item.createdAt,
    }));

    fetcher.submit(
      {
        intent: "sync_state",
        state: JSON.stringify(itemsToSync),
        order_number: orderData?.order_number || domain,
      },
      { method: "post" }
    );
  };

  const handleOpenNewFolderModal = () => {
    setNewFolderName("Folder Baru");
    setShowNewFolderModal(true);
  };

  const confirmCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: DriveItem = {
      id: `KEY${Date.now()}`,
      parentId: currentFolderId,
      name: newFolderName.trim(),
      type: "folder",
      createdAt: new Date().toISOString(),
    };

    syncState([...items, newFolder]);
    setShowNewFolderModal(false);
    setNewFolderName("");
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();

      let mime = "file";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
        mime = "image";
      if (["pdf", "doc", "docx", "xls", "xlsx"].includes(ext || ""))
        mime = "doc";

      try {
        const uploadRes = await API.ASSET.upload(file);
        console.log(uploadRes);

        const newFilePayload = {
          file_type: mime,
          file_url: uploadRes.url,
          file_name: uploadRes.filename,
          folder_id: currentFolderId || orderData?.drive_folder_id || null,
          level: currentFolderId ? 2 : 1,
          order_number: orderData?.order_number, // Associate with order_number
        };

        const result = await API.ORDER_UPLOAD.create_single_file({
          session: {},
          req: { body: newFilePayload },
        });

        if (!result.success) {
          throw new Error(result.message || "Upload gagal");
        }

        // Reload real-time data
        reloadRealFolders();
        reloadRealFiles();

        toast.success("Upload File berhasil");
        e.target.value = "";
      } catch (err: any) {
        toast.error(err.message || "Upload gagal");
        console.error(err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah anda yakin ingin menghapus item ini?")) return;

    // Get all descendants (for folders)
    const getDescendants = (parentId: string): DriveItem[] => {
      const children = items.filter((i) => i.parentId === parentId);
      let descendants: DriveItem[] = [...children];
      children.forEach((c) => {
        if (c.type === "folder") {
          descendants = [...descendants, ...getDescendants(c.id)];
        }
      });
      return descendants;
    };

    // Find the item to delete
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    // Get all items to delete (item + descendants)
    const itemsToDelete = [itemToDelete];
    if (itemToDelete.type === "folder") {
      itemsToDelete.push(...getDescendants(id));
    }

    // If all items are temporary (have KEY prefix), just remove from state
    const allTemporary = itemsToDelete.every((item) =>
      item.id.startsWith("KEY")
    );

    if (allTemporary) {
      // Just remove from local state
      const idsToDelete = new Set(itemsToDelete.map((i) => i.id));
      const newItems = items.filter((i) => !idsToDelete.has(i.id));
      setItems(newItems);
      setSelectedItem(null);
      toast.success("Item berhasil dihapus");
      return;
    }

    // Otherwise, call API to delete from database
    try {
      const itemsPayload = itemsToDelete.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      fetcher.submit(
        {
          intent: "delete_items",
          items: JSON.stringify(itemsPayload),
        },
        { method: "post" }
      );

      // Optimistically remove from UI
      const idsToDelete = new Set(itemsToDelete.map((i) => i.id));
      const newItems = items.filter((i) => !idsToDelete.has(i.id));
      setItems(newItems);
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus item");
      console.error(err);
    }
  };

  const handleRenameStart = (item: DriveItem) => {
    setIsRenaming(item.id);
    setRenameValue(item.name);
  };

  const handleRenameSave = () => {
    if (isRenaming && renameValue.trim()) {
      syncState(
        items.map((i) =>
          i.id === isRenaming ? { ...i, name: renameValue } : i
        )
      );
    }
    setIsRenaming(null);
  };

  const handleCut = (id: string) => {
    setClipboard({ id, op: "cut" });
    setSelectedItem(null);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const item = items.find((i) => i.id === clipboard.id);
    if (!item) {
      setClipboard(null);
      return;
    }

    if (item.type === "folder") {
      let curr = currentFolderId;
      let invalid = false;
      while (curr) {
        if (curr === item.id) invalid = true;
        const parent = items.find((i) => i.id === curr)?.parentId;
        curr = parent || null;
      }
      if (invalid) {
        toast.error("Tidak bisa memindahkan folder ke dalam dirinya sendiri.");
        return;
      }
    }

    if (clipboard.op === "cut") {
      syncState(
        items.map((i) =>
          i.id === clipboard.id ? { ...i, parentId: currentFolderId } : i
        )
      );
    }
    setClipboard(null);
  };

  const handleDownload = (item: DriveItem) => {
    // Implement download logic
    toast.info("Download akan segera dimulai...");
  };

  const handleOpenFolder = (folderId: string | number) => {
    const url = `/public/drive-link/${domain}?folder_id=${folderId}`;
    navigate(url);
  };

  const renderIcon = (item: any) => {
    const isFolder = item.folder_name !== undefined;
    if (isFolder)
      return <Folder size={48} className="text-yellow-400 fill-yellow-400" />;
    const mimeType = item.file_type || item.mimeType;
    if (mimeType === "image")
      return <FileImage size={40} className="text-purple-500" />;
    return <FileText size={40} className="text-blue-500" />;
  };

  // Render "Link Not Found" page if order not found
  if (!orderFound) {
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
                Maaf, link drive yang Anda akses tidak dapat ditemukan atau
                sudah tidak aktif.
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
                Butuh bantuan? Hubungi administrator untuk informasi lebih
                lanjut.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render normal drive interface if order found
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Nota Modal */}
      {showNota && orderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1 border border-gray-200"
              onClick={() => setShowNota(false)}
            >
              <X size={16} />
            </button>
            <NotaView
              order={orderData}
              isEditable={true}
              onReviewChange={handleUpdateReview}
              onPaymentProofChange={(proof) =>
                onUpdatePaymentProof(orderData.id, proof)
              }
            />
          </div>
        </div>
      )}

      {/* Public Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <HardDrive size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Drive Management
                </h1>
                <p className="text-sm text-gray-500">
                  {orderData?.institution_name || "Shared Drive"} - {domain}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col h-[calc(100vh-200px)]">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleOpenNewFolderModal}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all hover:shadow-md"
              >
                <FolderPlus size={16} />
                <span>Folder Baru</span>
              </button>
              <button
                onClick={() => setShowNota(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all hover:shadow-md"
              >
                <FileText size={16} />
                <span>Lihat Nota</span>
              </button>
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:shadow-md"
              >
                <Upload size={16} />
                <span>Upload File</span>
              </button>
              {clipboard && (
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-200 animate-pulse shadow-sm"
                >
                  <Clipboard size={16} /> Paste
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                {currentItems.length} Items
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600 overflow-x-auto bg-gray-50/50">
            <button
              onClick={() => navigate(`/public/drive-link/${domain}`)}
              className={`flex items-center hover:bg-white px-3 py-1.5 rounded-lg transition-colors ${
                !currentFolderId ||
                currentFolderId === orderData?.drive_folder_id
                  ? "font-bold text-blue-600 bg-blue-50"
                  : "hover:text-blue-600"
              }`}
            >
              <HardDrive size={14} className="mr-1.5" /> Root
            </button>
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <span className="text-gray-300">/</span>
                <button
                  onClick={() => handleOpenFolder(crumb.id)}
                  className={`hover:bg-white px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    idx === getBreadcrumbs().length - 1
                      ? "font-bold text-blue-600 bg-blue-50"
                      : "hover:text-blue-600"
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Content Area */}
          <div
            className="flex-1 overflow-y-auto p-6"
            onClick={() => setSelectedItem(null)}
          >
            {currentItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Folder size={80} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Folder ini kosong</p>
                <p className="text-sm mt-2">
                  Upload file atau buat folder baru untuk memulai
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {currentItems.map((item) => {
                  const isFolder = item.folder_name !== undefined;
                  const itemName = isFolder ? item.folder_name : item.file_name;
                  const itemId = String(item.id);

                  return (
                    <div
                      key={itemId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(itemId);
                      }}
                      onDoubleClick={() => {
                        if (isFolder) {
                          handleOpenFolder(itemId);
                        } else if (item.file_url) {
                          window.open(item.file_url, "_blank");
                        }
                      }}
                      className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
                        selectedItem === itemId
                          ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400 shadow-lg"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                      } ${clipboard?.id === itemId ? "opacity-50" : ""}`}
                    >
                      {renderIcon(item)}

                      {isRenaming === itemId ? (
                        <input
                          autoFocus
                          className="w-full text-center text-xs border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={handleRenameSave}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleRenameSave()
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-center w-full">
                          <div
                            className="text-xs font-medium text-gray-700 truncate w-full px-1"
                            title={itemName}
                          >
                            {itemName}
                          </div>
                          {!isFolder && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              {item.size || "0 MB"}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Context Menu */}
                      <div
                        className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${
                          selectedItem === itemId
                            ? "opacity-100 visible"
                            : "opacity-0 invisible group-hover:visible group-hover:opacity-100"
                        }`}
                      >
                        {!isFolder && item.file_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.file_url, "_blank");
                            }}
                            title="Download"
                            className="p-1.5 hover:bg-gray-100 text-green-600 border-b border-gray-100"
                          >
                            <Download size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameStart({
                              id: itemId,
                              name: itemName,
                              type: isFolder ? "folder" : "file",
                            } as any);
                          }}
                          title="Ganti Nama"
                          className="p-1.5 hover:bg-gray-100 text-gray-600 border-b border-gray-100"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCut(itemId);
                          }}
                          title="Pindahkan"
                          className="p-1.5 hover:bg-gray-100 text-orange-600 border-b border-gray-100"
                        >
                          <Scissors size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(itemId);
                          }}
                          title="Hapus"
                          className="p-1.5 hover:bg-gray-100 text-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Hint */}
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

          {/* New Folder Modal */}
          {showNewFolderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FolderPlus size={20} className="text-blue-600" />
                  Buat Folder Baru
                </h3>
                <form onSubmit={confirmCreateFolder}>
                  <input
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Nama Folder..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewFolderModal(false)}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Check size={16} />
                      Buat
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

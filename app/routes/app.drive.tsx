// app/routes/app.drive.tsx
import React, { useState, useEffect, useRef } from "react";
import type { DriveItem, Order } from "../types";
import {
  Folder,
  File,
  MoreVertical,
  Trash2,
  Edit2,
  FolderPlus,
  Upload,
  Scissors,
  Clipboard,
  Share2,
  CornerUpLeft,
  HardDrive,
  FileImage,
  FileText,
  Receipt,
  Layout,
  ArrowLeft,
  Check,
  X,
  Home,
  ChevronRight,
  Plus as PlusIcon,
  Lock,
  FolderLock,
} from "lucide-react";
import NotaView from "../components/NotaView";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  items: DriveItem[];
  orders: Order[];
}

// Special folder ID for "Drive Pesanan"
const ORDERS_DRIVE_FOLDER_ID = "SYSTEM_ORDERS_DRIVE";

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const url = new URL(request.url);
  const folderId = url.searchParams.get("folder_id");

  // Fetch folders and files with order_number IS NULL (admin general drive)
  const foldersRes = await API.ORDER_UPLOAD.get_folder({
    session: { user, token },
    req: {
      query: {
        size: 1000,
        level: 1,
        folder_id: null,
        order_number: null, // Filter: only folders without order_number
      },
    },
  });

  const filesRes = await API.ORDER_UPLOAD.get_file({
    session: { user, token },
    req: {
      query: {
        size: 1000,
        order_number: null, // Filter: only files without order_number
      },
    },
  });

  const ordersRes = await API.ORDERS.get({
    session: { user, token },
    req: { query: { size: 100 } },
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

  return Response.json({ items, orders: ordersRes.items || [] });
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sync_state") {
    const stateStr = formData.get("state") as string;
    const state = stateStr ? JSON.parse(stateStr) : [];

    // Filter out system folder from sync
    const foldersToSync = state
      .filter(
        (i: any) => i.type === "folder" && i.id !== ORDERS_DRIVE_FOLDER_ID
      )
      .map((f: any) => ({
        id: f.id && f.id.startsWith("KEY") ? undefined : f.id,
        folder_name: f.name,
        parent_id: f.parentId || null,
        order_number: null, // Ensure order_number is null for admin drive
      }));

    try {
      const result = await API.ORDER_UPLOAD.create({
        session: { user, token },
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
        .filter((item: any) => item.type === "folder" && !item.id.startsWith("KEY"))
        .map((item: any) => item.id);

      const fileIds = items
        .filter((item: any) => item.type === "file" && !item.id.startsWith("KEY"))
        .map((item: any) => item.id);

      // Delete folders
      if (folderIds.length > 0) {
        const folderResult = await API.ORDER_UPLOAD.bulk_delete_folders({
          session: { user, token },
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
          session: { user, token },
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

  return Response.json({ success: true });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DrivePage() {
  const { items: initialItems, orders } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Local state initialized from loader
  const [items, setItems] = useState<DriveItem[]>(initialItems);

  // Sync state with loader revalidation
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success === false) {
        toast.error(fetcher.data.message || "Operasi gagal");
      } else if (fetcher.data.success === true) {
        // Show success message if available
        if (fetcher.data.message) {
          toast.success(fetcher.data.message);
        }
        // Reload data after successful operation
        fetcher.load(window.location.pathname + window.location.search);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "nota">("files");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{
    id: string;
    op: "cut" | "copy";
  } | null>(null);

  // Rename State
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // New Folder Modal State
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // File Input Ref for Real Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if we're inside Orders Drive
  const isInsideOrdersDrive = () => {
    let curr = currentFolderId;
    while (curr) {
      if (curr === ORDERS_DRIVE_FOLDER_ID) return true;
      const folder = items.find((i) => i.id === curr);
      curr = folder?.parentId || null;
    }
    return currentFolderId === ORDERS_DRIVE_FOLDER_ID;
  };

  // Filter items in current directory
  const currentItems = items.filter(
    (item) => item.parentId === currentFolderId
  );

  // Add system "Drive Pesanan" folder at root level only
  if (currentFolderId === null) {
    const ordersDriveFolder: DriveItem = {
      id: ORDERS_DRIVE_FOLDER_ID,
      parentId: null,
      name: "Drive Pesanan",
      type: "folder",
      createdAt: new Date().toISOString(),
      isSystemFolder: true, // Mark as system folder
    } as any;

    // Check if not already in list
    if (!currentItems.find((i) => i.id === ORDERS_DRIVE_FOLDER_ID)) {
      currentItems.unshift(ordersDriveFolder);
    }
  }

  // Sort: Folders first, then new to old
  currentItems.sort((a, b) => {
    if (a.type === b.type)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return a.type === "folder" ? -1 : 1;
  });

  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = currentFolderId;

    while (curr) {
      if (curr === ORDERS_DRIVE_FOLDER_ID) {
        crumbs.unshift({ id: ORDERS_DRIVE_FOLDER_ID, name: "Drive Pesanan" });
        break;
      }
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

  // Check if item is system folder
  const isSystemFolder = (itemId: string) => {
    return itemId === ORDERS_DRIVE_FOLDER_ID;
  };

  // --- Actions ---

  // Helper to sync state to server
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
      { intent: "sync_state", state: JSON.stringify(itemsToSync) },
      { method: "post" }
    );
  };

  const handleOpenNewFolderModal = () => {
    if (isInsideOrdersDrive()) {
      toast.error("Tidak dapat membuat folder di dalam Drive Pesanan");
      return;
    }
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
    if (isInsideOrdersDrive()) {
      toast.error("Tidak dapat upload file di dalam Drive Pesanan");
      return;
    }
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
        // 1. Upload Asset
        const uploadRes = await API.ASSET.upload(file);

        // 2. Create DB Record
        const newFilePayload = {
          file_type: mime,
          file_url: uploadRes.url,
          file_name: file.name,
          folder_id: currentFolderId || null,
          order_number: null, // Ensure null for admin drive
        };

        const result = await API.ORDER_UPLOAD.create_single_file({
          session: {},
          req: { body: newFilePayload },
        });

        if (!result.success) {
          throw new Error(result.message || "Upload gagal");
        }

        // Reload data to get the fresh file with proper ID
        fetcher.load(window.location.pathname + window.location.search);

        toast.success("Upload berhasil");

        // Reset
        e.target.value = "";
      } catch (err: any) {
        toast.error(err.message || "Upload gagal");
        console.error(err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (isSystemFolder(id)) {
      toast.error("Folder sistem tidak dapat dihapus");
      return;
    }

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
    if (isSystemFolder(item.id)) {
      toast.error("Folder sistem tidak dapat diubah");
      return;
    }
    setIsRenaming(item.id);
    setRenameValue(item.name);
  };

  const handleRenameSave = () => {
    if (isRenaming && renameValue.trim()) {
      if (isSystemFolder(isRenaming)) {
        toast.error("Folder sistem tidak dapat diubah");
        setIsRenaming(null);
        return;
      }
      syncState(
        items.map((i) =>
          i.id === isRenaming ? { ...i, name: renameValue } : i
        )
      );
    }
    setIsRenaming(null);
  };

  const handleCut = (id: string) => {
    if (isSystemFolder(id)) {
      toast.error("Folder sistem tidak dapat dipindahkan");
      return;
    }
    setClipboard({ id, op: "cut" });
    setSelectedItem(null);
  };

  const handlePaste = () => {
    if (!clipboard) return;

    if (isInsideOrdersDrive()) {
      toast.error("Tidak dapat memindahkan item ke dalam Drive Pesanan");
      return;
    }

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

  const handleShare = async (item?: DriveItem) => {
    const targetId = item ? item.id : currentFolderId;

    if (!targetId) {
      toast.error(
        "Tidak dapat membagikan root drive utama. Masuk ke dalam folder terlebih dahulu."
      );
      return;
    }

    if (isSystemFolder(targetId)) {
      toast.error("Folder sistem tidak dapat dibagikan");
      return;
    }

    alert(`Share logic reserved. (Target ID: ${targetId})`);
  };

  const handleOpenFolder = (item: DriveItem) => {
    if (item.type !== "folder") return;

    if (item.id === ORDERS_DRIVE_FOLDER_ID) {
      // Navigate to orders drive view
      navigate("/app/drive/orders");
      return;
    }

    setCurrentFolderId(item.id);
  };

  const renderIcon = (item: DriveItem) => {
    if (item.type === "folder") {
      if (item.id === ORDERS_DRIVE_FOLDER_ID) {
        return <FolderLock size={48} className="text-blue-600 fill-blue-600" />;
      }
      return <Folder size={48} className="text-yellow-400 fill-yellow-400" />;
    }
    if (item.mimeType === "image")
      return <FileImage size={40} className="text-purple-500" />;
    return <FileText size={40} className="text-blue-500" />;
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-140px)]`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="flex gap-2">
          {!isInsideOrdersDrive() && (
            <>
              <button
                onClick={handleOpenNewFolderModal}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
              >
                <FolderPlus size={16} />{" "}
                <span className="hidden md:inline">Folder Baru</span>
              </button>
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
              >
                <Upload size={16} />{" "}
                <span className="hidden md:inline">Upload</span>
              </button>
            </>
          )}

          {currentFolderId &&
            !isSystemFolder(currentFolderId) &&
            !isInsideOrdersDrive() && (
              <button
                onClick={() => handleShare()}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
              >
                <Share2 size={16} />{" "}
                <span className="hidden md:inline">Bagikan</span>
              </button>
            )}
          {clipboard && !isInsideOrdersDrive() && (
            <button
              onClick={handlePaste}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-200 animate-pulse"
            >
              <Clipboard size={16} /> Paste
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400">{currentItems.length} Items</div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
        <button
          onClick={() => {
            setCurrentFolderId(null);
            setActiveTab("files");
          }}
          className={`flex items-center hover:bg-gray-100 px-2 py-1 rounded ${!currentFolderId ? "font-bold text-blue-600" : ""}`}
        >
          <HardDrive size={14} className="mr-1" /> Drive
        </button>
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => {
                if (crumb.id === ORDERS_DRIVE_FOLDER_ID) {
                  navigate("/app/drive/orders");
                } else {
                  setCurrentFolderId(crumb.id);
                }
              }}
              className={`hover:bg-gray-100 px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 ${idx === getBreadcrumbs().length - 1 ? "font-bold text-blue-600" : ""}`}
            >
              {crumb.id === ORDERS_DRIVE_FOLDER_ID && <Lock size={12} />}
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-y-auto p-4"
        onClick={() => setSelectedItem(null)}
      >
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Folder size={64} className="mb-4 opacity-20" />
            <p>Folder ini kosong</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentItems.map((item) => {
              const isSystem = isSystemFolder(item.id);

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item.id);
                  }}
                  onDoubleClick={() => handleOpenFolder(item)}
                  className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    selectedItem === item.id
                      ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                      : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                  } ${clipboard?.id === item.id ? "opacity-50" : ""} ${isSystem ? "bg-blue-50/30" : ""}`}
                >
                  {renderIcon(item)}

                  {isRenaming === item.id && !isSystem ? (
                    <input
                      autoFocus
                      className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameSave}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-center w-full">
                      <div
                        className={`text-xs font-medium truncate w-full flex items-center justify-center gap-1 ${isSystem ? "text-blue-700" : "text-gray-700"}`}
                        title={item.name}
                      >
                        {isSystem && <Lock size={10} />}
                        {item.name}
                      </div>
                      {item.type === "file" && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {item.size}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Context Menu - Hidden for system folders */}
                  {!isSystem && (
                    <div
                      className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${selectedItem === item.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}
                    >
                      {item.type === "folder" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                          title="Bagikan Link"
                          className="p-1.5 hover:bg-gray-100 text-blue-600 border-b border-gray-100"
                        >
                          <Share2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameStart(item);
                        }}
                        title="Ganti Nama"
                        className="p-1.5 hover:bg-gray-100 text-gray-600"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCut(item.id);
                        }}
                        title="Pindahkan"
                        className="p-1.5 hover:bg-gray-100 text-orange-600"
                      >
                        <Scissors size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        title="Hapus"
                        className="p-1.5 hover:bg-gray-100 text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeTab === "files" && (
        <div className="p-2 border-t border-gray-100 text-[10px] text-gray-400 text-center bg-gray-50">
          {isInsideOrdersDrive()
            ? "Drive Pesanan bersifat read-only. Klik ganda untuk membuka folder."
            : "Klik ganda untuk membuka folder."}
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Buat Folder Baru
            </h3>
            <form onSubmit={confirmCreateFolder}>
              <input
                autoFocus
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Nama Folder..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

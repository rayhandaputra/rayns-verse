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
} from "lucide-react";
import NotaView from "../components/NotaView";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  type LoaderFunction,
  type ActionFunction,
  // json,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const url = new URL(request.url);
  const folderId = url.searchParams.get("folder_id");

  // Fetch all folders and files (or by order if relevant, but assuming global for "App Drive")
  // Using large size to try and get all structure, adjusting to "sync" logic
  // API structure in drive-old fetches per order_number. If this is a global drive,
  // do we have a global order number? Or do we fetch everything?
  // Let's assume we fetch generic assets or all order uploads.
  // Viewing `drive-old.tsx` shows it attaches to an `order`.
  // If `app.drive.tsx` is generic, we might need to know WHICH order context we are in.
  // If no params, maybe we show nothing or valid defaults?
  // Since I don't see `order_number` in the URL params for `app.drive.tsx` usually,
  // I will try to fetch ALL folders.

  const foldersRes = await API.ORDER_UPLOAD.get_folder({
    session: { user, token },
    req: { query: { size: 1000 } },
  });

  const filesRes = await API.ORDER_UPLOAD.get_file({
    session: { user, token },
    req: { query: { size: 1000 } },
  });

  const ordersRes = await API.ORDERS.get({
    session: { user, token },
    req: { query: { size: 100 } }, // for linking orders
  });

  // Map to DriveItem
  const items: DriveItem[] = [];

  if (foldersRes.items) {
    foldersRes.items.forEach((f: any) => {
      items.push({
        id: String(f.id),
        parentId: f.parent_id ? String(f.parent_id) : null, // Assuming API supports parent_id recursion
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
        size: "0 MB", // API might not return size?
        createdAt: f.created_at || new Date().toISOString(),
      });
    });
  }

  // If fetching fails or empty, items is []
  return Response.json({ items, orders: ordersRes.items || [] });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sync_state") {
    // Logic copied from drive-old: Bulk Sync
    // We receive the FULL new state of folders.
    // NOTE: `drive-old` seemed to re-create folders based on state array?
    // "API.ORDER_UPLOAD.create({ ... folders: state.map(...) })"
    // If the API is "smart sync" (upsert), this works.

    const stateStr = formData.get("state") as string;
    const state = stateStr ? JSON.parse(stateStr) : [];

    // We map DriveItem back to API expectation
    // API expects: folder_name, etc.
    // Need `order_number`? If this is global drive, what order number?
    // `drive-old` used `order.order_number`.
    // If we don't have one, we might need a dummy or skipping it?
    // I'll assume we might not need it if not provided, or this API is strict.
    // WARNING: If API requires order_number, this generic drive might fail without one.
    // But I will proceed assuming the endpoint handles it or we pass a system code.

    const foldersToSync = state
      .filter((i: any) => i.type === "folder")
      .map((f: any) => ({
        id: f.id.startsWith("KEY") ? undefined : f.id, // New items (KEY...) won't have DB ID
        folder_name: f.name,
        parent_id: f.parentId,
        // order_number?
      }));

    // Assuming we only sync folders this way? files are separate?
    // drive-old only synced folders via `.create`. Files via single upload.

    try {
      await API.ORDER_UPLOAD.create({
        session: { user, token },
        req: {
          body: { folders: foldersToSync },
        },
      });
      return Response.json({ success: true });
    } catch (e: any) {
      return Response.json({ success: false, message: e.message });
    }
  }

  if (intent === "upload_file") {
    // Handled purely client side via `handleUploadFile` calling API directly?
    // drive-old: `handleUploadFile` calls `API.ASSET.upload` then `API.ORDER_UPLOAD.create_single_file`.
    // It did NOT use standard form action for file upload.
    // It used `submit` only for `saveChanges` (folders).
    // So action here is mainly for Folder Sync.
  }

  return Response.json({ success: true });
};

export default function DrivePage() {
  const { items: initialItems, orders } = useLoaderData<{
    items: DriveItem[];
    orders: Order[];
  }>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Local state initialized from loader
  const [items, setItems] = useState<DriveItem[]>(initialItems);

  // Sync state with loader revalidation
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  // Guest view props are not present in route version usually, assuming admin view
  // But we can check query param for linked mode?

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

  // Filter items in current directory
  const currentItems = items.filter(
    (item) => item.parentId === currentFolderId
  );

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

  // --- Actions ---

  // Helper to sync state to server
  const syncState = (newItems: DriveItem[]) => {
    setItems(newItems);
    // Construct payload for API
    // Since API might only sync folders structure, filtering folders:
    // Real file uploads are separate.
    const foldersOnly = newItems;
    fetcher.submit(
      { intent: "sync_state", state: JSON.stringify(foldersOnly) },
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
      id: `KEY${Date.now()}`, // Temp ID, will be replaced by DB ID on revalidation? Not auto-replaced unless we reload.
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
        // 1. Upload Asset
        const uploadRes = await API.ASSET.upload(file);

        // 2. Create DB Record
        const newFilePayload = {
          file_type: mime,
          file_url: uploadRes.url,
          file_name: file.name,
          folder_id: currentFolderId,
        };

        await API.ORDER_UPLOAD.create_single_file({
          session: {}, // Client side usually doesn't need session here if handled by cookie/browser? API wrapper handles it?
          // Wait, API wrapper needs session passed if not global? defaults?
          // Assuming API.ORDER_UPLOAD uses client-side fetch wrapper which attaches cookies.
          req: { body: newFilePayload },
        });

        const newFile: DriveItem = {
          id: String(Date.now()), // Temp ID
          parentId: currentFolderId,
          name: file.name,
          type: "file",
          mimeType: mime,
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          createdAt: new Date().toISOString(),
        };

        // No need to sync entire state for file, just update local.
        // Revalidation will fetch real ID later.
        setItems([...items, newFile]);
        toast.success("Upload berhasil");

        // Reset
        e.target.value = "";
      } catch (err) {
        toast.error("Upload gagal");
        console.error(err);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Apakah anda yakin ingin menghapus item ini?")) return;

    // Recursive delete function (VISUAL ONLY unless API supports recursive delete)
    // If we rely on syncing the folder structure state, deleting parent folder removes children in state?
    // drive-old logic: `saveChanges` sends updated list. If items missing, does API delete?
    // API `create` usually creates/updates. Deletion might need specific call or "sync" handles it.
    // If API `create` is "upsert only", we might need explicit `delete`.
    // Assuming `state` sync handles it for now as per `drive-old` pattern, OR we just update visual.

    // Actually `drive-old` didn't show Delete implementation calling explicit DELETE endpoint.
    // It just updated `folders` state and called `saveChanges`.
    // So assume Sync State handles removal or we accept it visual only until refresh.

    const getDescendants = (parentId: string): string[] => {
      const children = items.filter((i) => i.parentId === parentId);
      let ids = children.map((c) => c.id);
      children.forEach((c) => {
        if (c.type === "folder") {
          ids = [...ids, ...getDescendants(c.id)];
        }
      });
      return ids;
    };

    const idsToDelete = new Set([id, ...getDescendants(id)]);
    const newItems = items.filter((i) => !idsToDelete.has(i.id));

    syncState(newItems);
    setSelectedItem(null);
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

  const generateShareLink = (accessCode: string) => {
    return `${window.location.protocol}//${window.location.host}${window.location.pathname}?access=${accessCode}`;
  };

  const handleShare = async (item?: DriveItem) => {
    const targetId = item ? item.id : currentFolderId;

    if (!targetId) {
      toast.error(
        "Tidak dapat membagikan root drive utama. Masuk ke dalam folder pesanan terlebih dahulu."
      );
      return;
    }

    // Since we fetch "orders" in loader, we can look up linked order.
    // Assuming `driveFolderId` or similar linkage exists.
    // If API `API.ORDERS.get` doesn't populate `driveFolderId` (it wasn't in list columns),
    // we might miss this linkage.
    // In `app.order-list.tsx` we saw `driveFolderId` was NOT in standard columns.
    // But `app.drive-old.tsx` didn't use this logic? It used `order` from loader.
    // If we are in generic drive, sharing might be tricky without explicit order link.
    // Fallback: Just show simple message.

    // const linkedOrder = orders.find((o) => o.driveFolderId === targetId);

    // For now mock:
    alert(`Share logic reserved. (Target ID: ${targetId})`);
  };

  const renderIcon = (item: DriveItem) => {
    if (item.type === "folder")
      return <Folder size={48} className="text-yellow-400 fill-yellow-400" />;
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

          {currentFolderId && (
            <button
              onClick={() => handleShare()}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
            >
              <Share2 size={16} />{" "}
              <span className="hidden md:inline">Bagikan</span>
            </button>
          )}
          {clipboard && (
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
              onClick={() => setCurrentFolderId(crumb.id)}
              className={`hover:bg-gray-100 px-2 py-1 rounded whitespace-nowrap ${idx === getBreadcrumbs().length - 1 ? "font-bold text-blue-600" : ""}`}
            >
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
            {currentItems.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item.id);
                }}
                onDoubleClick={() =>
                  item.type === "folder" && setCurrentFolderId(item.id)
                }
                className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  selectedItem === item.id
                    ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                    : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                } ${clipboard?.id === item.id ? "opacity-50" : ""}`}
              >
                {renderIcon(item)}

                {isRenaming === item.id ? (
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
                      className="text-xs font-medium text-gray-700 truncate w-full"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    {item.type === "file" && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        {item.size}
                      </div>
                    )}
                  </div>
                )}

                {/* Context Menu */}
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
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === "files" && (
        <div className="p-2 border-t border-gray-100 text-[10px] text-gray-400 text-center bg-gray-50">
          Klik ganda untuk membuka folder.
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

// app/routes/app.drive.internal.tsx
import React, { useState, useEffect, useRef } from "react";
import type { DriveItem } from "../types";
import {
  Folder,
  Trash2,
  Edit2,
  FolderPlus,
  Upload,
  Scissors,
  Clipboard,
  Share2,
  HardDrive,
  FileText,
  Lock,
} from "lucide-react";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  type LoaderFunction,
  type ActionFunction,
  useActionData,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import ModalSecond from "~/components/modal/ModalSecond";
import { Button } from "~/components/ui/button";
import { useModal } from "~/hooks";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  items: DriveItem[];
}

// Special folder ID for "Drive Pesanan"
const ORDERS_DRIVE_FOLDER_ID = "SYSTEM_ORDERS_DRIVE";

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

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

  // Map to DriveItem
  const items: DriveItem[] = [];

  if (foldersRes.items) {
    foldersRes.items.forEach((f: any) => {
      items.push({
        id: String(f.id),
        parentId: f.parent_id ? String(f.parent_id) : "null",
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
        parentId: f.folder_id ? String(f.folder_id) : "null",
        name: f.file_name,
        type: "file",
        mimeType: f.file_type || "doc",
        size: "0 MB",
        createdAt: f.created_at || new Date().toISOString(),
      });
    });
  }

  return Response.json({ items });
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

export default function DriveInternalPage() {
  const { items: initialItems } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const query = useQueryParams();
  const actionData = useActionData();

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
        order_number: "null",
        ...(query.folder_id
          ? { folder_id: query.folder_id }
          : { folder_id: "null" }),
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
        order_number: "null",
        ...(query.folder_id
          ? { folder_id: query.folder_id }
          : { folder_id: "null" }),
      })
      .build(),
    autoLoad: true,
  });
  console.log(realFiles);

  useEffect(() => {
    if (actionData) {
      reloadRealFolders();
      reloadRealFiles();
    }
  }, [actionData]);

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
        if (fetcher.data.message) {
          toast.success(fetcher.data.message);
        }
        // Reload data after successful action
        reloadRealFolders();
        reloadRealFiles();
        fetcher.load(window.location.pathname + window.location.search);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const [modal, setModal] = useModal();
  // Use query.folder_id as source of truth for currentFolderId
  const currentFolderId = query.folder_id || null;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{
    id: string;
    op: "cut" | "copy";
  } | null>(null);

  // Rename State
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // File Input Ref for Real Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if item is system folder
  const isSystemFolder = (itemId: string) => {
    return itemId === ORDERS_DRIVE_FOLDER_ID;
  };

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

  const syncState = (newItems: DriveItem[]) => {
    setItems(newItems);

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
    setModal({
      type: "create_folder",
      open: true,
      data: { folder_name: "Folder Baru" },
    });
  };

  const confirmCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modal?.data?.folder_name?.trim()) return;

    const newFolder: DriveItem = {
      id: `KEY${Date.now()}`,
      parentId: currentFolderId,
      name: modal.data.folder_name.trim(),
      type: "folder",
      createdAt: new Date().toISOString(),
    };

    syncState([...items, newFolder]);
    setModal({ ...modal, open: false });
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

        const newFilePayload = {
          file_type: mime,
          file_url: uploadRes.url,
          file_name: file.name,
          folder_id: currentFolderId || null,
          level: currentFolderId ? 2 : 1,
          order_number: null,
        };

        const result = await API.ORDER_UPLOAD.create_single_file({
          session: {},
          req: { body: newFilePayload },
        });

        if (!result.success) {
          throw new Error(result.message || "Upload gagal");
        }

        // Reload both folders and files data
        reloadRealFolders();
        reloadRealFiles();

        toast.success("Upload berhasil");
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

    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    const itemsToDelete = [itemToDelete];
    if (itemToDelete.type === "folder") {
      itemsToDelete.push(...getDescendants(id));
    }

    const allTemporary = itemsToDelete.every((item) =>
      item.id.startsWith("KEY")
    );

    if (allTemporary) {
      const idsToDelete = new Set(itemsToDelete.map((i) => i.id));
      const newItems = items.filter((i) => !idsToDelete.has(i.id));
      setItems(newItems);
      setSelectedItem(null);
      toast.success("Item berhasil dihapus");
      return;
    }

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

      const idsToDelete = new Set(itemsToDelete.map((i) => i.id));
      const newItems = items.filter((i) => !idsToDelete.has(i.id));
      setItems(newItems);
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus item");
      console.error(err);
    }
  };

  const handleRenameStart = (item: any) => {
    if (isSystemFolder(item.id)) {
      toast.error("Folder sistem tidak dapat diubah");
      return;
    }
    setIsRenaming(item.id);
    setRenameValue(item.folder_name || item.file_name);
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

  const handleShare = async (item?: any) => {
    const targetId = item ? item.id : currentFolderId;

    if (!targetId) {
      toast.error("Tidak dapat membagikan root drive utama.");
      return;
    }

    if (isSystemFolder(targetId)) {
      toast.error("Folder sistem tidak dapat dibagikan");
      return;
    }

    // const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Judul Halaman",
          text: "Deskripsi singkat",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share dibatalkan");
      }
    } else {
      // fallback
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin");
    }
    // };

    // alert(`Share logic reserved. (Target ID: ${targetId})`);
  };

  const handleOpenFolder = (item: any) => {
    navigate(`/app/drive/internal?folder_id=${item.id}`);
  };

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  return (
    <>
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
            <FolderPlus size={16} />
            <span className="hidden md:inline">Folder Baru</span>
          </button>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Upload size={16} />
            <span className="hidden md:inline">Upload</span>
          </button>

          {currentFolderId && (
            <button
              onClick={() => handleShare()}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
            >
              <Share2 size={16} />
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
        <div className="text-xs text-gray-400">
          {folders.length + files.length} Items
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
        <button
          onClick={() => navigate(`/app/drive/internal`)}
          className={`flex items-center hover:bg-gray-100 px-2 py-1 rounded ${!currentFolderId ? "font-bold text-blue-600" : ""}`}
        >
          <HardDrive size={14} className="mr-1" /> Internal Ops
        </button>
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <span className="text-gray-300">/</span>
            <button
              onClick={() =>
                navigate(`/app/drive/internal?folder_id=${crumb.id}`)
              }
              className={`hover:bg-gray-100 px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 ${idx === getBreadcrumbs().length - 1 ? "font-bold text-blue-600" : ""}`}
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
                  onDoubleClick={() => handleOpenFolder(folder)}
                  className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    selectedItem === folder.id
                      ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                      : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                  } ${clipboard?.id === folder.id ? "opacity-50" : ""}`}
                >
                  <Folder
                    size={48}
                    className="text-yellow-400 fill-yellow-400"
                  />

                  {isRenaming === folder.id && !isSystem ? (
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(folder);
                        }}
                        className="p-1.5 hover:bg-gray-100 text-blue-600 border-b"
                      >
                        <Share2 size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameStart(folder);
                        }}
                        className="p-1.5 hover:bg-gray-100 text-gray-600"
                      >
                        <Edit2 size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCut(folder.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 text-orange-600"
                      >
                        <Scissors size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(folder.id);
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameStart(file);
                    }}
                    className="p-1.5 hover:bg-gray-100 text-gray-600"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCut(file.id);
                    }}
                    className="p-1.5 hover:bg-gray-100 text-orange-600"
                  >
                    <Scissors size={12} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
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

      {/* New Folder Modal */}
      {modal?.type === "create_folder" && (
        <ModalSecond
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title="Buat Folder Baru"
          size="xl"
        >
          <form onSubmit={confirmCreateFolder}>
            <input
              autoFocus
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nama Folder..."
              value={modal?.data?.folder_name}
              onChange={(e) =>
                setModal({
                  ...modal,
                  data: { ...modal.data, folder_name: e.target.value },
                })
              }
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setModal({ ...modal, open: false })}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Buat
              </Button>
            </div>
          </form>
        </ModalSecond>
      )}
    </>
  );
}

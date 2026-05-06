import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  Trash2,
  Edit2,
  FolderPlus,
  Upload,
  Clipboard,
  Share2,
  FileText,
  Download,
} from "lucide-react";
import { useFetcher, useNavigate } from "react-router";
import { API } from "~/nexus";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import ModalSecond from "~/components/shared/modal/ModalSecond";
import { useModal } from "~/hooks";
import { DriveBreadcrumb } from "~/components/shared/breadcrumb/DriveBreadcrumb";
import { DriveItem } from "~/types";

interface DriveInternalFeatureProps {
  initialItems: DriveItem[];
  current_folder?: any;
}

const ORDERS_DRIVE_FOLDER_ID = "SYSTEM_ORDERS_DRIVE";

export default function DriveInternalFeature({ initialItems, current_folder }: DriveInternalFeatureProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const query = useQueryParams();
  const [sortBy, setSortBy] = useState("created_on:desc");

  const {
    data: realFolders,
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
        ...(sortBy && { sort: sortBy }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: realFiles,
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
        ...(sortBy && { sort: sortBy }),
      })
      .build(),
    autoLoad: true,
  });

  // Local state initialized from props
  const [items, setItems] = useState<DriveItem[]>(initialItems);
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);

  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data: any = fetcher.data;
      if (data.success === false) {
        toast.error(data.message || "Operasi gagal");
      } else if (data.success === true) {
        if (data.message) {
          toast.success(data.message);
        }
        reloadRealFolders();
        reloadRealFiles();
      }
    }
  }, [fetcher.data, fetcher.state, reloadRealFolders, reloadRealFiles]);

  const [modal, setModal] = useModal();
  const currentFolderId = query.folder_id || null;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{
    id: string;
    op: "cut" | "copy";
  } | null>(null);

  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSystemFolder = (itemId: string) => itemId === ORDERS_DRIVE_FOLDER_ID;

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
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) mime = "image";
      if (["pdf", "doc", "docx", "xls", "xlsx"].includes(ext || "")) mime = "doc";

      try {
        const uploadRes = await API.ASSET.upload(file);
        const newFilePayload = {
          file_type: mime,
          file_url: uploadRes.url,
          file_name: uploadRes.original_name,
          folder_id: currentFolderId || null,
          level: currentFolderId ? 2 : 1,
          order_number: null,
        };

        const result = await API.ORDER_UPLOAD.create_single_file({
          session: {},
          req: { body: newFilePayload },
        });

        if (!result.success) throw new Error(result.message || "Upload gagal");

        reloadRealFolders();
        reloadRealFiles();
        toast.success("Upload berhasil");
        e.target.value = "";
      } catch (err: any) {
        toast.error(err.message || "Upload gagal");
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
        if (c.type === "folder") descendants = [...descendants, ...getDescendants(c.id)];
      });
      return descendants;
    };

    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    const itemsToDelete = [itemToDelete];
    if (itemToDelete.type === "folder") itemsToDelete.push(...getDescendants(id));

    const allTemporary = itemsToDelete.every((item) => item.id.startsWith("KEY"));

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
        { intent: "delete_items", items: JSON.stringify(itemsPayload) },
        { method: "post" }
      );

      const idsToDelete = new Set(itemsToDelete.map((i) => i.id));
      const newItems = items.filter((i) => !idsToDelete.has(i.id));
      setItems(newItems);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus item");
    }
  };

  const handleRenameStart = (item: any) => {
    if (isSystemFolder(item.id)) return toast.error("Folder sistem tidak dapat diubah");
    setIsRenaming(item.id);
    setRenameValue(item.folder_name || item.file_name);
  };

  const handleRenameSave = () => {
    if (isRenaming && renameValue.trim()) {
      if (isSystemFolder(isRenaming)) {
        setIsRenaming(null);
        return;
      }
      syncState(items.map((i) => (i.id === isRenaming ? { ...i, name: renameValue } : i)));
    }
    setIsRenaming(null);
  };

  const handleCut = (id: string) => {
    if (isSystemFolder(id)) return toast.error("Folder sistem tidak dapat dipindahkan");
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
      if (invalid) return toast.error("Tidak bisa memindahkan folder ke dalam dirinya sendiri.");
    }

    if (clipboard.op === "cut") {
      syncState(items.map((i) => (i.id === clipboard.id ? { ...i, parentId: currentFolderId } : i)));
    }
    setClipboard(null);
  };

  const handleShare = async (item?: any) => {
    const targetId = item ? item.id : currentFolderId;
    if (!targetId) return toast.error("Tidak dapat membagikan root drive utama.");
    if (isSystemFolder(targetId)) return toast.error("Folder sistem tidak dapat dibagikan");

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
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin");
    }
  };

  const handleOpenFolder = (item: any) => {
    navigate(`/app/drive/internal?folder_id=${item.id}`);
  };

  const handleDownloadAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentFolderId) return toast.error("Folder ID tidak ditemukan");
    window.location.href = `/server/drive/${currentFolderId}/download`;
    toast.success("Download dimulai...");
  };

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  return (
    <div className="flex flex-col h-full">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="flex gap-2">
          <button onClick={handleOpenNewFolderModal} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
            <FolderPlus size={16} /> <span className="hidden md:inline">Folder Baru</span>
          </button>
          <button onClick={handleUploadClick} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Upload size={16} /> <span className="hidden md:inline">Upload</span>
          </button>
          {currentFolderId && (
            <button onClick={() => handleShare()} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
              <Share2 size={16} /> <span className="hidden md:inline">Bagikan</span>
            </button>
          )}
          {clipboard && (
            <button onClick={handlePaste} className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-200 animate-pulse">
              <Clipboard size={16} /> Paste
            </button>
          )}
          {currentFolderId && files.length > 0 && (
            <button onClick={handleDownloadAll} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm">
              <Download size={16} /> <span className="hidden md:inline">Download All ({files.length})</span>
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400">{folders.length + files.length} Items</div>
      </div>

      <div className="flex justify-between items-center px-4 py-2 gap-2">
        <DriveBreadcrumb
          domain="internal"
          currentFolderId={current_folder?.id || query?.folder_id}
          rootFolderId={null}
          breadcrumbs={current_folder?.id ? [{ id: current_folder.id, name: current_folder.folder_name }] : []}
          onOpenFolder={(folderId) => handleOpenFolder({ id: folderId })}
        />
        <select
          className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="created_on:desc">Terbaru</option>
          <option value="created_on:asc">Terlama</option>
          <option value="folder_name:asc">Folder (A-Z)</option>
          <option value="folder_name:desc">Folder (Z-A)</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4" onClick={() => setSelectedItem(null)}>
        {folders.length === 0 && files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Folder size={64} className="mb-4 opacity-20" />
            <p>Folder ini kosong</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder: any) => (
              <div
                key={folder.id}
                onClick={(e) => { e.stopPropagation(); setSelectedItem(folder.id); }}
                onDoubleClick={() => handleOpenFolder(folder)}
                className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${selectedItem === folder.id ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"} ${clipboard?.id === folder.id ? "opacity-50" : ""}`}
              >
                <Folder size={48} className="text-yellow-400 fill-yellow-400" />
                {isRenaming === folder.id ? (
                  <input autoFocus className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={handleRenameSave} onKeyDown={(e) => e.key === "Enter" && handleRenameSave()} onClick={(e) => e.stopPropagation()} />
                ) : (
                  <div className="text-center w-full truncate text-xs font-medium text-gray-700" title={folder.folder_name}>{folder.folder_name}</div>
                )}
                <div className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${selectedItem === folder.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}>
                  <button onClick={(e) => { e.stopPropagation(); handleRenameStart(folder); }} className="p-1.5 hover:bg-gray-100 text-gray-600 border-b"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleCut(folder.id); }} className="p-1.5 hover:bg-gray-100 text-orange-600 border-b"><Scissors size={14} className="rotate-90" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(folder.id); }} className="p-1.5 hover:bg-gray-100 text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {files.map((file: any) => (
              <div
                key={file.id}
                onClick={(e) => { e.stopPropagation(); setSelectedItem(file.id); }}
                className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${selectedItem === file.id ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"} ${clipboard?.id === file.id ? "opacity-50" : ""}`}
              >
                <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-500 rounded-lg"><FileText size={28} /></div>
                {isRenaming === file.id ? (
                  <input autoFocus className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={handleRenameSave} onKeyDown={(e) => e.key === "Enter" && handleRenameSave()} onClick={(e) => e.stopPropagation()} />
                ) : (
                  <div className="text-center w-full truncate text-xs font-medium text-gray-700" title={file.file_name}>{file.file_name}</div>
                )}
                <div className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${selectedItem === file.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}>
                  <a href={file.file_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 text-blue-600 border-b"><Download size={14} /></a>
                  <button onClick={(e) => { e.stopPropagation(); handleRenameStart(file); }} className="p-1.5 hover:bg-gray-100 text-gray-600 border-b"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleCut(file.id); }} className="p-1.5 hover:bg-gray-100 text-orange-600 border-b"><Scissors size={14} className="rotate-90" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1.5 hover:bg-gray-100 text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalSecond
        open={modal.open && modal.type === "create_folder"}
        title="Buat Folder Baru"
        onClose={() => setModal({ ...modal, open: false })}
      >
        <form onSubmit={confirmCreateFolder}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Folder</label>
            <input
              autoFocus
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={modal.data?.folder_name || ""}
              onChange={(e) => setModal({ ...modal, data: { ...modal.data, folder_name: e.target.value } })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal({ ...modal, open: false })} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Batal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buat Folder</button>
          </div>
        </form>
      </ModalSecond>
    </div>
  );
}

const Scissors = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

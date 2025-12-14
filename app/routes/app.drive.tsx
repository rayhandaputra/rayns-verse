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
} from "lucide-react";
import NotaView from "../components/NotaView";

interface DrivePageProps {
  items: DriveItem[];
  orders?: Order[]; // Optional, to link folder to order
  onUpdateItems: (newItems: DriveItem[]) => void;
  initialFolderId?: string | null;
  rootFolderId?: string | null; // If set, user cannot navigate above this folder (For Guest/Linked View)
  isGuest?: boolean;
}

const DrivePage: React.FC<DrivePageProps> = ({
  items = [],
  orders = [],
  onUpdateItems,
  initialFolderId,
  rootFolderId,
  isGuest = false,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(
    initialFolderId || rootFolderId || null
  );
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

  // Sync initial folder if provided, but respect Root Lock
  useEffect(() => {
    if (initialFolderId !== undefined) {
      setCurrentFolderId(initialFolderId);
      setActiveTab("files");
    }
  }, [initialFolderId]);

  // If locked to a root, ensure we never drift above it
  useEffect(() => {
    if (rootFolderId && !currentFolderId) {
      setCurrentFolderId(rootFolderId);
    }
  }, [rootFolderId, currentFolderId]);

  // Find linked Order for current folder (Recursive lookup if inside subfolder, or just match root)
  const effectiveOrderId = rootFolderId || currentFolderId;
  const currentOrder = effectiveOrderId
    ? orders.find((o) => o.driveFolderId === effectiveOrderId)
    : null;

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

    // Stop if we hit null OR if we hit the locked rootFolderId (exclusive of root, handled separately)
    while (curr) {
      const folder = items.find((i) => i.id === curr);
      if (folder) {
        crumbs.unshift({ id: folder.id, name: folder.name });
        // Break if this was the root folder to stop traversing up
        if (rootFolderId && curr === rootFolderId) {
          break;
        }
        curr = folder.parentId;
      } else {
        curr = null;
      }
    }
    return crumbs;
  };

  // --- Actions ---

  const handleOpenNewFolderModal = () => {
    setNewFolderName("Folder Baru");
    setShowNewFolderModal(true);
  };

  const confirmCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: DriveItem = {
      id: String(Date.now()),
      parentId: currentFolderId,
      name: newFolderName.trim(),
      type: "folder",
      createdAt: new Date().toISOString(),
    };
    onUpdateItems([...items, newFolder]);
    setShowNewFolderModal(false);
    setNewFolderName("");
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();

      let mime = "file";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
        mime = "image";
      if (["pdf", "doc", "docx", "xls", "xlsx"].includes(ext || ""))
        mime = "doc";

      const newFile: DriveItem = {
        id: String(Date.now()),
        parentId: currentFolderId,
        name: file.name,
        type: "file",
        mimeType: mime,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        createdAt: new Date().toISOString(),
      };
      onUpdateItems([...items, newFile]);

      // Reset value to allow selecting same file again
      e.target.value = "";
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Apakah anda yakin ingin menghapus item ini?")) return;

    // Recursive delete function
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

    onUpdateItems(newItems);
    setSelectedItem(null);
  };

  const handleRenameStart = (item: DriveItem) => {
    setIsRenaming(item.id);
    setRenameValue(item.name);
  };

  const handleRenameSave = () => {
    if (isRenaming && renameValue.trim()) {
      onUpdateItems(
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
        alert("Tidak bisa memindahkan folder ke dalam dirinya sendiri.");
        return;
      }
    }

    if (clipboard.op === "cut") {
      onUpdateItems(
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
    // 1. Determine target folder ID (Item ID or Current Folder ID)
    const targetId = item ? item.id : currentFolderId;

    if (!targetId) {
      alert(
        "Tidak dapat membagikan root drive utama. Masuk ke dalam folder pesanan terlebih dahulu."
      );
      return;
    }

    // 2. Find linked Order
    // Sharing works by generating a link to the Order that OWNS this folder.
    // We can only share the Main Folder of an Order.
    const linkedOrder = orders.find((o) => o.driveFolderId === targetId);

    if (linkedOrder) {
      const link = generateShareLink(linkedOrder.accessCode);
      try {
        await navigator.clipboard.writeText(link);
        alert(`Link akses publik berhasil disalin ke clipboard:\n\n${link}`);
      } catch (e) {
        // Fallback for some browsers or insecure contexts
        prompt("Salin link akses berikut:", link);
      }
    } else {
      alert(
        "Gagal Membagikan:\nFolder ini dibuat secara manual dan tidak terhubung dengan Data Pesanan (Order).\n\nHanya folder utama yang dibuat otomatis dari Form Pesanan yang memiliki link akses publik."
      );
    }
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
      className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col ${isGuest ? "h-screen rounded-none border-0" : "h-[calc(100vh-140px)]"}`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Guest Header */}
      {isGuest && (
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">
              K
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base">Kinau Drive</h1>
              <p className="text-xs text-gray-400">
                File Storage & Order Details
              </p>
            </div>
          </div>
          {currentOrder && (
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium">{currentOrder.instansi}</div>
              <div className="text-xs text-gray-400">Guest Access</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs for Order Context (Always show if Order is linked, esp for Guest) */}
      {currentOrder && (
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("files")}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition ${activeTab === "files" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Layout size={16} /> File & Desain
          </button>
          <button
            onClick={() => setActiveTab("nota")}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition ${activeTab === "nota" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Receipt size={16} /> Nota & Pembayaran
          </button>
        </div>
      )}

      {activeTab === "nota" && currentOrder ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <NotaView order={currentOrder} />
        </div>
      ) : (
        <>
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
            <div className="text-xs text-gray-400">
              {currentItems.length} Items
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
            {!rootFolderId && (
              <button
                onClick={() => {
                  setCurrentFolderId(null);
                  setActiveTab("files");
                }}
                className={`flex items-center hover:bg-gray-100 px-2 py-1 rounded ${!currentFolderId ? "font-bold text-blue-600" : ""}`}
              >
                <HardDrive size={14} className="mr-1" /> Drive
              </button>
            )}
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {(!rootFolderId || idx > 0) && (
                  <span className="text-gray-300">/</span>
                )}
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
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleRenameSave()
                        }
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
        </>
      )}

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
};

export default DrivePage;

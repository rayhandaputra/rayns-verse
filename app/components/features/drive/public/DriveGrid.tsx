import React from "react";
import { Folder, FileText, Trash2, Edit2, Eye } from "lucide-react";
import { getMimeType } from "~/utils/utils";

interface DriveGridProps {
  folders: any[];
  files: any[];
  selectedItem: string | null;
  setSelectedItem: (id: string | null) => void;
  onOpenFolder: (id: string) => void;
  onRename: (item: any) => void;
  onDelete: (item: any, type: "folder" | "file") => void;
  onPreview: (file: any) => void;
  onRenameSave: (e: any) => void;
  modalData: any;
  setModalData: (data: any) => void;
}

export const DriveGrid = ({
  folders, files, selectedItem, setSelectedItem, onOpenFolder,
  onRename, onDelete, onPreview, onRenameSave, modalData, setModalData
}: DriveGridProps) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <div id="drive-empty-state" className="flex flex-col items-center justify-center text-gray-300 py-20 font-sans">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-3">
          <Folder size={40} className="text-gray-200" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Folder masih kosong</p>
        <p className="text-xs text-gray-300 mt-1">Ketuk tombol + untuk menambah file</p>
      </div>
    );
  }

  return (
    <div id="drive-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {folders.map((folder: any) => (
        <div
          id={`folder-${folder.id}`}
          key={folder.id}
          onClick={() => onOpenFolder(folder?.id)}
          className="group relative p-3 rounded-2xl border border-gray-100 bg-white flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-150 hover:shadow-md hover:border-gray-200"
        >
          {/* Action menu */}
          {!folder.isSystem && !folder.purpose && (
            <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
              <button
                id={`btn-menu-folder-${folder.id}`}
                onClick={(e) => { e.stopPropagation(); setSelectedItem(selectedItem === folder.id ? null : folder.id); }}
                className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
              </button>
              {selectedItem === folder.id && (
                <div id={`menu-folder-${folder.id}`} className="absolute top-7 right-0 w-32 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                  <button onClick={() => { onRename(folder); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <Edit2 size={13} className="text-gray-400" /> Ganti Nama
                  </button>
                  <div className="h-px bg-gray-50" />
                  <button onClick={() => { onDelete(folder, 'folder'); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50">
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Icon */}
          <div className="w-full aspect-square flex items-center justify-center bg-amber-50 rounded-xl">
            <Folder size={44} className="text-amber-400 fill-amber-400" />
          </div>
          {/* Name */}
          {modalData?.type === "rename_folder" && modalData?.data?.id === folder.id ? (
            <input
              id={`input-rename-folder-${folder.id}`}
              autoFocus
              className="w-full text-center text-xs border border-blue-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-200 font-sans"
              value={modalData?.data?.folder_name}
              onChange={(e) => setModalData({ data: { ...modalData?.data, folder_name: e.target.value } })}
              onBlur={(e) => onRenameSave(e)}
              onKeyDown={(e) => e.key === "Enter" && onRenameSave(e)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-[11px] font-semibold text-gray-700 text-center w-full leading-tight line-clamp-2 font-sans" title={folder.folder_name}>
              {folder.folder_name}
            </p>
          )}
        </div>
      ))}

      {files.map((file: any) => (
        <div
          id={`file-${file.id}`}
          key={file.id}
          onClick={() => { window.open(file.file_url, '_blank'); }}
          className="group relative p-3 rounded-2xl border border-gray-100 bg-white flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-150 hover:shadow-md hover:border-gray-200"
        >
          {/* Action menu */}
          <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
            <button
              id={`btn-menu-file-${file.id}`}
              onClick={(e) => { e.stopPropagation(); setSelectedItem(selectedItem === file.id ? null : file.id); }}
              className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
            </button>
            {selectedItem === file.id && (
              <div id={`menu-file-${file.id}`} className="absolute top-7 right-0 w-32 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                <button onClick={() => { onPreview(file); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Eye size={13} className="text-gray-400" /> Preview
                </button>
                <div className="h-px bg-gray-50" />
                <button onClick={() => { onDelete(file, 'file'); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            )}
          </div>
          {/* Thumbnail */}
          <div className="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden relative">
            {getMimeType(file.file_name) === 'image' ? (
              <img src={file.file_url} className="w-full h-full object-cover" alt={file.file_name} />
            ) : (
              <FileText size={36} className="text-blue-400" />
            )}
          </div>
          {/* Name */}
          <p className="text-[11px] font-medium text-gray-600 text-center w-full leading-tight line-clamp-2 font-sans" title={file.file_name}>
            {file.file_name}
          </p>
        </div>
      ))}
    </div>
  );
};

import React from "react";
import { FolderPlus, Upload } from "lucide-react";

interface DriveFABProps {
  fabOpen: boolean;
  setFabOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  loadingAction: boolean;
  loadingUpload: boolean;
  onNewFolder: () => void;
  onUpload: () => void;
}

export const DriveFAB = ({ fabOpen, setFabOpen, loadingAction, loadingUpload, onNewFolder, onUpload }: DriveFABProps) => (
  <div id="drive-fab-container" className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-3">
    {/* Sub-buttons */}
    <div className={`flex flex-col items-end gap-2 transition-all duration-300 ${
      fabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
      {/* Folder Baru */}
      <button
        id="btn-fab-new-folder"
        onClick={onNewFolder}
        disabled={loadingAction}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-lg active:scale-95 transition-transform font-sans"
      >
        <FolderPlus size={18} className="text-amber-500" /> Folder Baru
      </button>
      {/* Upload */}
      <button
        id="btn-fab-upload"
        onClick={onUpload}
        disabled={loadingUpload}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-300 active:scale-95 transition-transform font-sans"
      >
        <Upload size={18} /> {loadingUpload ? 'Mengunggah...' : 'Upload File'}
      </button>
    </div>

    {/* Backdrop untuk tutup FAB */}
    {fabOpen && (
      <div id="drive-fab-backdrop" className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />
    )}

    {/* Main FAB Button */}
    <button
      id="btn-fab-main"
      onClick={() => setFabOpen((prev: boolean) => !prev)}
      className={`w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-300 active:scale-95 transition-all duration-300 ${
        fabOpen ? 'rotate-45' : 'rotate-0'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
);

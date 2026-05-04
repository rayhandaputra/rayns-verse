import React from "react";
import { Link2OffIcon, Folder } from "lucide-react";

export const DriveNotFound = ({ domain, session }: { domain: string; session: any; }) => {
  return (
    <div id="drive-not-found-container" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
          <Link2OffIcon size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Link Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-8">Link yang Anda tuju mungkin salah, sudah kadaluarsa, atau telah dihapus oleh pemilik.</p>
        <a 
          id="btn-back-home"
          href={!session ? "/" : "/app/overview"} 
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all font-sans"
        >
          <Folder size={18} />
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
};

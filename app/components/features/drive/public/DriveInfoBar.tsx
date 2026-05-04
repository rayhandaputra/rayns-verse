import React from "react";
import { FileText, MapPin } from "lucide-react";
import { getGoogleMapsLink } from "~/constants";

interface DriveInfoBarProps {
  orderData: any;
  onViewNota: () => void;
}

export const DriveInfoBar = ({ orderData, onViewNota }: DriveInfoBarProps) => {
  if (!orderData) return null;
  return (
    <div id="drive-info-bar" className="w-full mx-auto px-3 pt-3 pb-1">
      <div className="grid grid-cols-2 gap-3">
        {/* Nota Card */}
        <button
          id="btn-view-nota"
          onClick={onViewNota}
          className="relative overflow-hidden flex flex-col items-center justify-center text-center gap-2 p-4 rounded-2xl bg-[#2563EB] text-white active:scale-95 transition-transform shadow-md shadow-blue-200 min-h-[110px]"
        >
          <div className="absolute -top-3 -right-3 opacity-20">
            <FileText size={65} />
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
            <FileText size={22} className="text-white" />
          </div>
          <span className="text-base md:text-lg font-extrabold leading-tight font-sans">Lihat Nota Pesanan</span>
        </button>

        {/* Alamat / Maps Card */}
        <a
          id="btn-view-location"
          href={getGoogleMapsLink()}
          target="_blank"
          rel="noreferrer"
          className="relative overflow-hidden flex flex-col items-center justify-center text-center gap-2 p-4 rounded-2xl bg-[#10B981] text-white active:scale-95 transition-transform shadow-md shadow-emerald-200 min-h-[110px]"
        >
          <div className="absolute -top-3 -right-3 opacity-20">
            <MapPin size={65} />
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
            <MapPin size={22} className="text-white" />
          </div>
          <span className="text-base md:text-lg font-extrabold leading-tight font-sans">Lihat Lokasi Pengambilan</span>
        </a>
      </div>
    </div>
  );
};

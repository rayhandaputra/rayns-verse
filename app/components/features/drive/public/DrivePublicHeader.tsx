import React from "react";
import { Lock } from "lucide-react";

interface HeaderProps {
  orderData: any;
  domain: string;
  activeCategory: string | null;
}

export const DrivePublicHeader = ({ orderData, domain, activeCategory }: HeaderProps) => {
  const displayName = +orderData?.is_kkn === 1
    ? `KKN ${orderData?.kkn_period}`
    : (orderData?.institution_name || orderData?.pic_name || "Guest");

  return (
    <div id="drive-public-header" className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="w-full mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
          <img src="/head-icon-kinau.png" alt="Kinau" className="w-5 invert brightness-0" />
        </div>
        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-900 leading-tight font-sans">Drive File Cetak</h1>
            {activeCategory && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                activeCategory === 'shirt'
                ? 'bg-teal-50 text-teal-700'
                : 'bg-purple-50 text-purple-700'
              }`}>
                {activeCategory === 'shirt' ? 'KAOS' : 'ID CARD'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate font-sans" title={displayName}>{displayName}</p>
        </div>
        {/* Public badge */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-medium text-gray-400 shrink-0 font-sans">
          <Lock size={10} /> Publik
        </div>
      </div>
    </div>
  );
};

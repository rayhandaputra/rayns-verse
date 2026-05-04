import React from "react";
import { Folder, IdCard, Layers, ArrowLeft } from "lucide-react";

interface DriveTabsProps {
  activeTab: string;
  activeCategory: string | null;
  showBackButton: boolean;
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

export const DriveTabs = ({ activeTab, activeCategory, showBackButton, onBack, onNavigate }: DriveTabsProps) => {
  const tabs = [
    { id: 'drive', label: 'Drive', icon: <Folder size={15} />, show: true },
    { id: 'idcard', label: 'ID Card', icon: <IdCard size={15} />, show: activeCategory === 'idcard_lanyard' },
    { id: 'lanyard', label: 'Lanyard', icon: <Layers size={15} />, show: activeCategory === 'idcard_lanyard' },
  ].filter(t => t.show);

  const colorMap: Record<string, string> = {
    drive: 'bg-blue-600 text-white shadow-blue-200',
    idcard: 'bg-purple-600 text-white shadow-purple-200',
    lanyard: 'bg-orange-500 text-white shadow-orange-200',
  };

  return (
    <div id="drive-tabs-container" className="w-full mx-auto px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {showBackButton && (
          <button
            id="btn-category-back"
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-full whitespace-nowrap shrink-0 active:scale-95 transition-transform font-sans"
          >
            <ArrowLeft size={13} /> Ganti
          </button>
        )}
        {tabs.map(tab => (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 shadow-sm font-sans ${
              activeTab === tab.id
              ? `${colorMap[tab.id] || 'bg-blue-600 text-white'} shadow`
              : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

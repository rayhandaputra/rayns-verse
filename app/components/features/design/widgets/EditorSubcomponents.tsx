import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { type SelempangAsset } from '~/utils/selempang-db';

export const CompactSlider = ({ label, value, min, max, onChange, unit = '', step = 0.5 }: any) => (
    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase mb-2 tracking-wider">
            <span>{label}</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">{value}{unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={e => onChange(parseFloat(e.target.value))} 
            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-ew-resize accent-blue-600" 
        />
    </div>
);

interface ObjectGalleryProps {
    items: SelempangAsset[];
    selectedId: string;
    onSelect: (id: string) => void;
    label: string;
}

export const ObjectGallery: React.FC<ObjectGalleryProps> = ({ items, selectedId, onSelect, label }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{items.length} Item</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            <button 
                onClick={() => onSelect('')}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${!selectedId ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
            >
                <X size={16} />
                <span className="text-[8px] font-black uppercase">Hapus</span>
            </button>
            {items.map(item => (
                <button 
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 transition-all p-2 bg-white relative group ${selectedId === item.id ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100 hover:border-blue-300'}`}
                >
                    <img src={item.data} className="w-full h-full object-contain" alt={item.name} />
                    {selectedId === item.id && <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-md"><CheckCircle2 size={10} /></div>}
                </button>
            ))}
        </div>
    </div>
);

import React from "react";
import { X, Edit2 } from "lucide-react";
import { type DesignTemplate } from "~/types/design";

interface DesignPreviewModalProps {
  template: DesignTemplate;
  onClose: () => void;
  onEdit: (template: DesignTemplate) => void;
}

export const DesignPreviewModal: React.FC<DesignPreviewModalProps> = ({
  template,
  onClose,
  onEdit
}) => {
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-10 relative overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase leading-none">{template.name}</h3>
            <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Detail Tata Letak Desain</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div 
          className="relative bg-gray-100 rounded-2xl overflow-hidden mx-auto shadow-inner" 
          style={{ 
            width: template.category === 'twibbon-idcard' ? '320px' : '500px', 
            height: template.category === 'twibbon-idcard' ? '450px' : '20px' 
          }}
        >
          <img src={template.baseImage} className="w-full h-full object-fill" alt="Preview" />
          {template.rules.map(rule => (
            <div 
              key={rule.id} 
              className="absolute border border-white/50 bg-indigo-500/20 flex items-center justify-center" 
              style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%` }}
            >
              <span className="text-[8px] font-black text-white uppercase drop-shadow-md text-center">{rule.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-4">
          <button 
            onClick={() => { onEdit(template); onClose(); }} 
            className="flex-1 bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-3 transition shadow-xl shadow-indigo-900/10"
          >
            <Edit2 size={18} /> Edit Aturan
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[24px] font-black uppercase text-xs">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

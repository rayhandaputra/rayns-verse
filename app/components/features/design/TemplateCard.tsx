import React from "react";
import { Edit2, Trash2, Search } from "lucide-react";
import { type DesignTemplate } from "~/types/design";

interface TemplateCardProps {
  template: DesignTemplate;
  onEdit: (template: DesignTemplate) => void;
  onDelete: (id: string) => void;
  onPreview: (template: DesignTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onPreview
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden group hover:shadow-xl transition-all relative">
      <div 
        className="aspect-[4/3] bg-gray-100 relative overflow-hidden cursor-pointer" 
        onClick={() => onPreview(template)}
      >
        <img 
          src={template.baseImage} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
          alt={template.name}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(template); }} 
            className="bg-white text-indigo-600 p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"
          >
            <Edit2 size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(template.id); }} 
            className="bg-red-50 text-white p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-gray-400 opacity-0 group-hover:opacity-100 transition">
          <Search size={16} />
        </div>
      </div>
      <div className="p-6">
        <h4 className="font-black text-gray-800 uppercase text-sm truncate">{template.name}</h4>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
            {template.rules.length} Rules
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
            template.styleMode === 'static' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-500'
          }`}>
            {template.styleMode === 'static' ? 'Statis' : 'Dinamis'}
          </span>
        </div>
      </div>
    </div>
  );
};

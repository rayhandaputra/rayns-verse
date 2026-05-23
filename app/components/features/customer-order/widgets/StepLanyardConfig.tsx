import { useMemo } from "react";
import { Check, Upload, ImageIcon, Type } from "lucide-react";
import { motion } from "motion/react";
import type { OrderState, DesignTemplate } from "../use-customer-order-logic";

interface StepLanyardConfigProps {
  state: OrderState;
  updateState: (partial: Partial<OrderState>) => void;
  handleFileSelect: (field: any, file: File | null) => void;
  templates: DesignTemplate[];
}

export default function StepLanyardConfig({
  state,
  updateState,
  handleFileSelect,
  templates,
}: StepLanyardConfigProps) {
  const lanyardTemplates = useMemo(
    () => templates.filter((t) => t.category === "twibbon-lanyard"),
    [templates]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3">
        <h2 className="text-base font-black text-foreground">Konfigurasi Lanyard</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Pilih desain lanyard dan atur posisi logo</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
        {/* Lanyard Design Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Pilih Desain Lanyard
          </label>
          <div className="grid grid-cols-2 gap-2">
            {lanyardTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => updateState({ lanyardDesignId: template.id })}
                className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                  state.lanyardDesignId === template.id
                    ? "border-accent shadow-md shadow-accent/20"
                    : "border-gray-100"
                }`}
              >
                {template.base_image ? (
                  <img
                    src={template.base_image}
                    alt={template.name}
                    className="w-full h-28 object-cover bg-gray-50"
                  />
                ) : (
                  <div className="w-full h-28 bg-secondary flex items-center justify-center">
                    <ImageIcon size={20} className="text-gray-300" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-[10px] font-bold text-foreground truncate">{template.name}</p>
                </div>
                {state.lanyardDesignId === template.id && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {lanyardTemplates.length === 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
              <ImageIcon size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">Belum ada template lanyard tersedia</p>
            </div>
          )}
        </motion.div>

        {/* Lanyard Logo Upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Logo untuk Lanyard (Opsional)
          </label>
          <label className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border-2 border-dashed border-gray-200 cursor-pointer hover:border-accent/50 transition-colors">
            {state.lanyardLogoPreview ? (
              <img src={state.lanyardLogoPreview} alt="Logo" className="w-14 h-14 object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
            )}
            <span className="text-[10px] font-medium text-gray-400">
              {state.lanyardLogoFile ? state.lanyardLogoFile.name : "Tap untuk upload logo lanyard"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect("lanyardLogoFile", e.target.files?.[0] || null)}
            />
          </label>
        </motion.div>

        {/* Lanyard Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Teks pada Lanyard (Opsional)
          </label>
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100">
            <Type size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={state.lanyardText}
              onChange={(e) => updateState({ lanyardText: e.target.value })}
              placeholder="Contoh: nama institusi, tagline..."
              className="flex-1 text-xs outline-none text-foreground placeholder:text-gray-300"
            />
          </div>
        </motion.div>

        {/* Preview hint */}
        {state.lanyardDesignId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-accent/5 rounded-xl p-3 border border-accent/10"
          >
            <p className="text-[10px] text-accent font-medium text-center">
              ✓ Desain lanyard terpilih. Posisi logo & teks akan disesuaikan oleh tim kami.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

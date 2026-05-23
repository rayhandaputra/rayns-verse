import { useState, useMemo } from "react";
import { Check, Upload, ImageIcon, Type, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { OrderState, DesignTemplate } from "../use-customer-order-logic";

interface StepIdCardConfigProps {
  state: OrderState;
  updateState: (partial: Partial<OrderState>) => void;
  handleFileSelect: (field: any, file: File | null) => void;
  templates: DesignTemplate[];
}

export default function StepIdCardConfig({
  state,
  updateState,
  handleFileSelect,
  templates,
}: StepIdCardConfigProps) {
  const [activeSection, setActiveSection] = useState<"front" | "back">("front");

  const frontTemplates = useMemo(
    () => templates.filter((t) => t.category === "twibbon-idcard"),
    [templates]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3">
        <h2 className="text-base font-black text-foreground">Konfigurasi ID Card</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Pilih desain dan atur jumlah anggota</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex-shrink-0 px-5 mb-3">
        <div className="flex bg-secondary rounded-xl p-1">
          {(["front", "back"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSection === tab
                  ? "bg-white text-foreground shadow-sm"
                  : "text-gray-400"
              }`}
            >
              {tab === "front" ? "Depan" : "Belakang"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-2">
        <AnimatePresence mode="wait">
          {activeSection === "front" ? (
            <motion.div
              key="front"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Member Count */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                  Jumlah Anggota
                </label>
                <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                  <button
                    onClick={() => updateState({ memberCount: Math.max(0, state.memberCount - 1) })}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <input
                    type="number"
                    value={state.memberCount || ""}
                    onChange={(e) => updateState({ memberCount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="flex-1 text-center text-lg font-black text-foreground bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <button
                    onClick={() => updateState({ memberCount: state.memberCount + 1 })}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Front Design Selection */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                  Pilih Desain Depan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {frontTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => updateState({ frontDesignId: template.id })}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                        state.frontDesignId === template.id
                          ? "border-accent shadow-md shadow-accent/20"
                          : "border-gray-100"
                      }`}
                    >
                      {template.base_image ? (
                        <img
                          src={template.base_image}
                          alt={template.name}
                          className="w-full h-24 object-cover bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-24 bg-secondary flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-300" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-foreground truncate">{template.name}</p>
                      </div>
                      {state.frontDesignId === template.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                  Upload Logo Utama
                </label>
                <label className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border-2 border-dashed border-gray-200 cursor-pointer hover:border-accent/50 transition-colors">
                  {state.logoPreview ? (
                    <img src={state.logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Upload size={18} className="text-gray-400" />
                    </div>
                  )}
                  <span className="text-[10px] font-medium text-gray-400">
                    {state.logoFile ? state.logoFile.name : "Tap untuk upload logo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect("logoFile", e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Back Design Selection */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                  Pilih Desain Belakang
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {frontTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => updateState({ backDesignId: template.id })}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                        state.backDesignId === template.id
                          ? "border-accent shadow-md shadow-accent/20"
                          : "border-gray-100"
                      }`}
                    >
                      {template.base_image ? (
                        <img
                          src={template.base_image}
                          alt={template.name}
                          className="w-full h-24 object-cover bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-24 bg-secondary flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-300" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-foreground truncate">{template.name}</p>
                      </div>
                      {state.backDesignId === template.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Back Text or Image */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                  Teks / Gambar Tambahan (Opsional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100">
                    <Type size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={state.backText}
                      onChange={(e) => updateState({ backText: e.target.value })}
                      placeholder="Teks untuk bagian belakang..."
                      className="flex-1 text-xs outline-none text-foreground placeholder:text-gray-300"
                    />
                  </div>
                  <label className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 cursor-pointer hover:border-accent/50 transition-colors">
                    {state.backImagePreview ? (
                      <img src={state.backImagePreview} alt="Back" className="w-10 h-10 object-contain rounded-lg" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Upload size={14} className="text-gray-400" />
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-gray-400 flex-1">
                      {state.backImageFile ? state.backImageFile.name : "Upload gambar (QR Code, logo)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect("backImageFile", e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

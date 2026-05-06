import React, { useState, useRef } from "react";
import { 
  X, Save, Upload, Image as ImageIcon, Type, 
  Briefcase, Scissors, Trash2, Plus, Minus, Maximize 
} from "lucide-react";
import { type DesignCategory, type DesignRule, type DesignTemplate, type StyleMode, type RuleType } from "~/types/design";
import { uploadFile } from "~/utils/utils";
import { applyDefaultIdCardLayout, applyLanyardDefaultLayout } from "~/utils/design-helpers";
import { RuleConfigDialog } from "./RuleConfigDialog";

interface DesignEditorProps {
  activeCategory: DesignCategory;
  templateId: string | null;
  initialData?: Partial<DesignTemplate>;
  onCancel: () => void;
  onSave: (template: DesignTemplate) => void;
  isSaving: boolean;
}

export const DesignEditor: React.FC<DesignEditorProps> = ({
  activeCategory,
  templateId,
  initialData,
  onCancel,
  onSave,
  isSaving
}) => {
  const [templateName, setTemplateName] = useState(initialData?.name || "");
  const [baseImage, setBaseImage] = useState<string | null>(initialData?.baseImage || null);
  const [rules, setRules] = useState<DesignRule[]>(initialData?.rules || []);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [styleMode, setStyleMode] = useState<StyleMode>(initialData?.styleMode || "dynamic");
  const [zoom, setZoom] = useState(0.8);
  const [showRuleConfig, setShowRuleConfig] = useState<{ id: string; type: RuleType } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const visualWidth = activeCategory === "twibbon-idcard" ? 350 : 900;
  const visualHeight = activeCategory === "twibbon-idcard" ? 550 : 22;
  const foldPercent = (7 / 90) * 100;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await uploadFile(file);
      setBaseImage(url);
      setRules([]);
      setZoom(0.8);
      if (activeCategory === "twibbon-idcard") {
        applyDefaultIdCardLayout((rule) => setRules((prev) => [...prev, rule]));
      }
    }
  };

  const addRule = (type: RuleType, label: string, options?: string[], fontFamily?: string, fontColor?: string) => {
    const newRule: DesignRule = {
      id: "rule-" + Date.now(),
      type: type,
      label: label,
      x: 10,
      y: 40,
      width: activeCategory === "twibbon-idcard" ? 80 : 15,
      height: activeCategory === "twibbon-idcard" ? 10 : 100,
      options,
      fontFamily,
      fontColor,
    };
    setRules([...rules, newRule]);
    setActiveRuleId(newRule.id);
    setShowRuleConfig(null);
  };

  const updateRule = (id: string, updates: Partial<DesignRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    if (activeRuleId === id) setActiveRuleId(null);
  };

  const handleSave = () => {
    if (!templateName || !baseImage) return alert("Nama dan gambar template wajib diisi!");
    onSave({
      id: templateId || "tpl-" + Date.now(),
      name: templateName,
      category: activeCategory,
      baseImage,
      rules,
      styleMode: activeCategory === "twibbon-lanyard" ? "dynamic" : styleMode,
    });
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-200 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 hover:bg-gray-200 rounded-full transition">
            <X size={20} />
          </button>
          <h3 className="font-black text-gray-800 text-lg uppercase leading-none">
            {templateId ? "Edit" : "Buat"} Layout {activeCategory.split("-")[1].toUpperCase()}
          </h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition shadow-xl shadow-indigo-900/10 disabled:opacity-50"
        >
          <Save size={18} /> {isSaving ? "Menyimpan..." : "SIMPAN TEMPLATE"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <div className="lg:col-span-3 border-r border-gray-100 p-6 overflow-y-auto bg-gray-50/30 space-y-6 scrollbar-hide">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nama Template</label>
            <input
              className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm font-black focus:border-indigo-400 outline-none"
              placeholder="Contoh: Panitia Wisuda 2025"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          {baseImage && (
            <div className="space-y-4 animate-fade-in">
              {activeCategory === "twibbon-idcard" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Mode Gaya Teks:</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white border border-gray-200 rounded-xl">
                    <button onClick={() => setStyleMode("dynamic")} className={`py-2 text-[9px] font-black uppercase rounded-lg transition ${styleMode === "dynamic" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-50"}`}>Dinamis</button>
                    <button onClick={() => setStyleMode("static")} className={`py-2 text-[9px] font-black uppercase rounded-lg transition ${styleMode === "static" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-50"}`}>Statis</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {activeCategory === "twibbon-idcard" && (
                    <button onClick={() => addRule("photo", "Area Foto")} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-center">
                      <ImageIcon size={20} className="text-indigo-500" />
                      <span className="text-[10px] font-black uppercase">Area Foto</span>
                    </button>
                  )}
                  <button onClick={() => addRule("logo", "Area Logo")} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-center">
                    <ImageIcon size={20} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase">Area Logo</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowRuleConfig({ id: "temp", type: "text" })} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-center">
                    <Type size={20} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase">Teks/Nama</span>
                  </button>
                  <button
                    disabled={activeCategory === "twibbon-idcard" && styleMode === "dynamic"}
                    onClick={() => setShowRuleConfig({ id: "temp", type: "dropdown" })}
                    className={`bg-white border p-4 rounded-2xl flex flex-col items-center gap-2 transition text-center ${
                      activeCategory === "twibbon-idcard" && styleMode === "dynamic" ? "border-gray-100 opacity-50 cursor-not-allowed" : "border-gray-200 hover:border-indigo-400"
                    }`}
                  >
                    <Briefcase size={20} className={activeCategory === "twibbon-idcard" && styleMode === "dynamic" ? "text-gray-300" : "text-indigo-500"} />
                    <span className="text-[10px] font-black uppercase">Pilihan Khusus</span>
                  </button>
                </div>
              </div>

              {activeCategory === "twibbon-lanyard" && (
                <button 
                  onClick={() => applyLanyardDefaultLayout((rule) => setRules((prev) => [...prev, rule]))} 
                  className="w-full bg-blue-50 border border-blue-200 text-blue-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition"
                >
                  <Scissors size={14} /> Set Layout Default (90cm)
                </button>
              )}

              <div className="pt-4 border-t border-gray-100 space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    onClick={() => setActiveRuleId(rule.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      activeRuleId === rule.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {rule.type === "logo" || rule.type === "photo" ? <ImageIcon size={14} /> : <Type size={14} />}
                      <span className="text-[10px] font-black uppercase block leading-none">{rule.label}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }} className={`${activeRuleId === rule.id ? "text-white/60 hover:text-white" : "text-red-300 hover:text-red-500"}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!baseImage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-4 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-200 transition bg-white"
            >
              <Upload size={32} />
              <span className="text-xs font-black uppercase tracking-widest px-4">Upload PNG Background</span>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png" onChange={handleFileUpload} />
            </button>
          )}
        </div>

        {/* Visual Editor Area */}
        <div className="lg:col-span-9 bg-gray-300 overflow-x-auto overflow-y-auto flex items-center justify-center custom-scrollbar p-12 lg:p-24 relative">
          {baseImage && (
            <div className="absolute top-6 left-6 z-50 flex items-center bg-white/90 backdrop-blur shadow-lg rounded-2xl border border-gray-100 p-1.5">
              <button onClick={() => setZoom(Math.max(0.4, zoom - 0.2))} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition"><Minus size={18} /></button>
              <span className="text-[10px] font-black w-12 text-center text-gray-800">{zoom.toFixed(1)}x</span>
              <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition"><Plus size={18} /></button>
            </div>
          )}

          {baseImage && (
            <div className="relative flex-shrink-0 transition-transform duration-300 ease-out origin-center" style={{ width: `${visualWidth}px`, height: `${visualHeight}px`, transform: `scale(${zoom})` }}>
              <div ref={editorRef} className="relative shadow-2xl bg-white select-none w-full h-full" style={{ backgroundImage: `url(${baseImage})`, backgroundSize: "100% 100%" }}>
                {activeCategory === "twibbon-lanyard" && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 bg-red-500/20 border-r border-red-500/30 flex items-center justify-center z-0 overflow-hidden" style={{ width: `${foldPercent}%` }}>
                      <span className="text-[6px] font-black text-red-700/60 uppercase whitespace-nowrap px-1">LIPAT 7cm</span>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 border-l border-red-500/30 flex items-center justify-center z-0 overflow-hidden" style={{ width: `${foldPercent}%` }}>
                      <span className="text-[6px] font-black text-red-700/60 uppercase whitespace-nowrap px-1">LIPAT 7cm</span>
                    </div>
                    <div className="absolute top-0 bottom-0 border-x border-blue-500/20 bg-blue-500/5 pointer-events-none" style={{ left: "41.66%", width: "16.67%" }}></div>
                  </>
                )}

                {rules.map((rule) => {
                  const isActive = activeRuleId === rule.id;
                  return (
                    <div
                      key={rule.id}
                      className={`absolute border flex items-center justify-center transition-all ${isActive ? "border-indigo-500 bg-indigo-50/20 z-20 shadow-xl" : "border-white/50 bg-white/10 z-10"}`}
                      style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%`, cursor: "move" }}
                      onMouseDown={(e) => {
                        setActiveRuleId(rule.id);
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const initialX = rule.x;
                        const initialY = rule.y;
                        const onMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = ((moveEvent.clientX - startX) / (editorRef.current?.offsetWidth || 1) / (zoom || 1)) * 100;
                          const deltaY = ((moveEvent.clientY - startY) / (editorRef.current?.offsetHeight || 1) / (zoom || 1)) * 100;
                          updateRule(rule.id, { x: Math.max(0, Math.min(100 - rule.width, initialX + deltaX)), y: Math.max(0, Math.min(100 - rule.height, initialY + deltaY)) });
                        };
                        const onMouseUp = () => {
                          window.removeEventListener("mousemove", onMouseMove);
                          window.removeEventListener("mouseup", onMouseUp);
                        };
                        window.addEventListener("mousemove", onMouseMove);
                        window.addEventListener("mouseup", onMouseUp);
                      }}
                    >
                      <span className={`text-[7px] font-black uppercase drop-shadow-md text-center px-0.5 pointer-events-none leading-none ${isActive ? "text-white" : "text-white/70"}`} style={{ fontFamily: rule.fontFamily || "Inter", color: rule.fontColor || "#000000" }}>{rule.label}</span>
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 cursor-se-resize flex items-center justify-center"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const initialWidth = rule.width;
                          const initialHeight = rule.height;
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const deltaWidth = ((moveEvent.clientX - startX) / (editorRef.current?.offsetWidth || 1) / (zoom || 1)) * 100;
                            const deltaHeight = ((moveEvent.clientY - startY) / (editorRef.current?.offsetHeight || 1) / (zoom || 1)) * 100;
                            updateRule(rule.id, { width: Math.max(1, Math.min(100 - rule.x, initialWidth + deltaWidth)), height: Math.max(1, Math.min(100 - rule.y, initialHeight + deltaHeight)) });
                          };
                          const onMouseUp = () => {
                            window.removeEventListener("mousemove", onMouseMove);
                            window.removeEventListener("mouseup", onMouseUp);
                          };
                          window.addEventListener("mousemove", onMouseMove);
                          window.addEventListener("mouseup", onMouseUp);
                        }}
                      >
                        <Maximize size={6} className="text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRuleConfig && (
        <RuleConfigDialog
          type={showRuleConfig.type}
          styleMode={styleMode}
          onClose={() => setShowRuleConfig(null)}
          onConfirm={(l, o, ff, fc) => addRule(showRuleConfig.type, l, o, ff, fc)}
        />
      )}
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

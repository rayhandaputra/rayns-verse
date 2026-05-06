import React, { useState, useRef } from "react";
import { Plus, X, Upload } from "lucide-react";
import { type RuleType, type StyleMode } from "~/types/design";

interface RuleConfigDialogProps {
  type: RuleType;
  styleMode: StyleMode;
  onClose: () => void;
  onConfirm: (label: string, options: string[], fontFamily: string, fontColor: string) => void;
}

export const RuleConfigDialog: React.FC<RuleConfigDialogProps> = ({
  type,
  styleMode,
  onClose,
  onConfirm
}) => {
  const [label, setLabel] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontColor, setFontColor] = useState("#000000");
  const [customFontData, setCustomFontData] = useState<string | undefined>(undefined);
  
  const fontUploadRef = useRef<HTMLInputElement>(null);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomFontData(base64);
        setFontFamily(file.name.split(".")[0]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!label) return alert("Label wajib diisi!");
    onConfirm(label, options, fontFamily, fontColor);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-10">
        <h3 className="text-xl font-black text-gray-800 mb-6 uppercase">
          Pengaturan {type === "dropdown" ? "Pilihan" : "Teks"}
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              Nama Kebutuhan (Label):
            </label>
            <input
              autoFocus
              className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-black focus:border-indigo-400 outline-none"
              placeholder="Contoh: NAMA, NIM, KELAS"
              value={label}
              onChange={(e) => setLabel(e.target.value.toUpperCase())}
            />
          </div>

          {styleMode === "static" && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Pilih Font:
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border-2 border-gray-100 rounded-xl p-4 text-sm font-black outline-none bg-white"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                  >
                    <option>Inter</option>
                    <option>Serif</option>
                    <option>Monospace</option>
                    <option>Cursive</option>
                    {customFontData && <option value={fontFamily}>{fontFamily} (Kustom)</option>}
                    <option value="upload">-- Upload --</option>
                  </select>
                  {fontFamily === "upload" && (
                    <button onClick={() => fontUploadRef.current?.click()} className="bg-indigo-600 text-white px-4 rounded-xl shadow-md">
                      <Upload size={18} />
                    </button>
                  )}
                  <input type="file" ref={fontUploadRef} className="hidden" accept=".ttf,.otf,.woff" onChange={handleFontUpload} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Warna Font:
                </label>
                <div className="flex gap-2 items-center border-2 border-gray-100 rounded-xl p-2 bg-white">
                  <input
                    type="color"
                    className="w-10 h-10 rounded border-0 cursor-pointer p-0 bg-transparent"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 text-[10px] font-mono font-black uppercase outline-none"
                    value={fontColor}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith("#")) val = "#" + val;
                      setFontColor(val.slice(0, 7));
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {type === "dropdown" && (
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">
                Tambah Daftar Pilihan:
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 border-2 border-white rounded-xl p-3 text-xs font-bold"
                  placeholder="Isi Nama Pilihan"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (newOption) {
                      setOptions([...options, newOption]);
                      setNewOption("");
                    }
                  }}
                  className="bg-indigo-600 text-white p-3 rounded-xl"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 group">
                    <span>{opt}</span>
                    <button
                      onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                      className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-4 text-xs font-black text-gray-400 bg-gray-50 rounded-2xl uppercase">
              Batal
            </button>
            <button onClick={handleConfirm} className="flex-1 py-4 text-xs font-black text-white bg-indigo-600 rounded-2xl uppercase shadow-lg shadow-indigo-200">
              Set Area
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

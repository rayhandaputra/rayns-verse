import React, { useState, useRef, useEffect } from 'react';
import { 
    Palette, Maximize2, GraduationCap, Type, Target, Calendar, Layers, Scissors, Upload, Trash2 
} from 'lucide-react';
import { loadSelempangAssets, saveSelempangAssets, type SelempangAsset } from '~/utils/selempang-db';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

type SelempangCategory = 'skin' | 'motif' | 'logo' | 'font' | 'tengah' | 'tahun' | 'bawah_atas' | 'bawah_sudut';

const CATEGORY_LABELS: Record<SelempangCategory, { label: string, icon: any, color: string }> = {
    skin: { label: 'Skin Kain', icon: Palette, color: 'text-rose-500' },
    motif: { label: 'Motif Pinggiran', icon: Maximize2, color: 'text-amber-600' },
    logo: { label: 'Logo Kampus', icon: GraduationCap, color: 'text-blue-500' },
    font: { label: 'Pilihan Font', icon: Type, color: 'text-indigo-600' },
    tengah: { label: 'Ornamen Tengah', icon: Target, color: 'text-amber-500' },
    tahun: { label: 'Tahun Angkatan', icon: Calendar, color: 'text-purple-500' },
    bawah_atas: { label: 'Bawah (Atas)', icon: Layers, color: 'text-indigo-500' },
    bawah_sudut: { label: 'Bawah (Sudut)', icon: Scissors, color: 'text-emerald-500' }
};

export const SelempangAssetManager: React.FC = () => {
    const [selempangAssets, setSelempangAssets] = useState<SelempangAsset[]>([]);
    const [sAssetCategory, setSAssetCategory] = useState<SelempangCategory>('skin');
    const sFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            const loaded = await loadSelempangAssets();
            setSelempangAssets(loaded);
        };
        init();
    }, []);

    const handleSAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        const newAssets: SelempangAsset[] = [];

        for (const file of files) {
            const data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            newAssets.push({
                id: 'sa-' + Math.random().toString(36).substr(2, 9),
                name: file.name.split('.')[0],
                type: sAssetCategory === 'skin' ? 'skin' : (sAssetCategory === 'font' ? 'font' : 'ornamen'),
                category: sAssetCategory,
                data: data,
                createdAt: new Date().toISOString()
            });
        }

        const updated = [...newAssets, ...selempangAssets];
        setSelempangAssets(updated);
        await saveSelempangAssets(updated);
        if (sFileInputRef.current) sFileInputRef.current.value = '';
        toast.success(`${newAssets.length} file berhasil diunggah`);
    };

    const deleteSAsset = async (id: string) => {
        const res = await Swal.fire({
            title: 'Hapus Aset?',
            text: 'Yakin ingin menghapus aset selempang ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });
        if (res.isConfirmed) {
            const updated = selempangAssets.filter(a => a.id !== id);
            setSelempangAssets(updated);
            await saveSelempangAssets(updated);
            toast.success('Aset berhasil dihapus');
        }
    };

    useEffect(() => {
        const fonts = selempangAssets.filter(a => a.category === 'font');
        fonts.forEach(font => {
            const fontName = `S_FONT_${font.id}`;
            if (!document.getElementById(fontName)) {
                const style = document.createElement('style');
                style.id = fontName;
                style.innerHTML = `@font-face { font-family: '${fontName}'; src: url(${font.data}); }`;
                document.head.appendChild(style);
            }
        });
    }, [selempangAssets]);

    return (
        <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 gap-4">
                <div>
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Database Aset Selempang</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">
                        Pilih kategori lalu klik kotak "Upload" untuk memasukkan file PNG / Font.
                    </p>
                </div>
                <div className="flex flex-wrap bg-gray-50 p-1 rounded-xl gap-1">
                    {(Object.keys(CATEGORY_LABELS) as SelempangCategory[]).map(cat => {
                        const Config = CATEGORY_LABELS[cat];
                        const Icon = Config.icon;
                        return (
                            <button 
                                key={cat}
                                onClick={() => setSAssetCategory(cat)} 
                                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase rounded-lg transition ${sAssetCategory === cat ? 'bg-white shadow text-emerald-600 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Icon size={12} className={sAssetCategory === cat ? Config.color : ''} />
                                {Config.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <div onClick={() => sFileInputRef.current?.click()} className="aspect-[1/2] border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group">
                    <Upload size={32} className="group-hover:text-emerald-500 group-hover:scale-105 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-wider px-4 text-center leading-tight">Upload ke {CATEGORY_LABELS[sAssetCategory].label}</span>
                    <input type="file" ref={sFileInputRef} className="hidden" accept={sAssetCategory === 'font' ? '.ttf,.otf' : 'image/png'} multiple onChange={handleSAssetUpload} />
                </div>

                {selempangAssets.filter(a => a.category === sAssetCategory).map(asset => (
                    <div key={asset.id} className="aspect-[1/2] bg-gray-50 border border-gray-100 rounded-[24px] overflow-hidden group relative shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="w-full h-full p-4 flex items-center justify-center">
                            {asset.category === 'font' ? (
                                <div className="text-center space-y-1">
                                    <div style={{ fontFamily: `S_FONT_${asset.id}` }} className="text-4xl text-gray-800 font-bold">Aa</div>
                                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Preview</div>
                                </div>
                            ) : (
                                <img src={asset.data} className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
                            <button onClick={() => deleteSAsset(asset.id)} className="bg-red-500 text-white p-3 rounded-full hover:scale-105 active:scale-95 transition shadow-lg"><Trash2 size={18}/></button>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl border border-gray-100 text-[8px] font-black uppercase truncate text-center shadow-sm">{asset.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

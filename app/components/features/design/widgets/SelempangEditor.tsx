import React, { useState, useEffect } from 'react';
import { 
    X, School, User, Eye, Loader2, Download, Save, CheckCircle2, Target, Type as TypeIcon, Calendar 
} from 'lucide-react';
import { loadSelempangAssets, type SelempangAsset } from '~/utils/selempang-db';
import { CompactSlider, ObjectGallery } from './EditorSubcomponents';
import { drawSide, SIDE_W, SIDE_H, TRIANGLE_H, PPCM, MARGIN_TOP_CM } from './DrawHelpers';

interface SelempangEditorProps {
    onExport: (base64: string, name: string) => void;
    onClose: () => void;
}

const LOCKED_ZOOM = 0.05;

export const SelempangEditor: React.FC<SelempangEditorProps> = ({ onExport, onClose }) => {
    const [assets, setAssets] = useState<SelempangAsset[]>([]);
    const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
    const [selectedMotif, setSelectedMotif] = useState<string | null>(null);
    const [threadColor, setThreadColor] = useState('#FFD700');
    const [globalFont, setGlobalFont] = useState('"Times New Roman"');
    
    const [isExporting, setIsExporting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<string | null>(null);
    
    const [nameText, setNameText] = useState({ value: '', size: 320, spacing: 5, pos: 50 });
    const [campusLogo, setCampusLogo] = useState<string>('');
    const [campusLogoSize, setCampusLogoSize] = useState<number>(80);
    const [campusLogoPosX, setCampusLogoPosX] = useState<number>(50);
    const [campusName, setCampusName] = useState({ value: '', size: 120, spacing: 2, pos: 25 });
    const [midMode, setMidMode] = useState<'ornamen' | 'text'>('ornamen');
    const [campusMidOrn, setCampusMidOrn] = useState({ id: '', size: 80, y: 45 }); 
    const [campusMidText, setCampusMidText] = useState({ value: 'CUMLAUDE', size: 180, spacing: 25, pos: 45 });
    const [campusProdi, setCampusProdi] = useState({ value: '', size: 90, spacing: 2, pos: 60 });
    const [campusYearOrn, setCampusYearOrn] = useState({ id: '', size: 80, y: 15 }); 
    const [ornBottomTop, setOrnBottomTop] = useState({ id: '', size: 80, y: 18 }); 
    const [ornBottomSudut, setOrnBottomSudut] = useState({ id: '', size: 39.5, y: 2 }); 

    useEffect(() => {
        const init = async () => {
            const loaded = await loadSelempangAssets();
            setAssets(loaded);
            const skins = loaded.filter(a => a.category === 'skin');
            if (skins.length > 0) setSelectedSkin(skins[0].data);

            const customFonts = loaded.filter(a => a.category === 'font');
            customFonts.forEach(font => {
                const fontName = `S_FONT_${font.id}`;
                if (!document.getElementById(fontName)) {
                    const style = document.createElement('style');
                    style.id = fontName;
                    style.innerHTML = `@font-face { font-family: '${fontName}'; src: url(${font.data}); }`;
                    document.head.appendChild(style);
                }
            });
        };
        init();
    }, []);

    const filterAssets = (cat: any) => assets.filter(a => a.category === cat);

    const handleRender = async (trans: boolean) => {
        setIsExporting(true);
        const canvas = document.createElement('canvas');
        canvas.width = (SIDE_W * 2) + 200; 
        canvas.height = SIDE_H;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const drawConfig = {
                selectedSkin, selectedMotif, threadColor, globalFont, nameText,
                campusLogo, campusLogoSize, campusLogoPosX, campusName, midMode,
                campusMidOrn, campusMidText, campusProdi, campusYearOrn,
                ornBottomTop, ornBottomSudut
            };
            await drawSide(ctx, 'kampus', trans, drawConfig, assets);
            ctx.translate(SIDE_W + 200, 0);
            await drawSide(ctx, 'nama', trans, drawConfig, assets);
            setPreviewData(canvas.toDataURL('image/png'));
            setShowPreview(true);
        }
        setIsExporting(false);
    };

    return (
        <div className="bg-white flex flex-col h-full overflow-hidden animate-fade-in no-print text-gray-800">
            <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20 flex-shrink-0 relative shadow-sm">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-red-500"><X size={24}/></button>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">1. KAIN</span>
                        <select className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black outline-none focus:border-blue-500" value={assets.find(a => a.data === selectedSkin)?.id || ''} onChange={e => setSelectedSkin(assets.find(a => a.id === e.target.value)?.data || null)}>
                            {assets.filter(a => a.category === 'skin').map(skin => (<option key={skin.id} value={skin.id}>{skin.name.toUpperCase()}</option>))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">2. MOTIF</span>
                        <select className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black outline-none focus:border-blue-500" value={assets.find(a => a.data === selectedMotif)?.id || ''} onChange={e => setSelectedMotif(assets.find(a => a.id === e.target.value)?.data || null)}>
                            <option value="">POLOS</option>
                            {assets.filter(a => a.category === 'motif').map(motif => (<option key={motif.id} value={motif.id}>{motif.name.toUpperCase()}</option>))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">3. BENANG</span>
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                            <button onClick={() => setThreadColor('#FFD700')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition ${threadColor === '#FFD700' ? 'bg-white text-amber-500 shadow-md' : 'text-gray-400'}`}>EMAS</button>
                            <button onClick={() => setThreadColor('#FFFFFF')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition ${threadColor === '#FFFFFF' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400'}`}>PUTIH</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">4. FONT</span>
                        <select className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black outline-none focus:border-blue-500" value={globalFont} onChange={e => setGlobalFont(e.target.value)}>
                            <option value='"Times New Roman"'>TIMES NEW ROMAN</option>
                            <option value='Arial'>ARIAL</option>
                            <option value='Georgia'>GEORGIA</option>
                            <option value='Serif'>SERIF</option>
                            {assets.filter(a => a.category === 'font').map(f => (
                                <option key={f.id} value={`S_FONT_${f.id}`}>{f.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[410px] border-r border-gray-100 bg-white flex flex-col h-full shadow-sm z-10">
                    <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <School size={20} className="text-blue-600"/>
                        <span className="font-black text-xs text-gray-800 uppercase tracking-widest">Sisi Kampus (Kiri)</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                            <ObjectGallery label="1. Logo Utama" items={filterAssets('logo')} selectedId={assets.find(a => a.data === campusLogo)?.id || ''} onSelect={(id) => setCampusLogo(assets.find(a => a.id === id)?.data || '')} />
                            {campusLogo && (
                                <CompactSlider label="Ukuran Logo" value={campusLogoSize} min={10} max={250} onChange={(v:any) => setCampusLogoSize(v)} />
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: "Nama Instansi", state: campusName, set: setCampusName },
                                { label: "Program Studi", state: campusProdi, set: setCampusProdi },
                            ].map((row, i) => (
                                <div key={i} className="p-4 bg-gray-50/50 rounded-2xl space-y-3 border border-gray-100 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{row.label}</label>
                                    <input className="w-full bg-white border-2 border-gray-100 p-3.5 rounded-xl text-sm font-black uppercase outline-none focus:border-blue-400 shadow-inner" value={row.state.value} onChange={e => row.set({...row.state, value: e.target.value})} placeholder="KETIK DISINI..." />
                                    <div className="grid grid-cols-2 gap-3">
                                        <CompactSlider label="Ukuran" value={row.state.size} min={40} max={350} onChange={(v:any) => row.set({...row.state, size: v})} />
                                        <CompactSlider label="Posisi" value={row.state.pos} min={10} max={80} onChange={(v:any) => row.set({...row.state, pos: v})} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-5 bg-blue-50/30 rounded-3xl border border-blue-100 space-y-5 shadow-sm">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">3. Area Tengah</span>
                                <div className="flex bg-white p-1 rounded-xl border border-gray-200 scale-90 origin-right">
                                    <button onClick={() => setMidMode('ornamen')} className={`p-2 rounded-lg transition ${midMode === 'ornamen' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><Target size={16}/></button>
                                    <button onClick={() => setMidMode('text')} className={`p-2 rounded-lg transition ${midMode === 'text' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><TypeIcon size={16}/></button>
                                </div>
                            </div>
                            {midMode === 'ornamen' ? (
                                <>
                                    <ObjectGallery label="Pilih Ornamen" items={filterAssets('tengah')} selectedId={campusMidOrn.id} onSelect={(id) => setCampusMidOrn({...campusMidOrn, id})} />
                                    {campusMidOrn.id && (
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <CompactSlider label="Ukuran" value={campusMidOrn.size} min={10} max={250} onChange={(v:any) => setCampusMidOrn({...campusMidOrn, size: v})} />
                                            <CompactSlider label="Posisi" value={campusMidOrn.y} min={10} max={80} onChange={(v:any) => setCampusMidOrn({...campusMidOrn, y: v})} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <input className="w-full bg-white border-2 border-blue-100 p-4 rounded-xl text-sm font-black uppercase outline-none focus:border-blue-400 shadow-inner" value={campusMidText.value} onChange={e => setCampusMidText({...campusMidText, value: e.target.value})} placeholder="TEXT VERTIKAL (MISAL: CUMLAUDE)" />
                                    <CompactSlider label="Font Size" value={campusMidText.size} min={70} max={300} onChange={(v:any) => setCampusMidText({...campusMidText, size: v})} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <CompactSlider label="Gap Text" value={campusMidText.spacing} min={0} max={100} onChange={(v:any) => setCampusMidText({...campusMidText, spacing: v})} />
                                        <CompactSlider label="Pos Y" value={campusMidText.pos} min={10} max={80} onChange={(v:any) => setCampusMidText({...campusMidText, pos: v})} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-purple-50/20 rounded-2xl border border-purple-100 space-y-4 shadow-sm">
                            <ObjectGallery label="4. Tahun Lulus" items={filterAssets('tahun')} selectedId={campusYearOrn.id} onSelect={(id) => setCampusYearOrn({...campusYearOrn, id})} />
                            {campusYearOrn.id && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <CompactSlider label="Ukuran" value={campusYearOrn.size} min={10} max={250} onChange={(v:any) => setCampusYearOrn({...campusYearOrn, size: v})} />
                                    <CompactSlider label="Posisi" value={campusYearOrn.y} min={5} max={80} onChange={(v:any) => setCampusYearOrn({...campusYearOrn, y: v})} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gray-200 flex flex-col overflow-hidden relative shadow-inner">
                    <div className="flex-1 overflow-hidden p-[5%_40%] flex items-start justify-center">
                        <div 
                            className="flex gap-12 items-start origin-top transition-transform duration-200 will-change-transform"
                            style={{ transform: `scale(${LOCKED_ZOOM}) translateY(-5%)` }}
                        >
                            {[0, 1].map((idx) => (
                                <div key={idx} className="flex flex-col items-center gap-10">
                                    <div className="relative shadow-[0_150px_300px_rgba(0,0,0,0.3)] bg-black transition-all duration-500 flex-shrink-0" 
                                        style={{ 
                                            width: `${SIDE_W}px`, height: `${SIDE_H}px`,
                                            backgroundImage: selectedSkin ? `url(${selectedSkin})` : 'none',
                                            backgroundSize: 'cover',
                                            clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${TRIANGLE_H}px), 50% 100%, 0 calc(100% - ${TRIANGLE_H}px))`
                                        }}>
                                        <div className="w-full h-full relative overflow-hidden" style={{ clipPath: 'inherit' }}>
                                            {selectedMotif && (
                                                <div className="absolute inset-0 z-0 opacity-95" 
                                                     style={{ 
                                                        backgroundImage: `url(${selectedMotif})`, 
                                                        backgroundSize: '100% auto', 
                                                        backgroundPosition: 'center top',
                                                        backgroundRepeat: 'no-repeat',
                                                        filter: threadColor === '#FFFFFF' ? 'brightness(0) invert(1)' : 'sepia(1) saturate(10000%) hue-rotate(10deg) brightness(1)' 
                                                    }} />
                                            )}
                                            {idx === 0 ? (
                                                <div className="w-full h-full relative z-10">
                                                    {campusLogo && (
                                                        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${MARGIN_TOP_CM * PPCM}px` }}>
                                                            <img src={campusLogo} style={{ width: `${(campusLogoSize/100)*SIDE_W*2}px`, height: 'auto', maxWidth: 'none' }} className="object-contain" />
                                                        </div>
                                                    )}
                                                    {[campusName, campusProdi].map((st, i) => (
                                                        <div key={i} className="absolute font-black uppercase text-center w-full leading-tight px-20 text-white" 
                                                            style={{ color: threadColor, fontFamily: globalFont, fontSize: `${st.size}px`, top: `${st.pos * PPCM}px` }}>{st.value}</div>
                                                    ))}
                                                    {midMode === 'ornamen' ? (
                                                        campusMidOrn.id && (
                                                            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${campusMidOrn.y * PPCM}px` }}>
                                                                <img src={assets.find(a => a.id === campusMidOrn.id)?.data} style={{ width: `${(campusMidOrn.size/100)*SIDE_W*2}px`, height: 'auto', maxWidth: 'none' }} className="brightness-0 invert opacity-80" />
                                                            </div>
                                                        )
                                                    ) : (
                                                        campusMidText.value && (
                                                            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-none" style={{ top: `${campusMidText.pos * PPCM}px`, color: threadColor, fontFamily: globalFont, fontSize: `${campusMidText.size}px`, gap: `${campusMidText.spacing}px`, transform: 'translateY(-50%)' }}>
                                                                {campusMidText.value.split('').map((c, i) => <span key={i} className="font-black">{c.toUpperCase()}</span>)}
                                                            </div>
                                                        )
                                                    )}
                                                    {campusYearOrn.id && (
                                                        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${campusYearOrn.y * PPCM}px` }}>
                                                            <img src={assets.find(a => a.id === campusYearOrn.id)?.data} style={{ width: `${(campusYearOrn.size/100)*SIDE_W*2}px`, height: 'auto', maxWidth: 'none' }} className="brightness-0 invert opacity-80" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center relative z-10">
                                                    <div className="rotate-90 font-black uppercase text-center whitespace-nowrap" 
                                                        style={{ color: threadColor, fontFamily: globalFont, fontSize: `${nameText.size}px`, letterSpacing: `${nameText.spacing}px`, transform: `rotate(90deg) translateX(${(nameText.pos - 50) * (SIDE_W/20)}px)` }}>
                                                        {nameText.value || 'NAMA LENGKAP ANDA'}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 pointer-events-none z-10">
                                                {ornBottomTop.id && (
                                                    <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${ornBottomTop.y * PPCM}px` }}>
                                                        <img src={assets.find(a => a.id === ornBottomTop.id)?.data} style={{ width: `${(ornBottomTop.size/100)*SIDE_W*2}px`, height: 'auto', maxWidth: 'none' }} className="brightness-0 invert opacity-80" />
                                                    </div>
                                                )}
                                                {ornBottomSudut.id && (
                                                    <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${ornBottomSudut.y * PPCM}px` }}>
                                                        <img src={assets.find(a => a.id === ornBottomSudut.id)?.data} style={{ width: `${(ornBottomSudut.size/100)*SIDE_W*2}px`, height: 'auto', maxWidth: 'none' }} className="brightness-0 invert opacity-80" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-16 flex items-center justify-center bg-white border-t border-gray-100 flex-shrink-0 z-30">
                         <button onClick={() => handleRender(false)} disabled={isExporting} className="px-10 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs flex items-center gap-3 transition-all shadow-xl active:scale-95 border border-white/10">
                            {isExporting ? <Loader2 size={16} className="animate-spin"/> : <Eye size={16}/>} LIHAT HASIL AKHIR (300 PPI)
                         </button>
                    </div>
                </div>

                <div className="w-[390px] border-l border-gray-100 bg-white flex flex-col h-full shadow-sm z-10">
                    <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <User size={20} className="text-emerald-600"/>
                        <span className="font-black text-xs text-gray-800 uppercase tracking-widest">Sisi Nama (Kanan)</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Teks Nama Lengkap:</label>
                            <input className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl text-sm font-black focus:border-emerald-400 outline-none uppercase shadow-inner" placeholder="NAMA LENGKAP..." value={nameText.value} onChange={e => setNameText({...nameText, value: e.target.value})} />
                            <div className="p-4 bg-emerald-50/20 rounded-3xl border border-emerald-100 space-y-4 shadow-sm">
                                <CompactSlider label="Ukuran Font" value={nameText.size} min={100} max={600} onChange={(v: any) => setNameText({...nameText, size: v})} />
                                <div className="grid grid-cols-2 gap-3">
                                    <CompactSlider label="Jarak Huruf" value={nameText.spacing} min={0} max={40} onChange={(v: any) => setNameText({...nameText, spacing: v})} />
                                    <CompactSlider label="Posisi" value={nameText.pos} min={10} max={90} onChange={(v: any) => setNameText({...nameText, pos: v})} />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-4 shadow-sm">
                            <ObjectGallery label="2. Ornamen Bawah (Atas)" items={filterAssets('bawah_atas')} selectedId={ornBottomTop.id} onSelect={(id) => setOrnBottomTop({...ornBottomTop, id})} />
                            {ornBottomTop.id && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <CompactSlider label="Ukuran" value={ornBottomTop.size} min={10} max={250} onChange={(v:any) => setOrnBottomTop({...ornBottomTop, size: v})} />
                                    <CompactSlider label="Jarak (cm)" value={ornBottomTop.y} min={5} max={40} onChange={(v:any) => setOrnBottomTop({...ornBottomTop, y: v})} unit="cm" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-emerald-50/20 rounded-3xl border border-emerald-100 space-y-4 shadow-sm">
                            <ObjectGallery label="3. Ornamen Bawah (Sudut)" items={filterAssets('bawah_sudut')} selectedId={ornBottomSudut.id} onSelect={(id) => setOrnBottomSudut({...ornBottomSudut, id})} />
                            {ornBottomSudut.id && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <CompactSlider label="Ukuran" value={ornBottomSudut.size} min={10} max={250} onChange={(v:any) => setOrnBottomSudut({...ornBottomSudut, size: v})} />
                                    <CompactSlider label="Jarak (cm)" value={ornBottomSudut.y} min={0} max={25} onChange={(v:any) => setOrnBottomSudut({...ornBottomSudut, y: v})} unit="cm" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showPreview && previewData && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-fade-in">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl shadow-sm"><CheckCircle2 size={32}/></div>
                                <div><h4 className="font-black text-xl text-gray-900 uppercase">Simulasi Bordir HD</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Sesuai Skala Cetak 170cm x 13cm (300 PPI)</p></div>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-3 hover:bg-gray-200 rounded-full transition text-gray-500"><X size={32}/></button>
                        </div>
                        <div className="flex-1 bg-gray-100/50 p-10 flex items-center justify-center overflow-auto">
                            <img src={previewData} className="max-h-full shadow-[0_50px_100px_rgba(0,0,0,0.1)] rounded-2xl border-[16px] border-white bg-white" />
                        </div>
                        <div className="p-8 bg-white border-t border-gray-100 flex gap-6">
                            <button onClick={() => { const l = document.createElement('a'); l.download = `Selempang_HD_${Date.now()}.png`; l.href = previewData; l.click(); }} className="flex-1 bg-gray-900 hover:bg-black text-white py-5 rounded-[24px] font-black uppercase text-sm flex items-center justify-center gap-4 transition-all shadow-xl"><Download size={24}/> DOWNLOAD FILE PNG</button>
                            <button onClick={() => onExport(previewData, nameText.value || 'Selempang')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[24px] font-black uppercase text-sm flex items-center justify-center gap-4 transition-all shadow-xl"><Save size={24}/> SIMPAN KE DRIVE CUSTOMER</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}</style>
        </div>
    );
};

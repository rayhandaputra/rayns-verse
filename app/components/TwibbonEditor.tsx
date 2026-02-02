
import React, { useState, useRef, useEffect } from 'react';
import type { DesignTemplate } from '../types';
import {
    Upload, Move, ZoomIn, ZoomOut, Type, Image as ImageIcon,
    Check, X, RefreshCw, Printer, Save, Minus, Plus, AlignCenter, Loader2, Download, Edit3, Trash2, PlusCircle, Palette, Link, Link2, Maximize2, User
} from 'lucide-react';

interface TwibbonEditorProps {
    template: DesignTemplate;
    onExport: (base64: string, fileName: string, firstValue: string) => void;
    onClose: () => void;
}

interface LogoItem {
    src: string;
    scale: number;
}

interface ElementState {
    id: string;
    type: 'photo' | 'text' | 'logo' | 'dropdown';
    x: number;
    y: number;
    scale: number;
    value: string;
    fontSize: number;
    logoGap?: number; // New property for horizontal spacing
}

const TwibbonEditor: React.FC<TwibbonEditorProps> = ({ template, onExport, onClose }) => {
    const [elements, setElements] = useState<ElementState[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<string | null>(null);

    const [globalFont, setGlobalFont] = useState('Inter');
    const [globalColor, setGlobalColor] = useState('#000000');
    const [syncText, setSyncText] = useState(false);

    const [zoom, setZoom] = useState(1);
    const previewBg = '#FFFFFF';

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fontUploadRef = useRef<HTMLInputElement>(null);

    const isLanyard = template.category === 'lanyard';
    const isStatic = template.styleMode === 'static';
    const visualWidth = isLanyard ? 900 : 350;
    const visualHeight = isLanyard ? 22 : 550;

    useEffect(() => {
        const initial = template.rules.map(rule => ({
            id: rule.id,
            type: rule.type,
            x: 0, y: 0, scale: 1,
            value: rule.type === 'logo' ? '[]' : (rule.type === 'dropdown' ? (rule.options?.[0] || '') : ''),
            fontSize: isLanyard ? 16 : 24,
            logoGap: isLanyard ? 5 : 32 // Default gaps
        }));
        setElements(initial);

        const firstTextRule = template.rules.find(r => r.type === 'text');
        if (firstTextRule) {
            if (firstTextRule.fontFamily) setGlobalFont(firstTextRule.fontFamily);
            if (firstTextRule.fontColor) setGlobalColor(firstTextRule.fontColor);
        }
    }, [template]);

    const injectFont = (name: string, data: string) => {
        const style = document.createElement('style');
        style.innerHTML = `@font-face { font-family: '${name}'; src: url(${data}); }`;
        document.head.appendChild(style);
    };

    const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                const fontName = file.name.split('.')[0];
                injectFont(fontName, base64);
                setGlobalFont(fontName);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateElementValue = (id: string, newVal: string) => {
        setElements(prev => {
            let next = prev.map(el => el.id === id ? { ...el, value: newVal } : el);
            if (isLanyard && syncText) {
                const leftTextRule = template.rules.find(r => r.label === 'TEKS KIRI' || r.label === 'MASUKKAN TEKS SISI KIRI');
                const rightTextRule = template.rules.find(r => r.label === 'TEKS KANAN' || r.label === 'MASUKKAN TEKS SISI KANAN');
                if (leftTextRule && rightTextRule && id === leftTextRule.id) {
                    next = next.map(el => el.id === rightTextRule.id ? { ...el, value: newVal } : el);
                }
            }
            return next;
        });
    };

    const handleSyncToggle = (checked: boolean) => {
        setSyncText(checked);
        if (checked) {
            const leftTextRule = template.rules.find(r => r.label === 'TEKS KIRI' || r.label === 'MASUKKAN TEKS SISI KIRI');
            const rightTextRule = template.rules.find(r => r.label === 'TEKS KANAN' || r.label === 'MASUKKAN TEKS SISI KANAN');
            if (leftTextRule && rightTextRule) {
                const leftEl = elements.find(el => el.id === leftTextRule.id);
                if (leftEl) {
                    setElements(prev => prev.map(el => el.id === rightTextRule.id ? { ...el, value: leftEl.value } : el));
                }
            }
        }
    };

    const handleAddLogo = (ruleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => {
                const el = elements.find(e => e.id === ruleId);
                if (el) {
                    const logos: LogoItem[] = JSON.parse(el.value || '[]');
                    logos.push({ src: reader.result as string, scale: 1 });
                    updateElementValue(ruleId, JSON.stringify(logos));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
            e.target.value = '';
        }
    };

    const handleAddPhoto = (ruleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => updateElementValue(ruleId, reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const updateLogoScale = (ruleId: string, index: number, newScale: number) => {
        const el = elements.find(e => e.id === ruleId);
        if (el) {
            const logos: LogoItem[] = JSON.parse(el.value || '[]');
            logos[index].scale = newScale;
            updateElementValue(ruleId, JSON.stringify(logos));
        }
    };

    const updateLogoGap = (ruleId: string, newGap: number) => {
        setElements(prev => prev.map(el => el.id === ruleId ? { ...el, logoGap: newGap } : el));
    };

    const removeLogo = (ruleId: string, index: number) => {
        const el = elements.find(e => e.id === ruleId);
        if (el) {
            const logos: LogoItem[] = JSON.parse(el.value || '[]');
            logos.splice(index, 1);
            updateElementValue(ruleId, JSON.stringify(logos));
        }
    };

    const generateResult = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const targetW = isLanyard ? 6000 : 661;
            const targetH = isLanyard ? 150 : 1039;
            canvas.width = targetW; canvas.height = targetH;

            // HELPER: Load Image via Proxy
            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    // Set CrossOrigin to anonymous to attempt CORS fetching
                    img.crossOrigin = "anonymous";

                    img.onload = () => resolve(img);

                    img.onerror = (e) => {
                        console.error("Image load failed", src, e);
                        reject(e);
                    };

                    // LOGIC PROXY:
                    // If URL is external (starts with http) and not base64 data URI, use proxy route
                    if (src.startsWith('http')) {
                        // Use encodeURIComponent to ensure the URL is safely passed as a query parameter
                        const proxyUrl = `/resources/image-proxy?url=${encodeURIComponent(src)}`;
                        img.src = proxyUrl;
                    } else {
                        // If base64 (local upload via FileReader), load directly
                        img.src = src;
                    }
                });
            };

            // DRAW PHOTO FIRST (LAYER 1 - BEHIND)
            for (const el of elements) {
                if (el.type === 'photo' && el.value) {
                    try {
                        const rule = template.rules.find(r => r.id === el.id)!;
                        const ruleX = (rule.x / 100) * targetW;
                        const ruleY = (rule.y / 100) * targetH;
                        const ruleW = (rule.width / 100) * targetW;
                        const ruleH = (rule.height / 100) * targetH;

                        const img = await loadImage(el.value);

                        const userScale = el.scale || 1;
                        const ratio = img.height / img.width;
                        const ruleRatio = ruleH / ruleW;
                        let sw, sh, sx, sy;

                        if (ratio > ruleRatio) {
                            sw = img.width / userScale;
                            sh = (img.width * ruleRatio) / userScale;
                            sx = (img.width - sw) / 2;
                            sy = (img.height - sh) / 2;
                        } else {
                            sh = img.height / userScale;
                            sw = (img.height / ruleRatio) / userScale;
                            sy = (img.height - sh) / 2;
                            sx = (img.width - sw) / 2;
                        }

                        ctx.drawImage(img, sx, sy, sw, sh, ruleX, ruleY, ruleW, ruleH);
                    } catch (err) {
                        console.error("Failed to draw photo layer", err);
                    }
                }
            }

            // DRAW TEMPLATE (LAYER 5 - OVERLAY)
            try {
                const tplImg = await loadImage(template.baseImage);
                ctx.drawImage(tplImg, 0, 0, targetW, targetH);
            } catch (err) {
                console.error("Failed to load template base image", err);
                alert("Gagal memuat gambar template. Silakan refresh atau coba lagi.");
                setIsExporting(false);
                return; // Stop execution if template fails
            }

            // DRAW TEXT & LOGOS (LAYER 10 - TOP)
            for (const el of elements) {
                const rule = template.rules.find(r => r.id === el.id)!;
                const ruleX = (rule.x / 100) * targetW;
                const ruleY = (rule.y / 100) * targetH;
                const ruleW = (rule.width / 100) * targetW;
                const ruleH = (rule.height / 100) * targetH;

                if (el.type === 'logo') {
                    const logos = JSON.parse(el.value || '[]');
                    if (logos.length === 0) continue;

                    const gapPx = (el.logoGap || (isLanyard ? 5 : 32)) * (targetW / visualWidth);
                    const logoBaseSizePx = isLanyard ? (2 / 90) * targetW : (ruleH * 0.95);

                    let totalW = 0;
                    logos.forEach((l: any, i: number) => {
                        totalW += (logoBaseSizePx * l.scale) + (i < logos.length - 1 ? gapPx : 0);
                    });

                    let finalScaleAdjust = 1;
                    if (totalW > ruleW) {
                        finalScaleAdjust = ruleW / totalW;
                        totalW = ruleW;
                    }

                    let currentStartX = (ruleX + ruleW / 2) - (totalW / 2);

                    for (const lItem of logos) {
                        try {
                            const img = await loadImage(lItem.src);
                            const ratio = img.height / img.width;
                            const currentSize = logoBaseSizePx * lItem.scale * finalScaleAdjust;
                            let dw, dh;

                            if (ratio > 1) {
                                dh = currentSize;
                                dw = dh / ratio;
                            } else {
                                dw = currentSize;
                                dh = dw * ratio;
                            }

                            const centerY = ruleY + (ruleH / 2) - (dh / 2);
                            ctx.drawImage(img, currentStartX + (currentSize - dw) / 2, centerY, dw, dh);
                            currentStartX += (currentSize + (gapPx * finalScaleAdjust));
                        } catch (err) {
                            console.error("Failed to load logo", lItem.src, err);
                        }
                    }
                } else if (el.type === 'text' || el.type === 'dropdown') {
                    if (!el.value) continue;
                    const fSize = (el.fontSize || 16) * (targetH / visualHeight);
                    const fontToUse = isStatic ? (rule.fontFamily || globalFont) : globalFont;
                    const colorToUse = isStatic ? (rule.fontColor || globalColor) : globalColor;

                    ctx.font = `bold ${fSize}px "${fontToUse}", sans-serif`;
                    ctx.fillStyle = colorToUse;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(el.value, ruleX + (ruleW / 2), ruleY + (ruleH / 2));
                }
            }

            // EXPORT
            try {
                const dataUrl = canvas.toDataURL('image/png');
                setPreviewData(dataUrl);
                setShowPreview(true);
            } catch (err) {
                console.error("Canvas Export Error:", err);
                alert("Gagal menyimpan gambar. Masih terjadi masalah keamanan Cross-Origin pada sumber gambar.");
            }

        } finally {
            setIsExporting(false);
        }
    };

    const handleConfirmSubmit = () => {
        if (previewData) {
            const firstValueEl = elements.find(el => el.type === 'text' || el.type === 'dropdown');
            onExport(previewData, `${template.name}.png`, firstValueEl?.value || 'TanpaNama');
            setShowPreview(false);
        }
    };

    const renderControls = () => (
        <div className={`p-8 ${isLanyard ? 'flex gap-8 overflow-x-auto no-scrollbar items-start' : 'space-y-8 overflow-y-auto custom-scrollbar flex-1'}`}>
            <div className={`flex-shrink-0 ${isLanyard ? 'w-96' : 'w-full'} space-y-4`}>
                <div className="flex items-center gap-2 mb-2"><ImageIcon size={14} className="text-blue-600" /><span className="text-[10px] font-black uppercase text-gray-400">UPLOAD LOGO (OPSIONAL)</span></div>
                {elements.filter(el => el.type === 'logo').map(el => {
                    const logos: LogoItem[] = JSON.parse(el.value || '[]');
                    return (
                        <div key={el.id} className="space-y-4">
                            <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                {logos.map((lItem, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg bg-white border overflow-hidden group border-gray-200">
                                        <img src={lItem.src} className="w-full h-full object-contain p-1" />
                                        <button onClick={() => removeLogo(el.id, i)} className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                                <button onClick={() => document.getElementById(`l-add-${el.id}`)?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-blue-400 hover:text-blue-500 hover:bg-white transition"><Plus size={18} /></button>
                                <input id={`l-add-${el.id}`} type="file" className="hidden" accept="image/*" onChange={e => handleAddLogo(el.id, e)} />
                            </div>
                            {logos.length > 0 && (
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4">
                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black text-blue-600 uppercase">Besaran Tiap Logo</span>
                                        {logos.map((lItem, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <img src={lItem.src} className="w-6 h-6 object-contain bg-white rounded border border-blue-200 p-0.5" />
                                                <input type="range" min="0.3" max="2.5" step="0.1" value={lItem.scale} onChange={e => updateLogoScale(el.id, i, parseFloat(e.target.value))} className="flex-1 accent-blue-600" />
                                                <span className="text-[9px] font-mono font-bold text-blue-500 w-8 text-right">{lItem.scale}x</span>
                                            </div>
                                        ))}
                                    </div>

                                    {!isLanyard && (
                                        <div className="pt-2 border-t border-blue-100 space-y-2">
                                            <div className="flex justify-between items-center text-[9px] font-black text-blue-600 uppercase">
                                                <span>Jarak Antar Logo</span>
                                                <span>{el.logoGap}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={el.logoGap || 32}
                                                onChange={e => updateLogoGap(el.id, parseInt(e.target.value))}
                                                className="w-full accent-blue-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!isLanyard && elements.filter(el => el.type === 'photo').length > 0 && (
                <div className="w-full space-y-4">
                    <div className="flex items-center gap-2 mb-2"><User size={14} className="text-orange-600" /><span className="text-[10px] font-black uppercase text-gray-400">FOTO PESERTA</span></div>
                    {elements.filter(el => el.type === 'photo').map(el => (
                        <div key={el.id} className="space-y-4">
                            <div className="relative aspect-square w-32 mx-auto rounded-3xl border-4 border-dashed border-gray-100 overflow-hidden group cursor-pointer hover:border-orange-200 transition bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-300" onClick={() => document.getElementById(`p-add-${el.id}`)?.click()}>
                                {el.value ? <img src={el.value} className="w-full h-full object-cover" /> : <><Plus size={24} /><span className="text-[8px] font-black uppercase">Pilih Foto</span></>}
                                <input id={`p-add-${el.id}`} type="file" className="hidden" accept="image/*" onChange={e => handleAddPhoto(el.id, e)} />
                            </div>
                            {el.value && (
                                <div className="px-4">
                                    <div className="flex justify-between items-center text-[9px] font-black text-orange-600 uppercase mb-2"><span>Zoom Foto</span><span>{(el.scale * 100).toFixed(0)}%</span></div>
                                    <input type="range" min="1" max="3" step="0.05" value={el.scale} onChange={e => setElements(prev => prev.map(x => x.id === el.id ? { ...x, scale: parseFloat(e.target.value) } : x))} className="w-full accent-orange-600" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className={`${isLanyard ? 'h-full w-px bg-gray-100' : 'w-full h-px bg-gray-100'}`}></div>

            {elements.filter(el => el.type === 'text' || el.type === 'dropdown').map((el, idx) => {
                const rule = template.rules.find(r => r.id === el.id);
                const isRightText = rule?.label === 'TEKS KANAN' || rule?.label === 'MASUKKAN TEKS SISI KANAN';
                let displayLabel = rule?.label || 'MASUKKAN TEKS';
                if (isLanyard) displayLabel = isRightText ? 'MASUKKAN TEKS SISI KANAN' : 'MASUKKAN TEKS SISI KIRI';

                return (
                    <div key={el.id} className={`flex-shrink-0 ${isLanyard ? 'w-80' : 'w-full'} space-y-4`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><Type size={14} className="text-indigo-600" /><span className="text-[10px] font-black uppercase text-gray-400">{displayLabel}</span></div>
                            {isLanyard && isRightText && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="hidden" checked={syncText} onChange={e => handleSyncToggle(e.target.checked)} />
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${syncText ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${syncText ? 'left-4.5' : 'left-0.5'}`}></div></div>
                                    <span className="text-[8px] font-black text-gray-400 uppercase group-hover:text-emerald-600">SAMA</span>
                                </label>
                            )}
                        </div>
                        {el.type === 'dropdown' ? (
                            <select className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-black focus:border-blue-400 shadow-sm" value={el.value} onChange={e => updateElementValue(el.id, e.target.value)}>
                                {rule?.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input className={`w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-black focus:border-blue-400 shadow-sm ${syncText && isRightText ? 'opacity-50 pointer-events-none' : ''}`} value={el.value} onChange={e => updateElementValue(el.id, e.target.value)} placeholder="Ketik teks..." readOnly={syncText && isRightText} />
                        )}
                        <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase px-1"><span>Ukuran</span><span>{el.fontSize}px</span></div>
                        <input type="range" min="8" max="72" value={el.fontSize} onChange={e => setElements(prev => prev.map(x => x.id === el.id ? { ...x, fontSize: parseInt(e.target.value) } : x))} className="w-full accent-indigo-600" />
                    </div>
                );
            })}

            {!isStatic && (
                <>
                    <div className={`${isLanyard ? 'h-full w-px bg-gray-100' : 'w-full h-px bg-gray-100'}`}></div>
                    <div className={`flex-shrink-0 ${isLanyard ? 'w-80' : 'w-full'} space-y-5`}>
                        <div className="flex items-center gap-2 mb-2"><Palette size={14} className="text-violet-600" /><span className="text-[10px] font-black uppercase text-gray-400">GANTI STYLE TEKS</span></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Pilih Font</label>
                                <select className="w-full border border-gray-200 rounded-xl p-3 text-xs font-black bg-white" value={globalFont} onChange={e => e.target.value === 'upload' ? fontUploadRef.current?.click() : setGlobalFont(e.target.value)}>
                                    <option>Inter</option><option>Serif</option><option>Monospace</option><option>Cursive</option>
                                    {!['Inter', 'Serif', 'Monospace', 'Cursive'].includes(globalFont) && <option value={globalFont}>{globalFont}</option>}
                                    <option value="upload">+ Upload</option>
                                </select>
                                <input type="file" ref={fontUploadRef} className="hidden" accept=".ttf,.otf" onChange={handleFontUpload} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Warna Teks</label>
                                <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl p-2 h-[42px]">
                                    <div className="w-6 h-6 rounded border border-gray-200 overflow-hidden relative flex-shrink-0">
                                        <input type="color" className="absolute -inset-1 w-[200%] h-[200%] cursor-pointer border-0 p-0" value={globalColor} onChange={e => setGlobalColor(e.target.value)} />
                                    </div>
                                    <input type="text" className="flex-1 text-[9px] font-mono font-bold uppercase outline-none" value={globalColor} onChange={e => setGlobalColor(e.target.value)} maxLength={7} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    const renderPreviewArea = () => (
        <div className="flex-1 bg-gray-300 flex items-center justify-center overflow-auto p-12 custom-scrollbar relative">
            <div className="absolute top-6 left-6 z-50 flex gap-3 no-print">
                <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl p-1.5 flex items-center gap-1 border border-gray-100">
                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition"><Minus size={18} /></button>
                    <span className="text-[10px] font-black w-12 text-center text-gray-800">{zoom.toFixed(1)}x</span>
                    <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition"><Plus size={18} /></button>
                </div>
            </div>
            <div className="relative shadow-2xl select-none overflow-hidden transition-all duration-300 ease-out flex-shrink-0" style={{ width: `${visualWidth}px`, height: `${visualHeight}px`, transform: `scale(${zoom})`, transformOrigin: 'center center', backgroundColor: previewBg }}>
                {elements.map(el => {
                    const rule = template.rules.find(r => r.id === el.id)!;
                    if (el.type === 'photo' && el.value) {
                        return (
                            <div key={el.id} className="absolute z-10 overflow-hidden" style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%` }}>
                                <img src={el.value} className="w-full h-full object-cover transition-transform duration-200" style={{ transform: `scale(${el.scale})` }} />
                            </div>
                        );
                    }
                    return null;
                })}

                <img src={template.baseImage} className="absolute inset-0 w-full h-full object-fill pointer-events-none" style={{ zIndex: 15 }} />

                {elements.map(el => {
                    const rule = template.rules.find(r => r.id === el.id)!;
                    if (el.type === 'logo') {
                        const logos: LogoItem[] = JSON.parse(el.value || '[]');
                        // Visual Gap logic
                        const gap = el.logoGap || (isLanyard ? 5 : 32);
                        const logoBaseSize = isLanyard ? 20 : (visualHeight * (rule.height / 100) * 0.95);

                        let totalW = 0;
                        logos.forEach((l, i) => { totalW += (logoBaseSize * l.scale) + (i < logos.length - 1 ? gap : 0); });

                        let startX = (rule.x * visualWidth / 100) + (rule.width * visualWidth / 100 / 2) - (totalW / 2);
                        return (
                            <div key={el.id} className="absolute inset-0 z-20 pointer-events-none flex items-center">
                                {logos.map((lItem, i) => {
                                    const currentWidth = logoBaseSize * lItem.scale;
                                    const currentX = startX;
                                    startX += currentWidth + gap;
                                    return <img key={i} src={lItem.src} className="absolute object-contain" style={{ left: `${currentX}px`, width: `${currentWidth}px`, height: `${currentWidth}px`, top: `${rule.y * visualHeight / 100 + (visualHeight * rule.height / 100 - currentWidth) / 2}px` }} />;
                                })}
                            </div>
                        );
                    }
                    if (el.type === 'text' || el.type === 'dropdown') {
                        const fontToUse = isStatic ? (rule.fontFamily || globalFont) : globalFont;
                        const colorToUse = isStatic ? (rule.fontColor || globalColor) : globalColor;
                        return (
                            <div key={el.id} className="absolute flex items-center justify-center z-20" style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%` }}>
                                <div className="font-bold text-center whitespace-nowrap flex items-center justify-center leading-none" style={{ fontSize: `${el.fontSize}px`, fontFamily: fontToUse, color: colorToUse, height: '100%', width: '100%' }}>{el.value}</div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/50 hover:bg-white text-gray-800 rounded-full transition shadow-lg z-[60]"><X size={24} /></button>
        </div>
    );

    return (
        <div className="bg-gray-100 rounded-[40px] border-4 border-white shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-fade-in relative">
            {isLanyard ? (
                <>
                    {renderPreviewArea()}
                    <div className="bg-white border-t border-gray-200 h-80 flex flex-col shadow-lg z-30">
                        <div className="px-10 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-4"><h3 className="font-black text-gray-800 text-sm uppercase">EDIT LANYARD KAMU</h3><div className="h-4 w-px bg-gray-300"></div><p className="text-[10px] font-bold text-gray-400 uppercase">Masukkan logo dan text sesuai keinginanmu</p></div>
                            <button onClick={generateResult} disabled={isExporting} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-3 hover:bg-blue-600 transition shadow-lg disabled:opacity-50">{isExporting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />} SIMPAN HASIL CETAK</button>
                        </div>
                        {renderControls()}
                    </div>
                </>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-xl z-30">
                        <div className="p-8 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-black text-gray-800 text-sm uppercase">EDIT ID CARD KAMU</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Lengkapi data untuk hasil cetak ID Card</p>
                        </div>
                        {renderControls()}
                        <div className="p-8 border-t border-gray-100 bg-gray-50">
                            <button onClick={generateResult} disabled={isExporting} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-blue-600 transition shadow-lg disabled:opacity-50">{isExporting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />} SIMPAN HASIL CETAK</button>
                        </div>
                    </div>
                    {renderPreviewArea()}
                </div>
            )}

            {showPreview && previewData && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                        <div className="flex-1 bg-gray-200 p-8 flex items-center justify-center overflow-hidden">
                            <img src={previewData} className="max-w-full max-h-full object-contain shadow-xl rounded-lg" />
                        </div>
                        <div className="w-full md:w-80 bg-white p-10 flex flex-col justify-center gap-6">
                            <div className="text-center mb-4">
                                <h4 className="text-xl font-black text-gray-900 uppercase">Preview Hasil</h4>
                                <p className="text-xs font-bold text-gray-400 mt-2">Cek desain & konten sebelum diproses</p>
                            </div>
                            <button onClick={handleConfirmSubmit} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 transition"><Save size={20} /> PROSES {isLanyard ? "LANYARD" : "ID CARD"}</button>
                            <button onClick={() => { const link = document.createElement('a'); link.download = `Cetak_${template.name}.png`; link.href = previewData; link.click(); }} className="w-full bg-emerald-500 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition"><Download size={20} /> DOWNLOAD {isLanyard ? "LANYARD" : "ID CARD"}</button>
                            <button onClick={() => setShowPreview(false)} className="w-full bg-white border-2 border-gray-100 text-gray-400 py-5 rounded-[24px] font-black flex items-center justify-center gap-3 hover:border-red-200 hover:text-red-500 transition"><Edit3 size={20} /> EDIT LAGI</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TwibbonEditor;

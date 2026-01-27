import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    type LoaderFunction, type ActionFunction,
    useLoaderData, useSubmit, useActionData
} from 'react-router';
import {
    LayoutTemplate, Plus, Trash2, Save, Upload,
    Type, Image as ImageIcon, Check, X,
    Maximize, Move, Eye, Edit2, Briefcase, Search, Scissors, Minus
} from 'lucide-react';

import { nexus } from "~/lib/nexus-client"; // Assuming this is where nexus lives
import { useFetcherData } from "~/hooks/use-fetcher-data"; // Assuming path
import { API } from "~/lib/api"; // Assuming this exports TwibbonTemplateAPI as API.TWIBBON_TEMPLATE
import { uploadFile } from '~/lib/utils';

// --- TYPES (app/types/design.ts) ---
export type DesignCategory = 'twibbon-idcard' | 'twibbon-lanyard'; // Adjusted to match DB ENUM
export type RuleType = 'text' | 'dropdown' | 'photo' | 'logo';
export type StyleMode = 'dynamic' | 'static';

export interface DesignRule {
    id: string;
    type: RuleType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    options?: string[];
    fontFamily?: string;
    fontColor?: string;
}

export interface DesignTemplate {
    id: string;
    name: string;
    category: DesignCategory;
    baseImage: string; // Mapped from base_image
    rules: DesignRule[];
    styleMode: StyleMode; // Mapped from style_mode
    createdAt?: string;
}

// --- LOADER (Initial Fetching) ---
export const loader: LoaderFunction = async ({ request }) => {
    // We can pre-fetch here if needed, but the requirement specifically asked 
    // to use the `useFetcherData` hook pattern on the client side for fetching.
    // So we can return minimal data or auth session here.
    return Response.json({});
};

// --- ACTION (Server Side Mutations) ---
export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const intent = formData.get('intent');

    // Note: In the useFetcherData pattern provided, the action usually handles 
    // the mutation if `endpoint` isn't provided to the hook, or serves as a proxy.
    // Based on the example: `submitAction({ intent: ... })` hits this action.

    if (intent === 'save_template') {
        const templateData = JSON.parse(formData.get('template') as string);

        // Map Client fields to DB fields
        const payload = {
            id: templateData.id.startsWith('tpl-') ? null : templateData.id, // If temp ID, send null to create new UUID
            name: templateData.name,
            category: templateData.category,
            base_image: templateData.baseImage,
            rules: templateData.rules,
            style_mode: templateData.styleMode
        };

        if (templateData.id && !templateData.id.startsWith('tpl-')) {
            const res = await API.TWIBBON_TEMPLATE.update({ req: { body: payload } });
            return Response.json(res);
        } else {
            const res = await API.TWIBBON_TEMPLATE.create({ req: { body: payload } });
            return Response.json(res);
        }
    }

    if (intent === 'delete_template') {
        const id = formData.get('id') as string;
        const res = await API.TWIBBON_TEMPLATE.update({ req: { body: { id, deleted: 1 } } });
        return Response.json(res);
    }

    return Response.json({ success: false, message: "Invalid Intent" });
};

export default function DesignRoute() {
    // 1. Fetcher for Templates List
    const {
        data: templatesRes,
        loading: loadingTemplates,
        reload: reloadTemplates
    } = useFetcherData<any>({
        endpoint: nexus()
            .module("TWIBBON_TEMPLATE") // Assuming mapped to TwibbonTemplateAPI
            .action("get")
            .params({
                page: 0,
                size: 100, // Fetch enough for the list
                // deleted_on is handled in API logic
            })
            .build(),
        autoLoad: true,
    });

    // 2. Fetcher for Actions (Save/Delete)
    const {
        data: actionRes,
        loading: loadingAction,
        load: submitAction
    } = useFetcherData({
        endpoint: "", // Empty endpoint means it hits the current route's action
        method: "POST",
        autoLoad: false,
    });

    // --- STATE MAPPING ---
    const dbTemplates = templatesRes?.data?.items || [];

    // Map DB fields (snake_case) to Frontend fields (camelCase)
    const mappedTemplates: DesignTemplate[] = useMemo(() => dbTemplates.map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category as DesignCategory,
        baseImage: t.base_image,
        rules: typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules,
        styleMode: t.style_mode as StyleMode,
        createdAt: t.created_on
    })), [dbTemplates]);

    // UI States
    const [activeTab, setActiveTab] = useState<DesignCategory>('twibbon-idcard');
    const [isCreating, setIsCreating] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null);

    // Editor States
    const [templateName, setTemplateName] = useState('');
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [rules, setRules] = useState<DesignRule[]>([]);
    const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
    const [styleMode, setStyleMode] = useState<StyleMode>('dynamic');
    const [zoom, setZoom] = useState(0.8);

    // UI Helpers
    const [showRuleConfig, setShowRuleConfig] = useState<{ id: string, type: string } | null>(null);
    const [configLabel, setConfigLabel] = useState('');
    const [configOptions, setConfigOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState('');
    const [fontFamily, setFontFamily] = useState('Inter');
    const [fontColor, setFontColor] = useState('#000000');
    const [customFontData, setCustomFontData] = useState<string | undefined>(undefined);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fontUploadRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync Action Results
    useEffect(() => {
        if (actionRes?.success) {
            reloadTemplates(); // Refresh list after save/delete
            // If saving, close editor
            if (isCreating && !editingTemplateId) { // Only reset if creating new, or optional UX
                // resetEditor(); 
            }
            alert(actionRes.message || "Berhasil!");
        } else if (actionRes?.success === false) {
            alert(actionRes.message || "Gagal!");
        }
    }, [actionRes]);

    const visualWidth = activeTab === 'twibbon-idcard' ? 350 : 900;
    const visualHeight = activeTab === 'twibbon-idcard' ? 550 : 22;

    const applyDefaultIdCardLayout = () => {
        const defaultRules: DesignRule[] = [
            { id: 'rule-logo-' + Date.now(), type: 'logo', label: 'AREA LOGO', x: 25, y: 10, width: 50, height: 15 },
            { id: 'rule-photo-' + Date.now(), type: 'photo', label: 'AREA FOTO', x: 20, y: 30, width: 60, height: 45 },
            { id: 'rule-name-' + Date.now(), type: 'text', label: 'NAMA/JABATAN', x: 10, y: 80, width: 80, height: 10, fontFamily: 'Inter', fontColor: '#000000' }
        ];
        setRules(defaultRules);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // In real app, we should upload file here first to get URL.
            // For now, we use Base64 as per original logic, BUT for DB optimization,
            // the API should ideally handle file upload. 
            // Assuming for this component we stick to Base64 flow or separate upload logic.

            // const reader = new FileReader();
            // reader.onload = () => {
            //     setBaseImage(reader.result as string);
            //     setRules([]);
            //     setZoom(0.8);
            //     if (activeTab === 'twibbon-idcard') {
            //         applyDefaultIdCardLayout();
            //     }
            // };
            // reader.readAsDataURL(file);

            const url = await uploadFile(file);
            setBaseImage(url);
            setRules([]);
            setZoom(0.8);
            if (activeTab === 'twibbon-idcard') {
                applyDefaultIdCardLayout();
            }
        }
    };

    const applyLanyardDefaults = () => {
        const foldPercent = (7 / 90) * 100;
        const logoWidthPercent = (15 / 90) * 100;
        const logoStart = 50 - (logoWidthPercent / 2);

        const defaultRules: DesignRule[] = [
            { id: 'l-logo-' + Date.now(), type: 'logo', label: 'LOGO TENGAH', x: logoStart, y: 0, width: logoWidthPercent, height: 100 },
            { id: 'l-txt-L-' + Date.now(), type: 'text', label: 'TEKS KIRI', x: foldPercent, y: 0, width: logoStart - foldPercent, height: 100, fontFamily: 'Inter', fontColor: '#000000' },
            { id: 'l-txt-R-' + Date.now(), type: 'text', label: 'TEKS KANAN', x: logoStart + logoWidthPercent, y: 0, width: (100 - foldPercent) - (logoStart + logoWidthPercent), height: 100, fontFamily: 'Inter', fontColor: '#000000' }
        ];
        setRules(defaultRules);
    };

    const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                setCustomFontData(base64);
                setFontFamily(file.name.split('.')[0]);
            };
            reader.readAsDataURL(file);
        }
    };

    const initiateRuleAdd = (type: 'text' | 'dropdown' | 'photo' | 'logo') => {
        if (type === 'photo' || type === 'logo') {
            addRule(type, type === 'photo' ? 'Area Foto' : 'Area Logo');
        } else {
            setConfigLabel('');
            setConfigOptions([]);
            setFontFamily('Inter');
            setFontColor('#000000');
            setCustomFontData(undefined);
            setShowRuleConfig({ id: 'temp-' + Date.now(), type });
        }
    };

    const addRule = (type: string, label: string, options?: string[], fFamily?: string, fColor?: string) => {
        const newRule: DesignRule = {
            id: 'rule-' + Date.now(),
            type: type as any,
            label: label,
            x: 10,
            y: 40,
            width: activeTab === 'twibbon-idcard' ? 80 : 15,
            height: activeTab === 'twibbon-idcard' ? 10 : 100,
            options: options,
            fontFamily: fFamily,
            fontColor: fColor
        };
        setRules([...rules, newRule]);
        setActiveRuleId(newRule.id);
        setShowRuleConfig(null);
    };

    const updateRule = (id: string, updates: Partial<DesignRule>) => {
        setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
        if (activeRuleId === id) setActiveRuleId(null);
    };

    const resetEditor = () => {
        setIsCreating(false);
        setEditingTemplateId(null);
        setBaseImage(null);
        setTemplateName('');
        setRules([]);
        setActiveRuleId(null);
        setStyleMode('dynamic');
        setZoom(0.8);
    };

    const handleSaveTemplate = () => {
        if (!templateName || !baseImage) return alert('Nama dan gambar template wajib diisi!');

        const templateData: DesignTemplate = {
            id: editingTemplateId || 'tpl-' + Date.now(), // Temporary ID if new
            name: templateName,
            category: activeTab,
            baseImage,
            rules,
            styleMode: activeTab === 'twibbon-lanyard' ? 'dynamic' : styleMode,
        };

        // Submit to API via useFetcherData hook
        submitAction({
            intent: 'save_template',
            template: JSON.stringify(templateData)
        });

        // Optimistic close (optional, or wait for effect)
        resetEditor();
    };

    const handleDeleteTemplate = (id: string) => {
        if (!confirm("Yakin ingin menghapus template ini?")) return;
        submitAction({ intent: 'delete_template', id });
    };

    const handleEditTemplate = (tpl: DesignTemplate) => {
        setEditingTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setBaseImage(tpl.baseImage);
        setRules(tpl.rules);
        setStyleMode(tpl.category === 'twibbon-lanyard' ? 'dynamic' : (tpl.styleMode || 'dynamic'));
        setIsCreating(true);
        setZoom(0.8);
    };

    const filteredTemplates = mappedTemplates.filter(t => t.category === activeTab);
    const foldPercent = (7 / 90) * 100;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Top Navigation */}
            <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit">
                <button onClick={() => { setActiveTab('twibbon-idcard'); resetEditor(); }} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition ${activeTab === 'twibbon-idcard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}><ImageIcon size={18} /> ID CARD</button>
                <button onClick={() => { setActiveTab('twibbon-lanyard'); resetEditor(); }} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition ${activeTab === 'twibbon-lanyard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}><Move size={18} /> LANYARD</button>
            </div>

            {isCreating ? (
                <div className="bg-white rounded-[40px] border border-gray-200 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={resetEditor} className="p-3 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
                            <div><h3 className="font-black text-gray-800 text-lg uppercase leading-none">{editingTemplateId ? 'Edit' : 'Buat'} Layout {activeTab.split('-')[1].toUpperCase()}</h3></div>
                        </div>
                        <button onClick={handleSaveTemplate} disabled={loadingAction} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition shadow-xl shadow-indigo-900/10 disabled:opacity-50">
                            <Save size={18} /> {loadingAction ? 'Menyimpan...' : 'SIMPAN TEMPLATE'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
                        {/* Sidebar Controls */}
                        <div className="lg:col-span-3 border-r border-gray-100 p-6 overflow-y-auto bg-gray-50/30 space-y-6 scrollbar-hide">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nama Template</label>
                                <input className="w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm font-black focus:border-indigo-400 outline-none" placeholder="Contoh: Panitia Wisuda 2025" value={templateName} onChange={e => setTemplateName(e.target.value)} />
                            </div>

                            {baseImage && (
                                <div className="space-y-4 animate-fade-in">
                                    {/* Opsi Mode Gaya Teks hanya untuk ID CARD */}
                                    {activeTab === 'twibbon-idcard' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Mode Gaya Teks:</label>
                                            <div className="grid grid-cols-2 gap-2 p-1 bg-white border border-gray-200 rounded-xl">
                                                <button onClick={() => setStyleMode('dynamic')} className={`py-2 text-[9px] font-black uppercase rounded-lg transition ${styleMode === 'dynamic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Dinamis</button>
                                                <button onClick={() => setStyleMode('static')} className={`py-2 text-[9px] font-black uppercase rounded-lg transition ${styleMode === 'static' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Statis</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            {activeTab === 'twibbon-idcard' && (
                                                <button onClick={() => initiateRuleAdd('photo')} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-center"><ImageIcon size={20} className="text-indigo-500" /><span className="text-[10px] font-black uppercase">Area Foto</span></button>
                                            )}
                                            <button onClick={() => initiateRuleAdd('logo')} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-center"><ImageIcon size={20} className="text-blue-500" /><span className="text-[10px] font-black uppercase">Area Logo</span></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => initiateRuleAdd('text')} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-center"><Type size={20} className="text-indigo-500" /><span className="text-[10px] font-black uppercase">Teks/Nama</span></button>
                                            <button
                                                disabled={activeTab === 'twibbon-idcard' && styleMode === 'dynamic'}
                                                onClick={() => initiateRuleAdd('dropdown')}
                                                className={`bg-white border p-4 rounded-2xl flex flex-col items-center gap-2 transition text-center ${(activeTab === 'twibbon-idcard' && styleMode === 'dynamic') ? 'border-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-indigo-400'}`}
                                            >
                                                <Briefcase size={20} className={(activeTab === 'twibbon-idcard' && styleMode === 'dynamic') ? 'text-gray-300' : 'text-indigo-500'} /><span className="text-[10px] font-black uppercase">Pilihan Khusus</span>
                                            </button>
                                        </div>
                                        {styleMode === 'dynamic' && activeTab === 'twibbon-idcard' && <p className="text-[8px] text-orange-500 font-bold uppercase tracking-tight text-center mt-1">*Pilihan khusus hanya aktif di Mode Statis</p>}
                                    </div>

                                    {activeTab === 'twibbon-lanyard' && (
                                        <button onClick={applyLanyardDefaults} className="w-full bg-blue-50 border border-blue-200 text-blue-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition"><Scissors size={14} /> Set Layout Default (90cm)</button>
                                    )}

                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        {rules.map(rule => (
                                            <div key={rule.id} onClick={() => setActiveRuleId(rule.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${activeRuleId === rule.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    {rule.type === 'logo' || rule.type === 'photo' ? <ImageIcon size={14} /> : <Type size={14} />}
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase block leading-none">{rule.label}</span>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }} className={`${activeRuleId === rule.id ? 'text-white/60 hover:text-white' : 'text-red-300 hover:text-red-500'}`}><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!baseImage && <button onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-4 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-200 transition bg-white"><Upload size={32} /><span className="text-xs font-black uppercase tracking-widest px-4">Upload PNG Background</span><input type="file" ref={fileInputRef} className="hidden" accept="image/png" onChange={handleFileUpload} /></button>}
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
                                    <div ref={editorRef} className="relative shadow-2xl bg-white select-none w-full h-full" style={{ backgroundImage: `url(${baseImage})`, backgroundSize: '100% 100%' }}>
                                        {activeTab === 'twibbon-lanyard' && (
                                            <>
                                                <div className="absolute left-0 top-0 bottom-0 bg-red-500/20 border-r border-red-500/30 flex items-center justify-center z-0 overflow-hidden" style={{ width: `${foldPercent}%` }}><span className="text-[6px] font-black text-red-700/60 uppercase whitespace-nowrap px-1">LIPAT 7cm</span></div>
                                                <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 border-l border-red-500/30 flex items-center justify-center z-0 overflow-hidden" style={{ width: `${foldPercent}%` }}><span className="text-[6px] font-black text-red-700/60 uppercase whitespace-nowrap px-1">LIPAT 7cm</span></div>
                                                <div className="absolute top-0 bottom-0 border-x border-blue-500/20 bg-blue-500/5 pointer-events-none" style={{ left: '41.66%', width: '16.67%' }}></div>
                                            </>
                                        )}

                                        {rules.map(rule => {
                                            const isActive = activeRuleId === rule.id;
                                            return (
                                                <div key={rule.id} className={`absolute border flex items-center justify-center transition-all ${isActive ? 'border-indigo-500 bg-indigo-50/20 z-20 shadow-xl' : 'border-white/50 bg-white/10 z-10'}`} style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%`, cursor: 'move' }}
                                                    onMouseDown={(e) => {
                                                        setActiveRuleId(rule.id);
                                                        const startX = e.clientX; const startY = e.clientY; const initialX = rule.x; const initialY = rule.y;
                                                        const onMouseMove = (moveEvent: MouseEvent) => {
                                                            const deltaX = ((moveEvent.clientX - startX) / (editorRef.current?.offsetWidth || 1) / (zoom || 1)) * 100;
                                                            const deltaY = ((moveEvent.clientY - startY) / (editorRef.current?.offsetHeight || 1) / (zoom || 1)) * 100;
                                                            updateRule(rule.id, { x: Math.max(0, Math.min(100 - rule.width, initialX + deltaX)), y: Math.max(0, Math.min(100 - rule.height, initialY + deltaY)) });
                                                        };
                                                        const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
                                                        window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
                                                    }}
                                                >
                                                    <span className={`text-[7px] font-black uppercase drop-shadow-md text-center px-0.5 pointer-events-none leading-none ${isActive ? 'text-white' : 'text-white/70'}`} style={{ fontFamily: rule.fontFamily || 'Inter', color: rule.fontColor || '#000000' }}>{rule.label}</span>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 cursor-se-resize flex items-center justify-center" onMouseDown={(e) => {
                                                        e.stopPropagation(); const startX = e.clientX; const startY = e.clientY; const initialWidth = rule.width; const initialHeight = rule.height;
                                                        const onMouseMove = (moveEvent: MouseEvent) => {
                                                            const deltaWidth = ((moveEvent.clientX - startX) / (editorRef.current?.offsetWidth || 1) / (zoom || 1)) * 100;
                                                            const deltaHeight = ((moveEvent.clientY - startY) / (editorRef.current?.offsetHeight || 1) / (zoom || 1)) * 100;
                                                            updateRule(rule.id, { width: Math.max(1, Math.min(100 - rule.x, initialWidth + deltaWidth)), height: Math.max(1, Math.min(100 - rule.y, initialHeight + deltaHeight)) });
                                                        };
                                                        const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
                                                        window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
                                                    }}><Maximize size={6} className="text-white" /></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div onClick={() => setIsCreating(true)} className="bg-white rounded-[40px] border-4 border-dashed border-gray-100 p-12 text-center group hover:border-indigo-200 transition cursor-pointer shadow-sm"><div className="w-20 h-20 bg-gray-50 group-hover:bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 transition"><Plus size={40} className="text-gray-300 group-hover:text-indigo-400 transition" /></div><h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tambah Template {activeTab.split('-')[1].toUpperCase()} Baru</h3><p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Klik untuk mulai mendesain tata letak</p></div>
                    {loadingTemplates ? (
                        <div className="text-center py-10 text-gray-400">Loading Templates...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredTemplates.map(tpl => (<div key={tpl.id} className="bg-white border border-gray-200 rounded-[32px] overflow-hidden group hover:shadow-xl transition-all relative"><div className="aspect-[4/3] bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => setPreviewTemplate(tpl)}><img src={tpl.baseImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3"><button onClick={(e) => { e.stopPropagation(); handleEditTemplate(tpl); }} className="bg-white text-indigo-600 p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"><Edit2 size={20} /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }} className="bg-red-50 text-white p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"><Trash2 size={20} /></button></div><div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-gray-400 opacity-0 group-hover:opacity-100 transition"><Search size={16} /></div></div><div className="p-6"><h4 className="font-black text-gray-800 uppercase text-sm truncate">{tpl.name}</h4><div className="flex items-center gap-3 mt-2"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">{tpl.rules.length} Rules</span><span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${tpl.styleMode === 'static' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-500'}`}>{tpl.styleMode === 'static' ? 'Statis' : 'Dinamis'}</span></div></div></div>))}</div>
                    )}
                </div>
            )}

            {previewTemplate && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setPreviewTemplate(null)}><div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-10 relative overflow-hidden" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6"><div><h3 className="text-xl font-black text-gray-900 uppercase leading-none">{previewTemplate.name}</h3><p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Detail Tata Letak Desain</p></div><button onClick={() => setPreviewTemplate(null)} className="p-3 hover:bg-gray-100 rounded-full transition"><X size={24} /></button></div><div className="relative bg-gray-100 rounded-2xl overflow-hidden mx-auto shadow-inner" style={{ width: previewTemplate.category === 'twibbon-idcard' ? '320px' : '500px', height: previewTemplate.category === 'twibbon-idcard' ? '450px' : '20px' }}><img src={previewTemplate.baseImage} className="w-full h-full object-fill" />{previewTemplate.rules.map(rule => (<div key={rule.id} className="absolute border border-white/50 bg-indigo-500/20 flex items-center justify-center" style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%` }}><span className="text-[8px] font-black text-white uppercase drop-shadow-md text-center">{rule.label}</span></div>))}</div><div className="mt-10 flex gap-4"><button onClick={() => { handleEditTemplate(previewTemplate); setPreviewTemplate(null); }} className="flex-1 bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-3 transition shadow-xl shadow-indigo-900/10"><Edit2 size={18} /> Edit Aturan</button><button onClick={() => setPreviewTemplate(null)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[24px] font-black uppercase text-xs">Tutup</button></div></div></div>
            )}

            {showRuleConfig && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-10"><h3 className="text-xl font-black text-gray-800 mb-6 uppercase">Pengaturan {showRuleConfig.type === 'dropdown' ? 'Pilihan' : 'Teks'}</h3><div className="space-y-6"><div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Nama Kebutuhan (Label):</label><input autoFocus className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-black focus:border-indigo-400 outline-none" placeholder="Contoh: NAMA, NIM, KELAS" value={configLabel} onChange={e => setConfigLabel(e.target.value.toUpperCase())} /></div>

                    {styleMode === 'static' && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Pilih Font:</label><div className="flex gap-2"><select className="flex-1 border-2 border-gray-100 rounded-xl p-4 text-sm font-black outline-none bg-white" value={fontFamily} onChange={e => setFontFamily(e.target.value)}><option>Inter</option><option>Serif</option><option>Monospace</option><option>Cursive</option>{customFontData && <option value={fontFamily}>{fontFamily} (Kustom)</option>}<option value="upload">-- Upload --</option></select>{fontFamily === 'upload' && <button onClick={() => fontUploadRef.current?.click()} className="bg-indigo-600 text-white px-4 rounded-xl shadow-md"><Upload size={18} /></button>}<input type="file" ref={fontUploadRef} className="hidden" accept=".ttf,.otf,.woff" onChange={handleFontUpload} /></div></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Warna Font:</label><div className="flex gap-2 items-center border-2 border-gray-100 rounded-xl p-2 bg-white"><input type="color" className="w-10 h-10 rounded border-0 cursor-pointer p-0 bg-transparent" value={fontColor} onChange={e => setFontColor(e.target.value)} /><input type="text" className="flex-1 text-[10px] font-mono font-black uppercase outline-none" value={fontColor} onChange={e => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; setFontColor(val.slice(0, 7)); }} /></div></div>
                        </div>
                    )}

                    {showRuleConfig.type === 'dropdown' && (<div className="bg-gray-50 p-6 rounded-3xl border border-gray-100"><label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Tambah Daftar Pilihan:</label><div className="flex gap-2 mb-4"><input className="flex-1 border-2 border-white rounded-xl p-3 text-xs font-bold" placeholder="Isi Nama Pilihan" value={newOption} onChange={e => setNewOption(e.target.value)} /><button onClick={() => { if (newOption) { setConfigOptions([...configOptions, newOption]); setNewOption(''); } }} className="bg-indigo-600 text-white p-3 rounded-xl"><Plus size={16} /></button></div><div className="flex flex-wrap gap-2">{configOptions.map((opt, i) => (<div key={i} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 group"><span>{opt}</span><button onClick={() => setConfigOptions(configOptions.filter((_, idx) => idx !== i))} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={12} /></button></div>))}</div></div>)}<div className="flex gap-3 pt-4"><button onClick={() => setShowRuleConfig(null)} className="flex-1 py-4 text-xs font-black text-gray-400 bg-gray-50 rounded-2xl uppercase">Batal</button><button onClick={() => addRule(showRuleConfig.type, configLabel, configOptions, fontFamily, fontColor)} className="flex-1 py-4 text-xs font-black text-white bg-indigo-600 rounded-2xl uppercase shadow-lg shadow-indigo-200">Set Area</button></div></div></div></div>
            )}
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};
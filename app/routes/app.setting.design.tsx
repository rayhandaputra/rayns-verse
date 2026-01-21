import React, { useState, useRef } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useSubmit } from 'react-router';
import { ImageIcon, Move, Save, X, Upload, Type, Trash2, Plus, Minus, Scissors, Briefcase } from 'lucide-react';
// import { useDesignEditor } from '~/hooks/useDesignEditor';
// import { CanvasEditor } from '~/components/design/CanvasEditor';
// import { TemplateList } from '~/components/design/TemplateList';
// import type { DesignTemplate, DesignRule } from '~/types';
// import React from 'react';
import { Edit2, Search } from 'lucide-react';
// import type { DesignTemplate } from '~/types/design';

// import React, { useRef } from 'react';
import { Maximize } from 'lucide-react';
// import type { DesignRule } from '~/types/design';
import { useReducer } from 'react';
// import type { DesignEditorState, DesignAction } from '~/types';

export type DesignRuleType = 'text' | 'dropdown' | 'photo' | 'logo';

export interface DesignRule {
    id: string;
    type: DesignRuleType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    options?: string[];
    fontFamily?: string;
    fontColor?: string;
}

export type StyleMode = 'dynamic' | 'static';

export interface DesignTemplate {
    id: string;
    name: string;
    category: 'idcard' | 'lanyard';
    baseImage: string;
    rules: DesignRule[];
    styleMode: StyleMode;
    createdAt: string;
}

// Action Payloads
export type DesignAction =
    | { type: 'SET_BASE_IMAGE'; payload: string }
    | { type: 'ADD_RULE'; payload: DesignRule }
    | { type: 'UPDATE_RULE'; payload: { id: string; updates: Partial<DesignRule> } }
    | { type: 'DELETE_RULE'; payload: string }
    | { type: 'RESET_EDITOR' }
    | { type: 'LOAD_TEMPLATE'; payload: DesignTemplate };

export interface DesignEditorState {
    templateName: string;
    baseImage: string | null;
    rules: DesignRule[];
    activeRuleId: string | null;
    styleMode: StyleMode;
    zoom: number;
}

// --- LOADER ---
export const loader = async ({ request }: LoaderFunctionArgs) => {
    // const templates = await db.designTemplate.findMany(); 
    const templates: DesignTemplate[] = []; // Mock
    return Response.json({ templates });
};

// --- ACTION ---
export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    // Handle create/update/delete template DB logic here
    return Response.json({ success: true });
};

export default function DesignPage() {
    const { templates } = useLoaderData<typeof loader>();
    const submit = useSubmit();

    // Local UI State (Navigation & Modals)
    const [activeTab, setActiveTab] = useState<'idcard' | 'lanyard'>('idcard');
    const [isCreating, setIsCreating] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    // Custom Hook for Editor State Logic
    const { state, dispatch, addRule } = useDesignEditor();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HANDLERS ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = () => {
                dispatch({ type: 'SET_BASE_IMAGE', payload: reader.result as string });
                // Optional: Apply default layout here
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = () => {
        if (!state.templateName || !state.baseImage) return alert('Data tidak lengkap!');

        const payload = JSON.stringify({
            id: editingTemplateId,
            name: state.templateName,
            category: activeTab,
            baseImage: state.baseImage,
            rules: state.rules,
            styleMode: state.styleMode
        });

        submit({ intent: 'save', payload }, { method: 'post' });
        setIsCreating(false);
        dispatch({ type: 'RESET_EDITOR' });
    };

    const handleEdit = (tpl: DesignTemplate) => {
        setEditingTemplateId(tpl.id);
        setIsCreating(true);
        dispatch({ type: 'LOAD_TEMPLATE', payload: tpl });
    };

    const handleDelete = (id: string) => {
        if (confirm("Hapus template ini?")) submit({ intent: 'delete', id }, { method: 'post' });
    };

    const visualConfig = activeTab === 'idcard'
        ? { w: 350, h: 550 }
        : { w: 900, h: 22 };

    return (
        <div className="pb-20 animate-fade-in">
            {/* Tab Navigation */}
            {!isCreating && (
                <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit mb-6">
                    {(['idcard', 'lanyard'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {tab === 'idcard' ? <ImageIcon size={18} /> : <Move size={18} />} {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Content Switch */}
            {isCreating ? (
                <div className="bg-white rounded-[40px] border border-gray-200 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                    {/* Editor Header */}
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <button onClick={() => { setIsCreating(false); dispatch({ type: 'RESET_EDITOR' }); }} className="p-3 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
                            <h3 className="font-black text-gray-800 text-lg uppercase">{editingTemplateId ? 'Edit' : 'Buat'} Layout {activeTab}</h3>
                        </div>
                        <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition">
                            <Save size={18} /> SIMPAN
                        </button>
                    </div>

                    <div className="grid grid-cols-1lg:grid-cols-12 flex-1 overflow-hidden">
                        {/* Sidebar Tools */}
                        <div className="lg:col-span-3 border-r border-gray-100 p-6 overflow-y-auto bg-gray-50/30 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Template</label>
                                <input
                                    className="input-primary"
                                    placeholder="Nama Template..."
                                    value={state.templateName}
                                    onChange={e => dispatch({ type: 'LOAD_TEMPLATE', payload: { ...state, name: e.target.value } as any })} // Simplified update for brevity
                                />
                            </div>

                            {state.baseImage ? (
                                <div className="space-y-4">
                                    {/* Add Rules Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => addRule('logo', 'Area Logo', activeTab)} className="tool-btn"><ImageIcon className="text-blue-500" size={20} /> LOGO</button>
                                        <button onClick={() => addRule('text', 'Teks Baru', activeTab)} className="tool-btn"><Type className="text-indigo-500" size={20} /> TEKS</button>
                                    </div>
                                    {/* Layers List */}
                                    <div className="space-y-2 pt-4 border-t">
                                        {state.rules.map(rule => (
                                            <div key={rule.id} className={`layer-item ${state.activeRuleId === rule.id ? 'active' : ''}`} onClick={() => dispatch({ type: 'UPDATE_RULE', payload: { id: rule.id, updates: {} } })}> {/* Select Logic */}
                                                <span className="text-[10px] font-black uppercase">{rule.label}</span>
                                                <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_RULE', payload: rule.id }) }}><Trash2 size={14} className="text-red-300 hover:text-red-500" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => fileInputRef.current?.click()} className="upload-box">
                                    <Upload size={32} /> <span className="text-xs font-black uppercase">Upload Background</span>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png" onChange={handleFileUpload} />
                                </button>
                            )}
                        </div>

                        {/* Canvas Area */}
                        <div className="lg:col-span-9 bg-gray-300 flex items-center justify-center p-12 overflow-auto relative">
                            {state.baseImage && (
                                <CanvasEditor
                                    baseImage={state.baseImage}
                                    width={visualConfig.w}
                                    height={visualConfig.h}
                                    zoom={state.zoom}
                                    rules={state.rules}
                                    activeRuleId={state.activeRuleId}
                                    onRuleSelect={(id) => { /* Update active ID logic */ }}
                                    onRuleUpdate={(id, updates) => dispatch({ type: 'UPDATE_RULE', payload: { id, updates } })}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <TemplateList
                    templates={templates}
                    activeTab={activeTab}
                    onCreateNew={() => { setIsCreating(true); dispatch({ type: 'RESET_EDITOR' }); }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPreview={() => { }}
                />
            )}

            <style>{`
        .input-primary { @apply w-full bg-white border-2 border-gray-100 rounded-xl p-4 text-sm font-black focus:border-indigo-400 outline-none; }
        .tool-btn { @apply bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-400 transition text-[10px] font-black uppercase; }
        .upload-box { @apply w-full h-40 border-4 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-200 transition bg-white; }
        .layer-item { @apply p-3 rounded-xl border flex items-center justify-between cursor-pointer transition bg-white border-gray-100 text-gray-500 hover:border-indigo-200; }
        .layer-item.active { @apply bg-indigo-600 border-indigo-600 text-white shadow-lg; }
      `}</style>
        </div>
    );
}

interface TemplateListProps {
    templates: DesignTemplate[];
    activeTab: 'idcard' | 'lanyard';
    onCreateNew: () => void;
    onEdit: (tpl: DesignTemplate) => void;
    onDelete: (id: string) => void;
    onPreview: (tpl: DesignTemplate) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({ templates, activeTab, onCreateNew, onEdit, onDelete, onPreview }) => {
    const filtered = templates.filter(t => t.category === activeTab);

    return (
        <div className="space-y-8">
            <div onClick={onCreateNew} className="bg-white rounded-[40px] border-4 border-dashed border-gray-100 p-12 text-center group hover:border-indigo-200 transition cursor-pointer shadow-sm">
                <div className="w-20 h-20 bg-gray-50 group-hover:bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 transition">
                    <Plus size={40} className="text-gray-300 group-hover:text-indigo-400 transition" />
                </div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tambah Template {activeTab.toUpperCase()} Baru</h3>
                <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Klik untuk mulai mendesain tata letak</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(tpl => (
                    <div key={tpl.id} className="bg-white border border-gray-200 rounded-[32px] overflow-hidden group hover:shadow-xl transition-all relative">
                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => onPreview(tpl)}>
                            <img src={tpl.baseImage} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(tpl); }} className="bg-white text-indigo-600 p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"><Edit2 size={20} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(tpl.id); }} className="bg-red-50 text-white p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"><Trash2 size={20} /></button>
                            </div>
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-gray-400 opacity-0 group-hover:opacity-100 transition"><Search size={16} /></div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-black text-gray-800 uppercase text-sm truncate">{tpl.name}</h4>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">{tpl.rules.length} Rules</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${tpl.styleMode === 'static' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-500'}`}>
                                    {tpl.styleMode === 'static' ? 'Statis' : 'Dinamis'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface CanvasEditorProps {
    baseImage: string;
    width: number;
    height: number;
    zoom: number;
    rules: DesignRule[];
    activeRuleId: string | null;
    onRuleUpdate: (id: string, updates: Partial<DesignRule>) => void;
    onRuleSelect: (id: string) => void;
    children?: React.ReactNode; // For overlays like lanyard folds
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
    baseImage, width, height, zoom, rules, activeRuleId, onRuleUpdate, onRuleSelect, children
}) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleDrag = (e: React.MouseEvent, rule: DesignRule, type: 'move' | 'resize') => {
        e.stopPropagation();
        onRuleSelect(rule.id);
        const startX = e.clientX;
        const startY = e.clientY;
        const initial = { ...rule };

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!editorRef.current) return;
            const deltaX = ((moveEvent.clientX - startX) / editorRef.current.offsetWidth / zoom) * 100;
            const deltaY = ((moveEvent.clientY - startY) / editorRef.current.offsetHeight / zoom) * 100;

            if (type === 'move') {
                onRuleUpdate(rule.id, {
                    x: Math.max(0, Math.min(100 - rule.width, initial.x + deltaX)),
                    y: Math.max(0, Math.min(100 - rule.height, initial.y + deltaY))
                });
            } else {
                onRuleUpdate(rule.id, {
                    width: Math.max(1, Math.min(100 - rule.x, initial.width + deltaX)),
                    height: Math.max(1, Math.min(100 - rule.y, initial.height + deltaY))
                });
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div className="relative transition-transform origin-center" style={{ width: `${width}px`, height: `${height}px`, transform: `scale(${zoom})` }}>
            <div ref={editorRef} className="relative shadow-2xl bg-white select-none w-full h-full" style={{ backgroundImage: `url(${baseImage})`, backgroundSize: '100% 100%' }}>
                {children}
                {rules.map(rule => {
                    const isActive = activeRuleId === rule.id;
                    return (
                        <div
                            key={rule.id}
                            className={`absolute border flex items-center justify-center transition-all cursor-move ${isActive ? 'border-indigo-500 bg-indigo-50/20 z-20 shadow-xl' : 'border-white/50 bg-white/10 z-10'}`}
                            style={{ left: `${rule.x}%`, top: `${rule.y}%`, width: `${rule.width}%`, height: `${rule.height}%` }}
                            onMouseDown={(e) => handleDrag(e, rule, 'move')}
                        >
                            <span className={`text-[7px] font-black uppercase drop-shadow-md pointer-events-none ${isActive ? 'text-white' : 'text-white/70'}`} style={{ fontFamily: rule.fontFamily, color: rule.fontColor }}>{rule.label}</span>
                            <div
                                className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 cursor-se-resize flex items-center justify-center"
                                onMouseDown={(e) => handleDrag(e, rule, 'resize')}
                            >
                                <Maximize size={6} className="text-white" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const initialState: DesignEditorState = {
    templateName: '',
    baseImage: null,
    rules: [],
    activeRuleId: null,
    styleMode: 'dynamic',
    zoom: 0.8,
};

function designReducer(state: DesignEditorState, action: DesignAction): DesignEditorState {
    switch (action.type) {
        case 'SET_BASE_IMAGE':
            return { ...state, baseImage: action.payload, rules: [], zoom: 0.8 };
        case 'ADD_RULE':
            return { ...state, rules: [...state.rules, action.payload], activeRuleId: action.payload.id };
        case 'UPDATE_RULE':
            return {
                ...state,
                rules: state.rules.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates } : r)
            };
        case 'DELETE_RULE':
            return {
                ...state,
                rules: state.rules.filter(r => r.id !== action.payload),
                activeRuleId: state.activeRuleId === action.payload ? null : state.activeRuleId
            };
        case 'LOAD_TEMPLATE':
            return {
                ...state,
                templateName: action.payload.name,
                baseImage: action.payload.baseImage,
                rules: action.payload.rules,
                styleMode: action.payload.styleMode || 'dynamic',
                zoom: 0.8
            };
        case 'RESET_EDITOR':
            return initialState;
        default:
            return state;
    }
}

export function useDesignEditor() {
    const [state, dispatch] = useReducer(designReducer, initialState);

    // Helper Methods
    const addRule = (type: DesignRule['type'], label: string, category: 'idcard' | 'lanyard', options?: string[], fontFamily?: string, fontColor?: string) => {
        const newRule: DesignRule = {
            id: `rule-${Date.now()}`,
            type,
            label,
            x: 10,
            y: 40,
            width: category === 'idcard' ? 80 : 15,
            height: category === 'idcard' ? 10 : 100,
            options,
            fontFamily,
            fontColor
        };
        dispatch({ type: 'ADD_RULE', payload: newRule });
    };

    return { state, dispatch, addRule };
}
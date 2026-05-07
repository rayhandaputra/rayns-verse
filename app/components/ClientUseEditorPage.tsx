import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DriveItem, Order, Product, ShirtSizeItem, ShirtColor, DesignTemplate, TwibbonEntry, TwibbonValue, TwibbonAssignment } from '~/types';
import {
    Folder, FileText, Receipt, Layout, ImageIcon, LayoutGrid, List,
    FolderPlus, Upload, Trash2, X, Printer, CheckCircle2, AlertTriangle,
    AlertCircle, Copy as CopyIcon, PlusCircle
} from 'lucide-react';
import NotaView from './NotaView';
import TwibbonEditor from './TwibbonEditor';
import { useNavigate } from 'react-router';
// import TwibbonTabContent from './TwibbonTabContent'; // Imported new component


interface TwibbonTabContentProps {
    activeTab: 'twibbon-idcard' | 'twibbon-lanyard';
    currentOrder: Order;
    designTemplates: DesignTemplate[];
    twibbonAssignments?: any;
    onUpdateAssignments: (orderId: string, assignments: TwibbonAssignment[]) => void;
    onShowEditor: (template: DesignTemplate) => void;
    onAddAssignment: () => void;
    handleDeleteAssignment?: (asgId: string) => void;
}

export const TwibbonTabContent: React.FC<TwibbonTabContentProps> = ({
    activeTab,
    currentOrder,
    designTemplates,
    onUpdateAssignments,
    onShowEditor,
    onAddAssignment,
    handleDeleteAssignment
}) => {

    const navigate = useNavigate();

    const type = activeTab === 'twibbon-idcard' ? 'idcard' : 'lanyard';
    const typeLabel = activeTab.split('-')[1]?.toUpperCase();
    const assignments = (currentOrder.twibbonAssignments || []).filter((a: any) => a.type === type);

    const generatePublicLink = (asgId: string, index: number) => {
        // return `kinau.id/public/design-link/${currentOrder?.id?.toUpperCase()}/${type === 'idcard' ? 'IdCard' : 'Lanyard'}${index + 1}`;
        return `kinau.id/public/design-link/${currentOrder?.id}`;
    };

    const handleTemplateChange = (asgId: string, newTemplateId: string) => {
        const updated = (currentOrder.twibbonAssignments || []).map((a: any) =>
            a.id === asgId ? { ...a, templateId: newTemplateId } : a
        );
        onUpdateAssignments(currentOrder.id, updated);
    };

    // const handleDeleteAssignment = (asgId: string) => {
    //     const updated = (currentOrder.twibbonAssignments || []).filter((a: any) => a.id !== asgId);
    //     onUpdateAssignments(currentOrder.id, updated);
    // };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="bg-white rounded-[40px] border border-gray-200 p-10 shadow-sm">
                <div className="mb-10 pb-10 border-b border-gray-100">
                    <h3 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-3">
                        {activeTab === 'twibbon-idcard' ?
                            <ImageIcon className="text-indigo-600" size={32} /> :
                            <LayoutGrid className="text-violet-600" size={32} />
                        }
                        ATUR EDITOR TEMPLATE DESAIN
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest leading-relaxed">
                        pilih desain {typeLabel} lalu buka editornya atau bagikan link nya untuk diakses anggota lain.
                    </p>
                </div>

                <div className="space-y-6">
                    {assignments.map((asg: any, idx: number) => {
                        const assignedTpl = designTemplates?.find((t: any) => t.id === asg.templateId);
                        const usedIds = (currentOrder.twibbonAssignments || [])
                            .filter((a: any) => a.id !== asg.id)
                            .map((a: any) => a.templateId);

                        const available = designTemplates?.filter((t: any) =>
                            t.category === type
                        ) || [];
                        // const available = designTemplates?.filter((t: any) =>
                        //     t.category === type && !usedIds.includes(t.id)
                        // ) || [];

                        const link = generatePublicLink(asg.id, idx);

                        return (
                            <div key={asg.id} className={`bg-gray-50 border-2 rounded-[32px] p-6 transition-all ${asg.templateId ? 'border-gray-100 bg-white shadow-sm' : 'border-dashed border-indigo-200 bg-indigo-50/20'}`}>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                    {/* Template Selection */}
                                    <div className="lg:col-span-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Desain Terpilih:</label>
                                        <select
                                            className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl text-sm font-black outline-none"
                                            value={asg.templateId}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTemplateChange(asg.id, e.target.value)}
                                        >
                                            <option value="">-- Pilih Desain --</option>
                                            {available.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Link Display */}
                                    <div className="lg:col-span-5">
                                        {asg.templateId ? (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block px-1">Link Editor Publik:</label>
                                                <div className="flex gap-2">
                                                    {/* <div className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl text-[11px] font-mono font-bold text-gray-500 truncate">{link}</div> */}
                                                    <div className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl text-[11px] font-mono font-bold text-gray-500 truncate">{`kinau.id/public/design-link/${asg?.unique_code}`}</div>
                                                    <button onClick={() => { navigator.clipboard.writeText(`kinau.id/public/design-link/${asg?.unique_code}`); alert('Link disalin!'); }} className="bg-white border border-gray-200 p-4 rounded-2xl text-indigo-600 shadow-sm"><CopyIcon size={18} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-gray-400 italic text-xs px-2">
                                                <AlertCircle size={16} /> Tentukan desain untuk mengaktifkan editor
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:col-span-3 flex justify-end gap-2">
                                        {assignedTpl && (
                                            <a
                                                href={`/public/design-link/${asg?.unique_code}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/10 no-underline"
                                            >
                                                <Printer size={16} /> Editor
                                            </a>
                                        )}
                                        {/* {asg.templateId && assignedTpl && (
                                            <button onClick={() => onShowEditor(assignedTpl)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/10">
                                                <Printer size={16} /> Editor
                                            </button>
                                        )} */}
                                        {/* <button onClick={() => handleDeleteAssignment(asg.id)} className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition border border-red-100"> */}
                                        <button onClick={() => { }} className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition border border-red-100">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <button onClick={onAddAssignment} className="w-full bg-white border-4 border-dashed border-gray-100 py-10 rounded-[32px] font-black text-gray-300 hover:text-indigo-400 hover:border-indigo-100 transition flex flex-col items-center gap-3">
                        <PlusCircle size={40} />
                        <span className="text-xs uppercase tracking-widest">TAMBAH DESAIN LAIN</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DrivePageProps {
    items: DriveItem[];
    orders?: Order[];
    products?: Product[];
    shirtColors?: ShirtColor[];
    designTemplates?: DesignTemplate[];
    onUpdateItems: (newItems: DriveItem[]) => void;
    onUpdateOrderSizes?: (orderId: string, sizes: ShirtSizeItem[]) => void;
    onUpdateTwibbonData?: (orderId: string, entries: TwibbonEntry[]) => void;
    onUpdateTwibbonAssignments?: (orderId: string, assignments: TwibbonAssignment[]) => void;
    initialFolderId?: string | null;
    rootFolderId?: string | null;
    isGuest?: boolean;
    onSaveReview?: (orderId: string, rating: number, review: string) => void;
}

const ClientUseEditorPage: React.FC<DrivePageProps> = ({
    items, orders = [], designTemplates = [],
    onUpdateItems, onUpdateTwibbonAssignments,
    initialFolderId, rootFolderId, isGuest = false
}) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId || rootFolderId || null);
    const [activeTab, setActiveTab] = useState<'files' | 'nota' | 'sizes' | 'twibbon-idcard' | 'twibbon-lanyard'>('files');
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showVisualEditor, setShowVisualEditor] = useState<DesignTemplate | null>(null);
    const [zoomedFile, setZoomedFile] = useState<DriveItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialFolderId !== undefined) {
            setCurrentFolderId(initialFolderId);
            setActiveTab('files');
        }
    }, [initialFolderId]);

    useEffect(() => {
        if (rootFolderId && !currentFolderId) {
            setCurrentFolderId(rootFolderId);
        }
    }, [rootFolderId, currentFolderId]);

    const effectiveOrderId = rootFolderId || currentFolderId;
    const currentOrder: any = effectiveOrderId ? orders.find(o => o.driveFolderId === effectiveOrderId || o.id === effectiveOrderId) : null;
    const currentFolder: any = items.find(i => i.id === currentFolderId);

    const isCottonProduct = currentOrder?.items.some((it: any) => it.productName.toLowerCase().includes('cotton combed')) || currentOrder?.jenisPesanan.toLowerCase().includes('cotton combed');
    const isIdCardProduct = currentOrder?.items.some((it: any) => it.productName.toLowerCase().includes('id card')) || currentOrder?.jenisPesanan.toLowerCase().includes('id card');
    const isLanyardProduct = currentOrder?.items.some((it: any) => it.productName.toLowerCase().includes('lanyard')) || currentOrder?.jenisPesanan.toLowerCase().includes('lanyard');

    const isFrontIdCardFolder = currentFolder?.name.toLowerCase().includes('id card (depan)');

    // --- SMART PROGRESS TRACKER ---
    const trackerStats = useMemo(() => {
        if (!isFrontIdCardFolder || !currentOrder) return null;

        const filesInFolder = items.filter(i => i.parentId === currentFolderId && i.type === 'file');
        const submittedCount = filesInFolder.length;
        const targetCount = currentOrder.jumlah || 0;

        const nameCounts: Record<string, number> = {};
        filesInFolder.forEach(f => {
            let cleanName = f.name.replace(/\.png$/i, '').replace(/\s\(\d+\)$/, '').trim();
            nameCounts[cleanName] = (nameCounts[cleanName] || 0) + 1;
        });

        const doubleCount = Object.values(nameCounts).filter(c => c > 1).length;
        let status: 'less' | 'over' | 'exact' = 'exact';
        if (submittedCount < targetCount) status = 'less';
        else if (submittedCount > targetCount) status = 'over';

        return { submittedCount, targetCount, doubleCount, status };
    }, [isFrontIdCardFolder, currentOrder, items, currentFolderId]);

    const handleAddTwibbonAssignment = () => {
        if (!currentOrder || !onUpdateTwibbonAssignments) return;
        const type = activeTab === 'twibbon-idcard' ? 'idcard' : 'lanyard';
        onUpdateTwibbonAssignments(currentOrder.id, [...(currentOrder.twibbonAssignments || []), { id: 'asg-' + Date.now(), templateId: '', type }]);
    };

    const handleExportTwibbon = (base64: string, fileName: string, firstValue: string) => {
        if (!currentOrder) return;
        const type = activeTab === 'twibbon-idcard' ? 'idcard' : 'lanyard';
        const targetName = type === 'idcard' ? 'ID Card (Depan)' : 'Lanyard';
        const targetFolder = items.find(i => i.parentId === currentOrder.driveFolderId && i.name.toLowerCase().includes(targetName.toLowerCase()));

        if (!targetFolder) return alert(`Folder ${targetName} tidak ditemukan!`);

        const currentAsg = (currentOrder.twibbonAssignments || []).filter((a: any) => a.type === type);
        const templateIdx = currentAsg.findIndex((a: any) => a.templateId === showVisualEditor?.id) + 1;
        const baseFileName = `[${templateIdx}] ${firstValue}`;

        const existingInFolder = items.filter(i => i.parentId === targetFolder.id && i.name.startsWith(baseFileName));
        let finalName = `${baseFileName}.png`;
        if (existingInFolder.length > 0) finalName = `${baseFileName} (${existingInFolder.length + 1}).png`;

        onUpdateItems([...items, {
            id: String(Date.now()), parentId: targetFolder.id, name: finalName, type: 'file', mimeType: 'image',
            data: base64, size: (base64.length / (1024 * 1024)).toFixed(2) + ' MB', createdAt: new Date().toISOString()
        }]);

        setShowVisualEditor(null);
        alert(`Berhasil! File disimpan sebagai: ${finalName}`);
    };

    const currentItems = items.filter(item => item.parentId === currentFolderId).sort((a, b) => a.type === 'folder' ? -1 : 1);
    const handleOpenNewFolderModal = () => { setNewFolderName('Folder Baru'); setShowNewFolderModal(true); };
    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = await Promise.all(Array.from(e.target.files).map((file: File, index) => new Promise<DriveItem>((resolve) => {
                const reader = new FileReader(); reader.onload = (evt) => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    resolve({ id: String(Date.now() + index), parentId: currentFolderId, name: file.name, type: 'file', mimeType: ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '') ? 'image' : 'doc', data: evt.target?.result as string, size: (file.size / 1024 / 1024).toFixed(2) + ' MB', createdAt: new Date().toISOString() });
                }; reader.readAsDataURL(file);
            })));
            onUpdateItems([...items, ...newFiles]);
        }
    };

    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col ${isGuest ? 'h-screen rounded-none border-0' : 'h-[calc(100vh-140px)]'}`}>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
            {currentOrder && !showVisualEditor && (
                <div className="flex border-b border-gray-100 bg-gray-50/50 flex-wrap overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('files')} className={`flex-1 py-4 text-xs md:text-sm font-black flex justify-center items-center gap-2 border-b-2 transition ${activeTab === 'files' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}><Layout size={16} /> FOLDER</button>
                    {isIdCardProduct && <button onClick={() => setActiveTab('twibbon-idcard')} className={`flex-1 py-4 text-xs md:text-sm font-black flex justify-center items-center gap-2 border-b-2 transition ${activeTab === 'twibbon-idcard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}><ImageIcon size={16} /> TWIBBON ID CARD</button>}
                    {isLanyardProduct && <button onClick={() => setActiveTab('twibbon-lanyard')} className={`flex-1 py-4 text-xs md:text-sm font-black flex justify-center items-center gap-2 border-b-2 transition ${activeTab === 'twibbon-lanyard' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-400'}`}><LayoutGrid size={16} /> TWIBBON LANYARD</button>}
                    {isCottonProduct && <button onClick={() => setActiveTab('sizes')} className={`flex-1 py-4 text-xs md:text-sm font-black flex justify-center items-center gap-2 border-b-2 transition ${activeTab === 'sizes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}><List size={16} /> DATA UKURAN</button>}
                    <button onClick={() => setActiveTab('nota')} className={`flex-1 py-4 text-xs md:text-sm font-black flex justify-center items-center gap-2 border-b-2 transition ${activeTab === 'nota' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}><Receipt size={16} /> NOTA & BAYAR</button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                {(activeTab === 'twibbon-idcard' || activeTab === 'twibbon-lanyard') && currentOrder ? (
                    <div className="p-4 md:p-10 animate-fade-in">
                        {showVisualEditor ? (
                            <div className="animate-scale-in"><TwibbonEditor template={showVisualEditor} onExport={handleExportTwibbon} onClose={() => setShowVisualEditor(null)} /></div>
                        ) : (
                            /* REFACTORED: Using Modular Component */
                            <TwibbonTabContent
                                activeTab={activeTab}
                                currentOrder={currentOrder}
                                designTemplates={designTemplates}
                                onUpdateAssignments={onUpdateTwibbonAssignments!}
                                onShowEditor={setShowVisualEditor}
                                onAddAssignment={handleAddTwibbonAssignment}
                                twibbonAssignments={currentOrder.twibbonAssignments}
                            />
                        )}
                    </div>
                ) : activeTab === 'nota' && currentOrder ? (
                    <div className="p-4 md:p-8"><NotaView order={currentOrder} /></div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* TRACKER BANNER (Khusus ID Card Depan) */}
                        {trackerStats && (
                            <div className={`p-6 rounded-[32px] border-2 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in ${trackerStats.status === 'exact' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                                trackerStats.status === 'less' ? 'bg-orange-50 border-orange-100 text-orange-900' :
                                    'bg-red-50 border-red-100 text-red-900'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${trackerStats.status === 'exact' ? 'bg-emerald-500 text-white' : 'bg-white shadow-sm'}`}>
                                        {trackerStats.status === 'exact' ? <CheckCircle2 size={24} /> : <AlertTriangle className={trackerStats.status === 'less' ? 'text-orange-500' : 'text-red-500'} size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg uppercase leading-none">Status Submit ID Card</h4>
                                        <p className="text-xs font-bold opacity-60 uppercase mt-1">
                                            {trackerStats.status === 'exact' ? 'Data sudah pas sesuai pesanan' :
                                                trackerStats.status === 'less' ? 'Ada anggota yang belum submit data' :
                                                    'Jumlah submit melebihi total pesanan'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black uppercase opacity-40">Pesanan</div>
                                        <div className="text-2xl font-black">{trackerStats.targetCount}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-black uppercase opacity-40">Masuk</div>
                                        <div className={`text-2xl font-black ${trackerStats.status === 'exact' ? 'text-emerald-600' : 'text-inherit'}`}>{trackerStats.submittedCount}</div>
                                    </div>
                                    {trackerStats.doubleCount > 0 && (
                                        <div className="bg-red-500 text-white px-4 py-2 rounded-2xl animate-pulse">
                                            <div className="text-[8px] font-black uppercase">Double Nama</div>
                                            <div className="text-lg font-black">{trackerStats.doubleCount}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {currentItems.map((item: any) => (
                                <div key={item.id} className="p-4 rounded-[28px] bg-white border-2 border-transparent hover:border-blue-400 transition-all flex flex-col items-center gap-3 shadow-sm relative group cursor-pointer"
                                    onClick={() => {
                                        if (item.type === 'folder') setCurrentFolderId(item.id);
                                        else if (item.mimeType === 'image') setZoomedFile(item);
                                    }}>
                                    <div className="w-full flex justify-center mb-1">
                                        {item.type === 'folder' ? <Folder size={48} className="text-yellow-400 fill-yellow-400" /> :
                                            item.mimeType === 'image' && item.data ? <img src={item.data} className="w-full h-24 object-contain rounded shadow-sm" /> :
                                                <FileText size={40} className="text-blue-500" />}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-700 truncate w-full uppercase text-center px-2">{item.name}</div>
                                    <button onClick={(e) => { e.stopPropagation(); onUpdateItems(items.filter(i => i.id !== item.id)); }} className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                                </div>
                            ))}
                            <div onClick={handleOpenNewFolderModal} className="p-4 rounded-[28px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition min-h-[140px]"><FolderPlus className="text-gray-300" size={32} /><span className="text-[9px] font-black text-gray-400 uppercase">FOLDER</span></div>
                            <div onClick={handleUploadClick} className="p-4 rounded-[28px] border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50 transition min-h-[140px]"><Upload className="text-blue-300" size={32} /><span className="text-[9px] font-black text-blue-400 uppercase">UPLOAD</span></div>
                        </div>
                    </div>
                )}
            </div>

            {/* LIGHTBOX FOR DRIVE FILES */}
            {zoomedFile && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in" onClick={() => setZoomedFile(null)}>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/10 text-white px-6 py-3 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest">{zoomedFile.name}</div>
                    <button onClick={() => setZoomedFile(null)} className="absolute top-6 right-6 text-white hover:text-red-400 transition bg-white/10 p-3 rounded-full"><X size={32} /></button>
                    <img src={zoomedFile.data} className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg" onClick={e => e.stopPropagation()} />
                    <div className="mt-8 flex gap-4">
                        <button onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = zoomedFile.data!;
                            link.download = zoomedFile.name;
                            link.click();
                        }} className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-3"><Printer size={18} /> Download File</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientUseEditorPage;
import React, { useState, useRef, useEffect } from 'react';
import type { DriveItem, DesignTemplate } from '~/types'; // Pastikan path import benar
import TwibbonEditor from './TwibbonEditor';
import { X, Save, AlertCircle } from 'lucide-react';

interface TwibbonEditorPageProps {
    /** Template awal yang akan di-load ke editor */
    initialTemplate: DesignTemplate | null;
    /** Callback saat user klik tombol close/batal */
    onClose?: () => void;
    /** Callback saat user selesai export/save hasil desain */
    onSaveResult?: (base64: string, fileName: string, firstValue: string) => void;
    /** (Opsional) Data Item/File yang ada (untuk cek duplikasi nama file saat save) */
    existingItems?: DriveItem[];
}

/**
 * Halaman Khusus / Wrapper untuk TwibbonEditor
 * Fokus: Menampilkan editor visual secara full-screen atau modal besar
 * Tanpa tab navigasi, tanpa drive folder, tanpa nota.
 */
const ClientTwibbonEditorPage: React.FC<TwibbonEditorPageProps> = ({
    initialTemplate,
    onClose,
    onSaveResult,
    existingItems = []
}) => {
    // State lokal untuk template aktif (jika ingin bisa ganti template di dalam page ini, 
    // tapi biasanya initialTemplate cukup)
    const [currentTemplate, setCurrentTemplate] = useState<DesignTemplate | null>(initialTemplate);

    useEffect(() => {
        if (initialTemplate) {
            setCurrentTemplate(initialTemplate);
        }
    }, [initialTemplate]);

    // Handler saat user klik "Export/Simpan" di dalam TwibbonEditor
    const handleExport = (base64: string, fileName: string, firstValue: string) => {
        if (!currentTemplate) return;

        // Logic penamaan file otomatis (cek duplikasi)
        // Misal format: "[TemplateName] NamaUser.png"
        const baseFileName = `[${currentTemplate.name}] ${firstValue || 'Untitled'}`;

        let finalName = `${baseFileName}.png`;

        // Cek duplikasi jika ada existingItems
        if (existingItems.length > 0) {
            const existing = existingItems.filter(i =>
                i.name.startsWith(baseFileName) && i.type === 'file'
            );
            if (existing.length > 0) {
                finalName = `${baseFileName} (${existing.length + 1}).png`;
            }
        }

        // Panggil callback parent untuk simpan ke state/DB/Drive
        if (onSaveResult) {
            onSaveResult(base64, finalName, firstValue);
        } else {
            console.warn("onSaveResult callback is not provided");
            // Fallback: Download langsung ke browser
            const link = document.createElement('a');
            link.href = base64;
            link.download = finalName;
            link.click();
        }
    };

    // Render State: Loading / Empty
    if (!currentTemplate) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-400">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest">Tidak ada template yang dipilih</p>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="mt-6 px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase hover:bg-gray-100 transition"
                    >
                        Kembali
                    </button>
                )}
            </div>
        );
    }

    // Render State: Editor Ready
    return (
        <div className="">
            {/* <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-fade-in"> */}
            {/* Header Sederhana (Opsional, karena TwibbonEditor mungkin sudah punya header sendiri) */}
            {/* <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                        Editor Desain
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {currentTemplate.name}
                    </p>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition border border-transparent hover:border-red-100"
                        title="Tutup Editor"
                    >
                        <X size={24} />
                    </button>
                )}
            </div> */}

            {/* Area Editor Utama */}
            <div className="flex-1 overflow-hidden relative">
                {/* TwibbonEditor dirender di sini. 
                    Pastikan TwibbonEditor dirancang untuk mengisi height parent (h-full) 
                    atau container ini yang mengatur layoutnya.
                */}
                <div className="w-full h-full flex justify-center bg-gray-50/50">
                    <div className="w-full max-w-7xl h-full p-4 md:p-6 animate-scale-in">
                        <TwibbonEditor
                            template={currentTemplate}
                            onExport={handleExport}
                            onClose={onClose || (() => { })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientTwibbonEditorPage;
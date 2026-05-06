import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
    LayoutTemplate, Lock, Link2OffIcon, HardDrive,
    ImageIcon, Info, ExternalLink, MessageCircle,
    Instagram, Globe, Zap, ArrowRight, Sparkles,
    FileCheck, PartyPopper, CheckCircle
} from 'lucide-react';
import { API } from "~/nexus";
import { nexus } from "~/nexus/nexus-client";
import { useFetcherData } from "~/hooks";
import { base64ToFile, getMimeType, getWhatsAppLink, uploadFile } from "~/utils/utils";
import ClientTwibbonEditorPage from '~/components/features/twibbon/ClientTwibbonEditor';
import { toast } from 'sonner';
import { ADMIN_WA } from '~/constants';

interface DesignGalleryFeatureProps {
    orderData: any;
    domain: string;
    assignmentData: any;
    bucketTwibbon: any;
}

export default function DesignGalleryFeature({ orderData, domain, assignmentData, bucketTwibbon }: DesignGalleryFeatureProps) {
    const [activeTab] = useState<'idcard' | 'lanyard' | 'files'>(assignmentData?.category);
    const isClient = useIsClient();

    const { data: templateRes } = useFetcherData<any>({
        endpoint: nexus().module("TWIBBON_TEMPLATE").action("get").params({ page: 0, size: 100 }).build(),
        autoLoad: true,
    });

    const templates = useMemo(() => {
        const items = templateRes?.data?.items || [];
        return items.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category === 'twibbon-idcard' ? 'idcard' : (t.category === 'twibbon-lanyard' ? 'lanyard' : t.category),
            baseImage: t.base_image,
            rules: typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules,
            styleMode: t.style_mode
        }));
    }, [templateRes]);

    const [successModal, setSuccessModal] = useState({ open: false, fileName: "" });

    const handleSaveResult = async (base64: string, fileName: string, firstValue: string) => {
        const file = base64ToFile(base64, fileName);
        const url = await uploadFile(file);
        const totalFile = await API.ORDER_UPLOAD.get_total_file_twibbon({ session: {}, req: { query: { folder_id: bucketTwibbon?.id } } });
        const newFileName = `[${Number(totalFile) + 1}] ${firstValue}`;
        const newFilePayload = {
            file_type: getMimeType(fileName),
            file_url: url,
            file_name: newFileName,
            folder_id: bucketTwibbon?.id || null,
            level: 2,
            order_number: orderData?.order_number,
        };
        await API.ORDER_UPLOAD.create_single_file({ session: {}, req: { body: newFilePayload } });
        toast.success(`Berhasil menyimpan twibbon ${newFileName}`);
        setSuccessModal({ open: true, fileName: newFileName });
    };

    const currentTemplate = useMemo(() => {
        if (!templates || templates.length === 0) return null;
        return templates.find((t: any) => t.category === activeTab);
    }, [templates, activeTab]);

    if (!isClient) return <DesignSkeleton />;
    if (!orderData && !domain) return <NotFoundPage domain={domain} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header orderData={orderData} />
            <div className="px-6 py-5">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight truncate">
                                {currentTemplate?.name || 'Public Template'}
                            </h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${currentTemplate?.styleMode === 'dynamic' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                {currentTemplate?.styleMode}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            <Info size={12} /> Template ini dikelola dan didukung oleh sistem Kinau.id
                        </p>
                    </div>

                    <div className="relative group w-full lg:w-auto">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                        <div className="relative bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 lg:min-w-[480px]">
                            <div className="flex items-center gap-4 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-5">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Powered By</div>
                                    <img src="/kinau-logo.png" onClick={() => (window.location.href = "/")} alt="Kinau" className="w-24 opacity-80 cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex-1 w-full sm:w-auto flex justify-between sm:justify-start gap-4 items-center">
                                <a href="https://kinau.id" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 group/item">
                                    <div className="p-2 rounded-full bg-gray-50 text-gray-500 group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-all"><Globe size={18} /></div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover/item:text-blue-600">Website</span>
                                </a>
                                <a href="https://instagram.com/kinau.id" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 group/item">
                                    <div className="p-2 rounded-full bg-gray-50 text-gray-500 group-hover/item:bg-pink-50 group-hover/item:text-pink-600 transition-all"><Instagram size={18} /></div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover/item:text-pink-600">Instagram</span>
                                </a>
                                <a href={`${getWhatsAppLink(ADMIN_WA)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 group/item">
                                    <div className="p-2 rounded-full bg-gray-50 text-gray-500 group-hover/item:bg-green-50 group-hover/item:text-green-600 transition-all"><MessageCircle size={18} /></div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover/item:text-green-600">WhatsApp</span>
                                </a>
                                <a href={`${getWhatsAppLink(ADMIN_WA)}`} target="_blank" rel="noreferrer" className="hidden sm:flex ml-auto bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold items-center gap-2 transition-all shadow-lg shadow-gray-200">
                                    Order <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
                {activeTab === 'files' ? (
                    <div className="bg-white rounded-[40px] p-10 border border-gray-200 text-center text-gray-400">
                        <HardDrive size={48} className="mx-auto mb-4 opacity-20" />
                        <p>File Browser Component Here</p>
                    </div>
                ) : (
                    <div className="relative">
                        <ClientTwibbonEditorPage initialTemplate={currentTemplate} onClose={() => { }} onSaveResult={handleSaveResult} />
                        {!currentTemplate && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-0">
                                <div className="text-center text-gray-400">
                                    <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-bold">Belum ada template untuk kategori ini</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SuccessModal isOpen={successModal.open} fileName={successModal.fileName} orderNumber={orderData?.order_number || "-"} onClose={() => setSuccessModal({ ...successModal, open: false })} />
        </div>
    );
}

const Header = ({ orderData }: { orderData: any }) => (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-[50]">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100"><LayoutTemplate size={24} className="text-indigo-600" /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">Editor Desain Visual</h1>
                        <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                            {orderData ? `${orderData.institution_name || 'Project'} - ${orderData.order_number}` : 'Public Template Editor'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                    <Lock size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Public Access</span>
                </div>
            </div>
        </div>
    </div>
);

const NotFoundPage = ({ domain }: { domain?: string }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
            <Link2OffIcon size={48} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link Tidak Ditemukan</h1>
            <p className="text-sm text-gray-500 mb-6">Akses untuk kode <span className="font-mono bg-gray-100 px-1 rounded">{domain}</span> tidak tersedia.</p>
            <a href="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold">Kembali ke Beranda</a>
        </div>
    </div>
);

const DesignSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="h-20 bg-white border-b border-gray-200" />
        <div className="max-w-7xl mx-auto p-6">
            <div className="h-64 bg-gray-200 rounded-[32px] animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-[24px] animate-pulse" />)}
            </div>
        </div>
    </div>
);

function useIsClient() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsClient(true), 0);
        return () => clearTimeout(timer);
    }, []);
    return isClient;
}

const SuccessModal = ({ isOpen, onClose, fileName }: { isOpen: boolean; onClose: () => void; fileName: string; orderNumber: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
            <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-300 rounded-full blur-[60px] opacity-40 animate-pulse" />
                <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <CheckCircle size={48} className="text-white" />
                            <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full text-white shadow-sm animate-pulse"><PartyPopper size={16} /></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Desain Berhasil Disimpan!</h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">Data desain Anda telah masuk ke sistem kami. <span className="font-semibold text-green-600">Panitia siap memproses</span> data ini.</p>
                    <div className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500"><FileCheck size={20} /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nama File Tersimpan</p>
                            <p className="text-sm font-bold text-gray-800 truncate" title={fileName}>{fileName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="group w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                        <Sparkles size={18} className="text-yellow-400 group-hover:rotate-12 transition-transform" /> Oke, Selesai <ArrowRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                <div className="h-1.5 w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500" />
            </div>
        </div>
    );
};

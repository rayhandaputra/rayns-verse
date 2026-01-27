import React, { useState, useEffect, useMemo } from 'react';
import {
    type LoaderFunction, type ActionFunction,
    useLoaderData,
    useNavigation,
    useNavigate
} from 'react-router';
import {
    LayoutTemplate, Lock, Link2OffIcon, HardDrive,
    X, ImageIcon, LayoutGrid,
    Layers,
    Tag,
    Hash,
    User,
    Info
} from 'lucide-react';
import { getOptionalUser } from "~/lib/session.server";
import { API } from "~/lib/api";
import { sendTelegramLog } from "~/lib/telegram-log";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
import { useQueryParams } from '~/hooks/use-query-params';
import { base64ToFile, getMimeType, safeParseObject, uploadFile } from "~/lib/utils";
import ClientTwibbonEditorPage from '~/components/ClientTwibbonEditor';
import { toast } from 'sonner';

// --- COMPONENTS ---
// import ClientTwibbonEditorPage from '~/components/ClientTwibbonEditorPage';

// --- TYPES ---
interface DesignTemplate {
    id: string;
    name: string;
    category: 'idcard' | 'lanyard';
    baseImage: string;
    rules: any[];
    styleMode: 'dynamic' | 'static';
    createdAt: string;
}

// --- LOADER ---
export const loader: LoaderFunction = async ({ request, params }) => {
    const domain = params?.domain;
    const authData = await getOptionalUser(request);

    if (!domain) {
        throw new Response("Domain tidak ditemukan", { status: 404 });
    }

    try {
        const assignmentRes = await API.TWIBBON_ASSIGNMENT.get({
            session: {},
            req: {
                query: {
                    unique_code: domain,
                    size: 1,
                },
            },
        });

        const orderRes = await API.ORDERS.get({
            session: {},
            req: {
                query: {
                    order_number: assignmentRes?.items?.[0]?.order_trx_code,
                    size: 1,
                },
            },
        });

        // Optional: Fetch detail folder if needed for uploads later
        const detailFolder = await API.ORDER_UPLOAD.get_folder({
            session: {},
            req: { query: { order_number: orderRes?.items?.[0]?.order_number, folder_id: "null", size: 1 } },
        });

        const getFolderIDCardLanyard = await API.ORDER_UPLOAD.get_folder({
            session: {},
            req: {
                query: {
                    folder_id: detailFolder?.items?.[0]?.id,
                    search: assignmentRes?.items?.[0]?.category === "idcard" ? "ID Card (Depan)" : "Lanyard",
                    size: 1,
                }
            }
        })

        return Response.json({
            session: authData?.user || null,
            domain,
            orderData: orderRes?.items?.[0] ?? null,
            current_folder: detailFolder?.items?.[0] ?? null,
            assignmentData: assignmentRes?.items?.[0] ?? null,
            bucketTwibbon: getFolderIDCardLanyard?.items?.[0] ?? null,
        });

    } catch (error: any) {
        console.error("Loader error:", error);
        sendTelegramLog("PUBLIC_DESIGN_LINK_LOADER_ERROR", { domain, error });
        return Response.json({ session: authData?.user || null, domain, orderData: null });
    }
};

// --- ACTION ---
export const action: ActionFunction = async ({ request, params }) => {
    const formData = await request.formData();
    const intent = formData.get('intent');

    try {
        // Logic to save the result image
        if (intent === "upload_result") {
            const payload = Object.fromEntries(formData.entries());
            const res = await API.ORDER_UPLOAD.create_single_file({ session: {}, req: { body: payload } });
            return Response.json(res);
        }

        return Response.json({ success: false, message: "Unknown intent" });
    } catch (error: any) {
        return Response.json({ success: false, message: error.message || "Gagal memproses" });
    }
};

// --- MAIN PAGE ---
export default function PublicDesignLinkPage() {
    const { domain, orderData, assignmentData, bucketTwibbon } = useLoaderData<any>();
    const { data: actionRes, load: submitAction } = useFetcherData({ endpoint: "", method: "POST", autoLoad: false });

    const navigate = useNavigate();
    const query = useQueryParams();
    const [activeTab, setActiveTab] = useState<'idcard' | 'lanyard' | 'files'>(assignmentData?.category);
    // const [activeTab, setActiveTab] = useState<'idcard' | 'lanyard' | 'files'>('idcard');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    // --- 1. Fetch Real Templates (Master Data) ---
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

    // --- Handlers ---
    const handleSaveResult = async (base64: string, fileName: string, firstValue: string) => {
        const file = base64ToFile(base64, fileName);
        const url = await uploadFile(file);

        const newFilePayload = {
            file_type: getMimeType(fileName),
            file_url: url,
            file_name: firstValue,
            folder_id: bucketTwibbon?.id || null,
            level: 2,
            order_number: orderData?.order_number,
        };
        const result = await API.ORDER_UPLOAD.create_single_file({ session: {}, req: { body: newFilePayload } });
        toast.success(`Berhasil menyimpan twibbon ${firstValue}`)
    };

    // Filter template based on active tab
    const currentTemplate = useMemo(() => {
        if (!templates || templates.length === 0) return null;
        // Logic to pick which template to show. 
        // For now, picking the first one that matches the category.
        // You could extend this to select from a list if multiple exist.
        return templates.find((t: any) => t.category === activeTab);
    }, [templates, activeTab]);


    // --- Render ---
    if (!isClient) return <DesignSkeleton />;
    if (!orderData && !domain) return <NotFoundPage domain={domain} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header orderData={orderData} />

            {/* --- NEW SECTION: MODERN INFO CARD --- */}
            <div className="px-6 py-5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                    {/* Left: Main Identity */}
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
                            <Info size={12} /> Pastikan data yang dimasukkan sesuai dengan instruksi panitia.
                        </p>
                    </div>

                    {/* Right: Meta Grid (Information) */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 md:p-4 flex-shrink-0 w-full md:w-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 md:gap-y-0">

                            {/* Item 1: Instansi */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-indigo-500">
                                    <User size={14} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Pemilik/Instansi</div>
                                    <div className="text-xs font-black text-gray-700 truncate max-w-[120px]" title={orderData?.institution_name || orderData?.pic_name}>
                                        {orderData?.institution_name || orderData?.pic_name || 'Guest'}
                                    </div>
                                </div>
                            </div>

                            {/* Item 2: Order Number */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-blue-500">
                                    <Hash size={14} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Kode Pesanan</div>
                                    <div className="text-xs font-black text-gray-700 font-mono">
                                        {orderData?.order_number || '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Item 3: Kategori */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-emerald-500">
                                    <Tag size={14} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Kategori</div>
                                    <div className="text-xs font-black text-gray-700 uppercase">
                                        {currentTemplate?.category}
                                    </div>
                                </div>
                            </div>

                            {/* Item 4: Rules Count */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-rose-500">
                                    <Layers size={14} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Elemen Input</div>
                                    <div className="text-xs font-black text-gray-700">
                                        {currentTemplate?.rules?.length || 0} Kolom
                                    </div>
                                </div>
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
                    // INTEGRATION: Using the specialized ClientTwibbonEditorPage component
                    // This wraps the editor logic neatly without extra tab noise
                    <div className="relative">
                        {/* We render it 'inline' here by passing a container or relying on its fullscreen behavior. 
                             If ClientTwibbonEditorPage is full screen fixed, you might want to adjust it 
                             or put it in a modal state. 
                             
                             However, based on your request to use it directly:
                         */}
                        <ClientTwibbonEditorPage
                            initialTemplate={currentTemplate}
                            onClose={() => { }}
                            onSaveResult={handleSaveResult}
                        />

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
        </div>
    );
}

// --- SUB COMPONENTS ---

const Header = ({ orderData }: { orderData: any }) => {
    return (
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-[50]">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                            {/* <img src="/head-icon-kinau.png" alt="Kinau" className="w-8 opacity-80" /> */}
                            <LayoutTemplate size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-800 tracking-tight">Editor Desain Visual</h1>
                            <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                                {orderData
                                    ? `${orderData.institution_name || 'Project'} - ${orderData.order_number}`
                                    : 'Public Template Editor'}
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
};

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
    useEffect(() => setIsClient(true), []);
    return isClient;
}
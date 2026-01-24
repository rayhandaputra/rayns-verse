import React, { useState, useEffect, useRef } from 'react';
import {
    type LoaderFunction, type ActionFunction,
    useLoaderData, useSubmit, useActionData,
    useNavigation,
    useNavigate
} from 'react-router'; // Adjust import based on your remix version (e.g. @remix-run/node)
import {
    LayoutTemplate, Lock, AlertCircle, Link2OffIcon, HardDrive
} from 'lucide-react';
import { getOptionalUser } from "~/lib/session.server";
import { API } from "~/lib/api"; // Your API client
import { sendTelegramLog } from "~/lib/telegram-log";
import type { DesignTemplate } from './app.setting.design';
import ClientUseEditorPage from '~/components/ClientUseEditorPage';
import { DriveBreadcrumb } from '~/components/breadcrumb/DriveBreadcrumb';
import { FooterHint } from './public.drive-link.$domain';
import { useQueryParams } from '~/hooks/use-query-params';
import TwibbonEditor from '~/components/TwibbonEditor';
// import DesignPage from '~/components/design/DesignPage'; // Assuming you moved the Refactored DesignPage here
// import { DesignTemplate } from '~/types/design';

// --- LOADER ---
export const loader: LoaderFunction = async ({ request, params }) => {
    const domain = params?.domain;
    const authData = await getOptionalUser(request);

    if (!domain) {
        throw new Response("Domain tidak ditemukan", { status: 404 });
    }

    const url = new URL(request.url);
    const { folder_id } = Object.fromEntries(url.searchParams.entries());

    try {
        // 1. Fetch Order Context (Optional, useful for header info)
        // Similar logic to Drive page to validate access
        const orderRes = await API.ORDERS.get({
            session: {}, // Public access
            req: {
                query: {
                    // Adapt search logic
                    ...(!domain?.includes("ORD")
                        ? { institution_domain: domain }
                        : { order_number: domain }),
                    size: 1,
                },
            },
        });

        const detailFolder = await API.ORDER_UPLOAD.get_folder({
            session: {},
            req: { query: { id: folder_id || "null", size: 1 } },
        });

        // 2. Fetch Design Templates (Real API call)
        // Assuming API.DESIGN_TEMPLATES.get exists or use a generic fetch
        // For now, we return MOCK data or empty array if API not ready
        // const designRes = await API.DESIGN.get_templates({ session: {} }); 

        // MOCK DATA for demonstration (Replace with real DB fetch)
        const mockTemplates: DesignTemplate[] = [
            {
                id: 'tpl-demo-1',
                name: 'Kepanitiaan Standar',
                category: 'idcard',
                baseImage: 'https://via.placeholder.com/350x550.png?text=Base+ID+Card', // Replace with real URL
                rules: [],
                styleMode: 'dynamic',
                createdAt: new Date().toISOString()
            }
        ];

        return Response.json({
            session: authData?.user || null,
            domain,
            orderData: orderRes?.items?.[0] ?? null,
            current_folder: detailFolder?.items?.[0] ?? null,
            templates: mockTemplates, // Pass templates to client
        });

    } catch (error: any) {
        console.error("Loader error:", error);
        sendTelegramLog("PUBLIC_DESIGN_LINK_LOADER_ERROR", {
            domain,
            error: error,
        });

        // Fallback for errors
        return Response.json({
            session: authData?.user || null,
            domain,
            orderData: null,
            templates: [],
        });
    }
};

// --- ACTION ---
export const action: ActionFunction = async ({ request, params }) => {
    const formData = await request.formData();
    const intent = formData.get('intent');

    // In a real scenario, validate if the public user has permission to save
    // For public links, maybe restrict saving to "Submission" rather than "Template Update"

    try {
        if (intent === 'save_template') {
            const templateData = JSON.parse(formData.get('template') as string);

            // CALL YOUR API HERE
            // await API.DESIGN.create({ session: {}, body: templateData });

            return Response.json({ success: true, message: "Template berhasil disimpan" });
        }

        if (intent === 'delete_template') {
            const id = formData.get('id') as string;
            // await API.DESIGN.delete({ session: {}, body: { id } });
            return Response.json({ success: true, message: "Template dihapus" });
        }

        return Response.json({ success: false, message: "Unknown intent" });

    } catch (error: any) {
        return Response.json({ success: false, message: error.message || "Gagal memproses" });
    }
};

// --- MAIN PAGE ---
export default function PublicDesignLinkPage() {
    const { domain, orderData, current_folder, templates } = useLoaderData<any>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const navigate = useNavigate();
    const query = useQueryParams();

    const [activeTab, setActiveTab] = useState<'idcard' | 'lanyard' | 'files'>('idcard');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const isClient = useIsClient(); // Custom hook to prevent hydration mismatch
    const isLoading = navigation.state === 'loading';
    const isNotFound = !orderData && !domain; // Basic validation

    const handleOpenFolder = (folderId: string) => {
        const url = `/public/design-link/${domain}?folder_id=${folderId}`;
        navigate(url);
    };

    // Pass actions to the internal component
    const handleUpdateTemplates = (newTemplates: DesignTemplate[]) => {
        // Here we just mimic the state update, but in Remix usually we submit to action
        // The inner component logic is complex (optimistic UI), so we might want to keep
        // the state local inside DesignPage, but sync important saves to server.

        // For "Save", the DesignPage already submits to action.
        // For "Delete", the DesignPage already submits to action.
        // So this prop might be purely for local optimistic updates if needed.
    };

    if (!isClient) return <DesignSkeleton />;

    if (isNotFound) return <NotFoundPage domain={domain} />;

    return (
        // <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <Header orderData={orderData} />

            <div className="flex justify-center gap-4 mt-4">
                <button
                    // onClick={() => navigate(`?tab=drive`)}
                    onClick={() => setActiveTab('idcard')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'idcard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    TWIBBON ID CARD
                </button>
                <button
                    // onClick={() => navigate(`?tab=template`)}
                    onClick={() => setActiveTab('lanyard')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'lanyard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    TWIBBON LANYARD
                </button>
                <button
                    // onClick={() => navigate(`?tab=editor`)}
                    onClick={() => setActiveTab('files')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'files' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    UNGGAHAN FILE
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col h-[calc(100vh-200px)]">
                    <DriveBreadcrumb
                        domain={domain}
                        currentFolderId={current_folder?.id || query?.folder_id}
                        rootFolderId={orderData?.drive_folder_id}
                        folderIdentity={current_folder}
                        breadcrumbs={[
                            ...(current_folder?.id
                                ? [
                                    {
                                        id: current_folder?.id,
                                        name: current_folder?.folder_name,
                                    },
                                ]
                                : []),
                        ]}
                        onOpenFolder={(folderId) => handleOpenFolder(folderId!)}
                    />

                    <div
                        className="flex-1 overflow-y-auto p-4"
                        onClick={() => setSelectedItem(null)}
                    > */}
                <div className="animate-scale-in"><TwibbonEditor template={{
                    id: "1",
                    name: "TEST",
                    category: activeTab as any,
                    baseImage: '',
                    rules: [
                        {
                            id: "1",
                            type: 'photo', // 'photo' | 'text' | 'logo' | 'dropdown';
                            label: "HAHA",
                            x: 50,
                            y: 50,
                            width: 100,
                            height: 100,
                            fontFamily: '',
                            fontColor: '',
                            options: [],
                        }
                    ],
                    styleMode: 'dynamic',
                    createdAt: '',
                }} onExport={() => { }} onClose={() => { }} /></div>
                {/* </div> */}

                {/* <FooterHint />
                </div> */}
                {/* </div> */}
            </div>

            {/* Content Container */}
            {/* <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6"> */}
            {/* Render the Refactored DesignPage here. 
                   We wrap it to provide it with the initial data from loader.
                */}
            {/* <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden min-h-[calc(100vh-140px)]"> */}
            {/* Pass props required by DesignPage.
                        Note: In the previous refactor, DesignPage used useLoaderData internally.
                        Since we are wrapping it in a specific route, we can either:
                        1. Let DesignPage use useLoaderData (it will pick up data from THIS route loader).
                        2. Pass props if we want it to be a dumb component.
                        
                        Based on previous refactor request: "props jadi diganti ambil dari useLoaderData()"
                        So we just render <DesignPage /> and ensure the loader matches the expected Interface.
                     */}
            {/* <ClientUseEditorPage
                        items={[{}]}
                        orders={[{}]}
                        designTemplates={[{}]}
                        onUpdateItems={() => { }}
                        onUpdateTwibbonAssignments={() => { }}
                        initialFolderId=""
                        rootFolderId=""
                        isGuest={false}
                    />
                </div>
            </div> */}
        </div >
    );
}

// --- SUB-COMPONENTS (Adapted from reference) ---

const Header = ({ orderData }: { orderData: any }) => {
    return (
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-[100]">
            <div className="max-w-[1600px] mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                            {/* Logo Kinau or Icon */}
                            {/* <LayoutTemplate size={24} className="text-indigo-600" /> */}
                            <img
                                src="/head-icon-kinau.png"
                                alt="Kinau"
                                className="w-8 opacity-80"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase">
                                    Editor Desain Visual
                                </h1>
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200">BETA</span>
                            </div>
                            <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                                {orderData
                                    ? `${orderData.institution_name || 'Project'} - ${orderData.order_number}`
                                    : 'Public Template Editor'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                            <Lock size={14} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Public Access Mode</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotFoundPage = ({ domain }: { domain?: string }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 border border-red-100">
                            <Link2OffIcon size={40} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-800 mb-3 uppercase tracking-tight">Link Tidak Ditemukan</h1>
                        <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
                            Maaf, akses editor desain untuk kode <span className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded">{domain}</span> tidak tersedia atau sudah kadaluarsa.
                        </p>
                        <a href="/" className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl">
                            <HardDrive size={16} /> Kembali ke Beranda
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DesignSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="h-20 bg-white border-b border-gray-200" />
            <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
                <div className="bg-white rounded-[40px] border border-gray-200 h-full flex flex-col p-8">
                    <div className="h-12 w-48 bg-gray-100 rounded-xl animate-pulse mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-[4/3] bg-gray-100 rounded-[32px] animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Hook
function useIsClient() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);
    return isClient;
}
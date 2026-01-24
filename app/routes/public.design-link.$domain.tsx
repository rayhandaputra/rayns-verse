import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    type LoaderFunction, type ActionFunction,
    useLoaderData, useSubmit, useActionData,
    useNavigation,
    useNavigate
} from 'react-router';
import {
    LayoutTemplate, Lock, AlertCircle, Link2OffIcon, HardDrive,
    ImageIcon, LayoutGrid, Upload as UploadIcon, X
} from 'lucide-react';
import { getOptionalUser } from "~/lib/session.server";
import { API } from "~/lib/api";
import { sendTelegramLog } from "~/lib/telegram-log";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
import { useQueryParams } from '~/hooks/use-query-params';
import { safeParseObject } from "~/lib/utils";

// --- COMPONENTS ---
import TwibbonEditor from '~/components/TwibbonEditor';
import { TwibbonTabContent } from "~/components/ClientUseEditorPage";

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
        const orderRes = await API.ORDERS.get({
            session: {},
            req: {
                query: {
                    ...(!domain?.includes("ORD")
                        ? { institution_domain: domain }
                        : { order_number: domain }),
                    size: 1,
                },
            },
        });

        const detailFolder = await API.ORDER_UPLOAD.get_folder({
            session: {},
            req: { query: { order_number: orderRes?.items?.[0]?.order_number, size: 1 } },
        });

        return Response.json({
            session: authData?.user || null,
            domain,
            orderData: orderRes?.items?.[0] ?? null,
            current_folder: detailFolder?.items?.[0] ?? null,
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
        if (intent === "upsert_assignment") {
            const payload = {
                id: formData.get("id") as string,
                order_trx_code: formData.get("order_trx_code"),
                category: formData.get("category"),
                twibbon_template_id: formData.get("twibbon_template_id"),
                twibbon_template_name: formData.get("twibbon_template_name"),
            };
            const res = await API.TWIBBON_ASSIGNMENT.upsert({ session: {}, req: { body: payload } });
            return Response.json(res);
        }

        if (intent === "delete_assignment") {
            const id = formData.get("id") as string;
            const res = await API.TWIBBON_ASSIGNMENT.delete({ session: {}, req: { body: { id } } });
            return Response.json(res);
        }

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
    const { domain, orderData } = useLoaderData<any>();
    const { data: actionRes, load: submitAction } = useFetcherData({ endpoint: "", method: "POST", autoLoad: false });

    const navigate = useNavigate();
    const query = useQueryParams();
    const [activeTab, setActiveTab] = useState<'idcard' | 'lanyard' | 'files'>('idcard');
    const [isClient, setIsClient] = useState(false);

    // Editor State (Untuk menampilkan TwibbonEditor secara overlay/fullscreen)
    const [showEditor, setShowEditor] = useState<DesignTemplate | null>(null);

    // Order State
    const [order, setOrder] = useState(orderData || { id: domain, instansi: 'Unknown', twibbonAssignments: [] });

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

    // --- 2. Fetch Order Assignments (Selected Designs) ---
    const { data: assignmentRes, reload: reloadAssignments } = useFetcherData<any>({
        endpoint: nexus().module("TWIBBON_ASSIGNMENT").action("get").params({ order_trx_code: orderData?.order_number, size: 50 }).build(),
        autoLoad: !!orderData,
    });

    // Sync Assignment Data ke State Order
    useEffect(() => {
        if (assignmentRes?.data?.items) {
            const mappedAssignments = assignmentRes.data.items.map((a: any) => ({
                id: a.id,
                type: a.category === 'twibbon-idcard' ? 'idcard' : (a.category === 'twibbon-lanyard' ? 'lanyard' : a.category),
                templateId: a.twibbon_template_id,
                publicLink: a.public_url_link,
                uniqueCode: a.unique_code
            }));
            setOrder((prev: any) => ({ ...prev, twibbonAssignments: mappedAssignments }));
        }
    }, [assignmentRes]);

    // Reload jika ada aksi sukses (save/delete)
    useEffect(() => {
        if (actionRes?.success) reloadAssignments();
    }, [actionRes]);

    // --- Handlers ---

    const handleUpdateAssignment = (orderId: string, updatedAssignments: any[]) => {
        // Optimistic UI Update
        setOrder({ ...order, twibbonAssignments: updatedAssignments });

        // Save changes to DB
        updatedAssignments.forEach(asg => {
            if (!asg.templateId) return;
            // Cari template name untuk snapshot
            const tplName = templates.find((t: any) => t.id === asg.templateId)?.name;

            // Cek apakah data ini baru diubah? (Simplifikasi: kirim upsert untuk assignment yg punya templateId)
            // Di production, sebaiknya cek diff data.
            submitAction({
                intent: "upsert_assignment",
                id: asg.id.startsWith('asg-') ? '' : asg.id, // ID kosong = Insert Baru
                order_trx_code: orderData.order_number,
                category: asg.type === 'idcard' ? 'twibbon-idcard' : 'twibbon-lanyard',
                twibbon_template_id: asg.templateId,
                twibbon_template_name: tplName
            });
        });
    };

    const handleAddAssignment = () => {
        const type = activeTab === 'idcard' ? 'idcard' : 'lanyard';
        const newAsg = { id: `asg-${Date.now()}`, type, templateId: '' };
        setOrder((prev: any) => ({ ...prev, twibbonAssignments: [...(prev.twibbonAssignments || []), newAsg] }));
    };

    const handleExportResult = (base64: string, fileName: string) => {
        // Logic upload hasil ke server
        // Disini kita hanya alert karena API upload butuh FormData file object, 
        // tapi kita bisa kirim base64 ke endpoint khusus atau convert dulu.
        alert("Fitur simpan hasil ke Drive sedang diproses... (Base64 Ready)");
        setShowEditor(null);
    };

    // --- Render ---
    if (!isClient) return <DesignSkeleton />;
    if (!orderData && !domain) return <NotFoundPage domain={domain} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header orderData={orderData} />

            <div className="flex justify-center gap-4 mt-4 px-4 overflow-x-auto">
                <button onClick={() => setActiveTab('idcard')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'idcard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                    TWIBBON ID CARD
                </button>
                <button onClick={() => setActiveTab('lanyard')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'lanyard' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                    TWIBBON LANYARD
                </button>
                {/* <button onClick={() => setActiveTab('files')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'files' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                    UNGGAHAN FILE
                </button> 
                */}
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
                {showEditor ? (
                    <div className="animate-scale-in">
                        {/* Editor View */}
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowEditor(null)} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                                <X size={18} /> Tutup Editor
                            </button>
                        </div>
                        <TwibbonEditor
                            template={showEditor}
                            onExport={(b64, name, val) => handleExportResult(b64, name)}
                            onClose={() => setShowEditor(null)}
                        />
                    </div>
                ) : (
                    <>
                        {activeTab === 'idcard' && (
                            <TwibbonTabContent
                                activeTab="twibbon-idcard"
                                currentOrder={order}
                                designTemplates={templates}
                                // Prop ini opsional tergantung implementasi TwibbonTabContent Anda
                                // twibbonAssignments={order.twibbonAssignments} 
                                onUpdateAssignments={handleUpdateAssignment}
                                onShowEditor={(tpl: any) => setShowEditor(tpl)}
                                onAddAssignment={handleAddAssignment}
                            />
                        )}
                        {activeTab === 'lanyard' && (
                            <TwibbonTabContent
                                activeTab="twibbon-lanyard"
                                currentOrder={order}
                                designTemplates={templates}
                                onUpdateAssignments={handleUpdateAssignment}
                                onShowEditor={(tpl: any) => setShowEditor(tpl)}
                                onAddAssignment={handleAddAssignment}
                            />
                        )}
                        {activeTab === 'files' && (
                            <div className="bg-white rounded-[40px] p-10 border border-gray-200 text-center text-gray-400">
                                <HardDrive size={48} className="mx-auto mb-4 opacity-20" />
                                <p>File Browser Component Here</p>
                            </div>
                        )}
                    </>
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
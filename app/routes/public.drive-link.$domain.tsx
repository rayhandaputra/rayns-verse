// app/routes/public.drive-link.$domain.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Folder, FileText, Trash2, Edit2, FolderPlus, Upload, Download,
  Check, X, Eye, Lock, AlertCircle, Link2OffIcon, MapPin,
  Shirt, IdCard, LayoutGrid, ChevronRight, Layers, ArrowLeft
} from "lucide-react";
import {
  useLoaderData,
  type LoaderFunction,
  type ActionFunction,
  useNavigate,
  useActionData,
} from "react-router";
import { API } from "~/lib/api";
import { toast } from "sonner";
import { getOptionalUser } from "~/lib/session.server";
import NotaView from "~/components/NotaView";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import ModalSecond from "~/components/modal/ModalSecond";
import { Button } from "~/components/ui/button";
import { DriveBreadcrumb } from "~/components/breadcrumb/DriveBreadcrumb";
import Swal from "sweetalert2";
import { getMimeType, safeParseObject } from "~/lib/utils";
import { sendTelegramLog } from "~/lib/telegram-log";
import { getGoogleMapsLink } from "~/constants";
import JSZip from "jszip";
import { TwibbonTabContent } from "~/components/ClientUseEditorPage";

// --- LOADER (LOGIC PRESERVED) ---
export const loader: LoaderFunction = async ({ request, params }) => {
  const domain = params?.domain;
  const authData = await getOptionalUser(request);

  if (!domain) {
    throw new Response("Domain tidak ditemukan", { status: 404 });
  }

  const url = new URL(request.url);
  const { folder_id } = Object.fromEntries(url.searchParams.entries());

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
      req: { query: { id: folder_id || "null", size: 1 } },
    });

    return Response.json(
      {
        session: authData?.user || null,
        domain,
        orderData: orderRes?.items?.[0] ?? null,
        current_folder: detailFolder?.items?.[0] ?? null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Loader error:", error);
    sendTelegramLog("PUBLIC_DRIVE_LINK_LOADER_ERROR", { domain, error });
    return Response.json(
      { session: authData?.user || null, domain, orderData: null },
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", Pragma: "no-cache" } }
    );
  }
};

// --- ACTION (LOGIC PRESERVED) ---
export const action: ActionFunction = async ({ request, params }) => {
  const domain = params.domain;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;
  const { folder_name, parent_id, order_number, ...payload } = Object.fromEntries(formData.entries());

  if (!domain) return Response.json({ success: false, message: "Domain tidak ditemukan" });

  try {
    let resMessage = "";
    if (intent === "create_folder") {
      const result = await API.ORDER_UPLOAD.create_single_folder({
        session: {},
        req: { body: { ...(id && { id }), folder_name, parent_id, order_number } },
      });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menambahkan folder";
    }
    else if (intent === "create_file") {
      const result = await API.ORDER_UPLOAD.create_single_file({
        session: {},
        req: { body: payload },
      });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menambahkan file";
    }
    else if (intent === "delete_folder") {
      const result = await API.ORDER_UPLOAD.delete_folder({ session: {}, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menghapus folder";
    }
    else if (intent === "delete_file") {
      const result = await API.ORDER_UPLOAD.delete_file({ session: {}, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menghapus file";
    }
    else if (intent === "update_review") {
      const rating = Number(formData.get("rating"));
      const review = formData.get("review") as string;
      const res = await API.ORDERS.update({ session: {}, req: { body: { id, rating, review } } });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal" });
      resMessage = "Berhasil mengirim ulasan";
    }
    else if (intent === "update_payment_proof") {
      const proof = formData.get("proof") as string;
      const res = await API.ORDERS.update({ session: {}, req: { body: { id, payment_proof: proof } } });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal" });
      resMessage = "Berhasil memperbarui bukti pembayaran";
    }
    else if (intent === "upsert_assignment") {
      const payload = {
        id: formData.get("id") as string,
        order_trx_code: formData.get("order_trx_code"),
        category: formData.get("category") === 'twibbon-idcard' ? 'idcard' : 'lanyard',
        twibbon_template_id: formData.get("twibbon_template_id"),
        twibbon_template_name: formData.get("twibbon_template_name"),
      };
      const res = await API.TWIBBON_ASSIGNMENT.upsert({
        session: {},
        req: { body: payload }
      });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal menyimpan setting desain" });
      resMessage = "Berhasil menyimpan setting desain";
    }
    else if (intent === "delete_assignment") {
      const id = formData.get("id") as string;
      const res = await API.TWIBBON_ASSIGNMENT.delete({
        session: {},
        req: { body: { id } }
      });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal menghapus desain" });
      resMessage = "Berhasil menghapus desain terpilih";
    }

    return Response.json({ success: true, message: resMessage });
  } catch (e: any) {
    console.error("Error:", e);
    sendTelegramLog("PUBLIC_DRIVE_LINK_ACTION_ERROR", { domain, error: e });
    return Response.json({ success: false, message: e.message || "Terjadi kesalahan" });
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function PublicDriveLinkPage() {
  const { domain, orderData, current_folder, session } = useLoaderData();
  const { data: actionDataFetcher, loading: loadingActionFetcher, load: submitAction } = useFetcherData({
    endpoint: "", method: "POST", autoLoad: false,
  });

  const navigate = useNavigate();
  const query = useQueryParams();
  const [modal, setModal] = useModal();
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- NEW STATE FOR MULTI-CATEGORY HANDLING ---
  const [activeCategory, setActiveCategory] = useState<'idcard_lanyard' | 'shirt' | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [fabOpen, setFabOpen] = useState(false); // FAB state — must be here, before any early returns

  // --- STATE INIT ---
  const [order, setOrder] = useState(orderData || { id: domain, instansi: 'Unknown', twibbonAssignments: [] });

  const currentFolderId = query.folder_id || orderData?.drive_folder_id || null;

  useEffect(() => { setIsClient(true); }, []);

  // Check Category Flags on Mount
  useEffect(() => {
    if (!orderData) return;

    const hasIdCardLanyard = +orderData?.is_idcard_lanyard === 1;
    const hasShirt = +orderData?.is_order_shirt === 1; // Assuming this flag exists in orderData based on prompt

    if (hasIdCardLanyard && hasShirt) {
      // Both active: Show selection UI
      setShowCategorySelection(true);
      // Play animation logic
      setTimeout(() => setAnimationPlayed(true), 2500); // Animation duration
    } else if (hasShirt) {
      // Only Shirt
      setActiveCategory('shirt');
    } else {
      // Default / Only ID Card
      setActiveCategory('idcard_lanyard');
    }
  }, [orderData]);


  // Version Check Effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const CURRENT_VERSION = "v0.0.2"; // Bumped version for new UI
      const savedVersion = localStorage.getItem("app_public_version");
      if (savedVersion !== CURRENT_VERSION) {
        localStorage.setItem("app_public_version", CURRENT_VERSION);
        if ("caches" in window) caches.keys().then((names) => { for (const name of names) caches.delete(name); });
        // window.location.reload(); // Optional: force reload
      }
    }
  }, []);

  // 1. Data Fetching Folders
  const { data: realFolders, loading: isLoadingFolders, reload: reloadRealFolders } = useFetcherData<any>({
    endpoint: nexus().module("ORDER_UPLOAD").action("get_folder").params({
      page: 0, size: 100, order_number: orderData?.order_number, ...(currentFolderId && { folder_id: currentFolderId }),
    }).build(),
    autoLoad: !!orderData?.order_number,
  });

  // 2. Data Fetching Files
  const { data: realFiles, loading: isLoadingFiles, reload: reloadRealFiles } = useFetcherData<any>({
    endpoint: nexus().module("ORDER_UPLOAD").action("get_file").params({
      page: 0, size: 100, order_number: orderData?.order_number, ...(currentFolderId ? { folder_id: currentFolderId } : { folder_id: "null" }),
    }).build(),
    autoLoad: !!orderData?.order_number,
  });

  // 3. Data Fetching Templates
  const { data: templateRes, loading: loadingTemplates } = useFetcherData<any>({
    endpoint: nexus().module("TWIBBON_TEMPLATE").action("get").params({ page: 0, size: 100 }).build(),
    autoLoad: true,
  });

  // 4. Fetch Real Order Assignments
  const { data: assignmentRes, loading: loadingAssignments, reload: reloadAssignments } = useFetcherData<any>({
    endpoint: nexus().module("TWIBBON_ASSIGNMENT").action("get").params({ order_trx_code: orderData?.order_number || orderData?.id, size: 50 }).build(),
    autoLoad: !!orderData,
  });

  const currentOrderWithAssignments = useMemo(() => {
    const dbAssignments = assignmentRes?.data?.items || [];
    const mappedAssignments = dbAssignments.map((a: any) => ({
      id: a.id,
      unique_code: a.unique_code,
      type: a.category === 'twibbon-idcard' ? 'idcard' : (a.category === 'twibbon-lanyard' ? 'lanyard' : a.category),
      templateId: a.twibbon_template_id,
      publicLink: a.public_url_link
    }));
    return { ...orderData, twibbonAssignments: mappedAssignments };
  }, [orderData, assignmentRes]);

  useEffect(() => { if (currentOrderWithAssignments) setOrder(currentOrderWithAssignments); }, [currentOrderWithAssignments]);
  useEffect(() => { if (actionDataFetcher?.success) reloadAssignments(); }, [actionDataFetcher]);

  const templates = useMemo(() => {
    const items = templateRes?.data?.items || [];
    return items.map((t: any) => ({
      id: t.id, name: t.name, unique_code: t.unique_code,
      category: t.category === 'twibbon-idcard' ? 'idcard' : (t.category === 'twibbon-lanyard' ? 'lanyard' : t.category),
      baseImage: t.base_image, rules: typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules, styleMode: t.style_mode
    }));
  }, [templateRes]);

  const isNotFound = useMemo(() => !orderData?.order_number && !current_folder, [orderData, current_folder]);

  useEffect(() => {
    if (isNotFound) sendTelegramLog("PUBLIC_DRIVE_LINK_NOT_FOUND", { domain, orderData, current_folder, query });
  }, [isNotFound]);

  // Filter Folders/Files based on Active Category (Optional Logic if backend supports filtering by tag/category)
  // For now, we assume all folders are mixed but we structure the view via tabs.
  // FUTURE: You might want to filter `folders` based on `activeCategory` if your backend supports metadata on folders.
  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  // --- Handlers ---
  const handleOpenFolder = (folderId: string) => navigate(`/public/drive-link/${domain}?folder_id=${folderId}`);
  const handleDownloadAll = (e: React.MouseEvent) => {
    e.preventDefault();
    const targetFolderId = query.folder_id || orderData?.drive_folder_id;
    if (!targetFolderId) return toast.error("Folder ID tidak ditemukan");
    window.location.href = `/server/drive/${targetFolderId}/download`;
    toast.success("Download dimulai...");
  };
  const onUpdateReview = (rating: number, review: string) => submitAction({ intent: "update_review", id: orderData.id, rating: String(rating), review });
  const onUpdatePaymentProof = (id: string, proof: string) => submitAction({ intent: "update_payment_proof", id, proof });
  const onDeleteItem = (item: any, type: "folder" | "file") => {
    Swal.fire({
      title: `Hapus ${type === "folder" ? "Folder" : "File"}?`, text: `Yakin ingin menghapus ${type === "folder" ? item.folder_name : item.file_name}?`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
      customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
    }).then((result) => { if (result.isConfirmed) submitAction({ intent: `delete_${type}`, id: item?.id }); });
  };
  const onCreateFolder = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    submitAction({ intent: "create_folder", folder_name: modal?.data?.folder_name, order_number: orderData?.order_number, parent_id: current_folder?.id || query?.folder_id || null });
  };
  const onRenameFolder = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    submitAction({ intent: "create_folder", id: modal?.data?.id, folder_name: modal?.data?.folder_name });
  };
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const processUploadFile = async (file: File, retries = 2) => {
    try {
      let uploadRes; let attempt = 0;
      while (attempt <= retries) {
        try { uploadRes = await API.ASSET.upload(file); break; }
        catch (err) { attempt++; if (attempt > retries) throw err; await delay(1000); }
      }
      const newFilePayload = {
        file_type: getMimeType(file.name), file_url: uploadRes.url, file_name: uploadRes.original_name || file.name,
        folder_id: currentFolderId || orderData?.drive_folder_id || null, level: currentFolderId ? 2 : 1, order_number: orderData?.order_number,
      };
      const result = await API.ORDER_UPLOAD.create_single_file({ session: {}, req: { body: newFilePayload } });
      if (!result.success) throw new Error(result.message);
      return { success: true, fileName: file.name };
    } catch (err) { return { success: false, fileName: file.name, error: err }; }
  };
  const uploadWithLimit = async (files: File[], limit: number, onProgress: any, processFn: any) => {
    const results: any[] = []; const queue = [...files]; let completed = 0;
    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift(); if (!file) continue;
        try { const res = await processFn(file); results.push(res); } catch (err) { results.push({ success: false, fileName: file.name, error: err }); } finally { completed++; onProgress(completed); }
      }
    };
    const workers = Array(Math.min(limit, files.length)).fill(null).map(() => worker());
    await Promise.all(workers); return results;
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files; if (!fileList || fileList.length === 0) return;
    setLoadingUpload(true); const toastId = toast.loading("Mempersiapkan file...");
    try {
      let filesToUpload: File[] = []; const rawFiles = Array.from(fileList);
      for (const file of rawFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "zip" || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
          toast.loading(`Mengekstrak ${file.name}...`, { id: toastId });
          try {
            const zip = new JSZip(); const content = await zip.loadAsync(file); const entries = Object.keys(content.files);
            for (const filename of entries) {
              const item = content.files[filename]; if (item.dir || filename.includes("__MACOSX") || filename.startsWith(".")) continue;
              const blob = await item.async("blob"); const cleanName = filename.split("/").pop() || filename;
              filesToUpload.push(new File([blob], cleanName, { type: getMimeType(cleanName) === "image" ? `image/${cleanName.split(".").pop()}` : blob.type }));
            }
          } catch (zipErr) { toast.error(`Gagal mengekstrak ${file.name}, upload biasa.`); filesToUpload.push(file); }
        } else { filesToUpload.push(file); }
      }
      if (filesToUpload.length === 0) { toast.dismiss(toastId); toast.warning("Tidak ada file valid"); setLoadingUpload(false); return; }
      const results = await uploadWithLimit(filesToUpload, 3, (count: any) => { toast.loading(`Mengunggah ${count}/${filesToUpload.length}...`, { id: toastId }); }, (file: any) => processUploadFile(file));
      const successful = results.filter((r: any) => r.success).length; const failed = results.filter((r: any) => !r.success).length;
      if (failed === 0) toast.success(`${successful} File berhasil`, { id: toastId }); else toast.warning(`${successful} Berhasil, ${failed} Gagal`, { id: toastId });
      reloadRealFolders(); reloadRealFiles();
    } catch (err: any) { toast.error("Error sistem"); sendTelegramLog("UPLOAD_ERROR", { domain, error: err }); } finally { setLoadingUpload(false); e.target.value = ""; }
  };

  const getTemplateName = (tplId: string) => templates.find((t: any) => t.id === tplId)?.name || "Unknown Template";
  const handleUpdate = (orderId: string, updatedAssignments: any[]) => {
    setOrder({ ...order, twibbonAssignments: updatedAssignments });
    updatedAssignments.forEach(asg => {
      if (!asg.templateId) return;
      submitAction({
        intent: "upsert_assignment", id: asg.id.startsWith('asg-') ? '' : asg.id, order_trx_code: orderData.order_number,
        category: asg.type === 'idcard' ? 'twibbon-idcard' : 'twibbon-lanyard', twibbon_template_id: asg.templateId, twibbon_template_name: getTemplateName(asg.templateId)
      });
    });
  };
  const handleAdd = () => {
    const type = query.tab === 'idcard' ? 'idcard' : 'lanyard';
    const newAsg = { id: `asg-${Date.now()}`, type: type, templateId: '' };
    setOrder((prev: any) => ({ ...prev, twibbonAssignments: [...(prev.twibbonAssignments || []), newAsg] }));
  };
  const handleDeleteAssignment = (asgId: string) => {
    if (asgId.startsWith('asg-')) { setOrder((prev: any) => ({ ...prev, twibbonAssignments: prev.twibbonAssignments.filter((a: any) => a.id !== asgId) })); }
    else { submitAction({ intent: "delete_assignment", id: asgId }); }
  };

  // --- Render Logic ---
  if (!isClient) return <DriveSkeleton />;
  // const isNotFound = useMemo(() => !orderData?.order_number && !current_folder, [orderData, current_folder]);
  // if (isNotFound) return <NotFoundPage domain={domain} session={session} />;
  if (isLoadingFolders && isLoadingFiles) return <DriveSkeleton orderData={orderData} />;

  // --- MULTI-CATEGORY SELECTION UI ---
  if (showCategorySelection && !activeCategory) {
    return (
      <CategoryOnboarding
        animationPlayed={animationPlayed}
        onSelect={(cat) => {
          setActiveCategory(cat);
          // Optional: Reset query params or set default tab
          navigate(`?tab=drive`, { replace: true });
        }}
      />
    );
  }

  // Define tabs based on Active Category
  const activeTab = query.tab || 'drive';

  const showBackButton = +orderData?.is_idcard_lanyard === 1 && +orderData?.is_order_shirt === 1;

  const renderContent = () => {
    if (activeTab === 'drive') {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DriveBreadcrumb
            domain={domain} currentFolderId={current_folder?.id || query?.folder_id} rootFolderId={orderData?.drive_folder_id} folderIdentity={current_folder}
            breadcrumbs={current_folder?.id ? [{ id: current_folder?.id, name: current_folder?.folder_name }] : []} onOpenFolder={handleOpenFolder}
          />
          {/* Download hint bar */}
          {files.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">{(realFolders?.data?.total_items || 0) + (realFiles?.data?.total_items || 0)} item</span>
              <button onClick={handleDownloadAll} disabled={isDownloading} className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                <Download size={14} className={isDownloading ? 'animate-bounce' : ''} /> Unduh Semua
              </button>
            </div>
          )}
          <div className="p-3 pb-6" onClick={() => setSelectedItem(null)}>
            <DriveGrid
              folders={folders} files={files} selectedItem={selectedItem} setSelectedItem={setSelectedItem} onOpenFolder={handleOpenFolder}
              onRename={(folder: any) => setModal({ ...modal, open: true, type: "rename_folder", data: folder })} onDelete={onDeleteItem} onPreview={(file: any) => setModal({ ...modal, open: true, type: "zoom_image", data: file })}
              onRenameSave={onRenameFolder} modalData={modal} setModalData={(val: any) => setModal({ ...modal, ...val })}
            />
          </div>
          <FooterHint />
        </div>
      );
    }

    if (activeCategory === 'idcard_lanyard' && (activeTab === 'idcard' || activeTab === 'lanyard')) {
      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <TwibbonTabContent
            activeTab={activeTab === 'idcard' ? "twibbon-idcard" : "twibbon-lanyard"}
            currentOrder={order} designTemplates={templates}
            onUpdateAssignments={(oid, newAsgs) => handleUpdate(oid, newAsgs)}
            onShowEditor={(tpl: any) => alert(`Membuka Editor: ${tpl.name}`)}
            onAddAssignment={handleAdd} handleDeleteAssignment={handleDeleteAssignment}
          />
        </div>
      );
    }

    if (activeCategory === 'shirt' && activeTab === 'shirt_specs') {
      return (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm text-gray-400 animate-in fade-in duration-500">
          <Shirt size={48} className="mb-4 opacity-50" />
          <p className="text-sm font-medium">Fitur Spesifikasi Baju akan segera hadir.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: '100px' }}>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="*/*" multiple />

      {/* ── Sticky Header ── */}
      <Header orderData={orderData} domain={domain} activeCategory={activeCategory} />

      {/* ── Info Card: Nota + Alamat ── */}
      <DriveInfoBar
        orderData={orderData}
        onViewNota={() => setModal({ ...modal, open: true, type: "view_nota", data: orderData })}
      />

      {/* ── Tabs ── */}
      <DriveTabs
        activeTab={activeTab}
        activeCategory={activeCategory}
        showBackButton={showBackButton}
        onBack={() => setActiveCategory(null)}
        onNavigate={(tab: string) => navigate(`?tab=${tab}`)}
      />

      {/* ── Content ── */}
      <div className="px-3 pt-3">
        {renderContent()}
      </div>

      {/* ── FAB (Floating Action Button) ── */}
      {activeTab === 'drive' && (
        <DriveFAB
          fabOpen={fabOpen}
          setFabOpen={setFabOpen}
          loadingAction={loadingActionFetcher}
          loadingUpload={loadingUpload}
          onNewFolder={() => { setFabOpen(false); setModal({ ...modal, open: true, type: "create_folder" }); }}
          onUpload={() => { setFabOpen(false); fileInputRef.current?.click(); }}
        />
      )}

      <GlobalModals
        modal={modal} setModal={setModal} loadingAction={loadingActionFetcher} orderData={orderData}
        onCreateFolder={onCreateFolder} onUpdateReview={onUpdateReview} onUpdatePaymentProof={onUpdatePaymentProof}
      />
    </div>
  );
}

// ============================================
// NEW COMPONENT: CATEGORY ONBOARDING
// ============================================

const CategoryOnboarding = ({ animationPlayed, onSelect }: { animationPlayed: boolean; onSelect: (cat: 'idcard_lanyard' | 'shirt') => void }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[120px] opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px] opacity-40 animate-pulse delay-1000" />

      <div className={`max-w-4xl w-full text-center transition-all duration-1000 ${animationPlayed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
            Halo! Pesanan Anda Memiliki <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">2 Kategori Produk</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Untuk memudahkan pengelolaan file dan desain, silakan pilih kategori yang ingin Anda akses terlebih dahulu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card 1: ID Card / Lanyard */}
          <button
            onClick={() => onSelect('idcard_lanyard')}
            className="group relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <IdCard size={120} className="text-purple-600 rotate-12" />
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
              <LayoutGrid size={28} className="text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ID Card & Lanyard</h3>
            <p className="text-gray-500 text-sm mb-6">Kelola file cetak peserta, desain twibbon ID Card, dan layout lanyard event.</p>
            <div className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:gap-3 transition-all">
              Buka Kategori <ChevronRight size={16} />
            </div>
          </button>

          {/* Card 2: Kaos / Kemeja */}
          <button
            onClick={() => onSelect('shirt')}
            className="group relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:border-teal-300 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shirt size={120} className="text-teal-600 -rotate-12" />
            </div>
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors duration-300">
              <Shirt size={28} className="text-teal-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Kaos & Kemeja</h3>
            <p className="text-gray-500 text-sm mb-6">Upload desain sablon, detail ukuran, dan spesifikasi produksi baju.</p>
            <div className="inline-flex items-center gap-2 text-teal-600 font-bold text-sm group-hover:gap-3 transition-all">
              Buka Kategori <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>

      {/* Animation Trigger Hack */}
      {!animationPlayed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-[60] animate-fadeOut pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Memuat Kategori...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENTS — Mobile-First Redesign
// ============================================

// ── Header ──────────────────────────────────
const Header = ({ orderData, domain, activeCategory }: { orderData: any; domain: string; activeCategory: string | null }) => {
  const displayName = +orderData?.is_kkn === 1
    ? `KKN ${orderData?.kkn_period}`
    : (orderData?.institution_name || orderData?.pic_name || "Guest");

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
          <img src="/head-icon-kinau.png" alt="Kinau" className="w-5 invert brightness-0" />
        </div>
        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Drive File Cetak</h1>
            {activeCategory && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${activeCategory === 'shirt'
                ? 'bg-teal-50 text-teal-700'
                : 'bg-purple-50 text-purple-700'
                }`}>
                {activeCategory === 'shirt' ? 'KAOS' : 'ID CARD'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate" title={displayName}>{displayName}</p>
        </div>
        {/* Public badge */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-medium text-gray-400 shrink-0">
          <Lock size={10} /> Publik
        </div>
      </div>
    </div>
  );
};

// ── Info Bar: Nota + Alamat highlight ───────
const DriveInfoBar = ({ orderData, onViewNota }: { orderData: any; onViewNota: () => void }) => {
  if (!orderData) return null;
  return (
    <div className="max-w-2xl mx-auto px-3 pt-3 pb-1">
      <div className="grid grid-cols-2 gap-2">
        {/* Nota Card */}
        <button
          onClick={onViewNota}
          className="relative overflow-hidden flex flex-col items-start gap-1 p-3 rounded-2xl bg-amber-400 text-white active:scale-95 transition-transform shadow-md shadow-amber-200"
        >
          <div className="absolute -top-3 -right-3 opacity-20">
            <FileText size={60} />
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-1">
            <FileText size={18} className="text-white" />
          </div>
          <span className="text-xs font-bold leading-tight">Lihat Nota</span>
          <span className="text-[10px] text-amber-100">Detail pesanan</span>
        </button>

        {/* Alamat / Maps Card */}
        <a
          href={getGoogleMapsLink()}
          target="_blank"
          rel="noreferrer"
          className="relative overflow-hidden flex flex-col items-start gap-1 p-3 rounded-2xl bg-red-500 text-white active:scale-95 transition-transform shadow-md shadow-red-200"
        >
          <div className="absolute -top-3 -right-3 opacity-20">
            <MapPin size={60} />
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-1">
            <MapPin size={18} className="text-white" />
          </div>
          <span className="text-xs font-bold leading-tight">Lihat Lokasi</span>
          <span className="text-[10px] text-red-200">Buka Google Maps</span>
        </a>
      </div>
    </div>
  );
};

// ── Tabs ─────────────────────────────────────
const DriveTabs = ({ activeTab, activeCategory, showBackButton, onBack, onNavigate }: any) => {
  const tabs = [
    { id: 'drive', label: 'Drive', icon: <Folder size={15} />, show: true },
    { id: 'idcard', label: 'ID Card', icon: <IdCard size={15} />, show: activeCategory === 'idcard_lanyard' },
    { id: 'lanyard', label: 'Lanyard', icon: <Layers size={15} />, show: activeCategory === 'idcard_lanyard' },
    // { id: 'shirt_specs', label: 'Ukuran', icon: <Shirt size={15} />, show: activeCategory === 'shirt' },
  ].filter(t => t.show);

  const colorMap: Record<string, string> = {
    drive: 'bg-blue-600 text-white shadow-blue-200',
    idcard: 'bg-purple-600 text-white shadow-purple-200',
    lanyard: 'bg-orange-500 text-white shadow-orange-200',
  };

  return (
    <div className="max-w-2xl mx-auto px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-full whitespace-nowrap shrink-0 active:scale-95 transition-transform"
          >
            <ArrowLeft size={13} /> Ganti
          </button>
        )}
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 shadow-sm ${activeTab === tab.id
              ? `${colorMap[tab.id] || 'bg-blue-600 text-white'} shadow`
              : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── FAB (Floating Action Button) ─────────────
const DriveFAB = ({ fabOpen, setFabOpen, loadingAction, loadingUpload, onNewFolder, onUpload }: any) => (
  <div className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-3">
    {/* Sub-buttons */}
    <div className={`flex flex-col items-end gap-2 transition-all duration-300 ${fabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
      {/* Folder Baru */}
      <button
        onClick={onNewFolder}
        disabled={loadingAction}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-lg active:scale-95 transition-transform"
      >
        <FolderPlus size={18} className="text-amber-500" /> Folder Baru
      </button>
      {/* Upload */}
      <button
        onClick={onUpload}
        disabled={loadingUpload}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-300 active:scale-95 transition-transform"
      >
        <Upload size={18} /> {loadingUpload ? 'Mengunggah...' : 'Upload File'}
      </button>
    </div>

    {/* Backdrop untuk tutup FAB */}
    {fabOpen && (
      <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />
    )}

    {/* Main FAB Button */}
    <button
      onClick={() => setFabOpen((prev: boolean) => !prev)}
      className={`w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-300 active:scale-95 transition-all duration-300 ${fabOpen ? 'rotate-45' : 'rotate-0'
        }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
);

const DriveGrid = ({ folders, files, selectedItem, setSelectedItem, onOpenFolder, onRename, onDelete, onPreview, onRenameSave, modalData, setModalData }: any) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-300 py-20">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-3">
          <Folder size={40} className="text-gray-200" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Folder masih kosong</p>
        <p className="text-xs text-gray-300 mt-1">Ketuk tombol + untuk menambah file</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {folders.map((folder: any) => (
        <div
          key={folder.id}
          onClick={() => onOpenFolder(folder?.id)}
          className="group relative p-3 rounded-2xl border border-gray-100 bg-white flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-150 hover:shadow-md hover:border-gray-200"
        >
          {/* Action menu */}
          {!folder.isSystem && (
            <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedItem(selectedItem === folder.id ? null : folder.id); }}
                className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
              </button>
              {selectedItem === folder.id && (
                <div className="absolute top-7 right-0 w-32 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button onClick={() => { onRename(folder); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <Edit2 size={13} className="text-gray-400" /> Ganti Nama
                  </button>
                  <div className="h-px bg-gray-50" />
                  <button onClick={() => { onDelete(folder, 'folder'); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50">
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Icon */}
          <div className="w-full aspect-square flex items-center justify-center bg-amber-50 rounded-xl">
            <Folder size={44} className="text-amber-400 fill-amber-400" />
          </div>
          {/* Name */}
          {modalData?.type === "rename_folder" && modalData?.data?.id === folder.id ? (
            <input
              autoFocus
              className="w-full text-center text-xs border border-blue-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={modalData?.data?.folder_name}
              onChange={(e) => setModalData({ data: { ...modalData?.data, folder_name: e.target.value } })}
              onBlur={(e) => onRenameSave(e)}
              onKeyDown={(e) => e.key === "Enter" && onRenameSave(e)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-[11px] font-semibold text-gray-700 text-center w-full leading-tight line-clamp-2" title={folder.folder_name}>
              {folder.folder_name}
            </p>
          )}
        </div>
      ))}

      {files.map((file: any) => (
        <div
          key={file.id}
          onClick={() => { window.open(file.file_url, '_blank'); }}
          className="group relative p-3 rounded-2xl border border-gray-100 bg-white flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-150 hover:shadow-md hover:border-gray-200"
        >
          {/* Action menu */}
          <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedItem(selectedItem === file.id ? null : file.id); }}
              className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
            </button>
            {selectedItem === file.id && (
              <div className="absolute top-7 right-0 w-32 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => { onPreview(file); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Eye size={13} className="text-gray-400" /> Preview
                </button>
                <div className="h-px bg-gray-50" />
                <button onClick={() => { onDelete(file, 'file'); setSelectedItem(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            )}
          </div>
          {/* Thumbnail */}
          <div className="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden relative">
            {getMimeType(file.file_name) === 'image' ? (
              <img src={file.file_url} className="w-full h-full object-cover" alt={file.file_name} />
            ) : (
              <FileText size={36} className="text-blue-400" />
            )}
          </div>
          {/* Name */}
          <p className="text-[11px] font-medium text-gray-600 text-center w-full leading-tight line-clamp-2" title={file.file_name}>
            {file.file_name}
          </p>
        </div>
      ))}
    </div>
  );
};

// ... GlobalModals, NotFoundPage, FooterHint, DriveSkeleton remain essentially the same, just keeping the styling consistent ...
const GlobalModals = ({ modal, setModal, loadingAction, orderData, onCreateFolder, onUpdateReview, onUpdatePaymentProof }: any) => {
  return (
    <>
      {modal?.type === "zoom_image" && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModal({ ...modal, type: "", open: false })}>
          <button onClick={() => setModal({ ...modal, type: "", open: false })} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"><X size={40} /></button>
          <img src={modal?.data?.file_url} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {/* ... Other modals same logic ... */}
      {modal?.type === "view_nota" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1 shadow-sm border border-gray-100" onClick={() => setModal({ ...modal, type: "", open: false })}><X size={18} /></button>
            <NotaView order={modal?.data} isEditable={true} onReviewChange={onUpdateReview} onPaymentProofChange={(proof: string) => onUpdatePaymentProof(orderData.id, proof)} />
          </div>
        </div>
      )}
      {modal?.type === "create_folder" && (
        <ModalSecond open={modal?.open} onClose={() => setModal({ ...modal, type: "", open: false })} size="md" title="Buat Folder Baru" icon={<FolderPlus size={24} className="text-blue-600" />}>
          <form onSubmit={onCreateFolder} className="mt-2">
            <input autoFocus className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" placeholder="Nama Folder..." value={modal?.data?.folder_name || ""} onChange={(e) => setModal({ ...modal, data: { ...modal?.data, folder_name: e.target.value } })} />
            <div className="flex gap-3">
              <Button type="button" onClick={() => setModal({ ...modal, type: "", open: false })} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Batal</Button>
              <Button type="submit" disabled={loadingAction} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">{loadingAction ? "Memproses..." : "Buat Folder"}</Button>
            </div>
          </form>
        </ModalSecond>
      )}
    </>
  );
};

const NotFoundPage = ({ domain, session }: { domain: string; session: any; }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto"><Link2OffIcon size={40} className="text-red-500" /></div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Link Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-8">Link yang Anda tuju mungkin salah, sudah kadaluarsa, atau telah dihapus oleh pemilik.</p>
        <a href={!session ? "/" : "/app/overview"} className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"><Folder size={18} />Kembali ke Beranda</a>
      </div>
    </div>
  );
};

const FooterHint = () => (
  <div className="p-3 border-t border-gray-50 text-[10px] text-gray-300 text-center">
    &copy; 2024 Kinau.id · All rights reserved
  </div>
);

const DriveSkeleton = ({ orderData }: { orderData?: any } = {}) => (
  <div className="min-h-screen bg-gray-50">
    {/* Skeleton Header */}
    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-2.5 w-20 bg-gray-50 rounded animate-pulse" />
      </div>
    </div>
    {/* Skeleton Info Bar */}
    <div className="px-3 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-20 bg-amber-100 rounded-2xl animate-pulse" />
        <div className="h-20 bg-red-100 rounded-2xl animate-pulse" />
      </div>
    </div>
    {/* Skeleton Tabs */}
    <div className="px-3 py-2 flex gap-2">
      <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
    </div>
    {/* Skeleton Grid */}
    <div className="px-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3">
            <div className="aspect-square bg-gray-50 rounded-xl animate-pulse mb-2" />
            <div className="h-2.5 w-3/4 mx-auto bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
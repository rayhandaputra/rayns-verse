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

  // Sub-tabs logic
  const renderSubTabs = () => {
    // If multiple categories, allow switching back to selection or other category
    const showBackButton = +orderData?.is_idcard_lanyard === 1 && +orderData?.is_order_shirt === 1;

    return (
      <div className="flex flex-wrap items-center gap-2 mt-4 px-4 sm:px-0">
        {showBackButton && (
          <button
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all mr-2"
          >
            <ArrowLeft size={14} /> Ganti Kategori
          </button>
        )}

        <button
          onClick={() => navigate(`?tab=drive`)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${activeTab === 'drive'
            ? 'bg-white border-blue-200 text-blue-600 shadow-md ring-2 ring-blue-50'
            : 'bg-white/50 border-transparent text-gray-500 hover:bg-white hover:text-gray-700'
            }`}
        >
          <Folder size={16} className={activeTab === 'drive' ? 'fill-blue-100' : ''} />
          DRIVE FOLDER
        </button>

        {activeCategory === 'idcard_lanyard' && (
          <>
            <button
              onClick={() => navigate(`?tab=idcard`)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${activeTab === 'idcard'
                ? 'bg-white border-purple-200 text-purple-600 shadow-md ring-2 ring-purple-50'
                : 'bg-white/50 border-transparent text-gray-500 hover:bg-white hover:text-gray-700'
                }`}
            >
              <IdCard size={16} className={activeTab === 'idcard' ? 'fill-purple-100' : ''} />
              TWIBBON ID CARD
            </button>
            <button
              onClick={() => navigate(`?tab=lanyard`)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${activeTab === 'lanyard'
                ? 'bg-white border-orange-200 text-orange-600 shadow-md ring-2 ring-orange-50'
                : 'bg-white/50 border-transparent text-gray-500 hover:bg-white hover:text-gray-700'
                }`}
            >
              <Layers size={16} className={activeTab === 'lanyard' ? 'fill-orange-100' : ''} />
              TWIBBON LANYARD
            </button>
          </>
        )}

        {/* {activeCategory === 'shirt' && (
          <button
            onClick={() => navigate(`?tab=shirt_specs`)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${activeTab === 'shirt_specs'
              ? 'bg-white border-teal-200 text-teal-600 shadow-md ring-2 ring-teal-50'
              : 'bg-white/50 border-transparent text-gray-500 hover:bg-white hover:text-gray-700'
              }`}
          >
            <Shirt size={16} className={activeTab === 'shirt_specs' ? 'fill-teal-100' : ''} />
            DATA UKURAN
          </button>
        )} */}
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'drive') {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-gray-50/80 to-white p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${activeCategory === 'shirt' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                {activeCategory === 'shirt' ? 'Kategori Apparel' : 'Kategori Merchandise'}
              </span> */}
              <h2 className="text-sm font-semibold text-gray-700">File Manager</h2>
            </div>
          </div>
          <DriveToolbar
            loadingAction={loadingActionFetcher} loadingUpload={loadingUpload} fileCount={files.length} totalItems={(realFolders?.data?.total_items || 0) + (realFiles?.data?.total_items || 0)} isDownloading={isDownloading}
            onNewFolder={() => setModal({ ...modal, open: true, type: "create_folder" })} onUpload={() => fileInputRef.current?.click()} onDownloadAll={handleDownloadAll} onViewNota={() => setModal({ ...modal, open: true, type: "view_nota", data: orderData })}
          />
          <DriveBreadcrumb
            domain={domain} currentFolderId={current_folder?.id || query?.folder_id} rootFolderId={orderData?.drive_folder_id} folderIdentity={current_folder}
            breadcrumbs={current_folder?.id ? [{ id: current_folder?.id, name: current_folder?.folder_name }] : []} onOpenFolder={handleOpenFolder}
          />
          <div className="flex-1 overflow-y-auto p-4" onClick={() => setSelectedItem(null)}>
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

    // Logic for ID Card / Lanyard Editor tabs
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
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

      <Header orderData={orderData} domain={domain} activeCategory={activeCategory} />

      <div className="max-w-7xl mx-auto px-4 py-2 relative z-10">
        {/* Render Tabs Logic based on Active Category */}
        {renderSubTabs()}

        <div className="mt-4">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="*/*" multiple />
          {renderContent()}
        </div>
      </div>

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
// SUB-COMPONENTS (Modified for Style)
// ============================================

const Header = ({ orderData, domain, activeCategory }: { orderData: any; domain: string; activeCategory: string | null }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <img src="/head-icon-kinau.png" alt="K" className="w-6 invert brightness-0" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Drive File Cetak</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="max-w-[200px] truncate" title={orderData?.institution_name || orderData?.pic_name}>
                  {+orderData?.is_kkn === 1 ? `KKN ${orderData?.kkn_period}` : (orderData?.institution_name || orderData?.pic_name || "Guest")}
                </span>
                {activeCategory && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className={`font-semibold ${activeCategory === 'shirt' ? 'text-teal-600' : 'text-purple-600'}`}>
                      {activeCategory === 'shirt' ? 'KAOS' : 'ID CARD & LANYARD'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              <Lock size={12} /> Public Access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DriveToolbar = ({ loadingAction, loadingUpload, fileCount, totalItems, isDownloading, onNewFolder, onUpload, onDownloadAll, onViewNota }: any) => {
  return (
    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
      <div className="flex gap-2 flex-wrap">
        <button onClick={onNewFolder} disabled={loadingAction} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 text-gray-700 transition-all active:scale-95">
          <FolderPlus size={18} className="text-gray-500" /><span>Folder Baru</span>
        </button>
        <button onClick={onUpload} disabled={loadingUpload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
          <Upload size={18} /><span>{loadingUpload ? "Mengunggah..." : "Upload File"}</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {fileCount > 0 && (
          <button onClick={onDownloadAll} disabled={isDownloading} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
            <Download size={18} className={isDownloading ? "animate-bounce" : ""} />
          </button>
        )}
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button onClick={onViewNota} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
          <FileText size={18} /> <span className="hidden sm:inline">Nota</span>
        </button>
        <a href={getGoogleMapsLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">
          <MapPin size={18} /> <span className="hidden sm:inline">Lokasi</span>
        </a>
      </div>
    </div>
  );
};

const DriveGrid = ({ folders, files, selectedItem, setSelectedItem, onOpenFolder, onRename, onDelete, onPreview, onRenameSave, modalData, setModalData }: any) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Folder size={48} className="text-gray-200" />
        </div>
        <p className="font-medium">Belum ada file atau folder</p>
        <p className="text-sm">Klik tombol Upload untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {folders.map((folder: any) => (
        <div
          key={folder.id}
          onClick={(e) => { e.stopPropagation(); setSelectedItem(folder.id); }}
          onDoubleClick={() => onOpenFolder(folder?.id)}
          className={`group relative p-4 rounded-2xl border flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${selectedItem === folder.id ? "bg-blue-50/50 border-blue-200 ring-2 ring-blue-100 shadow-sm" : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-md hover:-translate-y-1"}`}
        >
          <div className="w-full aspect-square flex items-center justify-center bg-amber-50 rounded-xl mb-1">
            <Folder size={48} className="text-amber-400 fill-amber-400 drop-shadow-sm" />
          </div>
          {modalData?.type === "rename_folder" && modalData?.data?.id === folder.id ? (
            <input
              autoFocus className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5"
              value={modalData?.data?.folder_name}
              onChange={(e) => setModalData({ data: { ...modalData?.data, folder_name: e.target.value } })}
              onBlur={(e) => onRenameSave(e)} onKeyDown={(e) => e.key === "Enter" && onRenameSave(e)} onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="text-center w-full"><div className="text-xs font-bold truncate w-full text-gray-700" title={folder.folder_name}>{folder.folder_name}</div></div>
          )}
          {!folder.isSystem && (
            <div className={`absolute top-2 right-2 flex bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden transition-all ${selectedItem === folder.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}>
              <button onClick={(e) => { e.stopPropagation(); onRename(folder); }} className="p-1.5 hover:bg-gray-50 text-gray-500"><Edit2 size={12} /></button>
              <div className="w-px bg-gray-100" />
              <button onClick={(e) => { e.stopPropagation(); onDelete(folder, "folder"); }} className="p-1.5 hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
            </div>
          )}
        </div>
      ))}
      {files.map((file: any) => (
        <div
          key={file.id}
          onClick={(e) => { e.stopPropagation(); setSelectedItem(file.id); }}
          onDoubleClick={() => window.open(file.file_url, "_blank")}
          className={`group relative p-4 rounded-2xl border flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${selectedItem === file.id ? "bg-blue-50/50 border-blue-200 ring-2 ring-blue-100 shadow-sm" : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-md hover:-translate-y-1"}`}
        >
          <div className="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-xl mb-1 relative overflow-hidden">
            {getMimeType(file.file_name) === 'image' ? (
              <img src={file.file_url} className="w-full h-full object-cover" />
            ) : (
              <FileText size={40} className="text-blue-500" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            <button onClick={(e) => { e.stopPropagation(); onPreview(file); }} className="absolute inset-0 m-auto w-10 h-10 bg-white/90 rounded-full shadow-lg text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200"><Eye size={20} /></button>
          </div>
          <div className="text-center w-full"><div className="text-xs font-medium truncate w-full text-gray-600" title={file.file_name}>{file.file_name}</div></div>
          <div className={`absolute top-2 right-2 flex bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden transition-all ${selectedItem === file.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}>
            <button onClick={(e) => { e.stopPropagation(); onDelete(file, "file"); }} className="p-1.5 hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
          </div>
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

const FooterHint = () => {
  return (
    <div className="p-3 border-t border-gray-100 text-[10px] text-gray-400 text-center bg-gray-50/50 rounded-b-2xl">
      &copy; 2024 Kinau.id Drive System. All rights reserved.
    </div>
  );
};

const DriveSkeleton = ({ orderData }: { orderData?: any } = {}) => (
  <div className="min-h-screen bg-white p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-50 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  </div>
);
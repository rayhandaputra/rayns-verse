import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Download, Shirt
} from "lucide-react";
import {
  useLoaderData,
  useNavigate,
} from "react-router";
import { API } from "~/nexus";
import { toast } from "sonner";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import { DriveBreadcrumb } from "~/components/shared/breadcrumb/DriveBreadcrumb";
import Swal from "sweetalert2";
import { getMimeType } from "~/utils/utils";
import { sendTelegramLog } from "~/utils/telegram-log";
import JSZip from "jszip";
import { TwibbonTabContent } from "~/components/features/drive/ClientUseEditorPage";
import { DrivePublicHeader } from "~/components/features/drive/public/DrivePublicHeader";
import { DriveInfoBar } from "~/components/features/drive/public/DriveInfoBar";
import { DriveTabs } from "~/components/features/drive/public/DriveTabs";
import { DriveFAB } from "~/components/features/drive/public/DriveFAB";
import { DriveGrid } from "~/components/features/drive/public/DriveGrid";
import { CategoryOnboarding } from "~/components/features/drive/public/CategoryOnboarding";
import { GlobalModals } from "~/components/features/drive/public/GlobalModals";
import { DriveNotFound } from "~/components/features/drive/public/DriveNotFound";
import { FooterHint } from "~/components/features/drive/public/FooterHint";
import { DriveSkeleton } from "~/components/features/drive/public/DriveSkeleton";

interface PublicDriveFeatureProps {
  domain: string;
  orderData: any;
  current_folder: any;
  session: any;
}

export default function PublicDriveFeature({ domain, orderData, current_folder, session }: PublicDriveFeatureProps) {
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

  const [activeCategory, setActiveCategory] = useState<'idcard_lanyard' | 'shirt' | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const [order, setOrder] = useState(orderData || { id: domain, instansi: 'Unknown', twibbonAssignments: [] });
  const currentFolderId = query.folder_id || orderData?.drive_folder_id || null;

  useEffect(() => {
    setTimeout(() => setIsClient(true), 0);
  }, []);

  useEffect(() => {
    if (!orderData) return;
    const hasIdCardLanyard = +orderData?.is_idcard_lanyard === 1;
    const hasShirt = +orderData?.is_order_shirt === 1;
    if (hasIdCardLanyard && hasShirt) {
      setTimeout(() => setShowCategorySelection(true), 0);
      setTimeout(() => setAnimationPlayed(true), 2500);
    } else if (hasShirt) {
      setTimeout(() => setActiveCategory('shirt'), 0);
    } else {
      setTimeout(() => setActiveCategory('idcard_lanyard'), 0);
    }
  }, [orderData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const CURRENT_VERSION = "v0.0.2";
      const savedVersion = localStorage.getItem("app_public_version");
      if (savedVersion !== CURRENT_VERSION) {
        localStorage.setItem("app_public_version", CURRENT_VERSION);
        if ("caches" in window) caches.keys().then((names) => { for (const name of names) caches.delete(name); });
      }
    }
  }, []);

  const { data: realFolders, reload: reloadRealFolders } = useFetcherData<any>({
    endpoint: nexus().module("ORDER_UPLOAD").action("get_folder").params({
      page: 0, size: 100, order_number: orderData?.order_number, ...(currentFolderId && { folder_id: currentFolderId }),
    }).build(),
    autoLoad: !!orderData?.order_number,
  });

  const { data: realFiles, reload: reloadRealFiles } = useFetcherData<any>({
    endpoint: nexus().module("ORDER_UPLOAD").action("get_file").params({
      page: 0, size: 100, order_number: orderData?.order_number, ...(currentFolderId ? { folder_id: currentFolderId } : { folder_id: "null" }),
    }).build(),
    autoLoad: !!orderData?.order_number,
  });

  const { data: templateRes } = useFetcherData<any>({
    endpoint: nexus().module("TWIBBON_TEMPLATE").action("get").params({ page: 0, size: 100 }).build(),
    autoLoad: true,
  });

  const { data: assignmentRes, reload: reloadAssignments } = useFetcherData<any>({
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

  useEffect(() => {
    if (currentOrderWithAssignments) {
      setTimeout(() => setOrder(currentOrderWithAssignments), 0);
    }
  }, [currentOrderWithAssignments]);

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

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

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
  const uploadWithLimit = async (files: File[], limit: number, onProgress: (completed: number, failedList: string[]) => void, processFn: any) => {
    const results: any[] = [];
    const queue = [...files];
    let completed = 0;
    const failedList: string[] = [];
    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) continue;
        try {
          const res = await processFn(file);
          results.push(res);
          if (!res.success) failedList.push(file.name);
        } catch (err) {
          results.push({ success: false, fileName: file.name, error: err });
          failedList.push(file.name);
        } finally {
          completed++;
          onProgress(completed, failedList);
        }
      }
    };
    const workers = Array(Math.min(limit, files.length)).fill(null).map(() => worker());
    await Promise.all(workers);
    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setLoadingUpload(true);
    const toastId = toast.loading("Mempersiapkan file...");
    try {
      const filesToUpload: File[] = [];
      const rawFiles = Array.from(fileList);
      for (const file of rawFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "zip" || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
          toast.loading(`Mengekstrak ${file.name}...`, { id: toastId });
          try {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            const entries = Object.keys(content.files);
            for (const filename of entries) {
              const item = content.files[filename];
              if (item.dir || filename.includes("__MACOSX") || filename.startsWith(".")) continue;
              const blob = await item.async("blob");
              const cleanName = filename.split("/").pop() || filename;
              filesToUpload.push(new File([blob], cleanName, {
                type: getMimeType(cleanName) === "image" ? `image/${cleanName.split(".").pop()}` : blob.type
              }));
            }
          } catch (zipErr) {
            toast.error(`Gagal mengekstrak ${file.name}, upload biasa.`);
            filesToUpload.push(file);
          }
        } else {
          filesToUpload.push(file);
        }
      }
      if (filesToUpload.length === 0) {
        toast.dismiss(toastId);
        toast.warning("Tidak ada file valid");
        setLoadingUpload(false);
        return;
      }
      const results = await uploadWithLimit(filesToUpload, 3, (count, currentFailed) => {
        const failureText = currentFailed.length > 0 ? ` (${currentFailed.length} gagal)` : "";
        toast.loading(`Mengunggah ${count}/${filesToUpload.length}${failureText}...`, { id: toastId });
      }, (file: any) => processUploadFile(file));
      const successful = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;
      if (failed === 0) {
        toast.success(`${successful} File berhasil diunggah`, { id: toastId });
      } else {
        const failedFileNames = results.filter((r: any) => !r.success).map((r: any) => r.fileName);
        toast.warning(
          <div className="flex flex-col gap-1">
            <p className="font-bold">Unggah selesai dengan beberapa kendala</p>
            <p className="text-xs">Berhasil: {successful}, Gagal: {failed}</p>
            <div className="mt-2 max-h-32 overflow-y-auto text-[10px] bg-red-50 p-2 rounded border border-red-100">
              <p className="font-semibold mb-1 text-red-700">Daftar file gagal:</p>
              <ul className="list-disc list-inside">{failedFileNames.map((name, i) => (<li key={i} className="truncate">{name}</li>))}</ul>
            </div>
          </div>, { id: toastId, duration: 8000 }
        );
      }
      reloadRealFolders(); reloadRealFiles();
    } catch (err: any) {
      toast.error("Error sistem saat mengunggah file");
      sendTelegramLog("UPLOAD_ERROR", { domain, error: err });
    } finally {
      setLoadingUpload(false); e.target.value = "";
    }
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

  if (!isClient) return <DriveSkeleton />;
  if (isNotFound) return <DriveNotFound domain={domain} session={session} />;
  
  if (showCategorySelection && !activeCategory) {
    return (
      <CategoryOnboarding
        animationPlayed={animationPlayed}
        onSelect={(cat) => {
          setActiveCategory(cat);
          navigate(`?tab=drive`, { replace: true });
        }}
      />
    );
  }

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
      <DrivePublicHeader orderData={orderData} domain={domain} activeCategory={activeCategory} />
      <DriveInfoBar orderData={orderData} onViewNota={() => setModal({ ...modal, open: true, type: "view_nota", data: orderData })} />
      <DriveTabs activeTab={activeTab} activeCategory={activeCategory} showBackButton={showBackButton} onBack={() => setActiveCategory(null)} onNavigate={(tab: string) => navigate(`?tab=${tab}`)} />
      <div className="px-3 pt-3">{renderContent()}</div>
      {activeTab === 'drive' && (
        <DriveFAB
          fabOpen={fabOpen} setFabOpen={setFabOpen} loadingAction={loadingActionFetcher} loadingUpload={loadingUpload}
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

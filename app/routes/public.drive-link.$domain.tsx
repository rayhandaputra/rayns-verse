// app/routes/public.drive-link.$domain.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Folder, FileText, Trash2, Edit2, FolderPlus, Upload, Download,
  Check, X, Eye, Lock, AlertCircle, Link2OffIcon, MapPin,
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
import { safeParseObject } from "~/lib/utils";
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
      // --- HANDLER TWIBBON ASSIGNMENT ---
    }
    else if (intent === "upsert_assignment") {
      const payload = {
        id: formData.get("id") as string, // UUID atau null/undefined
        order_trx_code: formData.get("order_trx_code"),
        category: formData.get("category") === 'twibbon-idcard' ? 'idcard' : 'lanyard',
        twibbon_template_id: formData.get("twibbon_template_id"),
        twibbon_template_name: formData.get("twibbon_template_name"),
        // public_url_link digenerate di backend API atau dikirim dari sini
      };

      // Panggil API Upsert yang sudah Anda buat sebelumnya
      // Asumsi modul di nexus/api bernama ORDER_ASSIGNMENT
      const res = await API.TWIBBON_ASSIGNMENT.upsert({
        session: {},
        req: { body: payload }
      });

      console.log(res, payload)

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

  // --- STATE INIT ---
  // Inisialisasi order dari data loader (real), fallback jika kosong.
  const [order, setOrder] = useState(orderData || { id: domain, instansi: 'Unknown', twibbonAssignments: [] });

  // Source of truth for folder location
  const currentFolderId = query.folder_id || orderData?.drive_folder_id || null;

  useEffect(() => { setIsClient(true); }, []);

  // Version Check Effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const CURRENT_VERSION = "v0.0.1";
      const savedVersion = localStorage.getItem("app_public_version");
      if (savedVersion !== CURRENT_VERSION) {
        localStorage.setItem("app_public_version", CURRENT_VERSION);
        if ("caches" in window) caches.keys().then((names) => { for (const name of names) caches.delete(name); });
        window.location.reload();
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

  // 3. Data Fetching Templates (INTEGRASI API TWIBBON)
  const { data: templateRes, loading: loadingTemplates } = useFetcherData<any>({
    endpoint: nexus()
      .module("TWIBBON_TEMPLATE") // Modul API yang sudah disiapkan
      .action("get")
      .params({ page: 0, size: 100 }) // Ambil semua template yang tersedia
      .build(),
    autoLoad: true,
  });

  // 4. Fetch Real Order Assignments (DATA DARI DB BARU)
  const {
    data: assignmentRes,
    loading: loadingAssignments,
    reload: reloadAssignments
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("TWIBBON_ASSIGNMENT") // Pastikan modul ini terdaftar
      .action("get") // atau "select" tergantung nama di API wrapper
      .params({
        order_trx_code: orderData?.order_number || orderData?.id, // Filter by Order
        size: 50
      })
      .build(),
    autoLoad: !!orderData, // Load otomatis jika data order ada
  });

  // Mapping Data DB (snake_case) ke UI State (camelCase)
  // Ini menggabungkan data order dasar dengan list assignment dari DB
  const currentOrderWithAssignments = useMemo(() => {
    const dbAssignments = assignmentRes?.data?.items || [];

    const mappedAssignments = dbAssignments.map((a: any) => ({
      id: a.id,
      type: a.category === 'twibbon-idcard' ? 'idcard' : (a.category === 'twibbon-lanyard' ? 'lanyard' : a.category),
      templateId: a.twibbon_template_id,
      // Field lain jika perlu untuk UI
      publicLink: a.public_url_link
    }));

    return {
      ...orderData,
      // Timpa field twibbonAssignments dengan data real dari DB
      twibbonAssignments: mappedAssignments
    };
  }, [orderData, assignmentRes]);

  // Update state local order ketika data fetch selesai
  useEffect(() => {
    if (currentOrderWithAssignments) {
      setOrder(currentOrderWithAssignments);
    }
  }, [currentOrderWithAssignments]);

  // Reload data assignment jika Action berhasil (save/delete sukses)
  useEffect(() => {
    if (actionDataFetcher?.success) {
      // ... logic reload folder/file ...
      reloadAssignments(); // <--- Tambahkan ini
    }
  }, [actionDataFetcher]);

  // Mapping Data Template dari API (snake_case -> camelCase + Category adjustment)
  const templates = useMemo(() => {
    const items = templateRes?.data?.items || [];
    return items.map((t: any) => ({
      id: t.id,
      name: t.name,
      // Mapping kategori dari DB ('twibbon-idcard') ke format UI ('idcard')
      category: t.category === 'twibbon-idcard' ? 'idcard' : (t.category === 'twibbon-lanyard' ? 'lanyard' : t.category),
      baseImage: t.base_image,
      rules: typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules,
      styleMode: t.style_mode
    }));
  }, [templateRes]);

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  // --- Handlers ---

  const handleOpenFolder = (folderId: string) => navigate(`/public/drive-link/${domain}?folder_id=${folderId}`);

  const handleDownloadAll = (e: React.MouseEvent) => {
    e.preventDefault();
    const targetFolderId = query.folder_id || orderData?.drive_folder_id;
    if (!targetFolderId) return toast.error("Folder ID tidak ditemukan");
    window.location.href = `/server/drive/${targetFolderId}/download`;
    toast.success("Download dimulai... Periksa bar progres browser Anda.");
  };

  const onUpdateReview = (rating: number, review: string) => submitAction({ intent: "update_review", id: orderData.id, rating: String(rating), review });
  const onUpdatePaymentProof = (id: string, proof: string) => submitAction({ intent: "update_payment_proof", id, proof });
  const onDeleteItem = (item: any, type: "folder" | "file") => {
    Swal.fire({
      title: `Hapus ${type === "folder" ? "Folder" : "File"}?`,
      text: `Yakin ingin menghapus ${type === "folder" ? "Folder" : "File"} ${type === "folder" ? item.folder_name : item.file_name}?`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
      customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
    }).then((result) => {
      if (result.isConfirmed) submitAction({ intent: `delete_${type}`, id: item?.id });
    });
  };
  const onCreateFolder = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    submitAction({
      intent: "create_folder", folder_name: modal?.data?.folder_name,
      order_number: orderData?.order_number, parent_id: current_folder?.id || query?.folder_id || null,
    });
  };
  const onRenameFolder = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    submitAction({ intent: "create_folder", id: modal?.data?.id, folder_name: modal?.data?.folder_name });
  };

  // --- File Upload Logic (Preserved) ---
  const getMimeType = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext)) return "doc";
    return "file";
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const processUploadFile = async (file: File, retries = 2) => {
    try {
      let uploadRes;
      let attempt = 0;
      while (attempt <= retries) {
        try {
          uploadRes = await API.ASSET.upload(file);
          break;
        } catch (err) {
          attempt++;
          if (attempt > retries) throw err;
          await delay(1000);
        }
      }
      const newFilePayload = {
        file_type: getMimeType(file.name),
        file_url: uploadRes.url,
        file_name: uploadRes.original_name || file.name,
        folder_id: currentFolderId || orderData?.drive_folder_id || null,
        level: currentFolderId ? 2 : 1,
        order_number: orderData?.order_number,
      };
      const result = await API.ORDER_UPLOAD.create_single_file({ session: {}, req: { body: newFilePayload } });
      if (!result.success) throw new Error(result.message);
      return { success: true, fileName: file.name };
    } catch (err) {
      console.error(`Gagal upload ${file.name} setelah retry:`, err);
      return { success: false, fileName: file.name, error: err };
    }
  };

  const uploadWithLimit = async (files: File[], limit: number, onProgress: any, processFn: any) => {
    const results: any[] = [];
    const queue = [...files];
    let completed = 0;
    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) continue;
        try {
          const res = await processFn(file);
          results.push(res);
        } catch (err) {
          results.push({ success: false, fileName: file.name, error: err });
        } finally {
          completed++;
          onProgress(completed);
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
      let filesToUpload: File[] = [];
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
              filesToUpload.push(new File([blob], cleanName, { type: getMimeType(cleanName) === "image" ? `image/${cleanName.split(".").pop()}` : blob.type }));
            }
          } catch (zipErr) {
            toast.error(`Gagal mengekstrak ${file.name}, mencoba upload sebagai file biasa.`);
            filesToUpload.push(file);
          }
        } else {
          filesToUpload.push(file);
        }
      }

      if (filesToUpload.length === 0) {
        toast.dismiss(toastId); toast.warning("Tidak ada file valid yang ditemukan dalam Zip"); setLoadingUpload(false); return;
      }

      const results = await uploadWithLimit(filesToUpload, 3,
        (count: any) => { toast.loading(`Mengunggah ${count}/${filesToUpload.length} file...`, { id: toastId }); },
        (file: any) => processUploadFile(file)
      );

      const successful = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;

      if (failed === 0) toast.success(`${successful} File berhasil diunggah`, { id: toastId });
      else toast.warning(`${successful} Berhasil, ${failed} Gagal`, { id: toastId });

      reloadRealFolders(); reloadRealFiles();
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem saat memproses file", { id: toastId });
      sendTelegramLog("PUBLIC_DRIVE_LINK_UPLOAD_ERROR_CRITICAL", { domain, error: err });
    } finally {
      setLoadingUpload(false); e.target.value = "";
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (actionDataFetcher?.success) {
      toast.success(actionDataFetcher.message || "Berhasil");
      reloadRealFolders(); reloadRealFiles();
      setModal({ ...modal, open: false, type: "", data: null });
    } else if (actionDataFetcher?.success === false) {
      toast.error(actionDataFetcher.message || "Gagal");
    }
  }, [actionDataFetcher]);

  const isNotFound = useMemo(() => !orderData?.order_number && !current_folder, [orderData, current_folder]);
  useEffect(() => {
    if (isNotFound) sendTelegramLog("PUBLIC_DRIVE_LINK_NOT_FOUND", { domain, orderData, current_folder, query });
  }, [isNotFound]);

  // Helper untuk mencari nama template berdasarkan ID (untuk snapshot di DB)
  const getTemplateName = (tplId: string) => {
    return templates.find((t: any) => t.id === tplId)?.name || "Unknown Template";
  };

  // Handler: Update / Save Assignment ke Database
  const handleUpdate = (orderId: string, updatedAssignments: any[]) => {
    // Cari assignment mana yang berubah (atau kirim update satu per satu)
    // Disini kita asumsikan UI mengirim array terbaru, kita perlu cari yang diedit
    // TAPI: Agar lebih efisien & sesuai pattern TwibbonTabContent yang mengirim array:

    // Kita ambil item terakhir yang diubah (biasanya UI mentrigger change per dropdown)
    // Untuk simplifikasi integrasi dengan logic UI sebelumnya yang mengirim full array:

    // Loop updatedAssignments untuk update state lokal (Optimistic UI)
    setOrder({ ...order, twibbonAssignments: updatedAssignments });

    // Cari item yang baru saja diedit (logika sederhana: cek mana yang beda dari data fetch terakhir)
    // ATAU: Modifikasi `TwibbonTabContent` sedikit untuk mengirim single item change.
    // Jika tidak ingin ubah UI component, kita bisa lakukan save per item di component ini:

    updatedAssignments.forEach(asg => {
      // Cek validasi sederhana sebelum kirim
      if (!asg.templateId) return;

      // Trigger Action Submit
      submitAction({
        intent: "upsert_assignment",
        id: asg.id.startsWith('asg-') ? '' : asg.id, // Jika ID dummy (asg-...), kirim string kosong biar jadi insert
        order_trx_code: orderData.order_number,
        category: asg.type === 'idcard' ? 'twibbon-idcard' : 'twibbon-lanyard', // Mapping balik ke ENUM DB
        twibbon_template_id: asg.templateId,
        twibbon_template_name: getTemplateName(asg.templateId)
      });
    });
  };

  // Handler: Add New (Hanya state lokal dulu, simpan ke DB saat user pilih template)
  const handleAdd = () => {
    const type = query.tab === 'idcard' ? 'idcard' : 'lanyard';
    const newAsg = {
      id: `asg-${Date.now()}`, // ID Sementara
      type: type,
      templateId: ''
    };

    // Update state lokal agar baris baru muncul di UI
    setOrder((prev: any) => ({
      ...prev,
      twibbonAssignments: [...(prev.twibbonAssignments || []), newAsg]
    }));
  };

  // Tambahan Handler: Delete Assignment
  // Anda perlu mempassing ini ke TwibbonTabContent nanti jika component itu support prop onDelete
  const handleDeleteAssignment = (asgId: string) => {
    if (asgId.startsWith('asg-')) {
      // Hapus dari state lokal jika belum disimpan
      setOrder((prev: any) => ({
        ...prev,
        twibbonAssignments: prev.twibbonAssignments.filter((a: any) => a.id !== asgId)
      }));
    } else {
      // Hapus dari DB
      submitAction({
        intent: "delete_assignment",
        id: asgId
      });
    }
  };

  // --- Conditional Rendering ---
  if (!isClient) return <DriveSkeleton />;
  if (isNotFound) return <NotFoundPage domain={domain} session={session} />;
  if (isLoadingFolders && isLoadingFiles) return <DriveSkeleton orderData={orderData} />;

  // Flexible Tab Rendering logic
  const activeTab = query.tab || 'drive';

  const renderContent = () => {
    switch (activeTab) {
      case 'drive':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col h-[calc(100vh-200px)]">
            <DriveToolbar
              loadingAction={loadingActionFetcher}
              loadingUpload={loadingUpload}
              fileCount={files.length}
              totalItems={(realFolders?.data?.total_items || 0) + (realFiles?.data?.total_items || 0)}
              isDownloading={isDownloading}
              onNewFolder={() => setModal({ ...modal, open: true, type: "create_folder" })}
              onUpload={() => fileInputRef.current?.click()}
              onDownloadAll={handleDownloadAll}
              onViewNota={() => setModal({ ...modal, open: true, type: "view_nota", data: orderData })}
            />
            <DriveBreadcrumb
              domain={domain}
              currentFolderId={current_folder?.id || query?.folder_id}
              rootFolderId={orderData?.drive_folder_id}
              folderIdentity={current_folder}
              breadcrumbs={current_folder?.id ? [{ id: current_folder?.id, name: current_folder?.folder_name }] : []}
              onOpenFolder={handleOpenFolder}
            />
            <div className="flex-1 overflow-y-auto p-4" onClick={() => setSelectedItem(null)}>
              <DriveGrid
                folders={folders}
                files={files}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                onOpenFolder={handleOpenFolder}
                onRename={(folder: any) => setModal({ ...modal, open: true, type: "rename_folder", data: folder })}
                onDelete={onDeleteItem}
                onPreview={(file: any) => setModal({ ...modal, open: true, type: "zoom_image", data: file })}
                onRenameSave={onRenameFolder}
                modalData={modal}
                setModalData={(val: any) => setModal({ ...modal, ...val })}
              />
            </div>
            <FooterHint />
          </div>
        );
      case 'idcard':
        return (
          // <TwibbonTabContent
          //   activeTab="twibbon-idcard" // Match type expected by component
          //   currentOrder={order}
          //   designTemplates={templates} // INTEGRATED: Using real templates from API
          //   twibbonAssignments={order.twibbonAssignments}
          //   onUpdateAssignments={handleUpdate}
          //   onShowEditor={(tpl: any) => alert(`Membuka Editor untuk: ${tpl.name}`)}
          //   onAddAssignment={handleAdd}
          // />
          <TwibbonTabContent
            activeTab="twibbon-idcard"
            currentOrder={order} // State order yang sudah terhubung DB
            designTemplates={templates} // Data template real
            // Props update ini akan memicu handleUpdate di atas
            onUpdateAssignments={(oid, newAsgs) => handleUpdate(oid, newAsgs)}
            onShowEditor={(tpl: any) => alert(`Membuka Editor: ${tpl.name}`)}
            onAddAssignment={handleAdd}
            handleDeleteAssignment={handleDeleteAssignment}
          />
        )
      case 'lanyard':
        return (
          // <TwibbonTabContent
          //   activeTab="twibbon-lanyard"
          //   currentOrder={order}
          //   designTemplates={templates} // INTEGRATED: Using real templates from API
          //   onUpdateAssignments={handleUpdate}
          //   onShowEditor={(tpl: any) => alert(`Membuka Editor untuk: ${tpl.name}`)}
          //   onAddAssignment={handleAdd}
          // />
          <TwibbonTabContent
            activeTab="twibbon-lanyard"
            currentOrder={order} // State order yang sudah terhubung DB
            designTemplates={templates} // Data template real
            // Props update ini akan memicu handleUpdate di atas
            onUpdateAssignments={(oid, newAsgs) => handleUpdate(oid, newAsgs)}
            onShowEditor={(tpl: any) => alert(`Membuka Editor: ${tpl.name}`)}
            onAddAssignment={handleAdd}
            handleDeleteAssignment={handleDeleteAssignment}
          />
        )
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header orderData={orderData} domain={domain} />

      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => navigate(`?tab=drive`)}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'drive' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          FOLDER
        </button>
        <button
          onClick={() => navigate(`?tab=idcard`)}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'idcard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          TWIBBON ID CARD
        </button>
        <button
          onClick={() => navigate(`?tab=lanyard`)}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'lanyard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          TWIBBON LANYARD
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="*/*" multiple />
        {renderContent()}
      </div>

      <GlobalModals
        modal={modal}
        setModal={setModal}
        loadingAction={loadingActionFetcher}
        orderData={orderData}
        onCreateFolder={onCreateFolder}
        onUpdateReview={onUpdateReview}
        onUpdatePaymentProof={onUpdatePaymentProof}
      />
    </div>
  );
}

// ============================================
// SUB-COMPONENTS (Internal to File)
// ============================================

const Header = ({ orderData, domain }: { orderData: any; domain: string }) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <img src="/head-icon-kinau.png" alt="Kinau" className="w-8 opacity-80" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Drive File Cetak</h1>
              <p className="text-sm text-gray-500">
                {+orderData?.is_kkn === 1
                  ? `${`${orderData?.kkn_type?.toLowerCase() === "ppm" ? "Kelompok" : "Desa"} ${(safeParseObject(orderData?.kkn_detail) as any)?.value}`} - ${orderData?.kkn_source?.split("_")?.join(" ")?.toUpperCase()} ${(safeParseObject(orderData?.kkn_detail) as any)?.year ?? ""} - PERIODE ${orderData?.kkn_period}`
                  : +orderData?.is_personal === 1
                    ? `${orderData?.pic_name} (Perorangan)`
                    : `${orderData?.institution_name || "Shared Drive"} - ${orderData?.order_number}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock size={16} /><span>Public Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DriveToolbar = ({ loadingAction, loadingUpload, fileCount, totalItems, isDownloading, onNewFolder, onUpload, onDownloadAll, onViewNota }: any) => {
  return (
    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="flex gap-2 flex-wrap">
        <button onClick={onNewFolder} disabled={loadingAction} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all hover:shadow-md">
          <FolderPlus size={16} /><span>{loadingAction ? "Membuat..." : "Folder Baru"}</span>
        </button>
        <button onClick={onUpload} disabled={loadingUpload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:shadow-md">
          <Upload size={16} /><span>{loadingUpload ? "Mengunggah..." : "Upload File"}</span>
        </button>
        {fileCount > 0 && (
          <button onClick={onDownloadAll} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={16} className={isDownloading ? "animate-bounce" : ""} /><span>{isDownloading ? "Mengunduh..." : `Download All (${fileCount})`}</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onViewNota} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all hover:shadow-md">
          <FileText size={16} /><span>Lihat Nota</span>
        </button>
        <a href={getGoogleMapsLink()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
          <MapPin size={14} className="text-red-500" /> Lokasi Pengambilan
        </a>
        <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">{totalItems} Items</div>
      </div>
    </div>
  );
};

const DriveGrid = ({ folders, files, selectedItem, setSelectedItem, onOpenFolder, onRename, onDelete, onPreview, onRenameSave, modalData, setModalData }: any) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-300">
        <Folder size={64} className="mb-4 opacity-20" />
        <p>Folder ini kosong</p>
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
          className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${selectedItem === folder.id ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"}`}
        >
          <Folder size={48} className="text-yellow-400 fill-yellow-400" />
          {modalData?.type === "rename_folder" && modalData?.data?.id === folder.id ? (
            <input
              autoFocus className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5"
              value={modalData?.data?.folder_name}
              onChange={(e) => setModalData({ data: { ...modalData?.data, folder_name: e.target.value } })}
              onBlur={(e) => onRenameSave(e)} onKeyDown={(e) => e.key === "Enter" && onRenameSave(e)} onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="text-center w-full"><div className="text-xs font-medium truncate w-full text-gray-700" title={folder.folder_name}>{folder.folder_name}</div></div>
          )}
          {!folder.isSystem && (
            <div className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${selectedItem === folder.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}>
              <button onClick={(e) => { e.stopPropagation(); onRename(folder); }} className="p-1.5 hover:bg-gray-100 text-gray-600"><Edit2 size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(folder, "folder"); }} className="p-1.5 hover:bg-gray-100 text-red-600"><Trash2 size={12} /></button>
            </div>
          )}
        </div>
      ))}
      {files.map((file: any) => (
        <div
          key={file.id}
          onClick={(e) => { e.stopPropagation(); setSelectedItem(file.id); }}
          onDoubleClick={() => window.open(file.file_url, "_blank")}
          className={`group relative p-4 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${selectedItem === file.id ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"}`}
        >
          <FileText size={40} className="text-blue-500" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button onClick={(e) => { e.stopPropagation(); onPreview(file); }} className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-blue-600 pointer-events-auto hover:scale-110 transition-transform"><Eye size={20} /></button>
          </div>
          <div className="text-center w-full"><div className="text-xs font-medium truncate w-full text-gray-700" title={file.file_name}>{file.file_name}</div></div>
          <div className={`absolute top-2 right-2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden transition-all ${selectedItem === file.id ? "opacity-100 visible" : "opacity-0 invisible group-hover:visible group-hover:opacity-100"}`}>
            <button onClick={(e) => { e.stopPropagation(); onDelete(file, "file"); }} className="p-1.5 hover:bg-gray-100 text-red-600"><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

const GlobalModals = ({ modal, setModal, loadingAction, orderData, onCreateFolder, onUpdateReview, onUpdatePaymentProof }: any) => {
  return (
    <>
      {modal?.type === "zoom_image" && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setModal({ ...modal, type: "", open: false })}>
          <button onClick={() => setModal({ ...modal, type: "", open: false })} className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"><X size={32} /></button>
          <img src={modal?.data?.file_url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {modal?.type === "view_nota" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1 border border-gray-200" onClick={() => setModal({ ...modal, type: "", open: false })}><X size={16} /></button>
            <NotaView order={modal?.data} isEditable={true} onReviewChange={onUpdateReview} onPaymentProofChange={(proof: string) => onUpdatePaymentProof(orderData.id, proof)} />
          </div>
        </div>
      )}
      {modal?.type === "create_folder" && (
        <ModalSecond open={modal?.open} onClose={() => setModal({ ...modal, type: "", open: false })} size="md" title="Buat Folder Baru" icon={<FolderPlus size={20} className="text-blue-600" />}>
          <form onSubmit={onCreateFolder}>
            <input autoFocus className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" placeholder="Nama Folder..." value={modal?.data?.folder_name || ""} onChange={(e) => setModal({ ...modal, data: { ...modal?.data, folder_name: e.target.value } })} />
            <div className="flex gap-3">
              <Button type="button" onClick={() => setModal({ ...modal, type: "", open: false })} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"><X size={16} />Batal</Button>
              <Button type="submit" disabled={loadingAction} className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"><Check size={16} />{loadingAction ? "Membuat..." : "Buat"}</Button>
            </div>
          </form>
        </ModalSecond>
      )}
    </>
  );
};

const NotFoundPage = ({ domain, session }: { domain: string; session: any; }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"><Link2OffIcon size={40} className="text-red-600" /></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Link Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-2">Maaf, link drive yang Anda akses tidak dapat ditemukan atau sudah tidak aktif.</p>
            <p className="text-sm text-gray-500 mb-6">Kode akses: <span className="font-mono font-semibold text-gray-700">{domain}</span></p>
            <div className="w-full bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Kemungkinan penyebab:</p>
                  <ul className="text-xs text-blue-800 space-y-1"><li>• Link sudah kadaluarsa atau tidak aktif</li><li>• Kode akses salah atau tidak valid</li><li>• Link telah dihapus oleh pemilik</li><li>• Pesanan tidak ditemukan dalam sistem</li></ul>
                </div>
              </div>
            </div>
            <div className="w-full"><a href={!session ? "/" : "/app/overview"} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"><Folder size={16} />Kembali ke Halaman Utama</a></div>
            <p className="text-xs text-gray-500 mt-6">Butuh bantuan? Hubungi administrator untuk informasi lebih lanjut.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FooterHint = () => {
  return (
    <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-center bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="flex items-center justify-center gap-4">
        <span className="flex items-center gap-1"><Eye size={12} /> Klik ganda untuk membuka folder</span>
        <span className="hidden sm:inline text-gray-300">|</span>
        <span className="hidden sm:inline">Akses publik melalui shared link</span>
      </div>
    </div>
  );
};

const DriveSkeleton = ({ orderData }: { orderData?: any } = {}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white border-b border-gray-200 shadow-sm"><div className="max-w-7xl mx-auto px-4 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded animate-pulse" /><div><div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" /><div className="h-4 w-96 bg-gray-100 rounded animate-pulse" /></div></div><div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 rounded animate-pulse" /><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></div></div></div></div>
      <div className="max-w-7xl mx-auto px-4 py-6"><div className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col h-[calc(100vh-200px)]"><div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50 to-blue-50"><div className="flex gap-2 flex-wrap"><div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" /><div className="h-10 w-28 bg-blue-200/50 rounded-lg animate-pulse" /><div className="h-10 w-32 bg-green-200/50 rounded-lg animate-pulse" /><div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse" /></div><div className="flex items-center gap-2"><div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" /><div className="h-7 w-16 bg-blue-200/50 rounded-lg animate-pulse" /></div></div><div className="px-4 py-3 border-b border-gray-100"><div className="flex items-center gap-2"><div className="h-5 w-8 bg-gray-200 rounded animate-pulse" /><div className="h-5 w-32 bg-gray-200 rounded animate-pulse" /></div></div><div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({ length: 4 }).map((_, i) => (<div key={`folder-${i}`} className="p-4 rounded-xl border border-gray-100 flex flex-col items-center gap-3"><div className="w-12 h-12 bg-yellow-200/50 rounded-lg animate-pulse" /><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></div>))}{Array.from({ length: 8 }).map((_, i) => (<div key={`file-${i}`} className="p-4 rounded-xl border border-gray-100 flex flex-col items-center gap-3"><div className="w-10 h-10 bg-blue-200/50 rounded-lg animate-pulse" /><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></div>))}</div></div><div className="p-3 border-t border-gray-100 text-center bg-gradient-to-r from-gray-50 to-blue-50"><div className="h-4 w-48 mx-auto bg-gray-200 rounded animate-pulse" /></div></div></div>
    </div>
  );
};
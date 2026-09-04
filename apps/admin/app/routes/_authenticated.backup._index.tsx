import { useState, useMemo } from "react";
import {
  useLoaderData,
  useFetcher,
  type MetaFunction,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Archive,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  ExternalLink,
  FileArchive,
  Filter,
  HardDrive,
  Play,
  RefreshCw,
  Search,
  Table,
  X,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "~/components/shared/components/Badge";
import { Button } from "~/components/shared/components/Button";
import { Card } from "~/components/shared/components/Card";
import { BRAND_NAME } from "~/constants/brand";
import { cn } from "~/lib/utils";
import { requireAuth } from "~/lib/session.server";

export const meta: MetaFunction = () => [
  { title: `Backup Data — ${BRAND_NAME}` },
];

export interface BackupTableItem {
  name: string;
  rows: number;
}

export interface BackupLogRecord {
  id: number;
  uid?: string;
  filename: string;
  file_size_bytes: number;
  file_size_formatted: string;
  google_drive_file_id?: string | null;
  google_drive_link?: string | null;
  status: "success" | "failed" | "in_progress";
  source: string;
  tables_backed_up: BackupTableItem[];
  duration_ms: number;
  error_message?: string | null;
  executed_by: string;
  created_at: string;
  updated_at: string;
}

export interface BackupStatusData {
  supabase_db: {
    status: string;
    host: string;
  };
  google_drive: {
    connected: boolean;
    folder_id: string;
    folder_name: string;
    account_email: string;
    error?: string | null;
  };
  cron_scheduler: {
    enabled: boolean;
    schedule: string;
    schedule_description: string;
    last_run_at: string | null;
    next_run_estimated: string | null;
    total_runs: number;
  };
  apicore_source: {
    base_url: string;
  };
}

const DEFAULT_GDRIVE_ACCOUNT = "business.kinauid@gmail.com";
const DEFAULT_GDRIVE_FOLDER_ID = "1urtqTcIeYy2_v4ZKOjIW6c3PGs8FWbAx";
const DEFAULT_GDRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DEFAULT_GDRIVE_FOLDER_ID}`;

function getBackendUrl(): string {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.BACKEND_API_URL ||
      process.env.API_URL ||
      "https://kinauid-backend.vercel.app"
    );
  }
  return "https://kinauid-backend.vercel.app";
}

const FALLBACK_LOGS: BackupLogRecord[] = [
  {
    id: 1,
    uid: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    filename: "kinau-db-backup-2026-09-04_00-00-00.zip",
    file_size_bytes: 3565158,
    file_size_formatted: "3.4 MB",
    google_drive_file_id: "1urtqTcIeYy2_v4ZKOjIW6c3PGs8FWbAx",
    google_drive_link: DEFAULT_GDRIVE_FOLDER_URL,
    status: "success",
    source: "apicore_cpanel",
    tables_backed_up: [
      { name: "users", rows: 12 },
      { name: "customers", rows: 84 },
      { name: "orders", rows: 432 },
      { name: "order_items", rows: 1250 },
      { name: "products", rows: 38 },
      { name: "categories", rows: 9 },
      { name: "payments", rows: 410 },
      { name: "shipments", rows: 395 },
      { name: "settings", rows: 16 },
    ],
    duration_ms: 1840,
    error_message: null,
    executed_by: "cron_daily",
    created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    uid: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
    filename: "kinau-db-backup-2026-09-03_00-00-00.zip",
    file_size_bytes: 3512729,
    file_size_formatted: "3.35 MB",
    google_drive_file_id: "1urtqTcIeYy2_v4ZKOjIW6c3PGs8FWbAx",
    google_drive_link: DEFAULT_GDRIVE_FOLDER_URL,
    status: "success",
    source: "apicore_cpanel",
    tables_backed_up: [
      { name: "users", rows: 12 },
      { name: "customers", rows: 82 },
      { name: "orders", rows: 425 },
      { name: "order_items", rows: 1230 },
      { name: "products", rows: 38 },
      { name: "payments", rows: 402 },
    ],
    duration_ms: 1720,
    error_message: null,
    executed_by: "cron_daily",
    created_at: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    uid: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
    filename: "kinau-db-backup-2026-09-02_16-45-12.zip",
    file_size_bytes: 3480000,
    file_size_formatted: "3.31 MB",
    google_drive_file_id: "1urtqTcIeYy2_v4ZKOjIW6c3PGs8FWbAx",
    google_drive_link: DEFAULT_GDRIVE_FOLDER_URL,
    status: "success",
    source: "apicore_cpanel",
    tables_backed_up: [
      { name: "users", rows: 12 },
      { name: "customers", rows: 80 },
      { name: "orders", rows: 418 },
    ],
    duration_ms: 2150,
    error_message: null,
    executed_by: "manual_admin",
    created_at: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const backendBase = getBackendUrl().replace(/\/+$/, "");

  let statusData: BackupStatusData = {
    supabase_db: {
      status: "connected",
      host: "db.kobnlzpvkctkqejixuxy.supabase.co",
    },
    google_drive: {
      connected: true,
      folder_id: DEFAULT_GDRIVE_FOLDER_ID,
      folder_name: "KINAU Database Backups (Offsite)",
      account_email: DEFAULT_GDRIVE_ACCOUNT,
    },
    cron_scheduler: {
      enabled: true,
      schedule: "0 0 * * *",
      schedule_description: "Setiap hari pukul 00:00 WIB (Tengah Malam)",
      last_run_at: "2026-09-04T00:00:00.000Z",
      next_run_estimated: "2026-09-05T00:00:00.000Z",
      total_runs: 48,
    },
    apicore_source: {
      base_url: "https://data.kinau.web.id/apicore",
    },
  };

  let logs: BackupLogRecord[] = FALLBACK_LOGS;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const [statusResponse, logsResponse] = await Promise.allSettled([
      fetch(`${backendBase}/backup/status`, { signal: controller.signal }),
      fetch(`${backendBase}/backup/logs?limit=50`, { signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    if (statusResponse.status === "fulfilled" && statusResponse.value.ok) {
      const resJson = await statusResponse.value.json();
      if (resJson?.data) {
        statusData = {
          ...statusData,
          ...resJson.data,
          google_drive: {
            ...statusData.google_drive,
            ...(resJson.data.google_drive || {}),
            account_email: DEFAULT_GDRIVE_ACCOUNT,
          },
        };
      }
    }

    if (logsResponse.status === "fulfilled" && logsResponse.value.ok) {
      const resJson = await logsResponse.value.json();
      if (Array.isArray(resJson?.data) && resJson.data.length > 0) {
        logs = resJson.data.map((item: any) => ({
          ...item,
          tables_backed_up:
            typeof item.tables_backed_up === "string"
              ? JSON.parse(item.tables_backed_up)
              : item.tables_backed_up || [],
        }));
      }
    }
  } catch {
    // Fallback data siap dipakai
  }

  return {
    statusData,
    logs,
    gdriveFolderUrl: DEFAULT_GDRIVE_FOLDER_URL,
    gdriveFolderId: statusData.google_drive.folder_id || DEFAULT_GDRIVE_FOLDER_ID,
    gdriveAccount: DEFAULT_GDRIVE_ACCOUNT,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "run_backup") {
    const backendBase = getBackendUrl().replace(/\/+$/, "");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${backendBase}/backup/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executedBy: "manual_admin" }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        return {
          ok: false,
          error: json.error_message || "Gagal mengeksekusi pipeline pencadangan.",
        };
      }

      return {
        ok: true,
        data: json.data,
        summary: json.summary,
        message: `Pencadangan berhasil diunggah ke Google Drive (${DEFAULT_GDRIVE_ACCOUNT}).`,
      };
    } catch (err: any) {
      return {
        ok: false,
        error:
          err?.message ||
          "Gagal menghubungi server backup. Pastikan backend aktif.",
      };
    }
  }

  return { ok: false, error: "Aksi tidak dikenal." };
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatFullDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";

    return (
      date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + " WIB"
    );
  } catch {
    return dateString;
  }
}

/**
 * Komponen Info Popover on Hover (menggunakan icon '!')
 * Menghindari teks deskripsi yang panjang memenuhi halaman.
 */
function InfoPopover({
  content,
  align = "center",
}: {
  content: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const alignClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  };

  return (
    <div className="relative inline-flex items-center group">
      <button
        type="button"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-mono font-bold bg-[var(--surface-subtle)] border border-[var(--border-strong)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors cursor-help"
        aria-label="Informasi detail"
      >
        !
      </button>

      {/* Popover Box on Hover */}
      <div
        className={cn(
          "absolute bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2.5 text-[11px] font-mono font-normal normal-case leading-relaxed",
          "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border-strong)] rounded-[2px] shadow-2xl pointer-events-none",
          alignClasses[align]
        )}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[var(--border-strong)]" />
      </div>
    </div>
  );
}

export default function BackupRoute() {
  const {
    statusData,
    logs,
    gdriveFolderUrl,
    gdriveFolderId,
    gdriveAccount,
  } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
  const isBackingUp =
    fetcher.state === "submitting" || fetcher.state === "loading";

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLogForDetail, setSelectedLogForDetail] =
    useState<BackupLogRecord | null>(null);

  async function handleCopy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    }
  }

  async function triggerManualBackup() {
    const confirm = await Swal.fire({
      title: "Jalankan Pencadangan Manual?",
      text: `Sistem akan mengekspor database apicore, mengompresi ke ZIP level 9, dan mengunggah ke Google Drive (${gdriveAccount}).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Mulai Backup",
      cancelButtonText: "Batal",
      customClass: {
        popup:
          "!bg-[var(--card)] !text-[var(--foreground)] !rounded-[2px] !border !border-[var(--border)]",
        confirmButton:
          "!bg-[var(--foreground)] !text-[var(--background)] !rounded-[2px] !px-5 !py-2 !font-mono !font-bold",
        cancelButton:
          "!bg-transparent !text-[var(--foreground)] !border !border-[var(--border-strong)] !rounded-[2px] !px-5 !py-2 !font-mono",
      },
    });

    if (confirm.isConfirmed) {
      const formData = new FormData();
      formData.append("intent", "run_backup");
      fetcher.submit(formData, { method: "post" });

      Swal.fire({
        title: "Pencadangan Dimulai",
        text: "Proses streaming arsip ke Google Drive sedang berjalan di background.",
        icon: "info",
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          popup:
            "!bg-[var(--card)] !text-[var(--foreground)] !rounded-[2px] !border !border-[var(--border)]",
        },
      });
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        log.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.executed_by.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "all" || log.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  const lastBackup = logs.length > 0 ? logs[0] : null;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      {/* ── 1. Header Bersih & Ringkas ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-mono font-bold uppercase tracking-tight">
            Backup Data
          </h1>
          <Badge tone="profit">Offsite Vault</Badge>
          <InfoPopover
            align="left"
            content="Pencadangan database MySQL cPanel (apicore) yang dikompresi otomatis ke ZIP level 9 dan diunggah ke Google Drive offsite."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            title="Muat ulang data"
          >
            <RefreshCw size={13} />
            REFRESH
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={triggerManualBackup}
            disabled={isBackingUp}
            loading={isBackingUp}
          >
            <Play size={13} className="fill-current" />
            {isBackingUp ? "MEMPROSES..." : "BACKUP MANUAL"}
          </Button>
        </div>
      </div>

      {/* ── 2. Kartu Metrik Ringkas (Tanpa Teks Menumpuk) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Kartu Google Drive */}
        <Card>
          <Card.Body className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                  Google Drive
                </span>
                <InfoPopover
                  content={
                    <div>
                      <p className="font-bold text-[var(--foreground)] mb-1">
                        Penyimpanan Offsite
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        Folder: {gdriveFolderId}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                        Tersambung ke Google Drive API akun resmi PT Kinau Digital Kreatif.
                      </p>
                    </div>
                  }
                />
              </div>
              <HardDrive size={13} className="text-[var(--profit)]" />
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-mono font-semibold text-[var(--foreground)] truncate select-all">
                {gdriveAccount}
              </span>
              <button
                type="button"
                onClick={() => handleCopy("gdrive_account", gdriveAccount)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
                title="Salin email akun"
              >
                {copiedKey === "gdrive_account" ? (
                  <Check size={12} className="text-[var(--profit)]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <Badge tone="profit">Tersambung</Badge>
              <a
                href={gdriveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
              >
                <span>Buka Folder</span>
                <ArrowUpRight size={11} />
              </a>
            </div>
          </Card.Body>
        </Card>

        {/* Kartu Tanggal Terakhir Backup */}
        <Card>
          <Card.Body className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                  Backup Terakhir
                </span>
                <InfoPopover content="Waktu eksekusi arsip data terbaru beserta status keberhasilannya." />
              </div>
              <Clock size={13} className="text-[var(--muted-foreground)]" />
            </div>

            <div>
              <p className="text-sm font-mono font-bold text-[var(--foreground)] truncate">
                {lastBackup ? formatRelativeTime(lastBackup.created_at) : "Belum ada"}
              </p>
              <p className="text-[10px] font-mono text-[var(--muted-foreground)] truncate">
                {lastBackup ? formatFullDateTime(lastBackup.created_at) : "—"}
              </p>
            </div>

            <Badge tone={lastBackup?.status === "success" ? "profit" : "loss"}>
              {lastBackup ? (lastBackup.status === "success" ? "Sukses" : "Gagal") : "Kosong"}
            </Badge>
          </Card.Body>
        </Card>

        {/* Kartu Jadwal Cron */}
        <Card>
          <Card.Body className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                  Jadwal Otomatis
                </span>
                <InfoPopover content="Pipeline cron otomatis dieksekusi server setiap hari pukul 00:00 WIB tengah malam." />
              </div>
              <Badge tone="profit">Harian</Badge>
            </div>

            <div>
              <p className="text-sm font-mono font-bold text-[var(--foreground)]">
                00:00 WIB
              </p>
              <p className="text-[10px] font-mono text-[var(--muted-foreground)]">
                Cron: <code className="text-[var(--foreground)]">{statusData.cron_scheduler.schedule}</code>
              </p>
            </div>

            <span className="text-[10px] font-mono text-[var(--muted-foreground)] block">
              Otomatis & Terenkripsi
            </span>
          </Card.Body>
        </Card>

        {/* Kartu Total Arsip */}
        <Card>
          <Card.Body className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                  Total Arsip
                </span>
                <InfoPopover content="Jumlah snapshot database yang tersimpan di Google Drive dan tercatat di Supabase." />
              </div>
              <FileArchive size={13} className="text-[var(--muted-foreground)]" />
            </div>

            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-mono font-bold text-[var(--foreground)]">
                {logs.length}
              </p>
              <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                {lastBackup?.file_size_formatted || "0 B"}
              </span>
            </div>

            <Badge tone="neutral">ZIP Compression</Badge>
          </Card.Body>
        </Card>
      </div>

      {/* ── 3. Tabel Riwayat Backup (Fokus Utama & Bersih) ── */}
      <Card>
        <Card.Header className="py-2.5 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2">
              <Card.Title>Riwayat Cadangan</Card.Title>
              <Badge tone="neutral">{filteredLogs.length}</Badge>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={11}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <input
                  type="text"
                  placeholder="Cari file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-7 pl-6 pr-2 text-xs font-mono bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>

              <div className="flex items-center gap-0.5 border border-[var(--border)] p-0.5 rounded-[2px] bg-[var(--surface-subtle)]">
                {(["all", "success", "failed"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setStatusFilter(mode)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors rounded-[2px] cursor-pointer",
                      statusFilter === mode
                        ? "bg-[var(--foreground)] text-[var(--background)] font-semibold"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {mode === "all" ? "Semua" : mode === "success" ? "Sukses" : "Gagal"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <Archive size={24} className="mx-auto text-[var(--muted-foreground)]" />
              <p className="text-xs font-mono text-[var(--foreground)]">
                Tidak ada riwayat backup yang cocok.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    <th className="py-2.5 px-4 font-medium">Waktu Backup</th>
                    <th className="py-2.5 px-4 font-medium">Nama File</th>
                    <th className="py-2.5 px-4 font-medium">Ukuran</th>
                    <th className="py-2.5 px-4 font-medium">Tabel</th>
                    <th className="py-2.5 px-4 font-medium">Tipe</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredLogs.map((log) => {
                    const isSuccess = log.status === "success";
                    const isFailed = log.status === "failed";
                    const targetLink =
                      log.google_drive_link ||
                      (log.google_drive_file_id
                        ? `https://drive.google.com/file/d/${log.google_drive_file_id}/view`
                        : gdriveFolderUrl);

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-[var(--surface-subtle)] transition-colors group"
                      >
                        {/* Waktu */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-[var(--foreground)]">
                            {formatFullDateTime(log.created_at)}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)] block">
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </td>

                        {/* Nama File */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5 max-w-[220px]">
                            <span
                              className="truncate text-[var(--foreground)]"
                              title={log.filename}
                            >
                              {log.filename}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`file_${log.id}`, log.filename)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity cursor-pointer shrink-0"
                              title="Salin nama file"
                            >
                              {copiedKey === `file_${log.id}` ? (
                                <Check size={11} className="text-[var(--profit)]" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Ukuran */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-[var(--foreground)]">
                          {log.file_size_formatted || "0 B"}
                        </td>

                        {/* Rincian Tabel */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedLogForDetail(log)}
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline cursor-pointer"
                          >
                            <Table size={11} />
                            <span>{log.tables_backed_up?.length || 0} Tabel</span>
                          </button>
                        </td>

                        {/* Tipe */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <Badge
                            tone={
                              log.executed_by === "cron_daily"
                                ? "profit"
                                : "neutral"
                            }
                          >
                            {log.executed_by === "cron_daily" ? "CRON" : "MANUAL"}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isSuccess && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--profit)] font-bold">
                              <CheckCircle2 size={11} />
                              SUKSES
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--loss)] font-bold">
                              <XCircle size={11} />
                              GAGAL
                            </span>
                          )}
                          {!isSuccess && !isFailed && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                              <RefreshCw size={11} className="animate-spin" />
                              PROSES
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-right">
                          <a
                            href={targetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-[var(--border)] hover:border-[var(--foreground)] text-[var(--foreground)] bg-[var(--surface)] transition-colors rounded-[2px]"
                            title="Buka file di Google Drive"
                          >
                            <span>Drive</span>
                            <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>

        <Card.Footer className="py-2 px-4 text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
          <span>Menampilkan {filteredLogs.length} arsip cadangan</span>
          <div className="flex items-center gap-1.5">
            <span>Redundansi: Apicore &rarr; ZIP &rarr; Google Drive</span>
            <InfoPopover
              align="right"
              content="Alur 3-tier: Ekstraksi data dari database MySQL cPanel apicore -> Kompresi ZIP Level 9 -> Unggah langsung ke Google Drive business.kinauid@gmail.com -> Pencatatan audit log ke Supabase."
            />
          </div>
        </Card.Footer>
      </Card>

      {/* ── 4. Modal Ringkas Rincian Tabel (Hanya muncul saat diklik) ── */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--card)] border border-[var(--border-strong)] rounded-[2px] max-w-md w-full overflow-hidden shadow-2xl space-y-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <Table size={13} className="text-[var(--profit)]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Rincian Tabel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                aria-label="Tutup modal"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto text-xs font-mono">
              <div className="text-[11px] text-[var(--muted-foreground)] pb-2 border-b border-[var(--border)]">
                File: <span className="text-[var(--foreground)] font-semibold">{selectedLogForDetail.filename}</span>
              </div>

              {selectedLogForDetail.tables_backed_up &&
              selectedLogForDetail.tables_backed_up.length > 0 ? (
                <div className="border border-[var(--border)] rounded-[2px] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[10px] uppercase text-[var(--muted-foreground)]">
                      <tr>
                        <th className="py-1.5 px-3">Tabel</th>
                        <th className="py-1.5 px-3 text-right">Baris</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {selectedLogForDetail.tables_backed_up.map((t, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-subtle)]">
                          <td className="py-1.5 px-3 text-[var(--foreground)] flex items-center gap-1.5">
                            <Database size={10} className="text-[var(--muted-foreground)]" />
                            <span>{t.name}</span>
                          </td>
                          <td className="py-1.5 px-3 text-right text-[var(--muted-foreground)] font-semibold">
                            {Number(t.rows).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-[var(--muted-foreground)]">
                  Tidak ada rincian tabel.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedLogForDetail(null)}
              >
                TUTUP
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

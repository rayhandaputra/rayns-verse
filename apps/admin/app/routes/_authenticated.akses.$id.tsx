import { useState } from "react";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  type MetaFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  Link,
} from "react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "~/components/shared/components/Badge";
import { Button } from "~/components/shared/components/Button";
import { Card } from "~/components/shared/components/Card";
import { BRAND_NAME } from "~/constants/brand";
import { ACCESS_ENTRIES } from "~/constants/access";
import { cn } from "~/lib/utils";
import { requireAuth } from "~/lib/session.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `${data?.entry?.label || "Detail Akses"} — ${BRAND_NAME}` },
];

export interface AccessDetailRecord {
  id: number | string;
  uid?: string;
  key?: string | null;
  label: string;
  category: string;
  url: string;
  url_label?: string;
  urlLabel?: string;
  username?: string | null;
  username_label?: string | null;
  usernameLabel?: string | null;
  password?: string | null;
  auth_note?: string | null;
  authNote?: string | null;
  notes?: string | null;
  extra_links?: Array<{ label: string; href: string }> | null;
  extraLinks?: Array<{ label: string; href: string }> | null;
  tech_stack?: string[] | null;
  embed_url?: string | null;
  sort_order?: number;
}

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

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAuth(request);
  const id = params.id;
  const backendBase = getBackendUrl().replace(/\/+$/, "");

  let entry: AccessDetailRecord | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${backendBase}/access/${id}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        const item = json.data;
        entry = {
          ...item,
          urlLabel: item.url_label || item.url,
          usernameLabel: item.username_label || "Username",
          authNote: item.auth_note || null,
          extraLinks:
            typeof item.extra_links === "string"
              ? JSON.parse(item.extra_links)
              : item.extra_links || [],
          tech_stack:
            typeof item.tech_stack === "string"
              ? JSON.parse(item.tech_stack)
              : item.tech_stack || [],
          embed_url: item.embed_url || item.url,
        };
      }
    }
  } catch {
    // Fallback search in hardcoded constants
  }

  if (!entry) {
    const fallbackItem = ACCESS_ENTRIES.find(
      (e) => String(e.id) === String(id)
    );
    if (fallbackItem) {
      entry = {
        ...fallbackItem,
        id: fallbackItem.id,
        url_label: fallbackItem.urlLabel || fallbackItem.url,
        urlLabel: fallbackItem.urlLabel || fallbackItem.url,
        username_label: fallbackItem.usernameLabel || "Username",
        usernameLabel: fallbackItem.usernameLabel || "Username",
        auth_note: fallbackItem.authNote || null,
        authNote: fallbackItem.authNote || null,
        extra_links: fallbackItem.extraLinks || [],
        extraLinks: fallbackItem.extraLinks || [],
        tech_stack: ["Production Ready", "SSL Encrypted", "Cloud Hosted"],
        embed_url: fallbackItem.url,
      };
    }
  }

  if (!entry) {
    throw new Response("Layanan / Akses tidak ditemukan", { status: 404 });
  }

  return { entry };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireAuth(request);
  const id = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const backendBase = getBackendUrl().replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    if (intent === "update") {
      const payload = {
        label: formData.get("label"),
        category: formData.get("category") || "Umum",
        url: formData.get("url"),
        url_label: formData.get("url_label") || formData.get("url"),
        username: formData.get("username") || null,
        username_label: formData.get("username_label") || "Username",
        password: formData.get("password") || null,
        auth_note: formData.get("auth_note") || null,
        notes: formData.get("notes") || "",
        embed_url: formData.get("embed_url") || formData.get("url"),
        tech_stack: formData.get("tech_stack")
          ? JSON.parse(String(formData.get("tech_stack")))
          : [],
        extra_links: formData.get("extra_links")
          ? JSON.parse(String(formData.get("extra_links")))
          : [],
      };

      const res = await fetch(`${backendBase}/access/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        return { ok: false, error: json.error_message || "Gagal memperbarui akses." };
      }
      return { ok: true, message: "Akses berhasil diperbarui." };
    }

    if (intent === "delete") {
      const res = await fetch(`${backendBase}/access/${id}`, {
        method: "DELETE",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        return { ok: false, error: json.error_message || "Gagal menghapus akses." };
      }
      return { ok: true, deleted: true, message: "Akses berhasil dihapus." };
    }

    return { ok: false, error: "Aksi tidak dikenal." };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Terjadi kesalahan server." };
  }
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

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
        aria-label="Informasi"
      >
        !
      </button>

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

export default function AccessDetailRoute() {
  const { entry } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Form State for Edit
  const [formLabel, setFormLabel] = useState(entry.label);
  const [formCategory, setFormCategory] = useState(entry.category || "Umum");
  const [formUrl, setFormUrl] = useState(entry.url);
  const [formUrlLabel, setFormUrlLabel] = useState(entry.url_label || entry.urlLabel || entry.url);
  const [formEmbedUrl, setFormEmbedUrl] = useState(entry.embed_url || entry.url);
  const [formUsername, setFormUsername] = useState(entry.username || "");
  const [formUsernameLabel, setFormUsernameLabel] = useState(entry.username_label || entry.usernameLabel || "Username");
  const [formPassword, setFormPassword] = useState(entry.password || "");
  const [formAuthNote, setFormAuthNote] = useState(entry.auth_note || entry.authNote || "");
  const [formNotes, setFormNotes] = useState(entry.notes || "");

  // Multiple Tech Stack Points State
  const [techStackList, setTechStackList] = useState<string[]>(entry.tech_stack || []);
  const [techStackInput, setTechStackInput] = useState("");

  async function handleCopy(key: string, text: string) {
    await copyText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  }

  function handleAddTechPoint() {
    const trimmed = techStackInput.trim();
    if (trimmed && !techStackList.includes(trimmed)) {
      setTechStackList([...techStackList, trimmed]);
      setTechStackInput("");
    }
  }

  function handleRemoveTechPoint(index: number) {
    setTechStackList(techStackList.filter((_, idx) => idx !== index));
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formLabel.trim() || !formUrl.trim()) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Label dan URL wajib diisi.",
        icon: "warning",
      });
      return;
    }

    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("label", formLabel.trim());
    formData.append("category", formCategory.trim() || "Umum");
    formData.append("url", formUrl.trim());
    formData.append("url_label", formUrlLabel.trim() || formUrl.trim());
    formData.append("embed_url", formEmbedUrl.trim() || formUrl.trim());
    formData.append("username", formUsername.trim());
    formData.append("username_label", formUsernameLabel.trim() || "Username");
    formData.append("password", formPassword);
    formData.append("auth_note", formAuthNote.trim());
    formData.append("notes", formNotes.trim());
    formData.append("tech_stack", JSON.stringify(techStackList));

    fetcher.submit(formData, { method: "post" });
    setIsEditModalOpen(false);

    Swal.fire({
      title: "Menyimpan...",
      text: "Memperbarui data layanan di Supabase.",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  async function handleDelete() {
    const confirm = await Swal.fire({
      title: `Hapus Layanan ${entry.label}?`,
      text: "Data akan dihapus dari Supabase dan dihilangkan dari sub-menu sidebar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        popup: "!bg-[var(--card)] !text-[var(--foreground)] !border !border-[var(--border)]",
        confirmButton: "!bg-[var(--loss)] !text-white !font-mono",
        cancelButton: "!bg-transparent !text-[var(--foreground)] !border !border-[var(--border)] !font-mono",
      },
    });

    if (confirm.isConfirmed) {
      const formData = new FormData();
      formData.append("intent", "delete");
      fetcher.submit(formData, { method: "post" });
      navigate("/akses");
    }
  }

  const activeEmbedUrl = entry.embed_url || entry.url;
  const activeUrlLabel = entry.url_label || entry.urlLabel || entry.url;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* ── 1. Breadcrumbs & Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)]">
          <Link to="/akses" className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            <span>Layanan & Akses</span>
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)] font-semibold truncate">{entry.label}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-mono font-bold uppercase tracking-tight text-[var(--foreground)]">
              {entry.label}
            </h1>
            <Badge tone="profit">{entry.category}</Badge>
            <InfoPopover
              align="left"
              content="Halaman detail dan embed langsung untuk layanan ini. Anda dapat mengedit poin tech stack, embed URL, dan kredensialnya kapan saja."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleCopy("main_url", entry.url)}
            >
              {copiedKey === "main_url" ? <Check size={13} className="text-[var(--profit)]" /> : <Copy size={13} />}
              SALIN URL
            </Button>

            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono font-semibold bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity rounded-[2px]"
            >
              <span>BUKA TAB BARU</span>
              <ArrowUpRight size={13} />
            </a>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormLabel(entry.label);
                setFormCategory(entry.category || "Umum");
                setFormUrl(entry.url);
                setFormUrlLabel(activeUrlLabel);
                setFormEmbedUrl(activeEmbedUrl);
                setFormUsername(entry.username || "");
                setFormUsernameLabel(entry.username_label || entry.usernameLabel || "Username");
                setFormPassword(entry.password || "");
                setFormAuthNote(entry.auth_note || entry.authNote || "");
                setFormNotes(entry.notes || "");
                setTechStackList(entry.tech_stack || []);
                setIsEditModalOpen(true);
              }}
            >
              <Pencil size={12} />
              EDIT
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Grid Info: Tech Stack Poin & Kredensial Akses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kolom Kiri: Kredensial & Autentikasi */}
        <Card className="lg:col-span-1">
          <Card.Header className="py-2.5 px-3.5">
            <div className="flex items-center gap-2">
              <KeyRound size={13} className="text-[var(--muted-foreground)]" />
              <Card.Title>Kredensial Layanan</Card.Title>
            </div>
            <Badge tone="neutral">Auth Vault</Badge>
          </Card.Header>

          <Card.Body className="p-3.5 space-y-2 text-xs font-mono">
            {/* URL */}
            <div className="space-y-1 pb-2 border-b border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-wider">
                URL Target
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[var(--foreground)]">{activeUrlLabel}</span>
                <button
                  type="button"
                  onClick={() => handleCopy("detail_url", entry.url)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  title="Salin URL"
                >
                  {copiedKey === "detail_url" ? <Check size={12} className="text-[var(--profit)]" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Username */}
            {entry.username ? (
              <div className="space-y-1 pb-2 border-b border-[var(--border)]">
                <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-wider">
                  {entry.username_label || entry.usernameLabel || "Username"}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--foreground)] select-all">{entry.username}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("detail_user", entry.username || "")}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    title="Salin Username"
                  >
                    {copiedKey === "detail_user" ? <Check size={12} className="text-[var(--profit)]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Password */}
            {entry.password ? (
              <div className="space-y-1 pb-2 border-b border-[var(--border)]">
                <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-wider">
                  Password
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--foreground)] select-all">
                    {passwordRevealed ? entry.password : "••••••••••••"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPasswordRevealed((v) => !v)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title={passwordRevealed ? "Sembunyikan" : "Tampilkan"}
                    >
                      {passwordRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy("detail_pass", entry.password || "")}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Salin Password"
                    >
                      {copiedKey === "detail_pass" ? <Check size={12} className="text-[var(--profit)]" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Auth Note */}
            {entry.auth_note || entry.authNote ? (
              <div className="space-y-1 pb-2 border-b border-[var(--border)]">
                <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-wider">
                  Metode Autentikasi
                </span>
                <p className="text-[var(--foreground)]">{entry.auth_note || entry.authNote}</p>
              </div>
            ) : null}

            {/* Catatan Operasional */}
            {entry.notes ? (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-wider">
                  Catatan Operasional
                </span>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  {entry.notes}
                </p>
              </div>
            ) : null}
          </Card.Body>
        </Card>

        {/* Kolom Kanan: Poin Deskripsi / Tech Stack (Persyaratan #1) */}
        <Card className="lg:col-span-2">
          <Card.Header className="py-2.5 px-3.5">
            <div className="flex items-center gap-2">
              <Code2 size={13} className="text-[var(--muted-foreground)]" />
              <Card.Title>Poin Deskripsi & Tech Stack</Card.Title>
            </div>
            <Badge tone="profit">{entry.tech_stack?.length || 0} Poin</Badge>
          </Card.Header>

          <Card.Body className="p-3.5 space-y-3">
            {entry.tech_stack && entry.tech_stack.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {entry.tech_stack.map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-xs font-mono text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
                  >
                    <Tag size={11} className="text-[var(--profit)] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs font-mono text-[var(--muted-foreground)]">
                Belum ada poin deskripsi atau tech stack yang ditambahkan. Klik tombol <b>EDIT</b> untuk menambahkan poin.
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* ── 3. Live Preview Embed URL (Persyaratan #2) ── */}
      <Card>
        <Card.Header className="py-2.5 px-3.5">
          <div className="flex items-center gap-2">
            <Globe size={13} className="text-[var(--profit)]" />
            <Card.Title>Live Embed Preview</Card.Title>
            <InfoPopover
              content="Pratinjau langsung dari tautan embed URL yang dimasukkan. Jika target website memblokir X-Frame-Options, gunakan tombol Buka di Tab Baru."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors"
              title="Reload Frame"
            >
              <RefreshCw size={12} />
              <span>Muat Ulang</span>
            </button>

            <a
              href={activeEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors"
            >
              <span>Buka Langsung</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </Card.Header>

        <Card.Body className="p-0 bg-black/40">
          <div className="relative w-full h-[540px] overflow-hidden rounded-b-[var(--radius-card)]">
            <iframe
              key={iframeKey}
              src={activeEmbedUrl}
              title={`Live preview ${entry.label}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </Card.Body>

        <Card.Footer className="py-2 px-3.5 text-[11px] font-mono text-[var(--muted-foreground)] flex items-center justify-between">
          <span className="truncate">Embed Target: <code className="text-[var(--foreground)]">{activeEmbedUrl}</code></span>
          <button
            type="button"
            onClick={() => handleCopy("embed_url_copy", activeEmbedUrl)}
            className="inline-flex items-center gap-1 text-[var(--foreground)] hover:underline shrink-0"
          >
            {copiedKey === "embed_url_copy" ? <Check size={11} className="text-[var(--profit)]" /> : <Copy size={11} />}
            <span>Salin URL Embed</span>
          </button>
        </Card.Footer>
      </Card>

      {/* ── 4. Modal Edit Layanan ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[var(--card)] border border-[var(--border-strong)] rounded-[2px] max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <Pencil size={13} className="text-[var(--profit)]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Edit Layanan: {entry.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Label *</label>
                  <input
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Kategori</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* URL & Embed URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">URL Target *</label>
                  <input
                    type="text"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Embed URL (Iframe)</label>
                  <input
                    type="text"
                    placeholder="https://kinauid.vercel.app"
                    value={formEmbedUrl}
                    onChange={(e) => setFormEmbedUrl(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Tech Stack Poin-poin Multiple Add */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase text-[var(--muted-foreground)]">
                  Poin Deskripsi / Tech Stack (Poin Bertingkat)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ketik poin (e.g. Next.js, Tailwind) lalu tekan Tambah..."
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTechPoint();
                      }
                    }}
                    className="flex-1 h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTechPoint}
                  >
                    <Plus size={12} />
                    TAMBAH
                  </Button>
                </div>

                {techStackList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {techStackList.map((pt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[11px] text-[var(--foreground)]"
                      >
                        <span>{pt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTechPoint(idx)}
                          className="text-[var(--muted-foreground)] hover:text-[var(--loss)]"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Username</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Password</label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Auth Note & Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Catatan Operasional</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  BATAL
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  SIMPAN PERUBAHAN
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

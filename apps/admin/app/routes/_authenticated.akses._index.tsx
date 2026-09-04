import { useState, useMemo } from "react";
import {
  useLoaderData,
  useFetcher,
  Link,
  type MetaFunction,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
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

export const meta: MetaFunction = () => [
  { title: `Layanan & Akses — ${BRAND_NAME}` },
];

export interface AccessLink {
  label: string;
  href: string;
}

export interface AccessEntry {
  id: string | number;
  uid?: string;
  key?: string | null;
  label: string;
  category: string;
  url: string;
  urlLabel?: string;
  url_label?: string;
  username?: string | null;
  usernameLabel?: string | null;
  username_label?: string | null;
  password?: string | null;
  authNote?: string | null;
  auth_note?: string | null;
  notes?: string | null;
  extraLinks?: AccessLink[];
  extra_links?: AccessLink[];
  tech_stack?: string[] | null;
  embed_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
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

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const backendBase = getBackendUrl().replace(/\/+$/, "");

  let entries: AccessEntry[] = ACCESS_ENTRIES.map((entry, idx) => ({
    ...entry,
    id: entry.id || idx + 1,
    url_label: entry.urlLabel || entry.url,
    username_label: entry.usernameLabel || "Username",
    auth_note: entry.authNote || null,
    extra_links: entry.extraLinks || [],
    tech_stack: ["Production Ready", "SSL Encrypted", "Cloud Hosted"],
    embed_url: entry.url,
  }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${backendBase}/access`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        entries = json.data.map((item: any) => ({
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
        }));
      }
    }
  } catch {
    // Fallback data
  }

  return { entries };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const backendBase = getBackendUrl().replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    if (intent === "create") {
      const payload = {
        label: formData.get("label"),
        category: formData.get("category") || "Umum",
        url: formData.get("url"),
        url_label: formData.get("url_label") || formData.get("url"),
        embed_url: formData.get("embed_url") || formData.get("url"),
        username: formData.get("username") || null,
        username_label: formData.get("username_label") || "Username",
        password: formData.get("password") || null,
        auth_note: formData.get("auth_note") || null,
        notes: formData.get("notes") || "",
        tech_stack: formData.get("tech_stack")
          ? JSON.parse(String(formData.get("tech_stack")))
          : [],
        extra_links: formData.get("extra_links")
          ? JSON.parse(String(formData.get("extra_links")))
          : [],
      };

      const res = await fetch(`${backendBase}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        return { ok: false, error: json.error_message || "Gagal menambah akses." };
      }
      return { ok: true, message: "Layanan baru berhasil disimpan ke Supabase." };
    }

    if (intent === "update") {
      const id = formData.get("id");
      const payload = {
        label: formData.get("label"),
        category: formData.get("category") || "Umum",
        url: formData.get("url"),
        url_label: formData.get("url_label") || formData.get("url"),
        embed_url: formData.get("embed_url") || formData.get("url"),
        username: formData.get("username") || null,
        username_label: formData.get("username_label") || "Username",
        password: formData.get("password") || null,
        auth_note: formData.get("auth_note") || null,
        notes: formData.get("notes") || "",
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
      return { ok: true, message: "Layanan berhasil diperbarui di Supabase." };
    }

    if (intent === "delete") {
      const id = formData.get("id");
      const res = await fetch(`${backendBase}/access/${id}`, {
        method: "DELETE",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        return { ok: false, error: json.error_message || "Gagal menghapus akses." };
      }
      return { ok: true, message: "Layanan berhasil dihapus dari Supabase." };
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

function FieldRow({
  label,
  value,
  secret,
  copiedKey,
  fieldKey,
  onCopy,
}: {
  label: string;
  value: string;
  secret?: boolean;
  copiedKey: string | null;
  fieldKey: string;
  onCopy: (key: string, value: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const display = secret && !revealed ? "••••••••" : value;
  const copied = copiedKey === fieldKey;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
          {label}
        </p>
        <p className="text-xs font-mono truncate select-all">{display}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Sembunyikan" : "Tampilkan"}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => onCopy(fieldKey, value)}
          aria-label="Salin"
          className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          {copied ? (
            <Check size={13} className="text-[var(--profit)]" />
          ) : (
            <Copy size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

function AccessCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: AccessEntry;
  onEdit: (entry: AccessEntry) => void;
  onDelete: (entry: AccessEntry) => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleCopy(key: string, value: string) {
    await copyText(value);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1500);
  }

  const urlLabel = entry.url_label || entry.urlLabel || entry.url;
  const username = entry.username;
  const usernameLabel = entry.username_label || entry.usernameLabel || "Username";
  const authNote = entry.auth_note || entry.authNote;
  const extraLinks = entry.extra_links || entry.extraLinks || [];
  const techStack = entry.tech_stack || [];
  const detailUrl = `/akses/${entry.id}`;

  return (
    <Card className="flex flex-col justify-between group">
      <div>
        <Card.Header className="py-2.5 px-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <KeyRound size={13} className="text-[var(--muted-foreground)] shrink-0" />
            <Link
              to={detailUrl}
              className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] hover:underline truncate"
            >
              {entry.label}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge tone="neutral">{entry.category || "Umum"}</Badge>
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              title="Edit layanan"
              aria-label={`Edit ${entry.label}`}
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--loss)] transition-colors cursor-pointer"
              title="Hapus layanan"
              aria-label={`Hapus ${entry.label}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </Card.Header>

        <Card.Body className="p-3.5 space-y-2">
          {/* Tech Stack Points */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1 pb-1">
              {techStack.slice(0, 4).map((tech, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-[var(--surface-subtle)] text-[var(--muted-foreground)] border border-[var(--border)] rounded-[2px]"
                >
                  <Tag size={9} className="text-[var(--profit)]" />
                  <span>{tech}</span>
                </span>
              ))}
              {techStack.length > 4 && (
                <span className="text-[9px] font-mono text-[var(--muted-foreground)] self-center">
                  +{techStack.length - 4} lainnya
                </span>
              )}
            </div>
          )}

          {/* URL Row */}
          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border)]">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                URL
              </p>
              <p className="text-xs font-mono truncate">{urlLabel}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(`${entry.id}:url`, entry.url)}
                aria-label="Salin URL"
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                {copiedKey === `${entry.id}:url` ? (
                  <Check size={13} className="text-[var(--profit)]" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Buka tautan"
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Username */}
          {username && (
            <FieldRow
              label={usernameLabel}
              value={username}
              copiedKey={copiedKey}
              fieldKey={`${entry.id}:user`}
              onCopy={handleCopy}
            />
          )}

          {/* Password */}
          {entry.password ? (
            <FieldRow
              label="Password"
              value={entry.password}
              secret
              copiedKey={copiedKey}
              fieldKey={`${entry.id}:pass`}
              onCopy={handleCopy}
            />
          ) : (
            authNote && (
              <div className="py-1.5 border-b border-[var(--border)] last:border-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                  Autentikasi
                </p>
                <p className="text-xs font-mono text-[var(--foreground)]">{authNote}</p>
              </div>
            )
          )}
        </Card.Body>
      </div>

      <Card.Footer className="py-2 px-3.5 flex items-center justify-between text-[11px] font-mono">
        <span className="text-[var(--muted-foreground)] truncate max-w-[200px]">
          {entry.notes || "Siap digunakan"}
        </span>
        <Link
          to={detailUrl}
          className="inline-flex items-center gap-1 text-[var(--foreground)] hover:underline font-semibold"
        >
          <span>Buka Detail & Embed</span>
          <ArrowUpRight size={12} />
        </Link>
      </Card.Footer>
    </Card>
  );
}

export default function AksesIndexRoute() {
  const { entries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingEntry, setEditingEntry] = useState<AccessEntry | null>(null);

  // Form State
  const [formLabel, setFormLabel] = useState("");
  const [formCategory, setFormCategory] = useState("Umum");
  const [formUrl, setFormUrl] = useState("");
  const [formUrlLabel, setFormUrlLabel] = useState("");
  const [formEmbedUrl, setFormEmbedUrl] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formUsernameLabel, setFormUsernameLabel] = useState("Username");
  const [formPassword, setFormPassword] = useState("");
  const [formAuthNote, setFormAuthNote] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Tech Stack Point Array State
  const [techStackList, setTechStackList] = useState<string[]>([]);
  const [techStackInput, setTechStackInput] = useState("");

  const categories = useMemo(() => {
    const list = Array.from(new Set(entries.map((e) => e.category).filter(Boolean)));
    return ["all", ...list];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.username && entry.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.tech_stack && entry.tech_stack.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCategory =
        selectedCategory === "all" || entry.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [entries, searchTerm, selectedCategory]);

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

  function openCreateModal() {
    setFormLabel("");
    setFormCategory("Umum");
    setFormUrl("");
    setFormUrlLabel("");
    setFormEmbedUrl("");
    setFormUsername("");
    setFormUsernameLabel("Username");
    setFormPassword("");
    setFormAuthNote("");
    setFormNotes("");
    setTechStackList([]);
    setTechStackInput("");
    setEditingEntry(null);
    setModalMode("create");
  }

  function openEditModal(entry: AccessEntry) {
    setEditingEntry(entry);
    setFormLabel(entry.label);
    setFormCategory(entry.category || "Umum");
    setFormUrl(entry.url);
    setFormUrlLabel(entry.url_label || entry.urlLabel || entry.url);
    setFormEmbedUrl(entry.embed_url || entry.url);
    setFormUsername(entry.username || "");
    setFormUsernameLabel(entry.username_label || entry.usernameLabel || "Username");
    setFormPassword(entry.password || "");
    setFormAuthNote(entry.auth_note || entry.authNote || "");
    setFormNotes(entry.notes || "");
    setTechStackList(entry.tech_stack || []);
    setTechStackInput("");
    setModalMode("edit");
  }

  function handleFormSubmit(e: React.FormEvent) {
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
    formData.append("intent", modalMode === "create" ? "create" : "update");
    if (editingEntry?.id) {
      formData.append("id", String(editingEntry.id));
    }
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
    setModalMode(null);

    Swal.fire({
      title: "Menyimpan...",
      text: "Data layanan berhasil disimpan ke Supabase database.",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  async function handleDeleteEntry(entry: AccessEntry) {
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
      formData.append("id", String(entry.id));
      fetcher.submit(formData, { method: "post" });
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      {/* ── 1. Header Halaman ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-mono font-bold uppercase tracking-tight">
            Layanan & Akses
          </h1>
          <Badge tone="profit">Supabase DB</Badge>
          <InfoPopover
            align="left"
            content="Setiap baris data layanan yang ditambahkan otomatis tampil sebagai sub-menu di sidebar kiri, lengkap dengan fitur live embed dan poin tech stack."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            title="Refresh data dari Supabase"
          >
            <RefreshCw size={13} />
            REFRESH
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreateModal}
          >
            <Plus size={13} />
            TAMBAH LAYANAN
          </Button>
        </div>
      </div>

      {/* ── 2. Filter Kategori & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-colors rounded-[2px] border cursor-pointer",
                selectedCategory === cat
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] font-bold"
                  : "bg-[var(--surface-subtle)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
              )}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="text"
            placeholder="Cari layanan, URL, tech stack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-7 pr-2.5 text-xs font-mono bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)]"
          />
        </div>
      </div>

      {/* ── 3. Grid Kartu Layanan ── */}
      {filteredEntries.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center space-y-2">
            <KeyRound size={24} className="mx-auto text-[var(--muted-foreground)]" />
            <p className="text-xs font-mono text-[var(--foreground)]">
              Tidak ada layanan yang cocok dengan filter atau pencarian.
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Gunakan tombol "TAMBAH LAYANAN" untuk mendaftarkan layanan baru.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEntries.map((entry) => (
            <AccessCard
              key={String(entry.id)}
              entry={entry}
              onEdit={openEditModal}
              onDelete={handleDeleteEntry}
            />
          ))}
        </div>
      )}

      {/* ── 4. Modal Form Tambah / Edit Layanan ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[var(--card)] border border-[var(--border-strong)] rounded-[2px] max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-[var(--profit)]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--foreground)]">
                  {modalMode === "create" ? "Tambah Layanan Baru" : `Edit Layanan: ${editingEntry?.label}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-3 max-h-[72vh] overflow-y-auto text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Label */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">
                    Nama Layanan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: FrontEnd KINAU"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">
                    Kategori
                  </label>
                  <input
                    type="text"
                    placeholder="FrontEnd, Hosting, Database, dll"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* URL & Embed URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">
                    URL Target *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://kinauid.vercel.app"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">
                    Embed URL (Pratinjau Live)
                  </label>
                  <input
                    type="text"
                    placeholder="https://kinauid.vercel.app"
                    value={formEmbedUrl}
                    onChange={(e) => setFormEmbedUrl(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Tech Stack Poin-poin Multiple Add (Persyaratan #1) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase text-[var(--muted-foreground)]">
                  Poin Deskripsi / Tech Stack (Multiple Add)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ketik poin (e.g. React 18, Tailwind, Bun) lalu tekan Tambah / Enter..."
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
                        <Tag size={10} className="text-[var(--profit)]" />
                        <span>{pt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTechPoint(idx)}
                          className="text-[var(--muted-foreground)] hover:text-[var(--loss)] ml-0.5 cursor-pointer"
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
                    placeholder="ceo@kinau.web.id"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Password</label>
                  <input
                    type="text"
                    placeholder="Password layanan"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Auth Note & Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Catatan Autentikasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Login via Google / SSO"
                  value={formAuthNote}
                  onChange={(e) => setFormAuthNote(e.target.value)}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[2px] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan penggunaan atau instruksi operasional..."
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
                  onClick={() => setModalMode(null)}
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
                  SIMPAN KE SUPABASE
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

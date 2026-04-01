import { useState, useEffect } from "react";
import { useLoaderData, type LoaderFunction } from "react-router";
import {
  Pencil,
  Send,
  RefreshCw,
  Loader2,
  Inbox,
  ShieldAlert,
  Mail,
  MailOpen,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Reply,
  Forward,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { requireAuth } from "~/lib/session.server";

/*
 * ============================================================
 * DATABASE TABLE STRUCTURE FOR LOCAL EMAIL STORAGE
 * ============================================================
 *
 * Table: sent_emails
 * Purpose: Menyimpan email yang dikirim user agar langsung muncul di UI
 *          tanpa menunggu response dari SMTP server.
 *
 * | Column         | Type         | Description                                      |
 * |----------------|--------------|--------------------------------------------------|
 * | id             | UUID / PK    | Primary key                                      |
 * | user_id        | FK -> users  | User yang mengirim email                         |
 * | from_email     | VARCHAR(255) | Email pengirim (official@kinau.id / admin@kinau.id) |
 * | from_name      | VARCHAR(255) | Nama pengirim kustom                             |
 * | to_email       | VARCHAR(255) | Email tujuan                                     |
 * | subject        | VARCHAR(500) | Judul email                                      |
 * | body           | TEXT         | Isi email (HTML)                                 |
 * | status         | ENUM         | 'pending' | 'sent' | 'failed'                    |
 * | error_message  | TEXT NULL    | Detail error jika gagal kirim                    |
 * | smtp_response  | TEXT NULL    | Response dari SMTP server                        |
 * | created_at     | TIMESTAMP    | Waktu email dibuat/dikirim                       |
 * | updated_at     | TIMESTAMP    | Waktu terakhir status di-update                  |
 *
 * Flow:
 * 1. User klik "Kirim" → INSERT row dengan status='pending' → UI langsung update
 * 2. Background: Kirim ke send_email.php
 * 3. Jika sukses → UPDATE status='sent'
 * 4. Jika gagal  → UPDATE status='failed', simpan error_message
 *
 * Table: received_emails (cache)
 * Purpose: Cache email dari IMAP agar tidak selalu fetch dari API
 *
 * | Column         | Type         | Description                                      |
 * |----------------|--------------|--------------------------------------------------|
 * | id             | UUID / PK    | Primary key                                      |
 * | imap_id        | INT          | ID email dari IMAP server                        |
 * | account_email  | VARCHAR(255) | Akun email (official@kinau.id / admin@kinau.id)  |
 * | folder         | VARCHAR(50)  | 'INBOX' | 'SPAM'                                 |
 * | from_email     | VARCHAR(255) | Email pengirim                                   |
 * | from_name      | VARCHAR(255) | Nama pengirim                                    |
 * | subject        | VARCHAR(500) | Judul email                                      |
 * | date           | TIMESTAMP    | Tanggal email                                    |
 * | seen           | BOOLEAN      | Sudah dibaca atau belum                          |
 * | cached_at      | TIMESTAMP    | Waktu di-cache                                   |
 *
 * ============================================================
 */

// Types
interface EmailFromAPI {
  id: number;
  folder: string;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
}

interface MailboxResponse {
  status: boolean;
  data: {
    inbox: EmailFromAPI[];
    spam: EmailFromAPI[];
    sent?: EmailFromAPI[];
  };
}

interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  folder: string;
  time: string;
  initials: string;
  color: string;
  seen: boolean;
  rawDate: string;
}

interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  fromName: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
}

// CEO email accounts
const CEO_EMAIL_ACCOUNTS = [
  { value: "official@kinau.id", label: "official@kinau.id" },
  { value: "admin@kinau.id", label: "admin@kinau.id" },
];

// Helper functions
function parseEmailFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
  }
  return { name: from, email: from };
}

function getInitials(name: string): string {
  const words = name.split(" ").filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-pink-100 text-pink-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
    "bg-orange-100 text-orange-700",
    "bg-cyan-100 text-cyan-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari`;

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function transformEmailData(
  apiEmails: EmailFromAPI[],
  folder: string
): Email[] {
  return apiEmails.map((email) => {
    const { name, email: senderEmail } = parseEmailFrom(email.from);
    return {
      id: `${folder.toLowerCase()}-${email.id}`,
      sender: name,
      senderEmail,
      subject: email.subject,
      preview:
        email.subject.slice(0, 80) + (email.subject.length > 80 ? "..." : ""),
      folder,
      time: formatRelativeTime(email.date),
      initials: getInitials(name),
      color: getAvatarColor(name),
      seen: email.seen,
      rawDate: email.date,
    };
  });
}

// Loader
export const loader: LoaderFunction = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const isCEO = user?.role?.toUpperCase() === "CEO" || user?.role?.toUpperCase() === "DEVELOPER";

  // CEO: fetch default account, non-CEO: fetch tanpa query
  let mailbox = null;
  let fetchError = null;
  try {
    const url = isCEO
      ? "https://data.kinau.id/mailbox.php?email=official@kinau.id"
      : "https://data.kinau.id/mailbox.php";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch mailbox");
    mailbox = await response.json();
  } catch (error) {
    console.error("Mailbox fetch error:", error);
    fetchError = "Gagal memuat email";
  }

  return { mailbox, error: fetchError, user };
};

// Components
function EmailListItem({
  email,
  isSelected,
  onClick,
}: {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group px-4 py-3 cursor-pointer transition-all duration-150 border-b border-gray-50 ${isSelected
        ? "bg-blue-50 border-l-[3px] border-l-blue-600"
        : "hover:bg-gray-50/80 border-l-[3px] border-l-transparent"
        } ${!email.seen ? "bg-blue-50/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5">
          <AvatarFallback className={`${email.color} text-xs font-semibold`}>
            {email.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className={`text-sm truncate ${!email.seen ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
            >
              {email.sender}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
              {email.time}
            </span>
          </div>
          <p
            className={`text-sm truncate ${!email.seen ? "font-semibold text-gray-800" : "text-gray-600"}`}
          >
            {email.subject}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {email.preview}
          </p>
        </div>
        {!email.seen && (
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
  isCEO,
  selectedAccount,
  onSend,
  isSending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCEO: boolean;
  selectedAccount: string;
  onSend: (data: { to: string; subject: string; body: string; fromName: string }) => void;
  isSending: boolean;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [fromName, setFromName] = useState("");

  const handleSubmit = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Mohon lengkapi semua field (Tujuan, Subjek, Isi)");
      return;
    }
    onSend({ to: to.trim(), subject: subject.trim(), body: body.trim(), fromName: fromName.trim() });
    setTo("");
    setSubject("");
    setBody("");
    setFromName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold">Email Baru</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-3">
          {isCEO && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 w-16 flex-shrink-0">Dari</label>
              <span className="text-sm text-gray-900">{selectedAccount}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 w-16 flex-shrink-0">Tujuan</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@contoh.com"
              className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 outline-none py-1.5 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 w-16 flex-shrink-0">Nama</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Nama pengirim (opsional)"
              className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 outline-none py-1.5 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 w-16 flex-shrink-0">Subjek</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Judul email"
              className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 outline-none py-1.5 bg-transparent"
            />
          </div>
          <div className="pt-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis isi email Anda di sini..."
              className="w-full text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none p-3 bg-gray-50/50 resize-none min-h-[200px]"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Email dikirim sebagai HTML
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Kirim
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SentEmailItem({ email }: { email: SentEmail }) {
  const statusConfig = {
    pending: { icon: Clock, label: "Mengirim...", className: "bg-yellow-100 text-yellow-700" },
    sent: { icon: CheckCircle2, label: "Terkirim", className: "bg-green-100 text-green-700" },
    failed: { icon: AlertCircle, label: "Gagal", className: "bg-red-100 text-red-700" },
  };
  const status = statusConfig[email.status];
  const StatusIcon = status.icon;

  return (
    <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Send className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-medium text-gray-700 truncate">
              Ke: {email.to}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
              {formatRelativeTime(email.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{email.subject}</p>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailPage() {
  const { mailbox, error, user } = useLoaderData<{
    mailbox: MailboxResponse | null;
    error: string | null;
    user: any;
  }>();

  const isCEO = user?.role?.toUpperCase() === "CEO" || user?.role?.toUpperCase() === "DEVELOPER";

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [selectedAccount, setSelectedAccount] = useState<string>("official@kinau.id");
  const [client, setClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    if (mailbox?.data) {
      const inboxEmails = transformEmailData(mailbox.data.inbox, "Inbox");
      const spamEmails = transformEmailData(mailbox.data.spam, "Spam");
      const sentApiEmails = transformEmailData(mailbox.data.sent || [], "Sent");
      setEmails([...inboxEmails, ...spamEmails, ...sentApiEmails]);

      if (!selectedEmail && inboxEmails.length > 0) {
        setSelectedEmail(inboxEmails[0].id);
      }
    }
  }, [mailbox]);

  const fetchEmails = async (account?: string) => {
    setIsRefreshing(true);
    try {
      const url = isCEO
        ? `https://data.kinau.id/mailbox.php?email=${encodeURIComponent(account || selectedAccount)}`
        : "https://data.kinau.id/mailbox.php";
      const response = await fetch(url);
      const data: MailboxResponse = await response.json();
      if (data.status && data.data) {
        const inboxEmails = transformEmailData(data.data.inbox, "Inbox");
        const spamEmails = transformEmailData(data.data.spam, "Spam");
        const sentApiEmails = transformEmailData(data.data.sent || [], "Sent");
        setEmails([...inboxEmails, ...spamEmails, ...sentApiEmails]);
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error("Refresh error:", err);
      toast.error("Gagal memuat email");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAccountChange = (account: string) => {
    setSelectedAccount(account);
    fetchEmails(account);
  };

  const handleSendEmail = async (data: {
    to: string;
    subject: string;
    body: string;
    fromName: string;
  }) => {
    // Optimistic: simpan ke sent list dengan status pending
    const tempId = Date.now().toString();
    const newSentEmail: SentEmail = {
      id: tempId,
      to: data.to,
      subject: data.subject,
      body: data.body,
      fromName: data.fromName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setSentEmails((prev) => [newSentEmail, ...prev]);
    setComposeOpen(false);
    toast.info("Mengirim email...");

    setIsSending(true);
    try {
      const payload: Record<string, string> = {
        to: data.to,
        subject: data.subject,
        body: data.body,
      };
      if (data.fromName) {
        payload.from_name = data.fromName;
      }

      const response = await fetch("https://data.kinau.id/send_email.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.status) {
        setSentEmails((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, status: "sent" } : e))
        );
        toast.success(result.message || "Email berhasil dikirim!");
      } else {
        setSentEmails((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, status: "failed" } : e))
        );
        toast.error(result.error || "Gagal mengirim email");
      }
    } catch (err) {
      console.log(err)
      setSentEmails((prev) =>
        prev.map((e) => (e.id === tempId ? { ...e, status: "failed" } : e))
      );
      toast.error("Gagal mengirim email. Periksa koneksi internet.");
    } finally {
      setIsSending(false);
    }
  };

  const folderMap: Record<string, string> = { inbox: "Inbox", spam: "Spam", sent: "Sent" };
  const filteredEmails = emails.filter((e) => e.folder === folderMap[selectedFolder]);
  const selectedEmailData = emails.find((e) => e.id === selectedEmail);
  const unreadCount = emails.filter((e) => e.folder === "Inbox" && !e.seen).length;

  if (!client) return null;

  if (error && !mailbox) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <p className="text-gray-900 font-medium">Gagal Memuat Email</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
          <Button onClick={() => fetchEmails()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 md:px-5 py-3 flex items-center justify-between gap-2 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">Email</h1>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-5">
              {unreadCount} baru
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCEO && (
            <Select value={selectedAccount} onValueChange={handleAccountChange}>
              <SelectTrigger size="sm" className="w-[140px] md:w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {CEO_EMAIL_ACCOUNTS.map((acc) => (
                  <SelectItem key={acc.value} value={acc.value}>
                    {acc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEmails()}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setComposeOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tulis Email</span>
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)] min-h-[500px]">
        {/* Left Sidebar - Email List */}
        <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col bg-white flex-shrink-0 ${mobileShowDetail ? "hidden md:flex" : "flex"}`}>
          {/* Tabs: Inbox / Spam / Terkirim */}
          <Tabs value={selectedFolder} onValueChange={setSelectedFolder}>
            <div className="px-3 pt-3 pb-2 border-b border-gray-100">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="inbox" className="gap-1 text-xs">
                  <Inbox className="w-3.5 h-3.5" />
                  Inbox
                  {unreadCount > 0 && (
                    <span className="ml-0.5 bg-blue-600 text-white text-[9px] rounded-full px-1.5 py-0 min-w-[16px] text-center leading-4">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="spam" className="gap-1 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Spam
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-1 text-xs">
                  <Send className="w-3.5 h-3.5" />
                  Terkirim
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Inbox & Spam tabs */}
            <TabsContent value="inbox" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {filteredEmails.length === 0 ? (
                  <EmptyState folder="Inbox" />
                ) : (
                  filteredEmails.map((email) => (
                    <EmailListItem
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail === email.id}
                      onClick={() => { setSelectedEmail(email.id); setMobileShowDetail(true); }}
                    />
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="spam" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {filteredEmails.length === 0 ? (
                  <EmptyState folder="Spam" />
                ) : (
                  filteredEmails.map((email) => (
                    <EmailListItem
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail === email.id}
                      onClick={() => { setSelectedEmail(email.id); setMobileShowDetail(true); }}
                    />
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sent" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {/* Local optimistic sent emails (pending/failed) */}
                {sentEmails.map((email) => (
                  <SentEmailItem key={`local-${email.id}`} email={email} />
                ))}
                {/* API sent emails from mailbox */}
                {filteredEmails.length === 0 && sentEmails.length === 0 ? (
                  <EmptyState folder="Terkirim" />
                ) : (
                  filteredEmails.map((email) => (
                    <EmailListItem
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail === email.id}
                      onClick={() => { setSelectedEmail(email.id); setMobileShowDetail(true); }}
                    />
                  ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Email Detail */}
        <div className={`flex-1 flex flex-col bg-gray-50/50 min-w-0 ${mobileShowDetail ? "flex" : "hidden md:flex"}`}>
          {selectedEmailData ? (
            <>
              {/* Subject Bar */}
              <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setMobileShowDetail(false)}
                      className="md:hidden p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base font-semibold text-gray-900 truncate">
                      {selectedEmailData.subject}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedEmailData.folder === "Spam" && (
                      <Badge variant="destructive" className="text-[10px] px-2 py-0 h-5">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Spam
                      </Badge>
                    )}
                    {!selectedEmailData.seen && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-2 py-0 h-5">
                        Belum dibaca
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Thread Area */}
              <ScrollArea className="flex-1">
                <div className="p-3 md:p-6 space-y-4">
                  {/* Email Message Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Sender Header */}
                    <div className="px-4 md:px-5 py-4 flex items-start gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0 mt-0.5">
                        <AvatarFallback className={`${selectedEmailData.color} text-xs font-bold`}>
                          {selectedEmailData.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">
                            {selectedEmailData.sender}
                          </span>
                          <span className="text-xs text-gray-400 truncate hidden sm:inline">
                            &lt;{selectedEmailData.senderEmail}&gt;
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400">kepada</span>
                          <span className="text-xs text-gray-600 font-medium">
                            {isCEO ? selectedAccount : "saya"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {new Date(selectedEmailData.rawDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[11px] text-gray-300 mt-0.5">
                          {new Date(selectedEmailData.rawDate).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-4 md:mx-5 border-t border-gray-100" />

                    {/* Email Body */}
                    <div className="px-4 md:px-5 py-4 md:py-5 min-h-[150px] md:min-h-[200px]">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedEmailData.subject}
                      </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="px-4 md:px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(selectedEmailData.rawDate)}
                        </span>
                        {selectedEmailData.seen ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                            <MailOpen className="w-3 h-3" />
                            Sudah dibaca
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
                            <Mail className="w-3 h-3" />
                            Belum dibaca
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-blue-600 h-7 px-2"
                        onClick={() => {
                          const replyEl = document.getElementById("reply-area");
                          if (replyEl) replyEl.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <Reply className="w-3.5 h-3.5 mr-1" />
                        Balas
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Reply Area */}
              <div id="reply-area">
                <ReplyArea
                  recipientEmail={selectedEmailData.senderEmail}
                  recipientName={selectedEmailData.sender}
                  subject={selectedEmailData.subject}
                  onSend={handleSendEmail}
                  isSending={isSending}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <button
                onClick={() => setMobileShowDetail(false)}
                className="md:hidden self-start m-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <MailOpen className="w-8 h-8 text-gray-300" />
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Tidak ada email dipilih</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Pilih email dari daftar untuk melihat detailnya
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        isCEO={isCEO}
        selectedAccount={selectedAccount}
        onSend={handleSendEmail}
        isSending={isSending}
      />
    </div>
  );
}

function ReplyArea({
  recipientEmail,
  recipientName,
  subject,
  onSend,
  isSending,
}: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  onSend: (data: { to: string; subject: string; body: string; fromName: string }) => void;
  isSending: boolean;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;

  const handleSend = () => {
    if (!replyBody.trim()) {
      toast.error("Tulis balasan terlebih dahulu");
      return;
    }
    onSend({
      to: recipientEmail,
      subject: replySubject,
      body: replyBody.trim(),
      fromName: "",
    });
    setReplyBody("");
    setIsExpanded(false);
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {!isExpanded ? (
        <div className="px-4 md:px-6 py-3 flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 flex items-center gap-2 text-left px-3 md:px-4 py-2.5 rounded-full border border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:bg-blue-50/30 hover:text-gray-600 transition-all"
          >
            <Reply className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Balas ke {recipientName}</span>
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2.5 rounded-full border border-gray-200 text-gray-400 hover:border-blue-300 hover:bg-blue-50/30 hover:text-gray-600 transition-all"
            title="Forward"
          >
            <Forward className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="px-4 md:px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Reply className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="text-xs text-gray-500 truncate">
                <span className="text-gray-700 font-medium">{recipientName}</span>
                <span className="mx-1 hidden sm:inline">&middot;</span>
                <span className="hidden sm:inline">{recipientEmail}</span>
              </div>
            </div>
            <button
              onClick={() => { setIsExpanded(false); setReplyBody(""); }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-400 mb-2 px-1">
            {replySubject}
          </div>

          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") handleSend();
            }}
            placeholder="Tulis balasan Anda..."
            autoFocus
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none p-3 bg-white resize-y min-h-[100px] max-h-[300px] placeholder:text-gray-300"
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-gray-300">
              Ctrl+Enter untuk kirim
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setIsExpanded(false); setReplyBody(""); }}
                className="text-xs text-gray-500 h-8"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isSending || !replyBody.trim()}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8 px-4"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Kirim
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ folder }: { folder: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        {folder === "Spam" ? (
          <ShieldAlert className="w-6 h-6 text-gray-300" />
        ) : folder === "Terkirim" ? (
          <Send className="w-6 h-6 text-gray-300" />
        ) : (
          <Inbox className="w-6 h-6 text-gray-300" />
        )}
      </div>
      <p className="text-sm font-medium text-gray-500">Kosong</p>
      <p className="text-xs text-gray-400 mt-1">
        Tidak ada email di {folder.toLowerCase()}
      </p>
    </div>
  );
}

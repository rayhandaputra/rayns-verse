import { useState, useEffect } from "react";
import { useLoaderData, type LoaderFunction } from "react-router";
import {
  ChevronDown,
  Pencil,
  Undo2,
  Redo2,
  Strikethrough,
  ListOrdered,
  Italic,
  Underline,
  Bold,
  Send,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

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

interface Message {
  id: string;
  sender: string;
  initials: string;
  color: string;
  email?: string;
  content: string;
  time?: string;
}

// Helper functions
function parseEmailFrom(from: string): { name: string; email: string } {
  // Format: "Name <email@domain.com>" or just "email@domain.com"
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

function getRandomColor(name: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-pink-100 text-pink-700",
    "bg-purple-100 text-purple-700",
    "bg-yellow-100 text-yellow-700",
    "bg-indigo-100 text-indigo-700",
    "bg-orange-100 text-orange-700",
    "bg-slate-100 text-slate-700",
  ];
  // Simple hash based on name
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

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function transformEmailData(
  apiEmails: EmailFromAPI[],
  folder: string
): Email[] {
  return apiEmails.map((email) => {
    const { name, email: senderEmail } = parseEmailFrom(email.from);
    return {
      id: String(email.id),
      sender: name,
      senderEmail,
      subject: email.subject,
      preview:
        email.subject.slice(0, 50) + (email.subject.length > 50 ? "..." : ""),
      folder: folder,
      time: formatRelativeTime(email.date),
      initials: getInitials(name),
      color: getRandomColor(name),
      seen: email.seen,
      rawDate: email.date,
    };
  });
}

// Loader
export const loader: LoaderFunction = async () => {
  try {
    const response = await fetch("https://data.kinau.id/mailbox.php");
    if (!response.ok) throw new Error("Failed to fetch mailbox");
    const data: MailboxResponse = await response.json();
    return { mailbox: data, error: null };
  } catch (error) {
    console.error("Mailbox fetch error:", error);
    return { mailbox: null, error: "Gagal memuat email" };
  }
};

// Sample conversation messages (placeholder)
const conversationMessages: Message[] = [
  {
    id: "1",
    sender: "System",
    initials: "SY",
    color: "bg-slate-100 text-slate-700",
    content: "Email content will be displayed here when you select an email.",
  },
];

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
      className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
        isSelected ? "bg-blue-50/50 border-l-2 border-l-blue-500" : ""
      } ${!email.seen ? "bg-blue-50/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className={`font-semibold text-sm text-gray-900 truncate ${!email.seen ? "font-bold" : ""}`}
            >
              {email.sender}
              {!email.seen && (
                <span className="ml-2 w-2 h-2 inline-block rounded-full bg-blue-500" />
              )}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
              {email.folder} · {email.time}
            </span>
          </div>
          <p
            className={`text-sm text-gray-700 truncate ${!email.seen ? "font-medium" : ""}`}
          >
            {email.subject}
          </p>
          <p className="text-xs text-gray-500 truncate">{email.preview}</p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (!message.sender) {
    return (
      <div className="pl-12 mb-4">
        <p className="text-sm text-gray-700 whitespace-pre-line">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarFallback className={message.color}>
          {message.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold text-sm text-gray-900">{message.sender}</p>
        <p className="text-sm text-gray-700 whitespace-pre-line">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function ComposeToolbar() {
  const tools = [
    { icon: Undo2, label: "Undo" },
    { icon: Redo2, label: "Redo" },
    { icon: Strikethrough, label: "Strikethrough" },
    { icon: ListOrdered, label: "List" },
    { icon: Italic, label: "Italic" },
    { icon: Underline, label: "Underline" },
    { icon: Bold, label: "Bold" },
  ];

  return (
    <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
      {tools.map((tool, index) => (
        <button
          key={index}
          title={tool.label}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <tool.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export default function EmailPage() {
  const { mailbox, error } = useLoaderData<{
    mailbox: MailboxResponse | null;
    error: string | null;
  }>();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("Inbox");
  const [messageInput, setMessageInput] = useState<string>("");
  const [client, setClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);

  const folders = ["Inbox", "Spam"];

  useEffect(() => {
    setClient(true);
  }, []);

  // Transform API data to Email format
  useEffect(() => {
    if (mailbox?.data) {
      const inboxEmails = transformEmailData(mailbox.data.inbox, "Inbox");
      const spamEmails = transformEmailData(mailbox.data.spam, "Spam");
      setEmails([...inboxEmails, ...spamEmails]);

      // Auto-select first email if none selected
      if (!selectedEmail && inboxEmails.length > 0) {
        setSelectedEmail(inboxEmails[0].id);
      }
    }
  }, [mailbox]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("https://data.kinau.id/mailbox.php");
      const data: MailboxResponse = await response.json();
      if (data.status && data.data) {
        const inboxEmails = transformEmailData(data.data.inbox, "Inbox");
        const spamEmails = transformEmailData(data.data.spam, "Spam");
        setEmails([...inboxEmails, ...spamEmails]);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredEmails = emails.filter((e) => e.folder === selectedFolder);
  const selectedEmailData = emails.find((e) => e.id === selectedEmail);

  if (!client) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Email</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Sidebar - Email List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          {/* Folder Selector & Compose */}
          <div className="p-3 flex items-center gap-2 border-b border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none">
                {selectedFolder}
                <span className="ml-1 text-xs text-gray-400">
                  ({filteredEmails.length})
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-white">
                {folders.map((folder) => {
                  const count = emails.filter(
                    (e) => e.folder === folder
                  ).length;
                  return (
                    <DropdownMenuItem
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={selectedFolder === folder ? "bg-blue-50" : ""}
                    >
                      {folder} ({count})
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full w-9 h-9"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          {/* Email List */}
          <ScrollArea className="flex-1">
            {filteredEmails.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>Tidak ada email di {selectedFolder}</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  isSelected={selectedEmail === email.id}
                  onClick={() => setSelectedEmail(email.id)}
                />
              ))
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Conversation View */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {selectedEmailData ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={selectedEmailData.color}>
                    {selectedEmailData.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {selectedEmailData.sender}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedEmailData.senderEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {selectedEmailData.rawDate}
                  </span>
                  {!selectedEmailData.seen && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Belum Dibaca
                    </span>
                  )}
                </div>
              </div>

              {/* Email Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedEmailData.subject}
                  </h2>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className={selectedEmailData.color}>
                        {selectedEmailData.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {selectedEmailData.sender}
                      </p>
                      <p className="text-xs text-gray-500">
                        to: admin@kinau.id
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="italic text-gray-400">
                      (Konten email lengkap akan ditampilkan di sini setelah API
                      read email diimplementasi)
                    </p>
                  </div>
                </div>
              </ScrollArea>

              {/* Compose Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span>Reply to:</span>
                    <span className="text-gray-900">
                      {selectedEmailData.senderEmail}
                    </span>
                  </div>
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-gray-700 placeholder:text-gray-400 resize-none min-h-[80px]"
                  />
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <ComposeToolbar />
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Send className="w-4 h-4" /> Send
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Pilih email untuk melihat detailnya</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ChevronDown, Pencil, Undo2, Redo2, Strikethrough, ListOrdered, Italic, Underline, Bold, Send } from "lucide-react";
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
interface Email {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  folder: string;
  time: string;
  avatar?: string;
  initials: string;
  color: string;
  isSelected?: boolean;
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

// Sample data
const emails: Email[] = [
  {
    id: "1",
    sender: "Lemon Squeezy",
    subject: "You made a sale!",
    preview: "Wooho! You made a sale!",
    folder: "Inbox",
    time: "7min ago",
    initials: "LS",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "2",
    sender: "Lemon Squeezy",
    subject: "You made a sale!",
    preview: "Wooho! You made a sale!",
    folder: "Inbox",
    time: "12min ago",
    initials: "LS",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "3",
    sender: "Guy Hawkins",
    subject: "Updates",
    preview: "Hey there, I just want to check the time of our a...",
    folder: "Inbox",
    time: "1h ago",
    initials: "GH",
    color: "bg-emerald-100 text-emerald-700",
    isSelected: true,
  },
  {
    id: "4",
    sender: "Jane Cooper",
    subject: "Appointment",
    preview: "Hey there, I just want to check the time of our a...",
    folder: "Inbox",
    time: "2d ago",
    initials: "JC",
    color: "bg-pink-100 text-pink-700",
  },
  {
    id: "5",
    sender: "Anna Taylor",
    subject: "UX Details",
    preview: "Hey there,...",
    folder: "Inbox",
    time: "Last week",
    initials: "AT",
    color: "bg-slate-100 text-slate-700",
  },
  {
    id: "6",
    sender: "Anna Taylor",
    subject: "nope, this is somethi...",
    preview: "Hey there, I just want to check the time of our a...",
    folder: "Inbox",
    time: "24 June",
    initials: "AT",
    color: "bg-slate-100 text-slate-700",
  },
  {
    id: "7",
    sender: "Kristin Watson",
    subject: "UI Discussion",
    preview: "Yes, Mike made a some progress here last week",
    folder: "Inbox",
    time: "21 June",
    initials: "KW",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "8",
    sender: "Kathryn Murphy",
    subject: "Weekly UX review",
    preview: "Thanks, appreciate this!",
    folder: "Inbox",
    time: "20 June",
    initials: "KM",
    color: "bg-purple-100 text-purple-700",
  },
];

const conversationMessages: Message[] = [
  {
    id: "1",
    sender: "Anna Taylor",
    initials: "AT",
    color: "bg-slate-100 text-slate-700",
    content: "I will update this tomorrow.",
  },
  {
    id: "2",
    sender: "Guy Hawkins",
    initials: "GH",
    color: "bg-emerald-100 text-emerald-700",
    content: "Thanks, maybe you can help me here:",
  },
  {
    id: "3",
    sender: "Anna Taylor",
    initials: "AT",
    color: "bg-slate-100 text-slate-700",
    content: "Thanks!",
  },
  {
    id: "4",
    sender: "",
    initials: "",
    color: "",
    content: "Me too! Hopefully, it'll make the app even easier to use.\n\nSee you soon!\n- Anna",
  },
  {
    id: "5",
    sender: "Guy Hawkins",
    initials: "GH",
    color: "bg-emerald-100 text-emerald-700",
    content: "No problem",
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
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-semibold text-sm text-gray-900 truncate">
              {email.sender}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
              {email.folder} · {email.time}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">{email.subject}</p>
          <p className="text-xs text-gray-500 truncate">{email.preview}</p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (!message.sender) {
    // Continuation of previous message
    return (
      <div className="pl-12 mb-4">
        <p className="text-sm text-gray-700 whitespace-pre-line">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarFallback className={message.color}>{message.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold text-sm text-gray-900">{message.sender}</p>
        <p className="text-sm text-gray-700 whitespace-pre-line">{message.content}</p>
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
  const [selectedEmail, setSelectedEmail] = useState<string>("3");
  const [selectedFolder, setSelectedFolder] = useState<string>("Inbox");
  const [messageInput, setMessageInput] = useState<string>("");
  const [client, setClient] = useState(false);

  const folders = ["Inbox", "Sent", "Drafts", "Spam", "Trash"];
  const selectedEmailData = emails.find((e) => e.id === selectedEmail);

  useEffect(() => {
    setClient(true);
  }, []);

  if (!client) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Email</h1>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Sidebar - Email List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          {/* Folder Selector & Compose */}
          <div className="p-3 flex items-center gap-2 border-b border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none">
                {selectedFolder}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-white">
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={selectedFolder === folder ? "bg-blue-50" : ""}
                  >
                    {folder}
                  </DropdownMenuItem>
                ))}
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
            {emails.map((email) => (
              <EmailListItem
                key={email.id}
                email={email}
                isSelected={selectedEmail === email.id}
                onClick={() => setSelectedEmail(email.id)}
              />
            ))}
          </ScrollArea>
        </div>

        {/* Right Panel - Conversation View */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {selectedEmailData && (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={selectedEmailData.color}>
                    {selectedEmailData.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedEmailData.sender}</p>
                  <p className="text-xs text-gray-500">guyhawkins@email.com</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    Updates
                  </span>
                  <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {conversationMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </ScrollArea>

              {/* Compose Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span>To:</span>
                    <span className="text-gray-900">guyhawkins@email.com</span>
                  </div>
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type Message..."
                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-gray-700 placeholder:text-gray-400 resize-none min-h-[80px]"
                  />
                  <ComposeToolbar />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { EmailMessage } from '../types';
import { Mail, Star, Trash2, Send, Search, RefreshCw, Paperclip } from 'lucide-react';
import { formatFullDate } from '../constants';

interface EmailPageProps {
  emails: EmailMessage[];
  onUpdateEmails: (emails: EmailMessage[]) => void;
}

const EmailPage: React.FC<EmailPageProps> = ({ emails, onUpdateEmails }) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<'Inbox' | 'Sent' | 'Spam'>('Inbox');

  const filteredEmails = emails.filter(e => e.tag === activeFolder);
  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleRead = (email: EmailMessage) => {
    setSelectedEmailId(email.id);
    if (!email.read) {
        onUpdateEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  };

  const handleDelete = (id: string) => {
      onUpdateEmails(emails.filter(e => e.id !== id));
      if (selectedEmailId === id) setSelectedEmailId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[calc(100vh-140px)] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-4">
                <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm">
                    <Send size={16} /> Tulis Pesan
                </button>
            </div>
            <nav className="flex-1 space-y-1 px-2">
                {['Inbox', 'Sent', 'Spam'].map(folder => (
                    <button 
                        key={folder}
                        onClick={() => { setActiveFolder(folder as any); setSelectedEmailId(null); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${activeFolder === folder ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <span>{folder}</span>
                        {folder === 'Inbox' && (
                            <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">
                                {emails.filter(e => e.tag === 'Inbox' && !e.read).length}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>

        {/* Email List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full bg-gray-100 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-blue-500" placeholder="Cari..." />
                </div>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredEmails.map(email => (
                    <div 
                        key={email.id}
                        onClick={() => handleRead(email)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition ${selectedEmailId === email.id ? 'bg-blue-50' : ''} ${!email.read ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm truncate w-40 ${!email.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{email.sender}</span>
                            <span className="text-[10px] text-gray-400">{new Date(email.date).toLocaleDateString()}</span>
                        </div>
                        <h4 className={`text-xs mb-1 truncate ${!email.read ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{email.subject}</h4>
                        <p className="text-xs text-gray-400 truncate">{email.preview}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 flex flex-col bg-white">
            {selectedEmail ? (
                <>
                    <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedEmail.subject}</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                    {selectedEmail.sender[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{selectedEmail.sender}</div>
                                    <div className="text-xs text-gray-500">to admin@kinau.id</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 mr-2">{formatFullDate(selectedEmail.date)}</span>
                            <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 rounded-lg"><Star size={18} /></button>
                            <button onClick={() => handleDelete(selectedEmail.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                    </div>
                    <div className="flex-1 p-8 text-gray-700 text-sm leading-relaxed overflow-y-auto">
                        <p className="mb-4">Halo Admin,</p>
                        <p>{selectedEmail.preview}</p>
                        <p className="mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
                        
                        <div className="mt-8 pt-6 border-t border-gray-100">
                             <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 inline-flex items-center gap-3 cursor-pointer hover:bg-gray-100">
                                 <div className="p-2 bg-red-100 text-red-600 rounded">
                                     <Paperclip size={16} />
                                 </div>
                                 <div className="text-xs">
                                     <div className="font-bold text-gray-700">lampiran.pdf</div>
                                     <div className="text-gray-400">2.4 MB</div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <Mail size={64} className="mb-4 opacity-20" />
                    <p>Pilih pesan untuk membaca</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default EmailPage;

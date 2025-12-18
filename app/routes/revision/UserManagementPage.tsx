
import React, { useState, useRef } from 'react';
import { User, AppSettings } from '../types';
import { Plus, Edit2, Trash2, X, Check, Shield, Image, Upload } from 'lucide-react';
import { loadSettings, saveSettings } from '../services/storage';

interface UserManagementPageProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, onUpdateUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
      role: 'CEO'
  });

  const handleEdit = (user: User) => {
      setEditingId(user.id);
      setFormData({ ...user });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if (confirm('Hapus user ini?')) {
          onUpdateUsers(users.filter(u => u.id !== id));
      }
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ role: 'CEO', username: '', password: '', name: '' });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.username || !formData.password || !formData.name) return;

      if (editingId) {
          onUpdateUsers(users.map(u => u.id === editingId ? { ...u, ...formData } as User : u));
      } else {
          const newUser: User = {
              id: 'usr-' + Date.now(),
              name: formData.name!,
              username: formData.username!,
              password: formData.password!,
              role: formData.role as any
          };
          onUpdateUsers([...users, newUser]);
      }
      setIsModalOpen(false);
  };

  const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const res = reader.result as string;
              const newSettings = { ...settings, headerBackground: res };
              setSettings(newSettings);
              saveSettings(newSettings);
              alert('Background Header diperbarui!');
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveHeaderImage = () => {
      const newSettings = { ...settings, headerBackground: undefined };
      setSettings(newSettings);
      saveSettings(newSettings);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-lg font-bold text-gray-800">Manajemen User</h2>
                <p className="text-gray-500 text-sm">Atur akses login untuk admin.</p>
            </div>
            <button onClick={handleAddNew} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
                <Plus size={16} /> Tambah User
            </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                        <th className="px-6 py-3">Nama Lengkap</th>
                        <th className="px-6 py-3">Username</th>
                        <th className="px-6 py-3">Password</th>
                        <th className="px-6 py-3">Role / Posisi</th>
                        <th className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{user.name}</td>
                            <td className="px-6 py-3 text-gray-600">{user.username}</td>
                            <td className="px-6 py-3 font-mono text-gray-400">••••••</td>
                            <td className="px-6 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                                    user.role === 'CEO' ? 'bg-purple-100 text-purple-700' :
                                    user.role === 'Developer' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    <Shield size={10} /> {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-3 flex justify-center gap-2">
                                <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16}/></button>
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* --- SETTINGS SECTION --- */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Pengaturan Tampilan</h2>
            <p className="text-gray-500 text-sm mb-4">Background untuk Judul Landing Page & Nota.</p>
            
            <div className="flex items-center gap-4">
                <div className="w-48 h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden relative">
                    {settings.headerBackground ? (
                        <img src={settings.headerBackground} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        <Upload size={16} /> Upload Background
                    </button>
                    {settings.headerBackground && (
                        <button 
                            onClick={handleRemoveHeaderImage}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg"
                        >
                            <Trash2 size={16} /> Hapus
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleHeaderImageUpload} />
                </div>
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">{editingId ? 'Edit User' : 'Tambah User Baru'}</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                            <input className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                                <input className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                                <input className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Posisi / Role</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as any})}
                            >
                                <option value="CEO">CEO (Full Access)</option>
                                <option value="Developer">Developer (Full Access)</option>
                            </select>
                        </div>
                        
                        <div className="pt-2 flex gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">Batal</button>
                            <button type="submit" className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManagementPage;

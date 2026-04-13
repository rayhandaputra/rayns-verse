import React, { useState, useRef, useEffect } from 'react';
import { type ActionFunction } from 'react-router';
import { useFetcher } from 'react-router';
import { Palette, Upload, Check, Trash2 } from 'lucide-react';
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { uploadFile } from '~/lib/utils';

// --- TYPES ---
export interface ShirtColor {
    id: string;
    name: string;
    image_url: string;
    created_on: string;
}

// --- ACTION REMIX ---
export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        if (intent === "create") {
            const name = formData.get("name") as string;
            const image_url = formData.get("image_url") as string;

            const res = await API.SHIRT_COLOR.create({
                session: { user, token },
                req: { body: { name, image_url } },
            });

            return Response.json({ success: res.success, message: res.message || "Warna berhasil ditambahkan" });
        }

        if (intent === "delete") {
            const id = formData.get("id") as string;
            const res = await API.SHIRT_COLOR.update({
                session: { user, token },
                req: { body: { id, deleted: 1 } },
            });
            return Response.json({ success: res.success, message: "Warna berhasil dihapus" });
        }
    } catch (error: any) {
        return Response.json({ success: false, message: error.message || "Terjadi kesalahan server" });
    }
    return Response.json({ success: false, message: "Invalid Intent" });
};

// --- COMPONENT ---
export default function KaosColorsPage() {
    const fetcher = useFetcher();
    const colorFileInputRef = useRef<HTMLInputElement>(null);

    // State Lokal UI
    const [newColorName, setNewColorName] = useState('');
    const [newColorImage, setNewColorImage] = useState('');

    // Data Fetching via Nexus
    const { data: colorData, reload } = useFetcherData({
        endpoint: nexus().module("SHIRT_COLOR").action("get").params({ size: 100 }).build(),
    });

    const colors: ShirtColor[] = colorData?.data?.items || [];

    // Efek setelah Action (Create/Delete) sukses
    useEffect(() => {
        if (fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            setNewColorName('');
            setNewColorImage('');
            reload();
        } else if (fetcher.data && !(fetcher.data as any).success) {
            toast.error((fetcher.data as any).message || "Gagal memproses data");
        }
    }, [fetcher.data]);

    // Handlers
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadFile(e.target.files[0]);
            // const reader = new FileReader();
            // reader.onload = () => setNewColorImage(reader.result as string);
            // reader.readAsDataURL(e.target.files[0]);
            setNewColorImage(url)
            setNewColorName(e.target.files[0]?.name.replace(/\.[^/.]+$/, "") || "")
        }
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: "Hapus Warna?",
            text: `Yakin ingin menghapus warna ${name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Hapus",
            cancelButtonText: "Batal",
            customClass: {
                confirmButton: "bg-red-600 text-white px-4 py-2 rounded-lg",
                cancelButton: "bg-gray-200 text-gray-800 px-4 py-2 rounded-lg ml-2"
            }
        }).then((res) => {
            if (res.isConfirmed) {
                fetcher.submit({ intent: "delete", id }, { method: "post" });
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColorName || !newColorImage) return toast.error("Nama dan Gambar wajib diisi");

        fetcher.submit(
            {
                intent: "create",
                name: newColorName,
                image_url: newColorImage, // Mengirim Base64 sesuai kebutuhan field image_url
            },
            { method: "post" }
        );
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Form Upload */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 bg-violet-50/20">
                    <h3 className="font-black text-gray-800 flex items-center gap-3">
                        <Palette size={22} className="text-violet-600" /> MANAJEMEN WARNA KAIN
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-2">
                        Upload contoh warna kain (PNG) agar muncul di pilihan warna customer.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nama Warna</label>
                            <input
                                name="name"
                                className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-black focus:border-violet-400 outline-none"
                                placeholder="Contoh: Maroon, Navy"
                                value={newColorName}
                                onChange={e => setNewColorName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Gambar PNG (134x105)</label>
                                <input
                                    type="file"
                                    ref={colorFileInputRef}
                                    className="hidden"
                                    accept="image/png"
                                    onChange={handleImageUpload}
                                />

                                <button
                                    type="button"
                                    onClick={() => colorFileInputRef.current?.click()}
                                    className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition font-black text-sm ${newColorImage ? 'border-violet-400 bg-violet-50 text-violet-600' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-violet-200'}`}
                                >
                                    {newColorImage ? <Check size={20} /> : <Upload size={20} />}
                                    {newColorImage ? 'GAMBAR DIPILIH' : 'PILIH GAMBAR'}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!newColorName || !newColorImage || fetcher.state !== 'idle'}
                                className="bg-violet-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-violet-700 disabled:opacity-50 transition shadow-lg"
                            >
                                {fetcher.state !== 'idle' ? 'PROSES...' : 'TAMBAH WARNA'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Grid List */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden p-10">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-gray-800 text-lg uppercase flex items-center gap-3">
                        <Palette size={24} className="text-violet-600" /> Katalog Warna Tersedia
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {colors.map(color => (
                        <div key={color.id} className="group relative bg-gray-50 p-3 rounded-[32px] border-2 border-transparent hover:border-violet-200 transition-all flex flex-col items-center gap-3 shadow-sm">
                            {/* <div className="w-24 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white">
                                <img src={color.image_url} className="w-full h-full object-cover" alt={color.name} />
                            </div> */}
                            <div className="w-24 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white relative">
                                {/* Overlay Transparan */}
                                <div className="absolute inset-0 z-10 w-full h-full" onContextMenu={(e) => e.preventDefault()}></div>

                                <img
                                    src={color.image_url}
                                    className="w-full h-full object-cover"
                                    alt={color.name}
                                    draggable="false"
                                />
                            </div>
                            <div className="text-[10px] font-black text-gray-700 text-center uppercase tracking-tight truncate w-full px-1">
                                {color.name}
                            </div>
                            <button
                                onClick={() => handleDelete(color.id, color.name)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}

                    {colors.length === 0 && (
                        <div className="col-span-full py-20 text-center text-xs font-bold text-gray-300 uppercase tracking-[0.2em] border-2 border-dashed border-gray-100 rounded-[32px]">
                            Belum ada katalog warna
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
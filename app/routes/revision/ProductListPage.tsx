
import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductTier, ProductVariation } from '../types';
import { formatCurrency, parseCurrency } from '../constants';
import { Plus, Edit2, Trash2, Save, X, Tag, Upload, Eye, EyeOff, Minus, Copy, Camera, Check, Layers } from 'lucide-react';

interface ProductListPageProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const ProductListPage: React.FC<ProductListPageProps> = ({ products, onUpdateProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [show, setShow] = useState(true);
  const [tiers, setTiers] = useState<ProductTier[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers for Formatting ---
  const formatInputNumber = (val: number) => {
      if (!val && val !== 0) return '';
      if (val === 0) return ''; // Explicitly return empty string for 0 to keep input clean
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseInputNumber = (val: string) => {
      return Number(val.replace(/\./g, '')) || 0;
  };

  // --- Actions ---

  const handleOpenAdd = () => {
      setEditingId(null);
      setName('');
      setDesc('');
      setImage('');
      setShow(true);
      setTiers([]); // Start empty
      setVariations([]);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
      setEditingId(p.id);
      setName(p.name);
      setDesc(p.description || '');
      setImage(p.image || '');
      setShow(p.showInDashboard ?? true);
      setTiers(p.wholesalePrices ? [...p.wholesalePrices] : []);
      setVariations(p.variations ? [...p.variations] : []);
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        alert('Nama produk wajib diisi');
        return;
    }

    // Ensure base price is set from first tier or 0 for internal consistency
    const basePrice = tiers.length > 0 ? tiers[0].price : 0;

    const productData: Product = {
      id: editingId || String(Date.now()),
      name,
      price: basePrice,
      category: 'Paket', // Default internal category
      description: desc,
      image,
      showInDashboard: show,
      wholesalePrices: tiers,
      variations: variations
    };

    if (editingId) {
        const updated = products.map(p => p.id === editingId ? productData : p);
        onUpdateProducts(updated);
        alert('Produk berhasil diperbarui!');
    } else {
        const updated = [...products, productData];
        onUpdateProducts(updated);
        alert('Produk berhasil ditambahkan!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent accidental form submissions if nested
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
      alert('Produk berhasil dihapus.');
    }
  };

  const handleDuplicate = (e: React.MouseEvent, product: Product) => {
      e.preventDefault();
      e.stopPropagation();
      const newProduct: Product = {
          ...product,
          id: String(Date.now()),
          name: product.name + ' (Copy)'
      };
      onUpdateProducts([...products, newProduct]);
      alert('Produk diduplikasi!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const res = reader.result as string;
              setImage(res);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Tier Logic ---
  const addTier = () => setTiers([...tiers, { minQty: 0, price: 0 }]); 
  
  const updateTier = (index: number, field: 'minQty'|'price', valStr: string) => {
      const val = parseInputNumber(valStr);
      const copy = [...tiers];
      copy[index] = { ...copy[index], [field]: val };
      setTiers(copy);
  };
  
  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));

  // --- Variation Logic ---
  const addVariation = () => setVariations([...variations, { name: '', price: 0 }]);

  const updateVariation = (index: number, field: 'name'|'price', val: string) => {
      const copy = [...variations];
      if (field === 'price') {
           copy[index] = { ...copy[index], price: parseInputNumber(val) };
      } else {
           copy[index] = { ...copy[index], name: val };
      }
      setVariations(copy);
  };

  const removeVariation = (index: number) => setVariations(variations.filter((_, i) => i !== index));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-bold text-gray-800">Daftar Produk</h2>
           <p className="text-gray-500 text-sm">Atur jenis barang, variasi, dan aturan harga.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3 w-1/3">Produk</th>
              <th className="px-6 py-3 w-1/3">Detail Harga & Variasi</th>
              <th className="px-6 py-3 text-center">Tampil</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 align-top">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
                            {product.image ? (
                                <img src={product.image} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Tag size={20}/></div>
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-base">{product.name}</div>
                            {product.description && <div className="text-xs text-gray-500 mt-1 max-w-xs">{product.description}</div>}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-3 align-top">
                    <div className="flex flex-col gap-2">
                        {/* Tiers */}
                        {product.wholesalePrices && product.wholesalePrices.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Grosir</span>
                                {product.wholesalePrices.map((t, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs bg-gray-100 px-2 py-1 rounded w-48">
                                        <span className="text-gray-600">≥ {t.minQty} pcs</span>
                                        <span className="font-bold text-gray-800">{formatCurrency(t.price)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <span className="text-xs text-gray-400 italic">Tidak ada aturan grosir</span>}

                        {/* Variations */}
                        {product.variations && product.variations.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-[10px] font-bold text-blue-400 uppercase">Variasi</span>
                                {product.variations.map((v, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs bg-blue-50 px-2 py-1 rounded w-48 border border-blue-100">
                                        <span className="text-blue-700">{v.name}</span>
                                        <span className="font-bold text-blue-800">+{formatCurrency(v.price)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-3 text-center align-top pt-4">
                    {(product.showInDashboard ?? true) ? <Eye size={18} className="text-blue-500 mx-auto"/> : <EyeOff size={18} className="text-gray-300 mx-auto"/>}
                </td>
                <td className="px-6 py-3 align-top pt-4">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenEdit(product)} className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition" title="Edit">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => handleDuplicate(e, product)} className="text-orange-600 hover:text-orange-800 p-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition" title="Duplikat">
                            <Copy size={16} />
                        </button>
                        <button onClick={(e) => handleDelete(e, product.id)} className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition" title="Hapus">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">Belum ada produk. Silakan tambah produk baru.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM (ADD / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 rounded-full p-1 hover:bg-red-50 transition"><X /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk</label>
                                <input 
                                    className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Contoh: Paket Premium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Gambar Produk</label>
                                <div className="flex gap-2 items-center">
                                    {image ? (
                                        <div className="relative w-10 h-10 group">
                                            <img src={image} className="w-full h-full object-cover rounded border" />
                                            <button type="button" onClick={() => setImage('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 border border-gray-300 bg-white rounded text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-1">
                                            <Upload size={14}/> Upload
                                        </button>
                                    )}
                                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi</label>
                            <textarea 
                                className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={2}
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Keterangan singkat produk..."
                            />
                        </div>

                        {/* Pricing Tiers Section */}
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <div className="flex justify-between items-center mb-3">
                                 <label className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1">
                                    <Tag size={14}/> Aturan Harga Grosir
                                 </label>
                                 <button type="button" onClick={addTier} className="text-xs flex items-center gap-1 text-white bg-gray-600 px-2 py-1 rounded hover:bg-gray-700 font-medium">
                                     <Plus size={14}/> Tambah Aturan
                                 </button>
                             </div>
                             
                             <div className="space-y-2">
                                 {tiers.map((tier, idx) => (
                                     <div key={idx} className="flex items-center gap-2">
                                         <div className="relative w-24">
                                             <input 
                                                type="text" 
                                                className="w-full border-gray-300 rounded p-2 text-sm text-center"
                                                placeholder="Min Qty" 
                                                value={formatInputNumber(tier.minQty)}
                                                onChange={e => updateTier(idx, 'minQty', e.target.value)}
                                             />
                                         </div>
                                         <span className="text-gray-400 text-xs font-medium">pcs @</span>
                                         <div className="relative flex-1">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                                            <input 
                                                type="text" 
                                                className="w-full border-gray-300 rounded p-2 pl-7 text-sm font-bold text-gray-800"
                                                placeholder="Harga Satuan"
                                                value={formatInputNumber(tier.price)}
                                                onChange={e => updateTier(idx, 'price', e.target.value)}
                                            />
                                         </div>
                                         <button type="button" onClick={() => removeTier(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded bg-white border border-gray-200"><Trash2 size={16}/></button>
                                     </div>
                                 ))}
                                 {tiers.length === 0 && (
                                     <div className="text-center py-4 bg-white/50 rounded-lg border border-dashed border-gray-300">
                                         <p className="text-xs text-gray-400">Belum ada aturan harga.</p>
                                         <p className="text-[10px] text-gray-400">Klik "Tambah Aturan" untuk memasukkan harga.</p>
                                     </div>
                                 )}
                             </div>
                         </div>

                        {/* Variations Section */}
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                             <div className="flex justify-between items-center mb-3">
                                 <label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1">
                                    <Layers size={14}/> Variasi Produk
                                 </label>
                                 <button type="button" onClick={addVariation} className="text-xs flex items-center gap-1 text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 font-medium">
                                     <Plus size={14}/> Tambah Variasi
                                 </button>
                             </div>
                             
                             <div className="space-y-2">
                                 {variations.map((v, idx) => (
                                     <div key={idx} className="flex items-center gap-2">
                                         <div className="relative flex-1">
                                             <input 
                                                type="text" 
                                                className="w-full border-blue-200 rounded p-2 text-sm"
                                                placeholder="Nama Variasi (misal: Bahan Premium)" 
                                                value={v.name}
                                                onChange={e => updateVariation(idx, 'name', e.target.value)}
                                             />
                                         </div>
                                         <span className="text-blue-400 text-xs font-medium whitespace-nowrap">+ Harga</span>
                                         <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                                            <input 
                                                type="text" 
                                                className="w-full border-blue-200 rounded p-2 pl-7 text-sm font-bold text-gray-800"
                                                placeholder="0"
                                                value={formatInputNumber(v.price)}
                                                onChange={e => updateVariation(idx, 'price', e.target.value)}
                                            />
                                         </div>
                                         <button type="button" onClick={() => removeVariation(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded bg-white border border-blue-200"><Trash2 size={16}/></button>
                                     </div>
                                 ))}
                                 {variations.length === 0 && (
                                     <div className="text-center py-4 bg-white/50 rounded-lg border border-dashed border-blue-200">
                                         <p className="text-xs text-blue-400">Produk ini tidak memiliki variasi.</p>
                                     </div>
                                 )}
                             </div>
                         </div>

                        <div className="flex items-center gap-2 pt-2">
                             <input 
                                id="showCheck"
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                checked={show}
                                onChange={e => setShow(e.target.checked)}
                             />
                             <label htmlFor="showCheck" className="text-sm text-gray-700 select-none">
                                 Tampilkan produk ini di Halaman Utama / Katalog
                             </label>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Batal</button>
                    <button type="submit" form="productForm" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg flex items-center gap-2">
                        <Save size={16} /> Simpan Produk
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;

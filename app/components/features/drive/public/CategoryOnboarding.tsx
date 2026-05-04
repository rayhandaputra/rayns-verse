import React from "react";
import { IdCard, LayoutGrid, Shirt, ChevronRight } from "lucide-react";

interface CategoryOnboardingProps {
  animationPlayed: boolean;
  onSelect: (cat: 'idcard_lanyard' | 'shirt') => void;
}

export const CategoryOnboarding = ({ animationPlayed, onSelect }: CategoryOnboardingProps) => {
  return (
    <div id="category-onboarding-container" className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[120px] opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px] opacity-40 animate-pulse delay-1000" />

      <div className={`max-w-4xl w-full text-center transition-all duration-1000 ${animationPlayed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight font-sans">
            Halo! Pesanan Anda Memiliki <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">2 Kategori Produk</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-sans">
            Untuk memudahkan pengelolaan file dan desain, silakan pilih kategori yang ingin Anda akses terlebih dahulu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card 1: ID Card / Lanyard */}
          <button
            id="btn-select-idcard"
            onClick={() => onSelect('idcard_lanyard')}
            className="group relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 font-sans"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <IdCard size={120} className="text-purple-600 rotate-12" />
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
              <LayoutGrid size={28} className="text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ID Card & Lanyard</h3>
            <p className="text-gray-500 text-sm mb-6">Kelola file cetak peserta, desain twibbon ID Card, dan layout lanyard event.</p>
            <div className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:gap-3 transition-all">
              Buka Kategori <ChevronRight size={16} />
            </div>
          </button>

          {/* Card 2: Kaos / Kemeja */}
          <button
            id="btn-select-shirt"
            onClick={() => onSelect('shirt')}
            className="group relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:border-teal-300 hover:-translate-y-1 transition-all duration-300 font-sans"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shirt size={120} className="text-teal-600 -rotate-12" />
            </div>
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors duration-300">
              <Shirt size={28} className="text-teal-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Kaos & Kemeja</h3>
            <p className="text-gray-500 text-sm mb-6">Upload desain sablon, detail ukuran, dan spesifikasi produksi baju.</p>
            <div className="inline-flex items-center gap-2 text-teal-600 font-bold text-sm group-hover:gap-3 transition-all">
              Buka Kategori <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>

      {/* Animation Trigger Hack */}
      {!animationPlayed && (
        <div id="category-onboarding-loader" className="absolute inset-0 flex items-center justify-center bg-white z-[60] animate-fadeOut pointer-events-none font-sans">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Memuat Kategori...</p>
          </div>
        </div>
      )}
    </div>
  );
};

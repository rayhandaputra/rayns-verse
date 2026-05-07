"use client";

import { Phone, Globe, MapPin, Instagram } from "lucide-react";
import { useNavigate } from "react-router";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer id="kontak" className="pt-24 pb-0 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 relative z-10 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-left">
          {/* Column 1: Company Info */}
          <div className="space-y-6">
            <img src="/kinau-logo.png" className="h-12 w-auto" alt="Kinau" />
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#1E434C]">PT Kinau Digital Kreatif</h3>
              <div className="space-y-1 text-sm text-gray-500">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NIB</p>
                <p className="font-mono text-xs">0204260115049</p>
              </div>
              <div className="space-y-1 mt-4 text-sm text-gray-500">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NPWP</p>
                <p className="font-mono text-xs">05.091.550.3-232.3000</p>
              </div>
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h3 className="text-[#1E434C] font-bold mb-6 uppercase tracking-wider text-sm">Kontak Kami</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-[#0097B2] mt-1" />
                <a href="tel:+6285219337474" className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">+62 852-1933-7474</a>
              </li>
              <li className="flex items-start gap-3">
                <Globe size={18} className="text-[#0097B2] mt-1" />
                <a href="mailto:admin@kinau.id" className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">admin@kinau.id</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#0097B2] mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-500 leading-relaxed">
                  Jalan Terusan Jl. Murai 1 No.7, Kel. Korpri Raya, Kec. Sukarame, Kota Bandar Lampung, Lampung.
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Menu */}
          <div>
            <h3 className="text-[#1E434C] font-bold mb-6 uppercase tracking-wider text-sm">Menu Cepat</h3>
            <ul className="space-y-3">
              <li><a href="#produk" className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">Produksi</a></li>
              <li><a href="#produk" className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">Daftar Harga</a></li>
              <li><a href="#kontak" className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">Kontak</a></li>
              <li><button onClick={() => navigate("/login")} className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">Login Admin</button></li>
            </ul>
          </div>

          {/* Column 4: Social Media */}
          <div>
            <h3 className="text-[#1E434C] font-bold mb-6 uppercase tracking-wider text-sm">Sosial Media</h3>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-[#0097B2] group-hover:text-white transition-all text-[#0097B2]">
                <Instagram size={20} />
              </div>
              <a href="https://instagram.com/kinau.id" target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-[#0097B2] transition-colors">@kinau.id</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent Image */}
      <div className="relative w-full overflow-hidden leading-[0]">
        <img src="/Home-Bawah.png" className="w-full h-auto object-cover" alt="" />
        
        {/* Copyright Bar */}
        <div className="absolute bottom-0 left-0 right-0 py-6 text-center">
          <p className="text-[10px] md:text-sm text-white/60 uppercase tracking-[0.2em] font-medium drop-shadow-sm">
            © {new Date().getFullYear()} PT KINAU DIGITAL KREATIF. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

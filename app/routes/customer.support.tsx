import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { 
  Sparkles, 
  MessageCircle, 
  MapPin, 
  HelpCircle, 
  Award, 
  Play, 
  ChevronRight, 
  Compass, 
  PhoneCall
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ADMIN_WA, getWhatsAppLink } from "~/utils/utils";
import Swal from "sweetalert2";

export default function CustomerSupport() {
  const { user } = useOutletContext<{ user: any; isDemo: boolean }>();
  const navigate = useNavigate();

  const [points, setPoints] = useState(150); // mock loyalty points

  const handleRedeemReward = (rewardName: string, requiredPoints: number) => {
    if (points < requiredPoints) {
      Swal.fire({
        title: "Poin Tidak Cukup 😔",
        text: `Kamu butuh ${requiredPoints} poin untuk menukarkan ${rewardName}. Kumpulkan terus poin belanja cetakmu!`,
        icon: "warning",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-[var(--customer-primary)] text-white font-black px-6 py-2 rounded-xl text-xs uppercase tracking-widest"
        }
      });
    } else {
      Swal.fire({
        title: "Tukarkan Reward! 🎉",
        text: `Yakin ingin menukarkan ${requiredPoints} poin Anda dengan ${rewardName}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Tukar!",
        cancelButtonText: "Batal",
        reverseButtons: true,
        customClass: {
          confirmButton: "bg-[var(--customer-accent)] text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest",
          cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest mr-2",
          popup: "rounded-[2rem] shadow-xl border border-slate-100 font-sans"
        },
        buttonsStyling: false
      }).then((result) => {
        if (result.isConfirmed) {
          setPoints(points - requiredPoints);
          Swal.fire({
            title: "Penukaran Berhasil",
            text: `Klaim reward ${rewardName} mu berhasil. Hubungi admin via chat WhatsApp dengan melampirkan kode claim: KCLAIM-${Math.floor(Math.random() * 8000) + 1000}.`,
            icon: "success",
            confirmButtonText: "Ambil Reward via WA",
            customClass: {
              confirmButton: "bg-[var(--customer-primary)] text-white font-black px-6 py-2 rounded-xl text-xs uppercase tracking-widest"
            }
          }).then(() => {
            window.open(getWhatsAppLink(ADMIN_WA, `Halo Admin, saya ingin klaim Reward: ${rewardName} dengan poin KINAU.`), "_blank");
          });
        }
      });
    }
  };

  const handleTutorialVideo = () => {
    Swal.fire({
      title: "Video Panduan Cetak 🎬",
      html: `
        <div style="padding: 10px 0;">
          <p style="font-size: 11px; margin-bottom: 15px; text-align: left; line-height: 1.4;">Tonton bagaimana mudahnya mengonfigurasi ID Card civitas, memasukkan foto peserta KKN, dan melakukan klaim pelunasan otomatis.</p>
          <div style="background: #1e293b; border-radius: 12px; padding: 40px; text-align: center; color: white; cursor: pointer; border: 2px solid #0097b2;">
            <span style="font-size: 24px;">▶️</span>
            <div style="font-size: 10px; font-weight: bold; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Putar Video Panduan KINAU</div>
          </div>
        </div>
      `,
      confirmButtonText: "Tutup",
      customClass: {
        confirmButton: "bg-[var(--customer-primary)] text-white font-black px-6 py-2 rounded-xl text-xs uppercase tracking-widest"
      }
    });
  };

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto pb-10 space-y-4 scrollbar-thin">
      
      {/* Loyalty points card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-5 text-white shadow-md relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-2">Kinau Premium Loyalty</span>
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-3xl font-black tracking-tight leading-none mb-1">{points}</h3>
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--customer-accent)]">Poin Akumulasi Belanja</span>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
            <Award className="text-amber-300" size={20} />
          </div>
        </div>
        
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4 mb-2">
          <div style={{ width: `${Math.min((points / 300) * 100, 100)}%` }} className="h-full bg-amber-400"></div>
        </div>
        <p className="text-[8px] font-bold text-blue-100/60 leading-normal">
          Tukarkan poin belanja cetak dengan souvenir eksklusif gantungan kunci hingga kaos spesial edisi KINAU.
        </p>
      </div>

      {/* Rewards Redeem block */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex-shrink-0 space-y-2.5">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block px-0.5">Penukaran Merchandise Kinau</span>
        
        <div className="space-y-2">
          {([
            { name: "Sertifikat Aliansi Premium", points: 80, badge: "📜" },
            { name: "Gantungan Kunci Kulit Kinau", points: 120, badge: "🔑" },
            { name: "Kaos Polo Kinau Exclusive", points: 250, badge: "👕" }
          ] as const).map((r, index) => (
            <div key={index} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-base">{r.badge}</span>
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{r.name}</h4>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">{r.points} Poin Belanja</span>
                </div>
              </div>
              <button
                onClick={() => handleRedeemReward(r.name, r.points)}
                className={`py-1.5 px-3 rounded-lg font-black text-[8px] uppercase tracking-wider transition-all cursor-pointer ${
                  points >= r.points 
                    ? "bg-[var(--customer-accent)] hover:bg-[var(--customer-accent)]/90 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-300 pointer-events-none"
                }`}
              >
                Tukar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick fast actions CS trigger */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-2.5 flex-shrink-0">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block px-0.5">Area Bantuan & Aliansi</span>

        <div className="space-y-2">
          {/* Chat WhatsApp CS */}
          <button
            onClick={() => window.open(getWhatsAppLink(ADMIN_WA, "Halo CS Kinau.id, saya perlu bantuan pengerjaan ID Card..."), "_blank")}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border hover:border-emerald-300 hover:bg-emerald-50/20 text-left transition-all group cursor-pointer flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle size={15} />
              </div>
              <div>
                <h5 className="text-[10px] font-black text-[var(--customer-primary)] uppercase tracking-tight">Hubungi Admin CS</h5>
                <p className="text-[8px] text-slate-400 font-bold uppercase">WhatsApp Fast Response 24/7</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* YouTube Tutorial Popup */}
          <button
            onClick={handleTutorialVideo}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all group cursor-pointer flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Play size={13} fill="currentColor" />
              </div>
              <div>
                <h5 className="text-[10px] font-black text-[var(--customer-primary)] uppercase tracking-tight">Panduan Alur Cetak</h5>
                <p className="text-[8px] text-slate-400 font-bold uppercase">Video Demo Penggunaan Portal</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Store Location Maps Navigation */}
          <button
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent("Kinau Digital Kreatif Lampung")}`, "_blank")}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border hover:border-amber-300 hover:bg-amber-50/20 text-left transition-all group cursor-pointer flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin size={15} />
              </div>
              <div>
                <h5 className="text-[10px] font-black text-[var(--customer-primary)] uppercase tracking-tight">Kunjungi Store Offline</h5>
                <p className="text-[8px] text-slate-400 font-bold uppercase">Rute Petunjuk di Google Maps</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Accordion FAQ summary FAQs brief */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex-shrink-0 space-y-2.5">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block px-0.5">Pertanyaan FAQ</span>
        
        <div className="space-y-2">
          <div>
            <span className="text-[9px] font-black text-slate-800 uppercase block mb-0.5">Berapa Lama Penggarapan ID Card?</span>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide leading-normal">
              Kisarand pengerjaan rata-rata berkisar 1-3 hari setelah berkas desain disetujui admin dan komitmen DP terverifikasi.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-1.5">
            <span className="text-[9px] font-black text-slate-800 uppercase block mb-0.5">Bagaimana Jika Hasil Cetak Cacat?</span>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide leading-normal">
              Kinau menyediakan garansi cetak ulang 100% jika terdapat kecacatan cetak murni dari kelalaian mesin produksi kami.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

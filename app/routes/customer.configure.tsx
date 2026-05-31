import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router";
import { 
  Sparkles, 
  CreditCard, 
  Trash2, 
  Save, 
  Upload, 
  Move, 
  ZoomIn, 
  ArrowRight,
  RefreshCw,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { getOptionalUser } from "~/utils/session.server";
import { API } from "~/nexus/index.server";
import type { ActionFunction } from "react-router";

export const action: ActionFunction = async ({ request }) => {
  const result = await getOptionalUser(request);
  if (!result) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const user = typeof result.user === "string" ? JSON.parse(result.user) : result.user;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_order") {
    const institution_name = formData.get("institution_name") as string;
    const pic_name = (formData.get("pic_name") as string) || user.fullname;
    const pic_phone = (formData.get("pic_phone") as string) || user.phone;
    const member_count = Number(formData.get("member_count")) || 1;
    const payment_type = formData.get("payment_type") as string;
    const total_amount = Number(formData.get("total_amount")) || 0;
    const dp_amount = Number(formData.get("dp_amount")) || 0;
    const payment_proof = formData.get("payment_proof") as string;

    try {
      const res = await API.ORDERS.create({
        session: { user, token: result.token },
        req: {
          body: {
            institution_name: institution_name || pic_name,
            pic_name,
            pic_phone,
            order_type: "package",
            status: "pending",
            payment_status: payment_proof
              ? (payment_type === "dp" ? "down_payment" : "paid")
              : "unpaid",
            total_amount,
            dp_amount,
            payment_proof: payment_proof || null,
            created_by: JSON.stringify({ id: user.id, fullname: user.fullname }),
            items: [
              {
                product_name: "Paket ID Card + Lanyard",
                product_type: "package",
                qty: member_count,
                unit_price: member_count > 0 ? Math.round(total_amount / member_count) : 0,
              },
            ],
          },
        },
      });

      return Response.json({ success: res.success, message: res.message || "Pesanan berhasil dibuat" });
    } catch (err: any) {
      return Response.json({ success: false, message: err.message || "Gagal membuat pesanan" }, { status: 500 });
    }
  }

  return Response.json({ success: false, message: "Intent tidak dikenali" });
};

export default function CustomerConfigure() {
  const { user } = useOutletContext<{ user: any; isDemo: boolean }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Segment states: 'idcard' | 'lanyard' | 'twibbon'
  const [activeSegment, setActiveSegment] = useState<"idcard" | "lanyard" | "twibbon">("idcard");

  // Read params for quick presets
  useEffect(() => {
    const preset = searchParams.get("preset");
    const orderNum = searchParams.get("order");
    if (preset === "lanyard") {
      setActiveSegment("lanyard");
    } else if (preset === "twibbon" || orderNum) {
      setActiveSegment("twibbon");
    } else {
      setActiveSegment("idcard");
    }
  }, [searchParams]);

  // ID CARD STATE
  const [idName, setIdName] = useState(user?.fullname || "CIVITAS KINAU");
  const [idNum, setIdNum] = useState("KKN-2026-001");
  const [idDept, setIdDept] = useState("UNIVERSITAS LAMPUNG");
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [idLogo, setIdLogo] = useState<string | null>(null);

  // LANYARD STATE
  const [lanyardColor, setLanyardColor] = useState("#103557");
  const [lanyardTextColor, setLanyardTextColor] = useState("#FFFFFF");
  const [lanyardText, setLanyardText] = useState("KINAU ID - CREATIVE PRINTING");
  const [lanyardTemplate, setLanyardTemplate] = useState("Modern Repeating Text");
  const [lanyardPattern, setLanyardPattern] = useState<string | null>(null);

  // CROPPING / TWIBBON STATES
  const [twibbonPhoto, setTwibbonPhoto] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [selectedCardOverlay, setSelectedCardOverlay] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const twibbonInputRef = useRef<HTMLInputElement>(null);

  const idCardTemplates = [
    { name: "Sleek Corporate Navy", bg: "from-[#103557] to-[#1E434C]", accent: "#0097B2", textColor: "text-white" },
    { name: "Creative Dynamic Orange", bg: "from-[#914614] to-[#BB6328]", accent: "#FFA726", textColor: "text-white" },
    { name: "Elegant Minimalist Emerald", bg: "from-[#144F35] to-[#217751]", accent: "#10B981", textColor: "text-white" },
    { name: "Tech Brutalist Amber", bg: "from-[#1E293B] to-[#334155]", accent: "#FBBF24", textColor: "text-white" },
  ];

  const lanyardTemplates = [
    { name: "Core Navy Gradient", color: "#103557", text: "#FFFFFF", slogan: "KINAU ID - LAMPUNG" },
    { name: "Vibrant Sunset Cyan", color: "#0097B2", text: "#FFFFFF", slogan: "CREATIVE ID CARD & LANYARD" },
    { name: "Classic Charcoal Dark", color: "#1E293B", text: "#FBBF24", slogan: "PRODUKSI PREMIUM KINAU" },
  ];

  const cardOverlays = [
    { name: "Anggota KKN Unila 2026", bg: "bg-gradient-to-tr from-[#103557] to-[#1E434C]", header: "KKN UNILA 2026" },
    { name: "Kartu Panitia Premium", bg: "bg-gradient-to-tr from-[#1E293B] to-[#914614]", header: "PANITIA EVENT" },
    { name: "Sponsor Partner Kinau", bg: "bg-gradient-to-tr from-[#144F35] to-[#0097B2]", header: "VIP MEMBERSHIP" },
  ];

  // File Upload Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setIdPhoto(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setIdLogo(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleTwibbonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setTwibbonPhoto(uploadEvent.target?.result as string);
        // Reset crop settings on new upload
        setScale(1);
        setPosX(0);
        setPosY(0);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveToCart = async () => {
    // Generate order object
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const orderNumber = `ORD-0${randomNum}`;
    
    let newItem = {};
    if (activeSegment === "idcard") {
      newItem = {
        id: `local-${Date.now()}`,
        order_number: orderNumber,
        institution_name: idDept || "Personal ID",
        order_type: "id_card",
        total_amount: 350000, // standard price for package
        dp_amount: 175000,
        payment_status: "unpaid",
        status: "ordered",
        order_date: new Date().toISOString().split('T')[0],
        pic_name: idName,
        design_template: idCardTemplates[selectedTemplateIndex].name,
        details: { idName, idNum, idDept }
      };
    } else if (activeSegment === "lanyard") {
      newItem = {
        id: `local-${Date.now()}`,
        order_number: orderNumber,
        institution_name: "Kustom Lanyard Pesanan",
        order_type: "lanyard",
        total_amount: 120000,
        dp_amount: 60000,
        payment_status: "unpaid",
        status: "ordered",
        order_date: new Date().toISOString().split('T')[0],
        pic_name: lanyardText,
        design_template: "Lanyard Slogan " + lanyardColor,
        details: { lanyardColor, lanyardText, lanyardTextColor }
      };
    } else {
      // Twibbon download trigger
      await Swal.fire({
        title: "Konfigurasi Berhasil",
        text: "Desain Twibbonize Anda siap dipasang! Unduh langsung kartu digital Anda.",
        icon: "success",
        confirmButtonText: "Unduh Digital ID",
        customClass: {
          confirmButton: "bg-[var(--customer-accent)] hover:bg-[var(--customer-accent)]/90 text-white font-black px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs"
        }
      });
      return;
    }

    // Persist to localStorage
    const saved = localStorage.getItem(`kinau_orders_${user.id}`);
    const existing = saved ? JSON.parse(saved) : [];
    localStorage.setItem(`kinau_orders_${user.id}`, JSON.stringify([newItem, ...existing]));

    await Swal.fire({
      title: "Desain Disimpan!",
      text: "Konfigurasi Anda telah disimpan ke keranjang pesanan. Silakan selesaikan pembayaran invoice Anda untuk memulai pengerjaan.",
      icon: "success",
      confirmButtonText: "Bayar Sekarang",
      showCancelButton: true,
      cancelButtonText: "Desain Lain",
      reverseButtons: true,
      customClass: {
        confirmButton: "bg-[var(--customer-primary)] text-white font-black px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs mr-2",
        popup: "rounded-[2rem] shadow-xl border border-slate-100 font-sans"
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(`/customer/orders?order=${orderNumber}`);
      } else {
        navigate("/customer/dashboard");
      }
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--customer-bg)]">
      
      {/* Tab Select Segment (Fixed, flex-shrink-0) */}
      <div className="px-5 pt-4 pb-2 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex bg-slate-100/80 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSegment("idcard")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeSegment === "idcard" ? "bg-[var(--customer-primary)] text-white shadow" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            💳 ID Card
          </button>
          <button
            onClick={() => setActiveSegment("lanyard")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeSegment === "lanyard" ? "bg-[var(--customer-primary)] text-white shadow" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🎗️ Lanyard
          </button>
          <button
            onClick={() => setActiveSegment("twibbon")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeSegment === "twibbon" ? "bg-[var(--customer-primary)] text-white shadow" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            📸 Twibbon
          </button>
        </div>
      </div>

      {/* Main Configurations + Canvas Studio (Unified inside a scrollable layout, fits 1-screen perfectly) */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-8 scrollbar-thin">
        
        {/* INTERACTIVE PREVIEW PANEL */}
        <div className="w-full flex justify-center bg-slate-950/5 py-4 rounded-3xl border border-slate-200/50 backdrop-blur-sm shadow-inner relative overflow-hidden group">
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/80 backdrop-blur border border-slate-200/30 rounded-lg text-[8px] font-black uppercase text-[var(--customer-accent)] shadow flex items-center gap-1">
            <Sparkles size={10} className="animate-spin-slow text-amber-500" /> Live Preview
          </div>

          <AnimatePresence mode="wait">
            {/* ID CARD RENDER */}
            {activeSegment === "idcard" && (
              <motion.div
                key="id-card-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-[200px] h-[310px] rounded-3xl bg-gradient-to-tr ${idCardTemplates[selectedTemplateIndex].bg} shadow-md border-2 border-white/20 p-4 font-sans text-center flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Logo & Wave ornament background */}
                <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

                {/* Card Header */}
                <div className="relative z-10 flex flex-col items-center mt-1">
                  <div className="w-6 h-6 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center p-1 border border-white/15">
                    {idLogo ? (
                      <img src={idLogo} className="w-full h-full object-contain" alt="Logo" />
                    ) : (
                      <img src="/kinau-logo.png" className="w-full h-full object-contain brightness-0 invert" alt="Kinau" />
                    )}
                  </div>
                  <span className="text-[6px] font-black uppercase tracking-widest text-[var(--customer-accent)] mt-1.5">
                    {idDept}
                  </span>
                </div>

                {/* Avatar frame */}
                <div className="avatar-area flex justify-center my-2 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white overflow-hidden shadow-inner flex items-center justify-center relative">
                    {idPhoto ? (
                      <img src={idPhoto} className="w-full h-full object-cover" alt="Avatar input" />
                    ) : (
                      <span className="text-[9px] font-bold text-white/50">Foto Peserta</span>
                    )}
                  </div>
                  {/* Miniature barcode decorative */}
                  <div className="absolute bottom-[-10px] w-12 h-4 bg-white/90 rounded border border-slate-200/50 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)]"></div>
                  </div>
                </div>

                {/* Credentials */}
                <div className="relative z-10 mb-2 mt-1">
                  <h4 className="text-[11px] font-extrabold text-white uppercase tracking-tight line-clamp-1">
                    {idName}
                  </h4>
                  <p className="text-[7px] font-black text-white/60 uppercase tracking-widest mt-0.5 leading-none">
                    {idNum}
                  </p>
                  <p className="inline-block mt-2.5 px-3 py-0.5 text-[6px] font-black rounded bg-white text-slate-900 border uppercase tracking-[0.1em]">
                    Civitas
                  </p>
                </div>
              </motion.div>
            )}

            {/* LANYARD RENDER */}
            {activeSegment === "lanyard" && (
              <motion.div
                key="lanyard-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-[200px] h-[310px] rounded-3xl bg-slate-100 flex flex-col justify-center items-center p-4 border border-slate-200/50 shadow-sm relative overflow-hidden"
              >
                {/* Structural hanging Lanyard mockup rendering */}
                <div className="w-full flex justify-center h-2/3 items-center relative py-6">
                  {/* Hanging loop line outer */}
                  <div 
                    style={{ borderColor: lanyardColor }}
                    className="absolute top-2 w-14 h-48 border-[6px] border-b-0 rounded-t-[2.5rem] opacity-90"
                  ></div>
                  
                  {/* Clasp connector mockup */}
                  <div className="absolute top-[180px] w-6 h-6 bg-slate-400 rounded-md border border-slate-500 shadow-inner flex items-center justify-center z-10">
                    <div className="w-1.5 h-3 bg-slate-500 rounded"></div>
                  </div>

                  {/* Attachment ring */}
                  <div className="absolute top-[200px] w-2 h-4 border-2 border-slate-500 rounded-b-md z-10"></div>
                </div>
                
                {/* Miniature badge at bottom */}
                <div className="w-16 h-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center p-1 z-10">
                  <div 
                    style={{ backgroundColor: lanyardColor }} 
                    className="w-full h-full rounded flex items-center justify-center text-[10px]"
                  >
                    🏷️
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Warna Utama</span>
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <span 
                      style={{ backgroundColor: lanyardColor }} 
                      className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                    ></span>
                    <span className="text-[9px] font-mono uppercase font-semibold text-slate-600">
                      {lanyardColor}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TWIBBON RENDER (HTML5 Canvas-Overlay simulation with live sliders) */}
            {activeSegment === "twibbon" && (
              <motion.div
                key="twibbon-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div 
                  className={`w-[200px] h-[310px] rounded-3xl ${cardOverlays[selectedCardOverlay].bg} border-2 border-white/20 p-5 font-sans relative overflow-hidden shadow-lg flex flex-col justify-between`}
                >
                  {/* Card head branding */}
                  <div className="text-center">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">
                      PERCETAKAN KINAU ID
                    </span>
                    <h3 className="text-[10px] font-black text-white tracking-wider uppercase mt-0.5">
                      {cardOverlays[selectedCardOverlay].header}
                    </h3>
                  </div>

                  {/* Embedded Canvas / Cropper Overlay frame */}
                  <div className="w-28 h-28 mx-auto rounded-full bg-slate-900 border-2 border-white overflow-hidden relative shadow-inner flex items-center justify-center">
                    <div className="absolute inset-0 z-0 bg-slate-800 flex items-center justify-center">
                      {twibbonPhoto ? (
                        <div
                          style={{
                            transform: `translate(${posX}px, ${posY}px) scale(${scale})`,
                            transition: "none"
                          }}
                          className="w-full h-full relative cursor-move flex items-center justify-center"
                        >
                          <img src={twibbonPhoto} className="w-full h-full object-contain" alt="Target avatar crop" />
                        </div>
                      ) : (
                        <span className="text-[8px] font-bold text-white/50 text-center px-4">Unggah foto di bawah</span>
                      )}
                    </div>
                    {/* Inner frame lock overlay to represent twibbon circle badge */}
                    <div className="absolute inset-0 border-[3px] border-white/20 rounded-full z-10 pointer-events-none"></div>
                  </div>

                  {/* Bottom credential placeholders */}
                  <div className="text-center relative z-10 mt-1">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-wider line-clamp-1">
                      {user?.fullname || "CIVITAS KINAU"}
                    </h4>
                    <p className="text-[7px] font-semibold text-white/60 lowercase tracking-widest leading-none mt-0.5">
                      {user?.email || "pelanggan@kinau.id"}
                    </p>
                    <div className="mt-2.5 flex justify-center">
                      <div className="px-2.5 py-0.5 bg-white text-slate-900 border text-[6px] font-black uppercase rounded tracking-widest">
                        Digital Member
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* CONFIGURATION CONTROLS PANEL */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-4">
          
          {/* ID CARD CONTROLS */}
          {activeSegment === "idcard" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-primary)]">Kustom Teks ID Card</span>
                <button 
                  onClick={() => { setIdName(user.fullname); setIdNum("KKN-2026-001"); setIdDept("UNIVERSITAS LAMPUNG"); }}
                  className="text-[9px] font-black text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                >
                  <RefreshCw size={10} /> Reset
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-1">Nama Civitas</label>
                  <input
                    type="text"
                    value={idName}
                    onChange={(e) => setIdName(e.target.value)}
                    maxLength={26}
                    placeholder="Masukkan nama lengkap"
                    className="w-full h-11 px-4 bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-[var(--customer-accent)] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-1">NIK / NIM / No. Registrasi</label>
                  <input
                    type="text"
                    value={idNum}
                    onChange={(e) => setIdNum(e.target.value)}
                    maxLength={18}
                    placeholder="Contoh: 220501002"
                    className="w-full h-11 px-4 bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-[var(--customer-accent)] focus:bg-white transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-1">Departemen / Kampus</label>
                  <input
                    type="text"
                    value={idDept}
                    onChange={(e) => setIdDept(e.target.value)}
                    maxLength={32}
                    placeholder="Contoh: FAKULTAS TEKNIK UNILA"
                    className="w-full h-11 px-4 bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-[var(--customer-accent)] focus:bg-white transition-all uppercase"
                  />
                </div>
              </div>

              {/* Uploads selection */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-2">Unggah Foto & Logo</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-200/50 hover:border-[var(--customer-accent)]/40 bg-slate-50/50 text-slate-500 hover:text-slate-800 flex items-center justify-center flex-col gap-1.5 transition-all text-[10px] font-bold cursor-pointer"
                  >
                    <Upload size={14} className="text-[var(--customer-accent)]" />
                    {idPhoto ? " Ganti Foto ✅" : "Unggah Foto Participan"}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </button>

                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-200/50 hover:border-[var(--customer-accent)]/40 bg-slate-50/50 text-slate-500 hover:text-slate-800 flex items-center justify-center flex-col gap-1.5 transition-all text-[10px] font-bold cursor-pointer"
                  >
                    <Upload size={14} className="text-[var(--customer-accent)]" />
                    {idLogo ? " Ganti Logo ✅" : "Unggah Logo Custom"}
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </button>
                </div>
              </div>

              {/* Predefined design selector */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-2">Pilih Template Warna (Admin-Configured)</span>
                <div className="grid grid-cols-2 gap-2">
                  {idCardTemplates.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        selectedTemplateIndex === idx 
                          ? "border-[var(--customer-primary)] bg-slate-50 shadow-sm" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <span className="text-[9px] font-extrabold text-[var(--customer-primary)] line-clamp-1">{tpl.name}</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span style={{ backgroundColor: tpl.accent }} className="w-2.5 h-2.5 rounded-full inline-block border border-white"></span>
                        <span className="text-[7px] font-mono uppercase font-semibold text-slate-400">Accent</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LANYARD CONTROLS */}
          {activeSegment === "lanyard" && (
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-primary)] block mb-1">Spesifikasi Lanyard</span>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-1">Tulisan / Slogan Sablon</label>
                  <input
                    type="text"
                    value={lanyardText}
                    onChange={(e) => setLanyardText(e.target.value)}
                    maxLength={36}
                    placeholder="Masukkan teks sablon Lanyard"
                    className="w-full h-11 px-4 bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-[var(--customer-accent)] focus:bg-white transition-all uppercase"
                  />
                </div>

                {/* Grid selection color block */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-2">Warna Tali Lanyard</label>
                  <div className="flex gap-3 flex-wrap">
                    {["#103557", "#0097B2", "#144F35", "#BB6328", "#1E293B", "#DC2626"].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setLanyardColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-9 h-9 rounded-full border-2 transform active:scale-95 cursor-pointer flex items-center justify-center transition-all ${
                          lanyardColor === hex ? "border-amber-400 scale-105 shadow-md" : "border-white hover:border-slate-200"
                        }`}
                      >
                        {lanyardColor === hex && <span className="text-[10px] text-white">✅</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates shortcut presets */}
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-2">Preset Lanyard Populer</span>
                  <div className="space-y-2">
                    {lanyardTemplates.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLanyardColor(preset.color);
                          setLanyardText(preset.slogan);
                          setLanyardTextColor(preset.text);
                        }}
                        className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 text-left flex items-center justify-between transition-all cursor-pointer"
                      >
                        <div>
                          <h5 className="text-[10px] font-bold text-slate-800 uppercase">{preset.name}</h5>
                          <span className="text-[8px] font-semibold text-slate-400 tracking-wider inline-block mt-0.5">{preset.slogan}</span>
                        </div>
                        <span style={{ backgroundColor: preset.color }} className="w-4 h-4 rounded-full inline-block border border-white shadow-sm"></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CROPPING / TWIBBON CONTROLS */}
          {activeSegment === "twibbon" && (
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-primary)] block mb-1">Canvas Positioning & Photo</span>
              
              {/* Photo selector trigger */}
              <button
                onClick={() => twibbonInputRef.current?.click()}
                className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[var(--customer-accent)] bg-slate-50 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 transition-all font-black text-xs cursor-pointer"
              >
                <Upload size={16} className="text-[var(--customer-accent)]" />
                {twibbonPhoto ? "PILIH/GANTI FOTO LAIN ✅" : "UNGHAH FOTO DIRI / CIVITAS (JPG/PNG)"}
                <input ref={twibbonInputRef} type="file" accept="image/*" onChange={handleTwibbonUpload} className="hidden" />
              </button>

              {twibbonPhoto && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                  <span className="text-[8px] font-black uppercase tracking-wide text-slate-400 block">Kamera Sliders Adjustment</span>
                  
                  {/* Slider Zoom */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                      <span>Perbesar / Zoom</span>
                      <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.05"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1 accent-[#0097B2]" 
                      />
                    </div>
                  </div>

                  {/* Horizontal displacement */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                      <span>Geser Kiri/Kanan</span>
                      <span>{posX}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        step="1"
                        value={posX}
                        onChange={(e) => setPosX(parseInt(e.target.value))}
                        className="flex-1 accent-[#0097B2]" 
                      />
                    </div>
                  </div>

                  {/* Vertical displacement */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                      <span>Geser Atas/Bawah</span>
                      <span>{posY}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        step="1"
                        value={posY}
                        onChange={(e) => setPosY(parseInt(e.target.value))}
                        className="flex-1 accent-[#0097B2]" 
                      />
                    </div>
                  </div>

                  {/* Move joystick actions */}
                  <div className="flex justify-center pt-1.5">
                    <button
                      onClick={() => { setPosX(0); setPosY(0); setScale(1); }}
                      className="py-1 px-3 bg-white hover:bg-slate-100 border text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-0.5 cursor-pointer text-slate-500"
                    >
                      <RefreshCw size={10} /> Reset Alignment
                    </button>
                  </div>
                </div>
              )}

              {/* Twibbon/Card Overlay selector */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-wide text-slate-400 block mb-2">Pilih Variasi Template Twibbonize</span>
                <div className="space-y-2">
                  {cardOverlays.map((overlay, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCardOverlay(index)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedCardOverlay === index 
                          ? "border-[var(--customer-primary)] bg-slate-50 shadow-sm" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div>
                        <h5 className="text-[10px] font-extrabold text-slate-800 uppercase">{overlay.name}</h5>
                        <span className="text-[8px] font-semibold text-slate-400 inline-block mt-0.5">{overlay.header}</span>
                      </div>
                      <span className="text-[10px]">🎨</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* STATIC SAVE & CHECKOUT ACTIONS FOOTER */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 flex gap-2">
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="px-4 py-3 border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
        >
          Kembali
        </button>
        <button
          onClick={handleSaveToCart}
          className="flex-1 py-3 bg-[var(--customer-primary)] text-white hover:bg-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {activeSegment === "twibbon" ? "📸 Selesai & Pasang Foto" : "🛒 Simpan Ke Keranjang + Bayar"} <ArrowRight size={12} strokeWidth={3} />
        </button>
      </div>

    </div>
  );
}

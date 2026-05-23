import { useState } from "react";
import { Upload, CreditCard, Banknote, User, Phone, Building, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { OrderState } from "../use-customer-order-logic";

interface StepCheckoutProps {
  state: OrderState;
  updateState: (partial: Partial<OrderState>) => void;
  handleFileSelect: (field: any, file: File | null) => void;
  onSubmit: () => void;
  pricePerUnit: number;
}

export default function StepCheckout({
  state,
  updateState,
  handleFileSelect,
  onSubmit,
  pricePerUnit,
}: StepCheckoutProps) {
  const totalPrice = state.memberCount * pricePerUnit;
  const dpAmount = Math.ceil(totalPrice * 0.5);
  const payableAmount = state.paymentType === "dp" ? dpAmount : totalPrice;

  const formatRp = (n: number) =>
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

  const isFormValid =
    state.institutionName.trim() !== "" &&
    state.picName.trim() !== "" &&
    state.picPhone.trim() !== "" &&
    state.paymentProofFile !== null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3">
        <h2 className="text-base font-black text-foreground">Checkout & Pembayaran</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Lengkapi data dan upload bukti pembayaran</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-[#35606B] rounded-2xl p-4 text-white"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Ringkasan</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">
              {state.memberCount} anggota
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/60">Total Harga</p>
              <p className="text-lg font-black">{formatRp(totalPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60">Harga/pcs</p>
              <p className="text-sm font-bold">{formatRp(pricePerUnit)}</p>
            </div>
          </div>
        </motion.div>

        {/* Customer Info */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
            Data Pemesan
          </label>
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100">
            <Building size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={state.institutionName}
              onChange={(e) => updateState({ institutionName: e.target.value })}
              placeholder="Nama Institusi / Organisasi"
              className="flex-1 text-xs outline-none text-foreground placeholder:text-gray-300"
            />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={state.picName}
              onChange={(e) => updateState({ picName: e.target.value })}
              placeholder="Nama PIC / Penanggung Jawab"
              className="flex-1 text-xs outline-none text-foreground placeholder:text-gray-300"
            />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100">
            <Phone size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="tel"
              value={state.picPhone}
              onChange={(e) => updateState({ picPhone: e.target.value })}
              placeholder="No. WhatsApp PIC"
              className="flex-1 text-xs outline-none text-foreground placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Payment Type */}
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateState({ paymentType: "dp" })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                state.paymentType === "dp"
                  ? "border-accent bg-accent/5"
                  : "border-gray-100 bg-white"
              }`}
            >
              <Banknote size={18} className={state.paymentType === "dp" ? "text-accent" : "text-gray-400"} />
              <span className="text-[10px] font-bold text-foreground">DP Dulu</span>
              <span className="text-[9px] text-gray-400">{formatRp(dpAmount)}</span>
            </button>
            <button
              onClick={() => updateState({ paymentType: "full" })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                state.paymentType === "full"
                  ? "border-accent bg-accent/5"
                  : "border-gray-100 bg-white"
              }`}
            >
              <CreditCard size={18} className={state.paymentType === "full" ? "text-accent" : "text-gray-400"} />
              <span className="text-[10px] font-bold text-foreground">Langsung Lunas</span>
              <span className="text-[9px] text-gray-400">{formatRp(totalPrice)}</span>
            </button>
          </div>
        </div>

        {/* Payment Amount Display */}
        <div className="bg-accent/5 rounded-xl p-3 border border-accent/10 text-center">
          <p className="text-[10px] text-accent font-medium">Yang harus dibayar:</p>
          <p className="text-lg font-black text-accent">{formatRp(payableAmount)}</p>
        </div>

        {/* Payment Proof Upload */}
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Bukti Pembayaran
          </label>
          <label className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border-2 border-dashed border-gray-200 cursor-pointer hover:border-accent/50 transition-colors">
            {state.paymentProofPreview ? (
              <img src={state.paymentProofPreview} alt="Bukti" className="w-full max-h-32 object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
            )}
            <span className="text-[10px] font-medium text-gray-400">
              {state.paymentProofFile ? state.paymentProofFile.name : "Upload bukti transfer"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect("paymentProofFile", e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!isFormValid || state.isSubmitting}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isFormValid && !state.isSubmitting
              ? "bg-accent text-white shadow-lg shadow-accent/30"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          {state.isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Memproses...
            </>
          ) : (
            "Kirim Pesanan"
          )}
        </button>
      </div>
    </div>
  );
}

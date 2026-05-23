import { useMemo } from "react";
import {
  ExternalLink,
  FileText,
  Truck,
  CreditCard,
  Eye,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { formatCurrency } from "~/constants";

interface StepDashboardProps {
  orderResult: any;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Menunggu", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  ordered: { label: "Dipesan", color: "text-blue-600 bg-blue-50", icon: Clock },
  confirmed: { label: "Dikonfirmasi", color: "text-blue-600 bg-blue-50", icon: CheckCircle2 },
  in_production: { label: "Produksi", color: "text-purple-600 bg-purple-50", icon: Loader2 },
  qc: { label: "Quality Check", color: "text-indigo-600 bg-indigo-50", icon: Eye },
  ready: { label: "Siap Kirim", color: "text-green-600 bg-green-50", icon: Truck },
  shipped: { label: "Dikirim", color: "text-green-600 bg-green-50", icon: Truck },
  delivered: { label: "Diterima", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  done: { label: "Selesai", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  rejected: { label: "Ditolak", color: "text-red-600 bg-red-50", icon: AlertCircle },
  cancelled: { label: "Dibatalkan", color: "text-red-600 bg-red-50", icon: AlertCircle },
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  none: { label: "Belum Bayar", color: "text-gray-500 bg-gray-50" },
  unpaid: { label: "Belum Lunas", color: "text-yellow-600 bg-yellow-50" },
  down_payment: { label: "DP", color: "text-blue-600 bg-blue-50" },
  paid: { label: "Lunas", color: "text-green-600 bg-green-50" },
};

export default function StepDashboard({ orderResult }: StepDashboardProps) {
  const orderNumber = orderResult?.order_number;

  const { data: orderData, loading } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({ order_number: orderNumber, size: 1 })
      .build(),
    autoLoad: !!orderNumber,
  });

  const order = useMemo(() => {
    const items = orderData?.data?.items || [];
    return items[0] || orderResult;
  }, [orderData, orderResult]);

  if (!order) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
          <p className="text-xs text-gray-400">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const paymentInfo = PAYMENT_MAP[order.payment_status] || PAYMENT_MAP.none;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3">
        <h2 className="text-base font-black text-foreground">Pesanan Aktif</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Pantau status pesanan Anda</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-3">
        {/* Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50"
        >
          {/* Order Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No. Pesanan</p>
              <p className="text-sm font-black text-foreground">{order.order_number || "-"}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
              <StatusIcon size={10} className="inline mr-1" />
              {statusInfo.label}
            </div>
          </div>

          {/* Institution */}
          <div className="mb-3 pb-3 border-b border-gray-50">
            <p className="text-xs font-bold text-foreground">{order.institution_name || "-"}</p>
            <p className="text-[10px] text-gray-400">{order.pic_name} • {order.pic_phone}</p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 mb-3">
            <div className={`flex-1 px-3 py-2 rounded-xl text-center ${statusInfo.color}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Produksi</p>
              <p className="text-[11px] font-black">{statusInfo.label}</p>
            </div>
            <div className={`flex-1 px-3 py-2 rounded-xl text-center ${paymentInfo.color}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Pembayaran</p>
              <p className="text-[11px] font-black">{paymentInfo.label}</p>
            </div>
          </div>

          {/* Price */}
          <div className="bg-secondary/50 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Total</span>
              <span className="text-sm font-black text-foreground">
                {formatCurrency(order.grand_total || order.total_amount || 0)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const domain = order.institution_domain || order.order_number;
                window.open(`/public/design-link/${domain}`, "_blank");
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 text-accent text-[10px] font-bold active:scale-95 transition-transform"
            >
              <Share2 size={12} />
              Link Twibbon
            </button>
            <button
              onClick={() => window.open(`/public/nota/${order.order_number}`, "_blank")}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary text-[10px] font-bold active:scale-95 transition-transform"
            >
              <FileText size={12} />
              Cetak Nota
            </button>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Progress Produksi
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: getProgressWidth(order.status) }}
              />
            </div>
            <span className="text-[10px] font-bold text-accent">{getProgressWidth(order.status)}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Status saat ini: <span className="font-bold text-foreground">{statusInfo.label}</span>
          </p>
        </motion.div>

        {/* Info Note */}
        <div className="bg-accent/5 rounded-xl p-3 border border-accent/10">
          <p className="text-[10px] text-accent font-medium text-center">
            Admin akan memverifikasi pembayaran Anda. Status akan berubah menjadi "Dikonfirmasi" setelah verifikasi selesai.
          </p>
        </div>
      </div>
    </div>
  );
}

function getProgressWidth(status: string): string {
  const progressMap: Record<string, string> = {
    pending: "5%",
    ordered: "10%",
    confirmed: "20%",
    in_production: "50%",
    qc: "70%",
    ready: "85%",
    shipped: "90%",
    delivered: "95%",
    done: "100%",
  };
  return progressMap[status] || "5%";
}

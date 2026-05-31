import React from "react";
import ModalShell from "~/components/modal/ModalShell";
import { Button } from "~/components/ui/button";
import type { OrderFilters } from "../use-order-list-logic";

interface OrderFilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  onApply: () => void;
  onReset: () => void;
  viewMode: "reguler" | "kkn";
  kknInstitutions: any;
  loadingKknInstitutions: boolean;
}

export function OrderFilterModal({
  open,
  onClose,
  filters,
  setFilters,
  onApply,
  onReset,
  viewMode,
  kknInstitutions,
  loadingKknInstitutions,
}: OrderFilterModalProps) {
  const updateFilter = (key: keyof OrderFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2017 + 1 }, (_, i) => (currentYear - i).toString());

  return (
    <ModalShell open={open} onClose={onClose} title="Filter Berdasarkan" size="md">
      <div className="space-y-4">
        {/* Tahun */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            value={filters.year}
            onChange={(e) => updateFilter("year", e.target.value)}
          >
            <option value="">Semua Tahun</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Status Produksi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Produksi</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Diproses</option>
            <option value="in_production">Produksi</option>
            <option value="done">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Status Pembayaran */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Pembayaran</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            value={filters.payment_status}
            onChange={(e) => updateFilter("payment_status", e.target.value)}
          >
            <option value="">Semua</option>
            <option value="paid">Lunas</option>
            <option value="down_payment">DP</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="none">Belum Ada</option>
          </select>
        </div>

        {/* Tipe Pesanan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Pesanan</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            value={filters.order_type}
            onChange={(e) => updateFilter("order_type", e.target.value)}
          >
            <option value="">Semua Tipe</option>
            <option value="package">Paket</option>
            <option value="id_card">ID Card</option>
            <option value="lanyard">Lanyard</option>
            <option value="custom">Custom</option>
            <option value="service">Service</option>
          </select>
        </div>

        {/* Institusi KKN (hanya tampil di mode KKN) */}
        {viewMode === "kkn" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Institusi KKN</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
              value={filters.kknInstitution}
              onChange={(e) => updateFilter("kknInstitution", e.target.value)}
              disabled={loadingKknInstitutions}
            >
              <option value="">Semua Institusi</option>
              {(Array.isArray(kknInstitutions?.data) ? kknInstitutions.data : []).map((inst: any, idx: number) => (
                <option key={idx} value={inst.institution_id}>
                  {inst.institution_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onReset}>
            Reset
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={onApply}>
            Terapkan
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

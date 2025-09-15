import { ChevronLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { DescriptionComponent } from "~/components/card/DescriptionCard";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ReceiptTemplate } from "~/components/print/order/ReceiptTemplate";
import { usePrintJS } from "~/hooks/usePrintJS";

export default function DetailOrder() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { printElement } = usePrintJS();

  // const invoiceData = {
  //   invoiceNumber: "KIN-INV-0001",
  //   date: "13/09/2025",
  //   time: "15:09:30",
  //   customerName: "Nama PIC Contoh",
  //   customerPhone: "0852-1933-7474",
  //   institution: "Institut Teknologi Sumatera",
  //   admin: "Rizki",
  //   paymentType: "DP",
  //   subtotal: 200000,
  //   dp: 50000,
  //   remaining: 150000,
  //   items: [{ product: "Paket ID Card + Lanyard", price: 20000, quantity: 10 }],
  // };
  const invoiceData: any = {
    invoiceNumber: "KIN-INV-0001",
    date: "13/09/2025",
    time: "15:09:30",
    customerName: "Nama PIC Contoh",
    customerPhone: "0852-1933-7474",
    institution: "Institut Teknologi Sumatera",
    admin: "Rizki",
    paymentType: "DP",
    subtotal: 200000,
    dp: 50000,
    remaining: 150000,
    items: [{ product: "Paket ID Card + Lanyard", price: 20000, quantity: 10 }],
    domainUrl: "https://kinau.id",
    // qrCodeUrl: "/qrcode-example.png", // contoh aja
    qrCodeUrl: "/kinau-logo.png", // contoh aja
  };

  return (
    <div className="space-y-3">
      <TitleHeader
        title="Detail Pesanan"
        description="Kelola data Pesanan."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Pesanan", href: "/" },
              { label: "Detail", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="text-blue-700"
            onClick={() => navigate("/app/order/ordered")}
            variant="outline"
          >
            <ChevronLeft className="w-4" />
            Kembali
          </Button>
        }
      />

      <DescriptionComponent
        title="Detail Pesanan"
        description="Informasi lengkap pesanan #12345"
        actionRight={
          <Button
            onClick={() => printElement("printable-content")}
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs"
          >
            <Printer className="w-4" />
            Cetak Nota
          </Button>
        }
        cols={3}
        data={{
          "Nomor Pesanan": "12345",
          "Nama Customer": "Budi Santoso",
          "Jenis Pesanan": "ID Card",
          Jumlah: 100,
          Deadline: "12 September 2025",
          Status: "Menunggu Pembayaran",
        }}
      />

      <div className="hidden">
        <ReceiptTemplate ref={printRef} {...invoiceData} />
      </div>
    </div>
  );
}

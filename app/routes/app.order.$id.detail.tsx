import { ChevronLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { DescriptionComponent } from "~/components/card/DescriptionCard";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ReceiptTemplate } from "~/components/print/order/ReceiptTemplate";
import { usePrintJS } from "~/hooks/usePrintJS";
import QRCode from "qrcode";

export default function DetailOrder() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { printElement } = usePrintJS();
  const [PrintButton, setPrintButton] =
    useState<React.ComponentType<any> | null>(null);
  const [client, setClient] = useState<boolean>(false);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const order: any = {
    order_number: "ORD-20251004-0001",
  };

  useEffect(() => {
    if (order?.order_number) {
      const qrContent = `https://kinau.id/track/${order.order_number}`;

      QRCode.toDataURL(qrContent, { width: 200, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR generation failed", err));
    }
  }, [order?.order_number]);

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    if (!client) return;
    import("~/components/PrintButton.client").then((mod) =>
      setPrintButton(() => mod.PrintButton)
    );
  }, [client]);

  if (!client) return null;

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

      {PrintButton ? (
        <PrintButton contentRef={printRef} />
      ) : (
        <button
          disabled
          className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
        >
          Loading Print...
        </button>
      )}

      <DescriptionComponent
        title="Detail Pesanan"
        description="Informasi lengkap pesanan #12345"
        actionRight={
          <Button
            onClick={() => {
              printElement("printable-content");
            }}
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs"
          >
            <Printer className="w-4" />
            Cetak Nota
          </Button>
        }
        cols={3}
        data={{
          invoiceNumber: "KIN-INV-0001",
          date: "13/09/2025",
          time: "15:09:30",
          customerName: "Nama PIC Contoh",
          customerPhone: "0852-1933-7474",
          institution: "Institut Teknologi Sumatera",
          admin: "Rizki",
        }}
      />

      <div className="hidden">
        <ReceiptTemplate
          ref={printRef}
          {...{
            order: {} as any,
            items: [
              {
                product_name: "",
                product_price: 10000,
                qty: 10,
              },
            ],
            qrCodeUrl: qrCodeUrl ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

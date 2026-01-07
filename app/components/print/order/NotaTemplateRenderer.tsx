import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { ADMIN_WA, formatCurrency, formatFullDate } from "~/constants";
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  safeParseObject,
} from "~/lib/utils";
// import path from "path"; // Impor di bagian paling atas

// Di dalam komponen NotaPdfTemplate:
// Pastikan kode ini berjalan di sisi server
// const logoPath = path.join(process.cwd(), "public", "kinau-logo.png");

// Registrasi Font agar mendukung ketebalan dan gaya mono
// Font.register({
//   family: "Inter",
//   fonts: [
//     {
//       src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff",
//       fontWeight: 400,
//     },
//     {
//       src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff",
//       fontWeight: 700,
//     },
//     {
//       src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuMZ9hjp-Ek-_EeA.woff",
//       fontWeight: 900,
//     },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2937",
    display: "flex",
    flexDirection: "column",
  },
  // Header Section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1f2937",
    paddingBottom: 10,
    marginBottom: 15,
  },
  logo: { width: 100, marginBottom: 4 },
  headerSub: { fontSize: 8, color: "#6b7280", fontWeight: "medium" },
  headerLoc: { fontSize: 7, color: "#9ca3af" },
  headerTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
    textAlign: "right",
  },
  orderNum: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4b5563",
    textAlign: "right",
  },

  // Info Grid
  grid: { flexDirection: "row", gap: 15, marginBottom: 20 },
  infoBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#9ca3af",
    marginBottom: 4,
  },
  infoValue: { fontSize: 12, fontWeight: "bold", color: "#111827" },
  infoSub: { fontSize: 8, color: "#4b5563" },

  // Status Badge
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },

  // Table
  table: { marginTop: 10, marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    alignItems: "center",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 0.5, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right", fontWeight: "bold" },

  // Summary & Payment
  flexRow: { flexDirection: "row", justifyContent: "space-between", gap: 15 },
  paymentSection: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 5,
  },
  summarySection: { width: 160 },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  sisaBayar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#111827",
    paddingTop: 5,
    marginTop: 5,
  },

  // Footer
  footerCetak: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopStyle: "dashed",
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signature: {
    width: 120,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#111827",
    paddingTop: 4,
  },

  // Contact Info (Bottom)
  contactContainer: {
    marginTop: "auto",
    borderTopWidth: 2,
    borderTopColor: "#111827",
    paddingTop: 10,
    textAlign: "center",
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    fontSize: 7,
    color: "#4b5563",
    marginTop: 4,
  },
});

export const NotaPdfTemplate = ({
  order,
  items,
  logoPath,
}: {
  order: any;
  items: any[];
  logoPath: string;
}) => {
  const total = order?.total_amount || 0;
  const paid = order?.dp_amount || 0;
  const remain = Math.max(0, total - paid);
  const isPaidOff = remain === 0;

  // Helper untuk warna status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
      case "paid":
        return "#16a34a";
      case "pending":
      case "down_payment":
        return "#eab308";
      case "confirmed":
        return "#3b82f6";
      default:
        return "#ef4444";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src={logoPath} style={styles.logo} />
            <Text style={styles.headerSub}>Your Custom Specialist</Text>
            <Text style={styles.headerLoc}>Kinau.id Production • Lampung</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>NOTA PESANAN</Text>
            <Text style={styles.orderNum}>#{order?.order_number}</Text>
            <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "right" }}>
              Tanggal: {formatFullDate(order?.created_on)}
            </Text>
          </View>
        </View>

        {/* Info Pelanggan & Deadline */}
        <View style={styles.grid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>PEMESAN</Text>
            <Text style={styles.infoValue}>
              {+order?.is_kkn === 1
                ? order?.kkn_type?.toLowerCase() === "ppm"
                  ? `Kelompok ${(safeParseObject(order?.kkn_detail) as any)?.value}`
                  : `Desa ${(safeParseObject(order?.kkn_detail) as any)?.value}`
                : order?.institution_name}
            </Text>
            {order?.pic_name && (
              <Text style={styles.infoSub}>
                {+order?.is_personal !== 1
                  ? `PJ: ${order?.pic_name} (${order?.pic_phone})`
                  : order?.pic_phone}
              </Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <View style={{ marginBottom: 5 }}>
              <Text style={styles.infoLabel}>DEADLINE</Text>
              <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                {formatFullDate(order?.deadline)}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              <View>
                <Text style={styles.infoLabel}>PEMBAYARAN</Text>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: getStatusColor(order?.payment_status) },
                  ]}
                >
                  {getPaymentStatusLabel(order?.payment_status ?? "none")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: getStatusColor(order?.status) },
                  ]}
                >
                  {getOrderStatusLabel(order?.status ?? "none")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text
              style={[styles.colDesc, styles.infoLabel, { color: "#4b5563" }]}
            >
              DESKRIPSI PRODUK
            </Text>
            <Text
              style={[styles.colQty, styles.infoLabel, { color: "#4b5563" }]}
            >
              QTY
            </Text>
            <Text
              style={[styles.colPrice, styles.infoLabel, { color: "#4b5563" }]}
            >
              HARGA
            </Text>
            <Text
              style={[styles.colTotal, styles.infoLabel, { color: "#4b5563" }]}
            >
              SUBTOTAL
            </Text>
          </View>
          {items?.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={{ fontWeight: "bold" }}>{item.product_name}</Text>
                {item.variant_name && (
                  <Text style={{ fontSize: 7, color: "#2563eb" }}>
                    ({item.variant_name})
                  </Text>
                )}
              </View>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>
                {formatCurrency(
                  +(item?.price_rule_value ?? 0) + +(item?.variant_price ?? 0)
                )}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.variant_final_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary & Payment Information */}
        <View style={styles.flexRow}>
          <View style={styles.paymentSection}>
            <Text style={[styles.infoLabel, { color: "#374151" }]}>
              INFORMASI PEMBAYARAN
            </Text>
            <View style={styles.paymentCard}>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                Jenius (Bank SMBC Indonesia)
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "bold", marginVertical: 2 }}
              >
                90360019583
              </Text>
              <Text style={{ fontSize: 8, color: "#4b5563" }}>
                a.n Rizki Naufal
              </Text>
            </View>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.summaryItem}>
              <Text style={{ color: "#6b7280" }}>Total Tagihan</Text>
              <Text style={{ fontWeight: "bold" }}>
                {formatCurrency(total)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={{ color: "#6b7280" }}>Uang Muka (DP)</Text>
              <Text style={{ fontWeight: "bold", color: "#16a34a" }}>
                {formatCurrency(paid)}
              </Text>
            </View>
            <View style={styles.sisaBayar}>
              <Text style={{ fontWeight: 900 }}>SISA BAYAR</Text>
              <Text
                style={{
                  fontWeight: 900,
                  color: isPaidOff ? "#16a34a" : "#dc2626",
                }}
              >
                {formatCurrency(remain)}
              </Text>
            </View>
            {isPaidOff && (
              <Text
                style={{
                  textAlign: "right",
                  fontSize: 8,
                  fontWeight: 900,
                  color: "#16a34a",
                  marginTop: 4,
                }}
              >
                ✓ PESANAN LUNAS
              </Text>
            )}
          </View>
        </View>

        {/* Footer Cetak & S&K */}
        <View style={styles.footerCetak}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, marginBottom: 5 }}>
              Link akses:{" "}
              <Text style={{ color: "#2563eb" }}>
                kinau.id/public/drive-link/{order?.order_number}
              </Text>
            </Text>
            <Text
              style={[styles.infoLabel, { color: "#6b7280", marginBottom: 2 }]}
            >
              SYARAT & KETENTUAN:
            </Text>
            <View style={{ fontSize: 7, color: "#9ca3af" }}>
              <Text>
                1. Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
              </Text>
              <Text>
                2. Bukti nota ini sah sebagai bukti pengambilan barang.
              </Text>
              <Text>
                3. Nota ini digunakan untuk claim garansi atau cetak ulang cacat
                produksi.
              </Text>
              <Text>4. Cap basah dapat diminta saat pengambilan barang.</Text>
            </View>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 30 }}>
              Hormat Kami,
            </Text>
            <View style={styles.signature}>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                Admin Kinau.id
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Info (Fixed Bottom) */}
        <View style={styles.contactContainer}>
          <Text style={{ fontSize: 8, fontWeight: "bold", color: "#374151" }}>
            HUBUNGI KAMI
          </Text>
          <View style={styles.contactGrid}>
            <Text>WhatsApp: {ADMIN_WA}</Text>
            <Text>Instagram: @kinauid</Text>
            <Text>Email: admin@kinau.id</Text>
            <Text>Website: www.kinau.id</Text>
          </View>
          <Text style={{ fontSize: 7, color: "#9ca3af", marginTop: 4 }}>
            Jalan Terusan Jl. Murai 1 No.7 , Kel. Korpri Raya, Kec. Sukarame,
            Bandar Lampung.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

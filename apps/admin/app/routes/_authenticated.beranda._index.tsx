import { useOutletContext } from "react-router";
import type { MetaFunction } from "react-router";
import {
  Circle,
  Database,
  FileText,
  Globe,
  Server,
} from "lucide-react";
import { Badge } from "~/components/shared/components/Badge";
import { Card } from "~/components/shared/components/Card";
import type { SessionData } from "~/lib/session.server";
import { BRAND_NAME } from "~/constants/brand";

export const meta: MetaFunction = () => [{ title: `Beranda — ${BRAND_NAME}` }];

const STATS = [
  { label: "Domain", value: "kinau.id", hint: "pantau masa berlaku", icon: Globe, tone: "profit" as const },
  { label: "Hosting", value: "—", hint: "modul segera hadir", icon: Server, tone: "neutral" as const },
  { label: "Database", value: "—", hint: "modul segera hadir", icon: Database, tone: "neutral" as const },
  { label: "Dokumen", value: "—", hint: "pajak & surat", icon: FileText, tone: "neutral" as const },
];

const COVERAGE = [
  { label: "Kelola domain kinau.id — expired, tgl pembelian, harga" },
  { label: "Kelola hosting & database" },
  { label: "Pajak & administrasi keuangan" },
  { label: "Surat-menyurat & arsip dokumen" },
];

export default function BerandaRoute() {
  const { user } = useOutletContext<{ user: SessionData }>();

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header halaman */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono font-bold uppercase tracking-tight">
              Beranda
            </h1>
            <Badge tone="profit">Backstage</Badge>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Halo, {user.user_name} — ringkasan backstage PT Kinau Digital Kreatif.
          </p>
        </div>
        <Badge tone="neutral">{user.user_role || "admin"}</Badge>
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, value, hint, icon: Icon, tone }) => (
          <Card key={label}>
            <Card.Body className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                  {label}
                </span>
                <Icon size={14} className="text-[var(--muted-foreground)]" />
              </div>
              <p className="text-2xl font-mono font-bold">{value}</p>
              <Badge tone={tone}>{hint}</Badge>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Tenggat + cakupan */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <Card.Header>
            <Card.Title>Jatuh Tempo Terdekat</Card.Title>
            <Badge tone="neutral">0 tenggat</Badge>
          </Card.Header>
          <Card.Body>
            <p className="text-xs text-[var(--muted-foreground)]">
              Belum ada tenggat tercatat. Perpanjangan domain, tagihan hosting,
              dan jadwal pajak akan muncul di sini setelah modulnya dihubungkan.
            </p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Cakupan Backstage</Card.Title>
            <Badge tone="default">0/{COVERAGE.length}</Badge>
          </Card.Header>
          <Card.Body className="space-y-2.5">
            {COVERAGE.map(({ label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Circle size={14} className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
                <span className="text-xs font-mono text-[var(--foreground)]">
                  {label}
                </span>
              </div>
            ))}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

# Customer Mobile-First Layout + API Context

Dokumen ini adalah context ringkas untuk AI agent yang perlu meniru master UI dengan prefix route `customer` dan menyiapkan API stack di project baru.

Sumber utama di project ini:

- `app/routes/customer.tsx` untuk shell/layout mobile-first.
- `app/app.css` untuk palette CSS variable customer.
- `app/routes/customer.dashboard.tsx` dan `app/components/features/customer-dashboard/` untuk contoh halaman customer.
- `README.md` bagian `APIProviderV2` dan `AI Agent Bridge`.
- `API.md` bagian endpoint `agent-query`, `agent-schema`, `agent-tables`, dan template zygote table.
- `app/nexus/core/api-provider-v2.ts` untuk implementasi provider RESTful.
- `app/nexus/modules/agent.server.ts` untuk bridge raw SQL server-only.

## 1. Prinsip Layout Customer

Layout customer adalah mobile-first dan diperlakukan seperti app di dalam layar browser. Jangan memulai dari layout desktop lalu mengecilkan; semua surface utama harus nyaman di viewport ponsel.

Gunakan route prefix:

```txt
/customer
/customer/dashboard
/customer/orders
/customer/profile
/customer/configure
```

Shell utama:

```tsx
<div className="min-h-screen bg-[var(--customer-bg)] text-[var(--customer-text)]">
  <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--customer-bg)] shadow-[0_0_40px_rgba(30,67,76,0.08)]">
    <header className="shrink-0 px-5 pb-4 pt-6">...</header>
    <main className="flex-1 overflow-y-auto px-5 pb-24">...</main>
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-3 border-t border-[var(--customer-border)] bg-white/95 px-6 pb-3 pt-2 shadow-[0_-16px_40px_rgba(30,67,76,0.08)] backdrop-blur">...</nav>
  </div>
</div>
```

Ukuran penting:

| Area | Class yang dipakai | Catatan |
| --- | --- | --- |
| App shell | `w-full max-w-[430px]` | Width master customer. Pakai ini, bukan `lg:max-w-*`. |
| Main padding | `px-5 pb-24` | `pb-24` memberi ruang untuk bottom nav fixed. |
| Header padding | `px-5 pb-4 pt-6` | Header hanya tampil di halaman non-detail. |
| Bottom nav | `fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2` | Nav terkunci di bawah dan sejajar dengan shell. |
| Bottom nav grid | `grid-cols-3 px-6 pb-3 pt-2` | Untuk `Beranda`, `Pesanan`, `Profil`. |
| Nav item | `min-h-14 rounded-2xl px-2 text-[10px] font-black` | Ikon lucide 18px, label kecil tebal. |
| Header action button | `h-11 w-11 rounded-2xl` | Dipakai untuk notifikasi/action icon. |
| Notification popover | `w-[310px] rounded-[26px]` | Tetap di dalam shell sempit. |

Gunakan breakpoint Tailwind hanya jika konten memang butuh peningkatan layout di area yang lebih lebar. Untuk customer master, default-nya tetap `max-w-[430px]`; hindari `lg:max-w-*`, `xl:max-w-*`, atau `2xl:max-w-*` pada shell customer karena akan merusak rasa mobile app.

## 2. Halaman Detail

Halaman konfigurasi dan detail order menyembunyikan header dan bottom nav agar flow terasa seperti wizard/transaction screen.

Pattern:

```tsx
const isConfigurePage = location.pathname.includes("/customer/configure");
const isOrderDetailPage =
  location.pathname.includes("/customer/orders") &&
  new URLSearchParams(location.search).has("detail");
const isDetailPage = isConfigurePage || isOrderDetailPage;

<header className={isDetailPage ? "hidden" : "shrink-0 px-5 pb-4 pt-6"} />
<main className={["flex-1 overflow-y-auto px-5 pb-24", isDetailPage ? "pt-6" : ""].join(" ")} />
{!isConfigurePage && !isOrderDetailPage && <nav>...</nav>}
```

## 3. Pola Surface dan Komponen

Gunakan card compact dengan radius besar, border tipis, dan shadow ringan:

```txt
rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm
rounded-[26px] border border-[var(--customer-border)] bg-white shadow-sm
rounded-[22px] bg-[var(--customer-bg)] px-3 py-3
```

Pattern umum:

- Section card: `rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm`
- Empty state: `rounded-[26px] border border-dashed border-[var(--customer-border)] bg-white py-10 text-center`
- Small data tile: `rounded-[18px] bg-[var(--customer-bg)] px-3 py-2`
- Two action buttons: `grid grid-cols-2 gap-2`
- Media thumbnail: `relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[var(--customer-border)] bg-[var(--customer-bg)]`
- Horizontal product carousel: `-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
- Product card width: `w-[230px] shrink-0 snap-center`

Gunakan ikon dari `lucide-react`. Ukuran yang sering dipakai:

- Bottom nav icon: `size={18}` dengan `strokeWidth={2.5}`.
- Header action icon: `size={20}`.
- Small chip/icon: `size={12}` sampai `size={16}`.
- Empty state icon: `size={28}`.

## 4. Typography

Typography customer padat dan tebal:

```txt
text-[9px] font-black uppercase tracking-widest
text-[10px] font-black uppercase tracking-[0.18em]
text-[11px] font-semibold leading-5
text-xs font-semibold
text-sm font-black
text-base font-black
text-xl font-black
```

Aturan:

- Label metadata kecil: `text-[9px]` atau `text-[10px]`, `uppercase`, `font-black`.
- Body helper text: `text-[11px]` atau `text-xs`, `font-semibold`, `leading-5`.
- Judul card: `text-sm` sampai `text-base`, `font-black`.
- Gunakan `truncate`, `line-clamp-1`, atau `line-clamp-2` untuk konten dinamis.

## 5. Customer Color Palette

Palette master ada di `app/app.css`. Semua UI prefix customer wajib memakai CSS variable, bukan hardcode hex langsung di komponen.

```css
:root {
  --customer-primary: #1E434C;
  --customer-primary-hover: #163338;
  --customer-primary-light: rgba(30, 67, 76, 0.1);

  --customer-accent: #0097B2;
  --customer-accent-hover: #007A91;
  --customer-accent-light: rgba(0, 151, 178, 0.1);

  --customer-bg: #F3F8FC;
  --customer-card: #FFFFFF;
  --customer-card-hover: #F8FBFE;

  --customer-text: #1E293B;
  --customer-text-muted: #64748B;
  --customer-text-light: #94A3B8;

  --customer-border: #E2E8F0;
  --customer-border-active: rgba(0, 151, 178, 0.3);

  --customer-success: #10B981;
  --customer-warning: #F59E0B;
  --customer-danger: #EF4444;
}
```

Tailwind usage:

```tsx
bg-[var(--customer-primary)]
hover:bg-[var(--customer-primary-hover)]
bg-[var(--customer-accent)]
text-[var(--customer-accent)]
bg-[var(--customer-accent-light)]
bg-[var(--customer-bg)]
text-[var(--customer-text-muted)]
border-[var(--customer-border)]
focus-within:ring-[var(--customer-border-active)]
```

## 6. Customer Route Auth Pattern

Parent route `/customer` membaca auth session, menolak anonymous, dan redirect non-customer ke dashboard admin.

```tsx
import { redirect, type LoaderFunctionArgs } from "react-router";
import { getOptionalUser } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const authData = await getOptionalUser(request);

  if (!authData?.user) {
    throw redirect("/login");
  }

  const user =
    typeof authData.user === "string" ? JSON.parse(authData.user) : authData.user;

  if (user?.role !== "customer") {
    throw redirect("/app/overview");
  }

  return {
    user: {
      fullname: user?.fullname || "Pelanggan",
      email: user?.email || "",
      role: user?.role || "customer",
      phone: user?.phone || "",
    },
    token: authData?.token || "",
  };
}
```

Child route mengambil user dari outlet:

```tsx
import { useOutletContext } from "react-router";

type CustomerContext = {
  user: { fullname?: string; email?: string };
  token?: string;
};

const { user, token } = useOutletContext<CustomerContext>();
```

## 7. APIProviderV2 Setup

`APIProviderV2` adalah RESTful engine untuk `https://data.kinau.id/apicore-latest`.

File yang perlu dibuat/disalin di project baru:

```txt
app/nexus/core/api-provider-v2.ts
app/nexus/core/config.ts
app/nexus/core/helpers.ts
app/nexus/index.ts
app/nexus/index.server.ts
```

Config minimum:

```ts
// app/nexus/core/config.ts
export const API_URL_V2 = "https://data.kinau.id/apicore-latest";
export const API_KEY = "REPLACE_WITH_STRONG_KEY";
```

Provider factory:

```ts
export const APIProviderV2 = (session: any) => new APIProviderV2Builder(session);
```

Import:

```ts
import { APIProviderV2 } from "~/nexus";
// atau
import { APIProviderV2 } from "~/nexus/core/api-provider-v2";
```

Response dari `Result()` di-normalisasi menjadi isi `result.data` plus:

```ts
{
  status: number;
  success: boolean;
  error_message: string | null;
}
```

## 8. APIProviderV2 Usage

SELECT sederhana memakai GET:

```ts
const result = await APIProviderV2(session)
  .Table("orders")
  .Select({
    page: 0,
    size: 10,
    where: { status: "pending", deleted_on: "null" },
  })
  .Result();

const items = result?.items || [];
```

SELECT dengan include/columns/orderBy/groupBy/search otomatis memakai POST:

```ts
const result = await APIProviderV2(session)
  .Table("orders")
  .Select({
    where: { status: "active" },
    columns: ["id", "order_number", "status"],
    include: [
      {
        table: "order_items",
        alias: "items",
        foreign_key: "order_number",
        reference_key: "order_number",
        columns: ["product_name", "qty", "price"],
        where: { deleted_on: "null" },
      },
    ],
    orderBy: ["created_on", "DESC"],
    page: 0,
    size: 10,
  })
  .Result();
```

INSERT:

```ts
await APIProviderV2(session)
  .Table("orders")
  .Insert({ order_number: "ORD-999", status: "pending" })
  .Result();
```

BULK INSERT:

```ts
await APIProviderV2(session)
  .Table("order_items")
  .BulkInsert({
    rows: [{ order_number: "ORD-001", product_id: 1, qty: 10 }],
    updateOnDuplicate: true,
    with_id: false,
  })
  .Result();
```

UPDATE:

```ts
await APIProviderV2(session)
  .Table("orders")
  .Update({ data: { status: "confirmed" }, where: { id: 123 } })
  .Result();
```

DELETE:

```ts
await APIProviderV2(session)
  .Table("orders")
  .Delete({ where: { id: 123 } })
  .Result();
```

Upload:

```ts
const formData = new FormData();
formData.append("file", file);

await APIProviderV2(session)
  .Upload(formData)
  .Result();
```

Retry dan timeout:

```ts
await APIProviderV2(session)
  .Table("orders")
  .Select({ page: 0, size: 10 })
  .Retry(3, 1000)
  .Timeout(15000)
  .Result();
```

## 9. Nexus Module Pattern

Untuk project baru, buat module per table/domain di `app/nexus/modules/`.

```ts
// app/nexus/modules/product.ts
import { APIProviderV2 } from "../core/api-provider-v2";

export const ProductAPI = {
  get: async ({ session, req }: { session?: any; req?: any } = {}) => {
    return APIProviderV2(session)
      .Table("products")
      .Select({
        page: req?.query?.page ?? 0,
        size: req?.query?.size ?? 10,
        where: {
          ...(req?.query?.show_in_dashboard !== undefined && {
            show_in_dashboard: req.query.show_in_dashboard,
          }),
          deleted_on: "null",
        },
      })
      .Result();
  },
};
```

Register di browser-safe index jika module tidak memakai `.server.ts`:

```ts
// app/nexus/index.ts
import { ProductAPI } from "./modules/product";

export const API = {
  PRODUCT: ProductAPI,
};
```

Register server-only module di `index.server.ts`:

```ts
// app/nexus/index.server.ts
import { AgentAPI } from "./modules/agent.server";

export const API = {
  AGENT: AgentAPI,
};
```

Jangan import module `.server.ts` dari `app/nexus/index.ts` karena akan kebundle ke browser.

## 10. Customer Loader dengan API Module

Contoh route customer dashboard:

```tsx
import { useLoaderData, useOutletContext } from "react-router";
import { API } from "~/nexus";
import CustomerDashboardFeature from "~/components/features/customer-dashboard/CustomerDashboardFeature";

export async function loader() {
  const [productsRes, ordersRes] = await Promise.all([
    API.PRODUCT.get({
      req: { query: { page: 0, size: 10, show_in_dashboard: 1 } },
    }),
    API.ORDERS.get({
      req: {
        query: {
          status: "done",
          is_portfolio: "1",
          page: 0,
          size: 6,
          pagination: "true",
        },
      },
    }),
  ]);

  return {
    products: productsRes?.items || [],
    productionItems: ordersRes?.items || [],
  };
}
```

## 11. Agent Query Bridge API

`AgentAPI` adalah bridge server-only untuk raw SQL ke:

```txt
https://data.kinau.id/apicore-latest/agent-query
https://data.kinau.id/apicore-latest/agent-schema
https://data.kinau.id/apicore-latest/agent-tables
```

File:

```txt
app/nexus/modules/agent.server.ts
```

Auth wajib dual-layer:

```txt
Authorization: Bearer REPLACE_WITH_STRONG_KEY
x-agent-key: REPLACE_WITH_AGENT_KEY
```

Jangan expose `AgentAPI` ke browser. Import hanya dari:

```ts
import { API } from "~/nexus/index.server";
```

Query single:

```ts
const result = await API.AGENT.query({
  sql: "SELECT * FROM orders WHERE status = 'pending' LIMIT 10",
});
```

DDL/DML:

```ts
const result = await API.AGENT.query({
  sql: "UPDATE orders SET status = 'confirmed' WHERE id = 5",
});
```

Batch:

```ts
const result = await API.AGENT.query({
  sql: [
    "SHOW TABLES",
    "DESCRIBE orders",
    "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'",
  ],
});
```

Schema:

```ts
const allSchema = await API.AGENT.schema({});
const orderSchema = await API.AGENT.schema({ tables: ["orders", "order_items"] });
```

Tables:

```ts
const tables = await API.AGENT.tables();
```

Response SELECT/SHOW:

```json
{ "success": true, "type": "query", "rows": [], "row_count": 10 }
```

Response DDL/DML:

```json
{ "success": true, "type": "execute", "affected_rows": 1 }
```

Error:

```json
{ "success": false, "error": "Table 'xyz' doesn't exist" }
```

## 12. Agent Query Safety Rules

Gunakan `APIProviderV2` untuk CRUD standar. Gunakan `AgentAPI` hanya untuk:

- Query kompleks seperti JOIN, subquery, aggregate.
- Investigasi data/debugging.
- Schema migration.
- Batch operations.
- AI-driven data analysis yang memang butuh SQL mentah.

Larangan:

- Jangan panggil `agent-query` langsung dari komponen browser.
- Jangan menaruh `AGENT_KEY` di client bundle.
- Jangan menjalankan `DROP`, `TRUNCATE`, `ALTER`, `CREATE`, atau bulk update tanpa review manusia.
- Jangan buat table baru tanpa template zygote di bawah.

## 13. Template Zygote Table

Jika membuat table baru via `agent-query`, struktur minimum wajib:

```sql
CREATE TABLE IF NOT EXISTS nama_tabel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- field bisnis di sini
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Contoh:

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(100),
  total_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('draft','sent','paid','cancelled') DEFAULT 'draft',
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Wajib:

- Kolom pertama `id INT AUTO_INCREMENT PRIMARY KEY`.
- Kolom akhir `created_on`, `modified_on`, `deleted`.
- Soft delete memakai `deleted TINYINT(1) DEFAULT 0`.

Hindari:

- Table tanpa `id`.
- Table tanpa timestamp.
- `deleted_on DATETIME` untuk table baru, kecuali backend project target memang sudah memakai kontrak berbeda.

## 14. Checklist untuk AI Agent

Sebelum membuat fitur customer baru:

- Pakai shell `max-w-[430px]`, bukan layout desktop.
- Pakai `px-5`, `pb-24`, bottom nav fixed `max-w-[430px]`.
- Pakai CSS variable `--customer-*`, bukan hardcode hex.
- Pakai card radius `rounded-[22px]` sampai `rounded-[30px]`.
- Pakai `lucide-react` untuk icon.
- Sembunyikan header/nav untuk flow detail atau wizard.
- Fetch server-side lewat `API` module atau `APIProviderV2`.
- Pisahkan browser-safe `app/nexus/index.ts` dan server-only `app/nexus/index.server.ts`.
- Pakai `AgentAPI` hanya di server dan hanya saat CRUD biasa tidak cukup.

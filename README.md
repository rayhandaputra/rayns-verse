# KINAU ID — ERP System Context

> **Dokumen ini adalah satu-satunya sumber kebenaran (single source of truth) untuk AI agent dan developer.**
> Semua context lama telah dikonsolidasi ke sini. Baca seluruh dokumen sebelum menulis kode apapun.

---

## 🧭 Project Overview

**KINAU ID** adalah sistem ERP (Enterprise Resource Planning) berbasis web untuk bisnis konveksi. Dibangun di atas React Router v7 (Remix-based) dengan backend PHP REST API.

**Domain bisnis yang dikelola:**

- Manajemen order (ID card, lanyard, kaos, custom, paket)
- Inventori & komoditas (bahan baku, stok, restock)
- Procurement & supplier
- Keuangan (jurnal, mutasi, gaji karyawan)
- Drive (manajemen file pelanggan & internal)
- CMS publik (katalog, twibbon, testimoni)
- Manajemen pengguna & autentikasi

---

## 🚀 Tech Stack

| Layer            | Teknologi                                         |
| :--------------- | :------------------------------------------------ |
| Framework        | React Router v7 (Remix-based) + Vite              |
| Styling          | Tailwind CSS (utility-first)                      |
| UI Primitives    | shadcn/UI (Radix + Tailwind)                      |
| State Management | Zustand (global UI & feature state)               |
| Animasi          | Motion (transisi & feedback interaktif)           |
| Auth             | Session-based via cookie (`session.server.ts`)    |
| Notifikasi       | Sonner (toast), SweetAlert2 (`app/utils/swal.ts`) |
| Charts           | ApexCharts via `ChartLazy` (SSR-safe)             |
| Backend          | PHP REST API di `https://data.kinau.web.id/api2`  |

---

## 🏗️ Struktur Direktori (Hierarki Ketat)

```
app/
├── nexus/                    ← ✅ CANONICAL: Satu-satunya API layer
│   ├── core/
│   │   ├── api-provider.ts   ← ✅ APIProvider (builder pattern) — SATU-SATUNYA FETCHER
│   │   ├── callApi.ts        ← ⚠️ DEPRECATED: Jangan pakai langsung
│   │   ├── config.ts         ← API_URL, API_KEY
│   │   ├── helpers.ts        ← generateHeader()
│   │   └── types.ts
│   ├── modules/              ← Domain modules (OrderAPI, ProductAPI, dll)
│   ├── index.ts              ← Browser-safe API hub (tanpa UserAPI/AuthAPI)
│   ├── index.server.ts       ← Server-only API hub (termasuk UserAPI, AuthAPI)
│   ├── nexus-client.ts       ← ⚠️ DEPRECATED: nexus() builder (gunakan useFetcherData langsung)
│   ├── nexus-client.types.ts
│   ├── api-client.tsx        ← ⚠️ DEPRECATED: useSWRLoader (jangan pakai untuk kode baru)
│   └── swr-loader.ts         ← ⚠️ DEPRECATED: SWR fetcher alternatif
│
├── components/
│   ├── ui/                   ← shadcn/UI primitives (stateless, atomic)
│   ├── core/                 ← Sidebar, Navbar, layout wrappers
│   ├── shared/               ← DataTableWrapper, FileUpload, GlobalAlert
│   ├── features/[feature]/   ← Komponen domain-spesifik
│   │   ├── [Feature]Feature.tsx   ← Entry point komponen
│   │   ├── use-[feature]-logic.ts ← State & API logic (hooks)
│   │   └── widgets/               ← Sub-komponen fitur
│   ├── layout/               ← Admin, Public, Manage layout wrappers
│   ├── print/                ← Template cetak (Nota, Receipt, Order)
│   ├── drive/                ← FolderCard, FileRow (file explorer)
│   └── Chart/                ← ChartLazy, ChartWrapper (SSR-safe)
│
├── hooks/                    ← Reusable hooks lintas fitur
│   ├── use-fetcher-data.ts   ← ✅ WAJIB untuk client-side data fetching
│   ├── use-modal.ts
│   ├── use-mobile.ts
│   └── ...
│
├── routes/                   ← "Thin" route handlers (max 150 baris)
│   ├── api.nexus.tsx         ← Universal API gateway (GET + POST)
│   ├── app.tsx               ← Root layout app
│   ├── app.order-*.tsx       ← Order lifecycle routes
│   ├── app.finance.*.tsx     ← Finance routes
│   ├── app.procurement.*.tsx ← Procurement routes
│   └── ...
│
├── types/                    ← TypeScript interfaces per domain
│   ├── core-entities.ts
│   ├── supporting-entities.ts
│   └── ...
│
├── constants/                ← Static data, Enums, Navigation config
├── schemas/                  ← Zod validation & Schema-to-UI config
├── utils/                    ← Pure functions (formatters, crypto, helpers)
├── context/                  ← React context providers
└── lib/
    ├── api/                  ← ⚠️ LEGACY — Jangan tambah modul baru di sini
    │   ├── client.ts         ← ⚠️ LEGACY APIProvider (config-based, deprecated)
    │   ├── core/callApi.ts   ← ⚠️ LEGACY callApi
    │   └── modules/          ← ⚠️ LEGACY modules (duplikat dari nexus/modules)
    └── ...                   ← Utilities lain (session, auth, pdf, dll)
```

---

## ⚠️ CRITICAL: Satu Pintu — `APIProvider(session).Result()`

Semua data fetching **wajib** melalui satu interface: `APIProvider` dari `app/nexus/core/api-provider.ts`.

### ✅ CANONICAL: `app/nexus/core/api-provider.ts`

```ts
import { APIProvider } from "~/nexus";
// atau
import { APIProvider } from "~/nexus/core/api-provider";

// Builder pattern — SATU-SATUNYA CARA FETCH DATA
await APIProvider(session)
  .Endpoint("POST", "select", "orders")
  .Data({ where: { id }, columns: [...] })
  .Result();
```

- Menerima `session` sebagai parameter (auto-attach auth headers)
- Builder pattern: `.Endpoint().Data().Retry().Timeout().Result()`
- Retry logic + exponential backoff + timeout (15s default)
- Digunakan oleh **semua** `app/nexus/modules/*.ts`

### ⚠️ DEPRECATED — Jangan Tambah Penggunaan Baru

| File                          | Alasan Deprecated                                                                                                                                 |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/lib/api/client.ts`       | Config-based pattern lama, duplikat fungsionalitas                                                                                                |
| `app/nexus/client.ts`         | Duplikat dari `app/lib/api/client.ts`                                                                                                             |
| `app/nexus/nexus-client.ts`   | Builder URL (`nexus()`) — masih boleh dipakai di komponen existing, tapi untuk kode baru gunakan `useFetcherData` langsung dengan endpoint string |
| `app/nexus/api-client.tsx`    | SWR-based fetcher, tidak konsisten dengan pattern utama                                                                                           |
| `app/nexus/swr-loader.ts`     | SWR fetcher alternatif, redundan                                                                                                                  |
| `app/nexus/core/callApi.ts`   | Low-level fetcher tanpa retry/timeout                                                                                                             |
| `app/lib/api/core/callApi.ts` | Legacy callApi                                                                                                                                    |

### Aturan Migrasi

- Modul baru → **selalu** di `app/nexus/modules/` dengan `APIProvider(session)` dari `~/nexus`
- Komponen yang masih import `~/lib/api` → migrasi ke `~/nexus` saat menyentuh file tersebut
- `app/lib/api/modules/` adalah duplikat dari `app/nexus/modules/` — **jangan edit keduanya**, edit hanya yang di `nexus/`
- `nexus()` builder di komponen existing → boleh tetap, tapi kode baru langsung pakai `useFetcherData({ endpoint: "/api/nexus?module=X&action=Y" })`

---

## 🔌 Arsitektur API (3 Layer)

### Layer 1 — Core: `app/nexus/core/api-provider.ts`

Satu-satunya fetcher. Semua module WAJIB menggunakan ini.

```ts
// APIProvider — builder pattern (SATU PINTU)
await APIProvider(session)
  .Endpoint("POST", "action", "table")
  .Data(payload)
  .Retry(3, 1000) // opsional, default 3x
  .Timeout(15000) // opsional, default 15s
  .Result();
```

### Layer 2 — Modules: `app/nexus/modules/*.ts`

Business logic per domain. Dipanggil dari route loaders/actions.

```ts
// Contoh: app/nexus/modules/order.ts
export const OrderAPI = {
  get: async ({ session, req }) => { ... },
  create: async ({ session, req }) => { ... },
  update: async ({ session, req }) => { ... },
  delete: async ({ session, req }) => { ... },
};
```

**Konvensi method yang wajib diikuti:**

- `get` — select/listing (support pagination, search, filter)
- `create` — insert (handle ID generation, defaults)
- `update` — modifikasi
- `delete` — soft delete (set `deleted_on`)

### Layer 3 — Gateway: `app/routes/api.nexus.tsx`

Satu route untuk semua module. Menerima `module` dan `action` sebagai query params.

```
GET  /api/nexus?module=ORDERS&action=get&page=0&size=10
POST /api/nexus  { module: "ORDERS", action: "create", ...data }
```

### Response Format dari Backend PHP

Semua response dari API mengikuti struktur ini:

```json
{
  "status": 200,
  "error_message": "",
  "data": {
    "total_items": 25,
    "items": [ ... ],
    "total_pages": 3,
    "current_page": 0
  }
}
```

**Penting untuk debugging:**

- Data aktual ada di `response.data.items` (array), **bukan** langsung di `response.data`
- Jika data tidak muncul di UI, pastikan akses sampai level `.items`:

  ```ts
  // ❌ SALAH — data akan undefined/object bukan array
  const list = data;

  // ✅ BENAR — akses items dari dalam data
  const list = data?.items;
  const total = data?.total_items;
  const pages = data?.total_pages;
  ```

- `current_page` dimulai dari `0` (zero-indexed)
- `error_message` berisi string kosong jika sukses, atau pesan error jika gagal
- `status` mengikuti HTTP status code (200 = sukses)

---

## � Backend API Specification (PHP REST API)

**Endpoint:** `https://data.kinau.web.id/api2`

### Request Format

Semua request ke backend PHP menggunakan POST dengan JSON body:

```json
{
  "table": "orders",
  "action": "select",
  "page": 0,
  "size": 10,
  "where": { "status": "pending" },
  "columns": ["id", "order_number", "status"],
  "search": "ORD-001",
  "searchBy": "order_number"
}
```

### CRUD Operations

#### 1. SELECT (Read)

```ts
// Request
await APIProvider(session)
  .Endpoint("POST", "select", "orders")
  .Data({
    page: 0,
    size: 10,
    columns: ["id", "order_number", "status", "created_on"],
    where: { status: "pending", deleted_on: "null" },
    search: "ORD",
    searchBy: "order_number",
    orderBy: ["created_on", "DESC"]
  })
  .Result();

// Response
{
  "status": 200,
  "error_message": "",
  "data": {
    "total_items": 25,
    "items": [
      { "id": 1, "order_number": "ORD-001", "status": "pending", "created_on": "2026-05-20 10:00:00" },
      ...
    ],
    "total_pages": 3,
    "current_page": 0
  }
}
```

**Filter Operators:**

- `where: { id: 5 }` — Exact match
- `where: { id: "!=5" }` — Not equal
- `where: { id: "5,10,15" }` — IN clause
- `where: { id: "!=5,10" }` — NOT IN clause
- `where: { status: "like:pending" }` — LIKE search
- `where: { status: "null" }` — IS NULL
- `where: { status: "is_not_null" }` — IS NOT NULL
- `where: { price: ">=1000" }` — Greater than or equal
- `where: { "year:created_on": 2026 }` — Year filter
- `where: { "month:created_on": 5 }` — Month filter

**Includes (Subqueries/Joins):**

```ts
include: [
  {
    table: "order_items",
    alias: "items",
    foreign_key: "order_number",
    reference_key: "order_number",
    columns: ["id", "product_name", "qty"],
    where: { deleted_on: "null" },
  },
];
```

#### 2. INSERT (Create)

```ts
// Request
await APIProvider(session)
  .Endpoint("POST", "insert", "orders")
  .Data({
    data: {
      order_number: "ORD-999",
      status: "pending",
      created_on: "2026-05-20 10:00:00"
    }
  })
  .Result();

// Response
{
  "status": 200,
  "error_message": "",
  "data": {
    "insert_id": "123"
  }
}
```

#### 3. UPDATE (Modify)

```ts
// Request
await APIProvider(session)
  .Endpoint("POST", "update", "orders")
  .Data({
    data: {
      status: "confirmed",
      modified_on: "2026-05-20 11:00:00"
    },
    where: { id: 123 }
  })
  .Result();

// Response
{
  "status": 200,
  "error_message": "",
  "data": {
    "affected_rows": 1
  }
}
```

#### 4. DELETE (Soft Delete)

```ts
// Request
await APIProvider(session)
  .Endpoint("POST", "delete", "orders")
  .Data({
    where: { id: 123 }
  })
  .Result();

// Response
{
  "status": 200,
  "error_message": "",
  "data": {
    "deleted_rows": 1
  }
}
```

#### 5. BULK-INSERT (Batch Insert)

```ts
// Request
await APIProvider(session)
  .Endpoint("POST", "bulk-insert", "order_items")
  .Data({
    rows: [
      { order_number: "ORD-001", product_id: 1, qty: 10 },
      { order_number: "ORD-001", product_id: 2, qty: 5 }
    ],
    updateOnDuplicate: true,  // ON DUPLICATE KEY UPDATE
    with_id: false            // Exclude 'id' column
  })
  .Result();

// Response
{
  "status": 200,
  "error_message": "",
  "data": {
    "status": "ok",
    "affected_total": 2
  }
}
```

### Error Handling

```json
{
  "status": 400,
  "error_message": "Missing table or data",
  "data": null
}
```

**Common Status Codes:**

- `200` — Success
- `201` — Created
- `400` — Bad Request (missing params)
- `404` — Route not found
- `500` — Server error

---

## �📡 Cara Konsumsi API

### Di Loaders/Actions (Server-side)

```ts
// Import dari index.server.ts untuk akses UserAPI & AuthAPI
import { API } from "~/nexus/index.server";

// Pola: await API.MODULE.method({ session, req: { body/query: data } })
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const data = await API.ORDERS.get({
    session,
    req: { query: { page: 0, size: 10 } },
  });
  return { data };
}
```

### Di Components (Client-side)

```ts
// WAJIB: useFetcherData — client-side data fetching
import { useFetcherData } from "~/hooks/use-fetcher-data";

function OrderList() {
  // Cara langsung (recommended untuk kode baru)
  const { data, loading } = useFetcherData({
    endpoint: "/api/nexus",
    params: { module: "ORDERS", action: "get", page: 0, size: 10 },
  });

  // Akses data: data?.items, data?.total_items
}
```

### Form Submissions

```ts
// Gunakan Remix Form atau fetcher.submit → trigger route action → panggil API module
import { Form, useFetcher } from "react-router";

// Di route action:
export async function action({ request }) {
  const session = await getSession(request);
  const body = await request.formData();
  return await API.ORDERS.create({
    session,
    req: { body: Object.fromEntries(body) },
  });
}
```

---

## ❌ Anti-Pattern yang Dilarang

| Anti-Pattern                                            | Pengganti yang Benar                                                                      |
| :------------------------------------------------------ | :---------------------------------------------------------------------------------------- |
| `fetch(url, {...})` langsung di komponen                | `useFetcherData` dengan endpoint `/api/nexus`                                             |
| `axios.get(...)`                                        | `useFetcherData` dengan endpoint `/api/nexus`                                             |
| Hardcode URL string: `"/api/nexus?module=ORDERS&..."`   | `useFetcherData({ endpoint: "/api/nexus", params: { module: "ORDERS", action: "get" } })` |
| Logic DB (where, join, filter) di route loader          | Pindahkan ke `app/nexus/modules/`                                                         |
| Import `~/lib/api` untuk kode baru                      | Import dari `~/nexus`                                                                     |
| `APIProvider({ endpoint, table, body })` (config-based) | `APIProvider(session).Endpoint().Data().Result()`                                         |
| `nexus().module().action().build()` untuk kode baru     | `useFetcherData` langsung dengan params object                                            |
| `console.log` tersisa di production code                | Hapus sebelum commit                                                                      |
| `setState` di dalam `useEffect` tanpa guard             | Gunakan `useMemo` untuk derived state                                                     |
| File komponen > 150 baris                               | Pecah menjadi sub-komponen                                                                |
| `ModalSecond`, `Modal`, atau modal custom lain          | `ModalShell` dari `~/components/modal/ModalShell`                                         |

---

## 🎨 Design System: "Finance Blue"

### Color Palette (OKLCH)

| Token              | Hex                                         | Penggunaan                      |
| :----------------- | :------------------------------------------ | :------------------------------ |
| `background`       | `#F3F8FC`                                   | Latar halaman (Cool White-Blue) |
| `primary`          | `#1E434C`                                   | Card utama, judul, hero section |
| `primary-gradient` | `linear-gradient(135deg, #1E434C, #35606B)` | Hero section                    |
| `accent`           | `#0097B2`                                   | FAB, indikator aktif, link      |
| `card`             | `#FFFFFF`                                   | Card surface dengan soft shadow |
| `foreground`       | `#1E293B`                                   | Teks utama (dilarang `#000000`) |
| `secondary`        | `#E2EEF7`                                   | Tombol filter tidak aktif       |
| `destructive`      | —                                           | Error, hapus, status kritis     |

### Visual Rules

- **Rounded:** `rounded-2xl` (24px) untuk container besar, `rounded-lg` untuk card
- **Glassmorphism:** `bg-white/10 backdrop-blur-md` untuk inner card di hero
- **Shadow:** `shadow-sm` atau `shadow-md` (ambient, sangat halus)
- **Separator:** Gunakan perubahan warna background (tonal), **bukan** border 1px
- **Iconography:** Container `rounded-2xl` dengan latar pastel transparan per kategori

### Mobile-First Layout (App-Shell Pattern)

- Desktop: `max-w-md mx-auto` — konten terpusat seperti native app
- Mobile: `w-full` — full-width
- Page background: `min-h-screen bg-[#F3F8FC]`
- Bottom nav: `fixed bottom-0` dengan safe-area inset

### Z-Index Tokens

| Layer   | Value |
| :------ | :---- |
| Sidebar | 40    |
| Navbar  | 50    |
| Modal   | 70    |
| Toast   | 90    |

---

## 🤖 Aturan Wajib untuk AI Agent

### Sebelum Membuat Komponen Baru

1. Cek `app/components/shared/widgets/` — apakah widget serupa sudah ada?
2. Cek `app/components/features/[feature]/widgets/` — apakah sudah ada di fitur terkait?
3. Cek `app/components/ui/` — apakah primitive shadcn sudah tersedia?

### Struktur Fitur Baru

Setiap fitur baru di `app/components/features/[feature-name]/` harus mengikuti pola:

```
features/[feature-name]/
├── [Feature]Feature.tsx      ← Entry point, max 150 baris
├── use-[feature]-logic.ts    ← Semua state & API calls
└── widgets/
    ├── README.md             ← WAJIB: daftar semua widget
    └── [Widget].tsx
```

**Widget README Format:**

```markdown
### Widget: [WidgetName]

- File: `[FileName].tsx`
- Function: [Deskripsi singkat]
- Props: `[PropName]: [Type]`
```

### Coding Rules

1. **150-Line Rule:** File > 150 baris harus dipecah
2. **No Direct Fetch:** Selalu `useFetcherData` di komponen, `APIProvider(session).Result()` di modules
3. **Slim Routes:** Route handler max 150 baris, logic di hooks/nexus
4. **Bahasa UI:** Label, placeholder, notifikasi → Bahasa Indonesia. Kode, variabel, fungsi → Bahasa Inggris
5. **Warna:** Selalu gunakan variabel Tailwind/token, bukan hardcode hex
6. **No console.log:** Hapus semua sebelum selesai
7. **Derived State:** Gunakan `useMemo`, bukan `useEffect + useState`
8. **Stabilisasi:** `useCallback` untuk functions, `useMemo` untuk objects/arrays di dependency list
9. **Satu Pintu API:** Semua fetch server-side HANYA via `APIProvider(session).Endpoint().Data().Result()`

### Audit Checklist (Wajib Sebelum Selesai)

- [ ] Menggunakan `useFetcherData`? (wajib untuk client-side fetch)
- [ ] Server-side fetch via `APIProvider(session).Endpoint().Data().Result()`?
- [ ] Warna menggunakan variabel Tailwind? (wajib)
- [ ] Tidak ada `console.log` tersisa?
- [ ] Tidak ada file > 150 baris?
- [ ] Import dari `~/nexus` (bukan `~/lib/api`)?
- [ ] Logic DB ada di `app/nexus/modules/`, bukan di route?
- [ ] Tidak ada import dari deprecated files (`nexus-client.ts`, `swr-loader.ts`, `api-client.tsx`)?

---

## 🗄️ Database Schema: `kinn6844_convections`

### Kontrak Global

Setiap tabel WAJIB memiliki: `id`, `created_on`, `modified_on`, `deleted_on` (soft-delete).

### Core Tables

- **orders**: `id, uid, order_number, institution_id, institution_name, institution_abbr, institution_domain, payment_status (none|unpaid|paid|down_payment|refunded|cancelled), payment_method, payment_reference, payment_proof, payment_proof_uploaded_on, payment_detail, payment_journal_code, dp_payment_method, dp_payment_detail, dp_payment_proof, dp_payment_proof_uploaded_on, dp_payment_journal_code, payment_due_date, discount_code, discount_type, discount_value, tax_percent, tax_value, shipping_fee, other_fee, subtotal, total_amount, dp_amount, grand_total, order_type (package|id_card|lanyard|custom|service), order_date, deadline, status (ordered|confirmed|in_production|qc|ready|shipped|delivered|done|rejected|cancelled|pending), status_printed, notes, images, drive_folder_id, pic_name, pic_phone, review, rating, shipping_address, shipping_contact, created_by, is_archive, is_portfolio, is_sponsor, is_kkn, kkn_source, kkn_period, kkn_year, is_personal, kkn_type, kkn_detail`
- **order_items**: `id, order_number, product_id, category_id, category_name, price_rule_id, price_rule_min_qty, price_rule_value, variant_id, variant_name, variant_price, variant_final_price, product_name, product_type (single|package|material|custom|addon), qty, unit_price, discount_type, discount_value, tax_percent, subtotal, discount_total, tax_value, total_after_tax, notes`
- **products**: `id, category_id, category_name, uid, code, name, image, description, type (single|package|material), show_in_dashboard, subtotal, hpp_price, discount_value, tax_fee, other_fee, total_price`
- **users**: `id, fullname, email, role (admin|user|manager|staff|developer|ceo), session_token, session_expired, is_active`
- **user_auth**: `id, user_id, email, password_hash, email_verified, last_login, failed_attempt, locked_until, session_token_hash, session_expired_at, session_ip, session_user_agent`

### Supporting Tables

- **accounts**: `id, uid, code, name, ref_account_number, ref_account_holder, is_bank, group_code, group_type (asset|liability|equity|income|expense), group_name, is_editable`
- **account_groups**: `id, uid, code, name, level, parent_id`
- **account_ledgers**: `id, uid, group_code, group_name, coa_code, coa_name, debit, credit, balance`
- **account_ledger_journals**: `id, uid, journal_code, journal_number, journal_date, description`
- **account_ledger_mutations**: `id, journal_code, trx_code, trx_date, ledger_id, account_code, account_name, category, notes, receipt_url, debit, credit`
- **assets**: `id, asset_name, category, purchase_date, location, status (Good|Damaged|Maintenance), total_value, total_unit`
- **bank_account**: `id, bank_name, account_number, holder_name`
- **cms_contents**: `id, title, slug, image, image_gallery, description, link, type (highlight-event|news|hero-section|testimonial|partner|cta-banner|stats), seq, total_order, value, suffix, icon_type, promotion_type, is_active`
- **commodities**: `id, uid, component_id, code, name, unit, conversion_factor, base_price`
- **components**: `id, code, name, unit, stock_qty, requirement_per_pkt`
- **discount_codes**: `id, code, name, description, discount_type (percentage|amount), discount_value, max_discount_amount, min_order_amount, valid_from, valid_until, user_limit, active`
- **employees**: `id, name, structural, phone, status (active|inactive|on_leave)`
- **employee_attendances**: `id, employee_id, employee_name, presence_date, time_in, time_out, location_lat_in, location_long_in, selfie_path, presence_status (present|permit|sick|absent)`
- **employee_salaries**: `id, employee_id, employee_name, base_salary, allowances, payment_type (monthly|daily)`
- **employee_salary_slips**: `id, employee_id, employee_name, period, payment_type, work_days_count, paid_base_salary, variable_allowances, deductions, net_salary, payment_status (pending|paid|failed)`
- **institutions**: `id, uid, name, abbr`
- **institution_domains**: `id, institution_id, domain, is_primary`
- **order_twibbon_assignments**: `id, order_trx_code, unique_code, twibbon_template_id, twibbon_template_name, category (idcard|lanyard), public_url_link`
- **order_upload_files**: `id, code, order_number, folder_id, folder_name, folder_purpose (id_card_front|id_card_back|lanyard), product_id, product_name, file_type (front|back|lanyard), file_url, file_name`
- **order_upload_folders**: `id, uid, order_number, folder_name, parent_id, level, product_id, product_name, purpose (id_card_front|id_card_back|lanyard|sablon_front|sablon_back), created_by`
- **product_categories**: `id, name, description, default_drive_folders, idx_idcard_front, idx_idcard_back, idx_lanyard, idx_sablon_depan, idx_sablon_belakang`
- **product_components**: `id, product_id, commodity_id, commodity_name, qty, unit_price, subtotal`
- **product_package_items**: `id, package_id, package_name, product_id, product_name, qty, unit_price, discount, subtotal, note, seq`
- **product_price_rules**: `id, uid, product_id, min_qty, price`
- **product_variants**: `id, uid, product_id, variant_name, base_price, is_default`
- **purchase_orders**: `id, order_number, supplier_id, supplier_name, status (pending|approved|received|cancelled), order_date, received_date, shipping_cost, admin_fee, discount_amount`
- **purchase_order_items**: `id, po_number, supplier_id, commodity_id, commodity_name, qty, unit, unit_price`
- **settings**: `id, key, value, description`
- **stock_logs**: `id, trx_code, direction (IN|OUT), category, order_trx_code, supplier_id, total_item_qty, total_item_price, discount_value, admin_cost, shipping_cost, sablon_supplier_id, sablon_kebutuhan_per_meter, sablon_cost, sablon_discount_value, sablon_admin_cost, sablon_shipping_cost, final_amount, laba_bersih, kaos_payment_proof_paid, kaos_payment_proof_dp, sablon_payment_proof_paid, sablon_payment_proof_dp, payment_status (none|unpaid|paid|down_payment), description`
- **stock_log_items**: `id, stock_log_id, supplier_id, order_trx_code, product_id, direction (IN|OUT), commodity_id, commodity_name, is_commodity_parent, category, movement_type (consumption|purchase|return), qty, needs_per_meter, supplier_price, selling_price, price_per_unit, subtotal`
- **suppliers**: `id, uid, name, category (id_card_with_lanyard|cotton_combed_premium), cotton_combed_category (kaos|sablon), price_s_xl, price_2xl, price_3xl, price_4xl, price_5xl, price_long_sleeve, price_per_meter, type (online|offline), address, location, phone, external_link`
- **supplier_commodities**: `id, parent_id, level, supplier_id, supplier_name, commodity_id, commodity_name, category, qty, current_stock, unit, unit_price, capacity_per_unit, is_package, is_affected_side, price`
- **testimonials**: `id, order_number, institution_name, name, rating, comment, status (pending|approved|rejected)`
- **x_design_templates**: `id, name, category, image_url, layout_rules, style_mode`
- **x_shirt_colors**: `id, name, image_url`
- **x_twibbon_templates**: `id, name, category (twibbon-idcard|twibbon-lanyard), base_image, rules, style_mode`
- **login_logs**: `id, user_id, email, ip_address, success`

---

## 📧 Email Integration (SMTP & IMAP)

Domain: `kinau.id` — menggunakan server Rumahweb.

### Kirim Email (SMTP)

```
POST https://data.kinau.web.id/send_email.php
Content-Type: application/json

{ "to": "...", "subject": "...", "body": "<html>...</html>", "from_name": "..." }
```

Response: `{ "status": true, "message": "Email berhasil dikirim ke ..." }`

### Baca Mailbox (IMAP)

```
GET https://data.kinau.web.id/mailbox.php?email=admin@kinau.id&password=...
```

Response: `{ "status": true, "data": { "inbox": [...], "spam": [...] } }`

---

## 🔐 Security & Auth

- **Session:** Cookie-based via `app/utils/session.server.ts`
- **Route Guard:** `app/middleware/auth.ts` — proteksi semua route `/app/*`
- **Encryption:** `crypto-js` via `app/utils/crypto.ts` untuk URL params sensitif
- **Auth Headers:** Di-generate otomatis oleh `generateHeader(session)` di `app/nexus/core/helpers.ts`
- **Server-only modules:** `user.server.ts`, `user_auth.server.ts` — hanya import dari `~/nexus/index.server`

---

## 🔧 Implementasi Khusus

### SSR-Safe Charting

```tsx
// Selalu gunakan ChartLazy untuk mencegah "window is not defined"
import { ChartLazy } from "~/components/Chart/ChartLazy";
// Jangan import ApexCharts langsung di server-rendered component
```

### Breadcrumb System

`AppBreadcrumb` otomatis collapse (ellipsis) jika depth > 3 level.

### Printing

Gunakan `PrintButton.client.tsx` + template renderer di `app/components/print/`.

### Drive System

Kombinasi `FolderCard` + `FileRow` untuk simulasi file explorer. Folder purpose: `id_card_front`, `id_card_back`, `lanyard`, `sablon_front`, `sablon_back`.

### Financial Integrity

Form transaksi (Income/Expense/Transfer) **wajib** mengakomodir input `account_id` (Wallet) dan `category_id`. Kalkulasi subtotal/total **wajib** dilakukan server-side di API module, bukan di client.

### Modal Component — `ModalShell` (WAJIB)

Semua modal di project ini **WAJIB** menggunakan `ModalShell` dari `app/components/modal/ModalShell.tsx`.

```tsx
import ModalShell from "~/components/modal/ModalShell";

<ModalShell
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Judul Modal"
  size="lg"
>
  {/* Content */}
</ModalShell>;
```

**Props:**

- `open: boolean` — Kontrol visibility
- `onClose: () => void` — Callback saat ditutup
- `title?: ReactNode` — Header (opsional, jika null maka close button di content area)
- `size?: "sm" | "md" | "lg" | "xl" | "2xl" | ... | "full"` — Lebar modal (default: `"md"`)
- `children: ReactNode` — Isi modal

**Dilarang menggunakan:**

- `ModalSecond` (`~/components/shared/modal/ModalSecond`) — Legacy, tanpa animasi
- `Modal` (`~/components/modal/Modal.tsx`) — Wrapper Dialog shadcn, tidak konsisten
- Modal custom inline — Gunakan `ModalShell` untuk konsistensi UX

### Table Action Column — Standar UI

Setiap kolom aksi di data table **WAJIB** mengikuti struktur berikut:

**Aturan Visual:**

- Wrapper: `flex items-center justify-end gap-2`
- Inner pod: `flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100`
- Tombol: `p-2 text-slate-500 hover:bg-white rounded transition-all`
- Icon: `w-4 h-4`
- Hover color sesuai aksi (amber = cetak, emerald = detail, red = hapus, blue = edit)
- Setiap `<button>` wajib punya `title` sebagai tooltip

**Reference Implementation:**

```tsx
<div className="flex items-center justify-end gap-2">
  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
    <button
      title="Cetak Dokumen"
      onClick={() => {}}
      className="p-2 text-slate-500 hover:text-amber-500 hover:bg-white rounded transition-all"
    >
      <Printer className="w-4 h-4" />
    </button>
    <button
      title="Lihat Detail"
      onClick={() => {}}
      className="p-2 text-slate-500 hover:text-[#10B981] hover:bg-white rounded transition-all"
    >
      <Eye className="w-4 h-4" />
    </button>
    <button
      title="Edit"
      onClick={() => {}}
      className="p-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded transition-all"
    >
      <Edit2 className="w-4 h-4" />
    </button>
    <button
      title="Hapus"
      onClick={() => {}}
      className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded transition-all"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Warna hover per aksi:**
| Aksi | Hover Color |
| :--- | :--- |
| Cetak/Print | `hover:text-amber-500` |
| Detail/View | `hover:text-[#10B981]` (emerald) |
| Edit | `hover:text-blue-500` |
| Hapus/Delete | `hover:text-red-500` |
| Download | `hover:text-indigo-500` |
| Duplikat | `hover:text-purple-500` |

---

## 📋 Modul API yang Tersedia (`API` object)

```ts
import { API } from "~/nexus";              // browser-safe
import { API } from "~/nexus/index.server"; // server-only (+ USER, USER_AUTH)

API.ORDERS          API.ORDER_ITEMS       API.ORDER_UPLOAD
API.PRODUCT         API.PRODUCT_COMPONENT API.PRODUCT_CATEGORY
API.PRODUCT_PACKAGE_ITEM                  API.PRODUCT_PRICE_RULES
API.COMMODITY       API.COMMODITY_STOCK   API.COMMODITIES
API.COMPONENTS      API.SUPPLIER          API.SUPPLIER_COMMODITY
API.INSTITUTION     API.ASSET             API.INVENTORY_ASSET
API.EMPLOYEE        API.EMPLOYEE_ATTENDANCE
API.EMPLOYEE_SALARY API.EMPLOYEE_SALARY_SLIP
API.TRANSACTION     API.BANK_ACCOUNT      API.ACCOUNT
API.ACCOUNT_MUTATION API.RESTOCK          API.STOCK_LOG
API.CMS_CONTENT     API.OVERVIEW          API.DISCOUNT
API.TESTIMONIAL     API.SETTINGS          API.SHIRT_COLOR
API.TWIBBON_TEMPLATE API.TWIBBON_ASSIGNMENT
// Server-only:
API.USER            API.USER_AUTH
API.AGENT                                 // AI Agent Bridge (raw SQL)
```

---

## 🤖 AI Agent Bridge — Raw SQL Execution

### Overview

Module `AgentAPI` (`app/nexus/modules/agent.server.ts`) menyediakan akses langsung ke database via raw SQL melalui endpoint `https://data.kinau.web.id/apicore-latest/agent-query`.

> ⚠️ **Server-only** — File ini `.server.ts`, tidak bisa diakses dari browser.
> ⚠️ **Full DB access** — SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE, DROP.

### Autentikasi

Dual-layer auth (sudah di-handle otomatis oleh module):

```
Authorization: Bearer REPLACE_WITH_STRONG_KEY
x-agent-key: REPLACE_WITH_AGENT_KEY
```

### Cara Consume

#### 1. Langsung di Route Loader/Action (Server-side)

```ts
import { API } from "~/nexus/index.server";

// Single SELECT query
const result = await API.AGENT.query({
  sql: "SELECT * FROM orders WHERE status = 'pending' LIMIT 10",
});
// result: { success: true, type: "query", rows: [...], row_count: 10 }

// DDL / DML
const result = await API.AGENT.query({
  sql: "UPDATE orders SET status = 'confirmed' WHERE id = 5",
});
// result: { success: true, type: "execute", affected_rows: 1 }

// Batch queries (array)
const result = await API.AGENT.query({
  sql: [
    "SHOW TABLES",
    "DESCRIBE orders",
    "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'",
  ],
});
// result: [{ success, type, rows, row_count }, { ... }, { ... }]
```

#### 2. Get Database Schema

```ts
// Semua tabel
const schema = await API.AGENT.schema({});

// Tabel tertentu
const schema = await API.AGENT.schema({ tables: ["orders", "order_items"] });
// result: { success: true, data: { orders: { columns: [...], indexes: [...] }, ... } }
```

#### 3. List All Tables

```ts
const tables = await API.AGENT.tables();
// result: { success: true, data: [{ table: "orders", rows: 5000, data_size: 524288, comment: "" }, ...] }
```

#### 4. Via API Gateway (Client-side melalui useFetcherData)

```ts
// Di komponen — panggil via /api/nexus gateway
const { data } = useFetcherData({
  endpoint: "/api/nexus",
  params: { module: "AGENT", action: "query" },
  method: "POST",
  body: { sql: "SELECT * FROM orders LIMIT 5" },
});
```

### Response Format

**SELECT / SHOW:**

```json
{ "success": true, "type": "query", "rows": [...], "row_count": 10 }
```

**INSERT / UPDATE / DELETE / DDL:**

```json
{ "success": true, "type": "execute", "affected_rows": 1 }
```

**Error:**

```json
{ "success": false, "error": "Table 'xyz' doesn't exist" }
```

### Kapan Menggunakan AgentAPI vs APIProvider

| Gunakan `APIProvider`                         | Gunakan `AgentAPI`                         |
| :-------------------------------------------- | :----------------------------------------- |
| CRUD standar (select, insert, update, delete) | Query kompleks (JOIN, subquery, aggregate) |
| Operasi yang sudah ada module-nya             | DDL (ALTER, CREATE TABLE)                  |
| Kode production yang stabil                   | Debugging & investigasi data               |
| Semua kode baru yang bisa pakai CRUD          | Migrasi schema, batch operations           |
|                                               | AI-driven data analysis                    |

---

## 🚀 APIProviderV2 — RESTful Engine (apicore-latest)

### Overview

`APIProviderV2` adalah builder baru yang menargetkan endpoint RESTful `https://data.kinau.web.id/apicore-latest`. Ini adalah pengganti bertahap dari `APIProvider` (api2) yang masih menggunakan POST-only routing.

**File:** `app/nexus/core/api-provider-v2.ts`
**Config:** `API_URL_V2` di `app/nexus/core/config.ts`

### Perbedaan dengan APIProvider (api2)

| Aspek            | APIProvider (api2)                 | APIProviderV2 (apicore-latest)                                   |
| :--------------- | :--------------------------------- | :--------------------------------------------------------------- |
| Routing          | POST + `{ table, action }` di body | HTTP Method + `/{table}` di URL                                  |
| SELECT           | `POST /api2` + `action: "select"`  | `GET /{table}?filters` atau `POST /{table}` (auto-detect)        |
| INSERT           | `POST /api2` + `action: "insert"`  | `POST /{table}` + `{ data: {...} }`                              |
| UPDATE           | `POST /api2` + `action: "update"`  | `PATCH /{table}` + `{ data, where }`                             |
| DELETE           | `POST /api2` + `action: "delete"`  | `DELETE /{table}` + `{ where }`                                  |
| Include/Relasi   | Didukung                           | Didukung (via POST auto-detect)                                  |
| Filter Operators | Sama                               | Sama (>=, !=, like:, null, dll)                                  |
| Response Format  | Sama                               | Sama (`{ status, error_message, data: { items, total_items } }`) |

### Cara Import

```ts
import { APIProviderV2 } from "~/nexus";
// atau
import { APIProviderV2 } from "~/nexus/core/api-provider-v2";
```

### Usage di Nexus Modules

```ts
// SELECT — simple (GET)
const result = await APIProviderV2(session)
  .Table("orders")
  .Select({
    page: 0,
    size: 10,
    where: { status: "pending", deleted_on: "null" },
  })
  .Result();

// SELECT — dengan include/relasi (POST auto-detect)
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

// INSERT
const result = await APIProviderV2(session)
  .Table("orders")
  .Insert({ order_number: "ORD-999", status: "pending" })
  .Result();

// BULK INSERT
const result = await APIProviderV2(session)
  .Table("order_items")
  .BulkInsert({
    rows: [{ order_number: "ORD-001", product_id: 1, qty: 10 }],
    updateOnDuplicate: true,
    with_id: false,
  })
  .Result();

// UPDATE
const result = await APIProviderV2(session)
  .Table("orders")
  .Update({ data: { status: "confirmed" }, where: { id: 123 } })
  .Result();

// DELETE
const result = await APIProviderV2(session)
  .Table("orders")
  .Delete({ where: { id: 123 } })
  .Result();
```

### Strategi Migrasi per Modul

Saat migrasi modul dari `APIProvider` ke `APIProviderV2`:

1. Buka `app/nexus/modules/[module].ts`
2. Ganti import: `APIProvider` → `APIProviderV2`
3. Ganti pattern:

```ts
// ❌ SEBELUM (api2)
await APIProvider(session)
  .Endpoint("POST", "select", "orders")
  .Data({ page: 0, size: 10, where: { status: "pending" } })
  .Result();

// ✅ SESUDAH (apicore-latest)
await APIProviderV2(session)
  .Table("orders")
  .Select({ page: 0, size: 10, where: { status: "pending" } })
  .Result();
```

4. Response format **identik** — tidak perlu ubah komponen/route yang mengkonsumsi data
5. Fitur tambahan: retry + exponential backoff + timeout (sama seperti APIProvider)

### Kapan Menggunakan APIProviderV2

| Gunakan `APIProviderV2`                              | Tetap `APIProvider`                       |
| :--------------------------------------------------- | :---------------------------------------- |
| Modul baru yang sedang dibuat                        | Modul existing yang belum diminta migrasi |
| Modul yang secara eksplisit diminta migrasi          | Kode yang sudah stabil dan tidak disentuh |
| Fitur yang butuh filter operator baru (EXISTS, raw:) | —                                         |

> **Catatan:** Kedua provider bisa hidup berdampingan. Migrasi dilakukan bertahap per modul, bukan big-bang.

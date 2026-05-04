Berikut adalah isi lengkap untuk `ai-context.md` yang telah menggabungkan standar boilerplate dengan struktur project nyata.

***

# 🌐 Project Context: Holistic Equilibrium (SIAKAD)

## 1. Core Tech Stack
- **Framework:** Remix (React Router v7) - Strict SSR/Hydration patterns.
- **Styling:** Tailwind CSS (Strict Utility-First).
- **UI Base:** shadcn/UI (Radix + Tailwind).
- **Components:** Sonner (Toast), SweetAlert2 (app/utils/swal.ts), React-Select (Custom Wrapper), DataTable (app/components/ui/data-table.tsx).

## 2. Global Standards & Patterns
- **Modularity:** Schema-to-UI pattern for ERP. Use Centralized endpoints (`app/constants/endpoints.ts`).
- **Data Fetching:** MUST use `app/nexus/` + `useFetcherData`. Dilarang `fetch/axios` langsung.
- **State:** Minimalist. Use `useModal` data prop or Zustand. Split to Hooks if > 5 states.
- **Z-Index:** Tokens: sidebar(40), navbar(50), modal(70), toast(90).
- **Communication:** FCM for push notifications; handle foreground with Sonner.

## 3. Design System: "The Digital Sanctuary" (Finance Blue)
- **North Star:** Organic Fluidity & Depth. Menggunakan tonal layering untuk membedakan hirarki, bukan garis border.
- **Color Palette:**
  - **Surface (Background):** `#F3F8FC` (Cool White-Blue) — Memberikan kesan bersih dan lega.
  - **Primary (Deep Teal/Navy):** `#1E434C` — Digunakan untuk card utama (Total Saldo) dan teks judul.
  - **Primary Container (Gradient):** `linear-gradient(135deg, #1E434C 0%, #35606B 100%)` — Untuk hero section.
  - **Accent (Cyan/Active):** `#0097B2` — Digunakan untuk FAB (Floating Action Button) dan indikator aktif.
  - **Card Background:** `#FFFFFF` — Putih bersih dengan soft shadow untuk elevated cards.
  - **Text (On-Surface):** `#1E293B` — Warna Navy gelap untuk teks utama. (Dilarang `#000000`).
  - **Secondary (Pale Blue):** `#E2EEF7` — Digunakan untuk background tombol filter (Hari, Minggu, dll) yang tidak aktif.

- **Visual Style:** 
  - **Rounded-lg:** `24px` atau `1.5rem` - `2rem` untuk container besar agar tetap "Soft".
  - **Glassmorphism:** Digunakan pada inner cards di dalam hero (Pemasukan/Pengeluaran) dengan `bg-white/10` dan `backdrop-blur-md`.
  - **Iconography:** Ikon dengan container `rounded-2xl` dan latar warna pastel transparan sesuai kategori (Soft Cyan, Purple, Green, Orange, Red).
  - **Shadows:** Menggunakan `shadow-sm` atau `shadow-md` yang sangat halus (ambient) untuk elemen elevated.

## 3.1. Mobile-First Layout Standard (App-Shell Pattern)
- **Philosophy:** All entry-point pages (Login, Home, Dashboard) follow a centered "App-Shell" layout mirroring native mobile apps on desktop.
- **Desktop Behavior:** Content wrapped in `max-w-md mx-auto` centered container to maintain app-like focus and prevent excessive horizontal scrolling.
- **Mobile Behavior:** Full-width fluid layout (`w-full`) to utilize screen space efficiently.
- **Container Styling:** `rounded-[24px]` (or `rounded-lg`) with `bg-white` (card surface) and soft ambient shadows.
- **Page Background:** `min-h-screen bg-[#F3F8FC]` (page/surface background).
- **Separation Logic:** Use tonal transitions (background color shifts) and shadows instead of 1px borders to delineate sections.
- **Padding & Spacing:** Consistent padding (`px-5`, `py-6`) within the app-shell to maintain breathing room.
- **Bottom Navigation:** Fixed positioning (`fixed bottom-0`) with safe-area inset padding for mobile viewport compatibility.

## 4. Navigation & Security
- **Auth:** Firebase Auth + `route-guard.tsx`.
- **Encryption:** `crypto-js` via `app/utils/crypto.ts`.
- **Prefetch:** All main links use `prefetch="intent"`.

## 5. Backend & Data Integration
- **Base URL:** `https://api.raynsenterprise.my.id` (Gunakan variabel lingkungan).
- **Primary Architecture:** Follows the "Consume API" context.
- **Convention:** Frontend (camelCase) <-> Backend (camelCase). Database (snake_case) dihandle oleh Backend.
- **API Reference:** Seluruh pemanggilan fungsi di `app/nexus/` wajib merujuk pada `api-contracts.md` dan `db-schema.md`.

## 6. Project Structure (Real Implementation)

### 📂 Directory Architecture
- `app/components/`: Centralized UI library.
    - `ui/`: shadcn/UI primitives (atomic components).
    - `drive/`: Specialized components for file management (FolderCard, FileRow, etc.).
    - `layout/`: Admin, Public, and Manage layout wrappers.
    - `Chart/`: ApexCharts implementation with `ChartLazy` for SSR safety.
    - `print/`: Templates for Nota, Receipt, and Order shares.
- `app/lib/api/`: The core data layer.
    - `core/`: API configurations and base helper functions.
    - `modules/`: Domain-specific API calls (e.g., `order.ts`, `commodity.ts`, `user_auth.ts`).
- `app/hooks/`: Reusable business logic (e.g., `useStockLogic.ts`, `use-fetcher-data.ts`).
- `app/routes/`: File-system based routing.
    - `app.procurement.*`: Procurement and vendor management.
    - `app.production.*`: Inventory adjustment and restocking.
    - `app.order.*`: Order lifecycle from form to detail.
    - `app.drive.*`: Internal and customer-facing document management.

### 🛠 Core Business Modules (Logic Domains)
Based on `app/lib/api/modules/`, the system manages:
1. **Inventory & Commodity:** `commodity.ts`, `commodity_stock.ts`, `restock.ts`, `stock_log.ts`.
2. **Order Lifecycle:** `order.ts`, `order_item.ts`, `order_upload.ts`, `transaction.ts`.
3. **Procurement:** `supplier.ts`, `supplier_commodity.ts`.
4. **Employee & Finance:** `employee.ts`, `employee_salary.ts`, `bank_account.ts`, `account_mutation.ts`.
5. **Digital Asset/Drive:** `asset.ts`, `twibbon_template.ts`.

## 7. Core Logics & Implementation Details
- **SSR Charting:** Use `ChartLazy` to wrap `ChartWrapper`. This prevents `window is not defined` errors by ensuring ApexCharts only renders on the client side.
- **Breadcrumb System:** `AppBreadcrumb` implements a collapsing logic (ellipsis) when the depth exceeds 3 levels to maintain UI cleanliness.
- **Data Presentation:** `DescriptionCard` is used as a standardized way to show key-value pairs for entity details (ERP-style).
- **File Management:** The "Drive" system uses a combination of `FolderCard` and `FileRow` to simulate a native OS file explorer within the web app.
- **Printing Logic:** Uses dedicated `PrintButton.client.tsx` and template renderers to handle physical printouts of orders/receipts.
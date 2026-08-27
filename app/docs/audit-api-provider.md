# Audit APIProvider — Kepatuhan Satu Pintu API

> **Tanggal Audit:** 20 Mei 2026  
> **Acuan:** `README.md` — Section "⚠️ CRITICAL: Satu Pintu — `APIProvider(session).Result()`"  
> **Aturan:** Semua data fetching wajib melalui `APIProvider(session).Endpoint().Data().Result()` (server-side) atau `useFetcherData({ endpoint: "/api/nexus", params: {...} })` (client-side).

---

## 🔴 VIOLATION — `fetch()` langsung ke backend Kinau

**4 file — WAJIB MIGRASI.** Menggunakan `fetch(url, ...)` langsung ke API backend tanpa melalui APIProvider atau useFetcherData.

| #   | File                                                             | Pelanggaran                                                    | Rekomendasi                                                                             |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | `app/components/features/order-manage/use-order-manage-logic.ts` | `fetch(API_URL, { method: "POST" })` — 3x pemanggilan langsung | Gunakan `useFetcherData({ endpoint: "/api/nexus", params: { module: "ORDERS", ... } })` |
| 2   | `app/components/features/product/ProductPackageForm.tsx`         | Ekspor `callApi(payload)` dengan `fetch(API_URL)` langsung     | Panggil `API.PRODUCT.create/update` via route action/loader                             |
| 3   | `app/routes/app.email.tsx`                                       | `fetch(mailbox_url)` di loader — endpoint `mailbox.php`        | Buat `MailboxAPI` module di `app/nexus/modules/`                                        |
| 4   | `app/components/features/email/EmailCampaignFeature.tsx`         | 3x `fetch()` ke `mailbox.php` & `send_email.php`               | Gunakan `useFetcherData` + module email server-side                                     |

### Detail Pelanggaran

#### 1. `app/components/features/order-manage/use-order-manage-logic.ts`

- **Import terlarang:** `import { API_URL, API_KEY } from "~/nexus"`
- **Pattern saat ini:**
  ```ts
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "x-api-key": API_KEY, ... },
    body: JSON.stringify({ action: "...", table: "...", data: {...} }),
  });
  ```
- **Seharusnya:** Gunakan `useFetcherData` dan `/api/nexus` gateway

#### 2. `app/components/features/product/ProductPackageForm.tsx`

- **Import terlarang:** `import { API_URL, API_KEY } from "~/nexus"`
- **Pattern saat ini:** Fungsi `callApi(payload)` dengan `fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })`
- **Seharusnya:** Logic dipindahkan ke route action, panggil `API.PRODUCT.create/update`

#### 3. `app/routes/app.email.tsx` (loader)

- **Pattern saat ini:**
  ```ts
  const url = "https://data.kinau.web.id/mailbox.php";
  const response = await fetch(url);
  ```
- **Seharusnya:** Buat module `MailboxAPI` di `app/nexus/modules/` yang wrap endpoint `mailbox.php`

#### 4. `app/components/features/email/EmailCampaignFeature.tsx`

- **Pattern saat ini:** `fetch(mailbox_url)`, `fetch("https://data.kinau.web.id/send_email.php", { method: "POST", body })`
- **Seharusnya:** Gunakan `useFetcherData` ke `/api/nexus?module=EMAIL&action=...`

---

## 🟡 WARNING — `nexus()` builder di komponen

**36 file.** Mengimpor `nexus` dari `~/nexus/nexus-client` atau `~/lib/nexus-client` dan menggunakan builder pattern `nexus().module().action().params().build()` di `useFetcherData`.

> **Per README:** _"nexus() builder di komponen existing → boleh tetap, tapi kode baru langsung pakai `useFetcherData({ endpoint: "/api/nexus?module=X&action=Y" })`"_  
> **Status:** Tidak perlu migrasi sekarang. Refactor bertahap saat file disentuh untuk perubahan lain.

### Route Files

| File                                 | Endpoint Contoh                                                             |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `app/routes/katalog.tsx`             | `nexus().module("SHIRT_COLOR").action("get").params({ size: 100 }).build()` |
| `app/routes/dashboard.customer.tsx`  | `nexus().module("ORDERS").action("get").params({...}).build()`              |
| `app/routes/app.print-area.tsx`      | `nexus().module("ORDERS").action("get").params({...}).build()`              |
| `app/routes/app.setting.design.tsx`  | `nexus().module(...)`                                                       |
| `app/routes/app.drive.internal.tsx`  | `nexus().module("ORDER_UPLOAD").action(...)`                                |
| `app/routes/app.asset.inventory.tsx` | `nexus().module(...)`                                                       |
| `app/routes/api.nexus.demo.tsx`      | Documentation file — boleh                                                  |

### Hook Files

| File                         | Endpoint Contoh                                    |
| ---------------------------- | -------------------------------------------------- |
| `app/hooks/useStockLogic.ts` | `nexus().module("SETTINGS").action("get").build()` |

### Component Files

| File                                 | Endpoint Contoh                             |
| ------------------------------------ | ------------------------------------------- |
| `app/components/NotaView.tsx`        | `nexus().module("ORDERS").action("get")...` |
| `app/components/shared/NotaView.tsx` | `nexus().module("ORDERS").action("get")...` |

### Feature — Finance

| File                                                    | Endpoint Contoh                                      |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `app/components/features/finance/CashflowDashboard.tsx` | `nexus().module("TRANSACTION").action(...)`          |
| `app/components/features/finance/SalaryDashboard.tsx`   | `nexus().module("EMPLOYEE_SALARY_SLIP").action(...)` |
| `app/components/features/finance/AccountCoaPage.tsx`    | `nexus().module("ACCOUNT").action(...)`              |
| `app/components/features/finance/FinanceDashboard.tsx`  | `nexus().module("TRANSACTION").action(...)`          |

### Feature — Product

| File                                                     | Endpoint Contoh                                       |
| -------------------------------------------------------- | ----------------------------------------------------- |
| `app/components/features/product/ProductListFeature.tsx` | `nexus().module("PRODUCT_CATEGORY").action("get")...` |

### Feature — Order

| File                                                               | Endpoint Contoh                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `app/components/features/order-history/use-order-history-logic.ts` | `nexus().module("ORDERS").action(...)`                       |
| `app/components/features/order/OrderEditFeature.tsx`               | `nexus().module("ORDERS").action(...)`                       |
| `app/components/features/order/OrderFormFeature.tsx`               | `nexus().module("ORDERS").action(...)`                       |
| `app/components/features/order/use-order-list-logic.ts`            | `nexus().module("OVERVIEW").action("getKknInstitutions")...` |

### Feature — Supplier & Institution

| File                                                           | Endpoint Contoh                             |
| -------------------------------------------------------------- | ------------------------------------------- |
| `app/components/features/supplier/use-supplier-logic.ts`       | `nexus().module("SUPPLIER").action(...)`    |
| `app/components/features/institution/use-institution-logic.ts` | `nexus().module("INSTITUTION").action(...)` |

### Feature — Overview

| File                                                     | Endpoint Contoh                                   |
| -------------------------------------------------------- | ------------------------------------------------- |
| `app/components/features/overview/use-overview-logic.ts` | `nexus().module("OVERVIEW").action("summary")...` |

### Feature — Public

| File                                                      | Endpoint Contoh                                          |
| --------------------------------------------------------- | -------------------------------------------------------- |
| `app/components/features/public/PublicDriveFeature.tsx`   | `nexus().module("ORDER_UPLOAD").action("get_folder")...` |
| `app/components/features/public/DesignGalleryFeature.tsx` | `nexus().module("TWIBBON_TEMPLATE").action("get")...`    |

### Feature — User

| File                                                     | Endpoint Contoh                      |
| -------------------------------------------------------- | ------------------------------------ |
| `app/components/features/user/UserManagementFeature.tsx` | `nexus().module("USER").action(...)` |

### Feature — Procurement

| File                                                                     | Endpoint Contoh                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `app/components/features/procurement/ProcurementComponentFeature.tsx`    | `nexus().module("SUPPLIER_COMMODITY").action("get")...` |
| `app/components/features/procurement/ProcurementCapacityFeature.tsx`     | `nexus().module("SUPPLIER_COMMODITY").action("get")...` |
| `app/components/features/procurement/ProcurementSupplierFeature.tsx`     | `nexus().module("SUPPLIER").action("get")...`           |
| `app/components/features/procurement/ProcurementVendorFeature.tsx`       | `nexus().module("SUPPLIER").action("get")...`           |
| `app/components/features/procurement/ProcurementShoppingFeature.tsx`     | `nexus().module("SUPPLIER").action("get")...`           |
| `app/components/features/procurement/ProcurementCatalogColorFeature.tsx` | `nexus().module("SHIRT_COLOR").action("get")...`        |
| `app/components/features/procurement/use-procurement-logic.ts`           | `nexus().module("SUPPLIER").action("get")...`           |

### Feature — Print Area

| File                                                        | Endpoint Contoh                        |
| ----------------------------------------------------------- | -------------------------------------- |
| `app/components/features/print-area/PrintAreaDashboard.tsx` | `nexus().module("ORDERS").action(...)` |

### Feature — Asset

| File                                                        | Endpoint Contoh                                 |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `app/components/features/asset/AssetInventoryDashboard.tsx` | `nexus().module("INVENTORY_ASSET").action(...)` |

### Feature — Settings

| File                                                     | Endpoint Contoh                                   |
| -------------------------------------------------------- | ------------------------------------------------- |
| `app/components/features/settings/DesignDashboard.tsx`   | `nexus().module("X_DESIGN_TEMPLATE").action(...)` |
| `app/components/features/settings/RecycleBinFeature.tsx` | `nexus().module(...)`                             |

### Feature — Drive

| File                                                     | Endpoint Contoh                                          |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `app/components/features/drive/DriveCustomerFeature.tsx` | `nexus().module("ORDER_UPLOAD").action("get_folder")...` |
| `app/components/features/drive/DriveInternalFeature.tsx` | `nexus().module("ORDER_UPLOAD").action("get_folder")...` |

---

## ⬛ DEPRECATED INFRA FILES

**9 file.** Infrastruktur deprecated/legacy yang sudah ditandai di `README.md`. Komponen **tidak boleh** menambah import baru dari file-file ini.

| File                          | Status        | Keterangan                               |
| ----------------------------- | ------------- | ---------------------------------------- |
| `app/nexus/swr-loader.ts`     | ⚠️ DEPRECATED | SWR fetcher alternatif, redundan         |
| `app/nexus/client.ts`         | ⚠️ DEPRECATED | Config-based pattern lama                |
| `app/nexus/api-client.tsx`    | ⚠️ DEPRECATED | SWR-based fetcher                        |
| `app/nexus/core/callApi.ts`   | ⚠️ DEPRECATED | Low-level fetcher tanpa retry/timeout    |
| `app/lib/api-client.tsx`      | ⚠️ DEPRECATED | Config-based pattern lama                |
| `app/lib/swr-loader.ts`       | ⚠️ DEPRECATED | SWR fetcher alternatif                   |
| `app/lib/api/client.ts`       | ⚠️ LEGACY     | Config-based, duplikat `nexus/client.ts` |
| `app/lib/api/core/callApi.ts` | ⚠️ LEGACY     | Legacy callApi                           |
| `app/lib/nexus-client.ts`     | ⚠️ DEPRECATED | Duplikat `app/nexus/nexus-client.ts`     |

---

## ⚪ EXEMPT — `fetch()` ke external/3rd-party API

**4 file.** Menggunakan `fetch()` ke API eksternal (Telegram, image proxy, file download). **Bukan pelanggaran** karena bukan backend Kinau.

| File                                              | Target             | Keterangan                     |
| ------------------------------------------------- | ------------------ | ------------------------------ |
| `app/lib/telegram-log.ts`                         | `api.telegram.org` | Telegram Bot API untuk logging |
| `app/utils/telegram-log.ts`                       | `api.telegram.org` | Duplikat telegram-log          |
| `app/routes/resources.image-proxy.tsx`            | Dynamic image URL  | Proxy gambar eksternal         |
| `app/routes/server.drive.$folder_id.download.tsx` | File storage URL   | Download file dari storage     |

---

## 📊 Ringkasan

| Kategori                       | Jumlah File | Prioritas  | Status                    |
| ------------------------------ | ----------- | ---------- | ------------------------- |
| 🔴 `fetch()` ke backend Kinau  | 4           | **Tinggi** | Wajib migrasi             |
| 🟡 `nexus()` builder existing  | 36          | Rendah     | Refactor bertahap         |
| ⬛ Deprecated infra            | 9           | —          | Jangan tambah import baru |
| ⚪ `fetch()` external (exempt) | 4           | —          | Tidak perlu tindakan      |

---

## 🎯 Rencana Aksi

### Fase 1 — Migrasi `fetch()` langsung (Prioritas Tinggi)

1. **`use-order-manage-logic.ts`** — Ganti `fetch(API_URL)` dengan `useFetcherData` ke `/api/nexus`
2. **`ProductPackageForm.tsx`** — Pindahkan logic ke route action, gunakan `API.PRODUCT` module
3. **`app.email.tsx` + `EmailCampaignFeature.tsx`** — Buat `MailboxAPI` / `EmailAPI` module di `app/nexus/modules/`, wrap `mailbox.php` & `send_email.php`

### Fase 2 — Refactor `nexus()` builder (Prioritas Rendah)

Saat menyentuh file existing dengan `nexus()`, ganti:

```tsx
// ❌ Pola lama
const { data } = useFetcherData({
  endpoint: nexus()
    .module("ORDERS")
    .action("get")
    .params({ page: 0, size: 10 })
    .build(),
});

// ✅ Pola baru
const { data } = useFetcherData({
  endpoint: "/api/nexus",
  params: { module: "ORDERS", action: "get", page: 0, size: 10 },
});
```

### Fase 3 — Hapus Duplikasi (Prioritas Rendah)

1. Hapus `app/lib/nexus-client.ts` (duplikat dari `app/nexus/nexus-client.ts`)
2. Hapus `app/lib/swr-loader.ts` (duplikat dari `app/nexus/swr-loader.ts`)
3. Hapus `app/utils/telegram-log.ts` (duplikat dari `app/lib/telegram-log.ts`)

---

## ✅ Audit Checklist (Referensi README)

- [ ] 4 file dengan `fetch()` langsung sudah dimigrasi?
- [ ] Tidak ada import baru dari `~/lib/api`?
- [ ] Tidak ada import baru dari deprecated files?
- [ ] Server-side fetch via `APIProvider(session).Endpoint().Data().Result()`?
- [ ] Client-side fetch via `useFetcherData({ endpoint: "/api/nexus", params: {...} })`?
- [ ] Tidak ada `axios` di project?
- [ ] Database logic ada di `app/nexus/modules/`, bukan di route?

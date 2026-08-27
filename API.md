# ⚡ Core REST API Engine — Panduan Lengkap

> PHP Native RESTful Engine — Dynamic Table Routing
>
> Base URL: `https://data.kinau.web.id/apicore-latest`
>
> Dokumentasi resmi: https://data.kinau.web.id/apicore-latest/docs

---

## 📌 RESTful Auto-CRUD Routing

URL = nama tabel, HTTP method = aksi CRUD:

| Method | Endpoint   | Aksi                                        |
| ------ | ---------- | ------------------------------------------- |
| GET    | `/{table}` | Select (filter + pagination)                |
| POST   | `/{table}` | Insert / Bulk Insert / Select (auto-detect) |
| PATCH  | `/{table}` | Update (wajib `where`)                      |
| DELETE | `/{table}` | Delete (wajib `where`)                      |

### POST Auto-Detect

POST otomatis mendeteksi aksi berdasarkan isi body:

| Kondisi Body                                                        | Aksi            |
| ------------------------------------------------------------------- | --------------- |
| Mengandung `include` / `columns` / `search` / `orderBy` / `groupBy` | → SELECT        |
| Mengandung `rows: [...]`                                            | → BULK INSERT   |
| Mengandung `data: {...}` atau field langsung                        | → SINGLE INSERT |

---

## 🔐 Autentikasi

Semua API endpoint memerlukan header:

```
Authorization: Bearer <API_KEY>
```

> Halaman `/docs` tidak memerlukan autentikasi.

---

## 📖 GET /{table} — Select

Ambil data dengan filter via query string.

### Contoh

```http
GET /orders?status=active&page=0&size=10
GET /users?name=like:john&orderBy=["created_at","DESC"]
GET /products?status=active,pending&stock=>0&deleted_at=null
```

### Query Parameters

| Parameter  | Default | Keterangan                                       |
| ---------- | ------- | ------------------------------------------------ |
| `page`     | `0`     | Halaman (0-indexed)                              |
| `size`     | `10`    | Item per halaman                                 |
| `orderBy`  | —       | Sorting, format JSON array: `["col","DESC"]`     |
| `groupBy`  | —       | Group by, format JSON array: `["category_id"]`   |
| `columns`  | —       | Kolom yang diambil, format JSON: `["id","name"]` |
| `search`   | —       | Keyword pencarian global                         |
| `searchBy` | `name`  | Kolom target search (comma-separated)            |
| `{kolom}`  | —       | Filter langsung (lihat bagian Filters)           |

---

## 🔍 Filter Operators

Berlaku untuk **GET** (query string) dan **POST** body (key `where`):

| Syntax                 | SQL Equivalent                       | Contoh Query String                       |
| ---------------------- | ------------------------------------ | ----------------------------------------- |
| `"col": "value"`       | `col = 'value'`                      | `?status=active`                          |
| `"col": ">=18"`        | `col >= 18`                          | `?age=>=18`                               |
| `"col": "<=100"`       | `col <= 100`                         | `?price=<=100000`                         |
| `"col": ">5"`          | `col > 5`                            | `?stock=>0`                               |
| `"col": "<50"`         | `col < 50`                           | `?qty=<50`                                |
| `"col": "!=val"`       | `col != 'val'`                       | `?status=!=deleted`                       |
| `"col": "a,b,c"`       | `col IN ('a','b','c')`               | `?status=active,pending`                  |
| `"col": "!=a,b"`       | `col NOT IN ('a','b')`               | `?role=!=admin,super`                     |
| `"col": "null"`        | `col IS NULL`                        | `?deleted_at=null`                        |
| `"col": "is_not_null"` | `col IS NOT NULL`                    | `?verified_at=is_not_null`                |
| `"col": "like:val"`    | `col LIKE '%val%'`                   | `?name=like:john`                         |
| `"col": "like:a,b"`    | `(col LIKE '%a%' OR col LIKE '%b%')` | `?name=like:john,jane`                    |
| `"year:col": 2025`     | `YEAR(col) = 2025`                   | `where: {"year:created_at": 2025}`        |
| `"month:col": 6`       | `MONTH(col) = 6`                     | `where: {"month:created_at": 6}`          |
| `"raw:x": "expr"`      | `(expr)` — raw SQL                   | `where: {"raw:calc": "price*qty>100000"}` |

### EXISTS / NOT EXISTS

Subquery untuk cek keberadaan data di tabel lain:

```json
{
  "where": {
    "exists:order_items": {
      "foreign_key": "order_id",
      "reference_key": "id",
      "where": { "status": "paid" }
    }
  }
}
```

→ `WHERE EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id AND status = 'paid')`

```json
// NOT EXISTS:
{
  "where": {
    "not_exists:payments": {
      "foreign_key": "order_id",
      "reference_key": "id"
    }
  }
}
```

> Filter di dalam exists mendukung: equality, IN, NOT IN, LIKE, IS NULL, IS NOT NULL.

### Global Search

Cari keyword di banyak kolom sekaligus:

```http
GET /products?search=laptop&searchBy=name,description,sku
```

→ `WHERE (name LIKE '%laptop%' OR description LIKE '%laptop%' OR sku LIKE '%laptop%')`

Default `searchBy`: `name`

---

## 🔗 Include Relasi (Sequelize-like)

Gunakan `POST /{table}` dengan key `include` untuk eager loading relasi:

```json
POST /orders
Content-Type: application/json

{
  "include": [
    {
      "table": "order_items",
      "alias": "items",
      "foreign_key": "order_id",
      "reference_key": "id",
      "columns": ["product_name", "qty", "price"],
      "where": { "deleted_at": "null" }
    },
    {
      "table": "payments",
      "alias": "payment_info",
      "foreign_key": "order_id",
      "reference_key": "id",
      "columns": ["amount", "method", "paid_at"],
      "where": { "status": "success" }
    }
  ],
  "where": { "status": "active" },
  "orderBy": ["created_at", "DESC"],
  "page": 0,
  "size": 10
}
```

### Include Parameters

| Parameter       | Required | Keterangan                                   |
| --------------- | -------- | -------------------------------------------- |
| `table`         | ✅       | Nama tabel relasi                            |
| `foreign_key`   | ✅       | Kolom FK di tabel relasi                     |
| `reference_key` | ✅       | Kolom PK di tabel utama                      |
| `columns`       | ✅       | Array kolom yang diambil                     |
| `alias`         | ❌       | Nama field di response (default: nama tabel) |
| `where`         | ❌       | Filter tambahan (equality, IN, IS NULL)      |

### Response Include

```json
{
  "items": [
    {
      "id": 1,
      "status": "active",
      "items": "[{\"product_name\":\"Baju\",\"qty\":2,\"price\":50000}]",
      "payment_info": "[{\"amount\":100000,\"method\":\"transfer\"}]"
    }
  ]
}
```

> ⚠️ Kolom relasi berisi **JSON string** — parse di client: `JSON.parse(row.items)`

---

## ➕ POST /{table} — Single Insert

Kirim data langsung di body (tanpa key `rows` atau `include`):

```json
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active"
}
```

Atau bungkus dalam key `data`:

```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Response (201)

```json
{
  "status": 201,
  "error_message": null,
  "data": { "insert_id": "42" }
}
```

---

## 📦 POST /{table} — Bulk Insert

Kirim array di key `rows`:

```json
POST /products
Content-Type: application/json

{
  "rows": [
    { "name": "Item A", "price": 10000, "category_id": 1 },
    { "name": "Item B", "price": 20000, "category_id": 2 },
    { "name": "Item C", "price": 15000, "category_id": 1 }
  ],
  "updateOnDuplicate": false,
  "with_id": false
}
```

### Options

| Parameter           | Default | Keterangan                                          |
| ------------------- | ------- | --------------------------------------------------- |
| `updateOnDuplicate` | `false` | Jika `true` → ON DUPLICATE KEY UPDATE (upsert)      |
| `with_id`           | `false` | Jika `true` → sertakan kolom id (default diabaikan) |

### Response (201)

```json
{
  "status": 201,
  "error_message": null,
  "data": { "status": "ok", "affected_total": 3 }
}
```

---

## ✏️ PATCH /{table} — Update

Kirim `data` (kolom yang diubah) dan `where` (kondisi):

```json
PATCH /users
Content-Type: application/json

{
  "data": {
    "status": "inactive",
    "updated_at": "2025-06-01 10:00:00"
  },
  "where": {
    "id": 42
  }
}
```

> ⚠️ `where` **wajib ada** — API menolak update tanpa kondisi untuk mencegah update seluruh tabel.

### Update Multiple Rows

```json
PATCH /orders
{
  "data": { "status": "cancelled" },
  "where": { "customer_id": 5 }
}
```

→ `UPDATE orders SET status='cancelled' WHERE customer_id = 5`

> Where pada update hanya mendukung equality (`key = value`).

### Response

```json
{
  "status": 200,
  "error_message": null,
  "data": { "affected_rows": 1 }
}
```

---

## 🗑️ DELETE /{table} — Delete

Kirim `where` untuk menentukan baris yang dihapus:

```json
DELETE /users
Content-Type: application/json

{
  "where": { "id": 42 }
}
```

> ⚠️ `where` **wajib ada** — API menolak delete tanpa kondisi.

### Response

```json
{
  "status": 200,
  "error_message": null,
  "data": { "deleted_rows": 1 }
}
```

---

## 📁 POST /upload — File Upload

Upload file via `multipart/form-data`. Field key: `file`

```http
POST /upload
Content-Type: multipart/form-data

file: [binary data]
```

### Batasan

| Item            | Nilai                               |
| --------------- | ----------------------------------- |
| Ukuran maksimal | 20 MB                               |
| Format didukung | png, jpg, jpeg, gif, webp, pdf, zip |
| Nama file       | Random (bin2hex 20 char)            |

### Response

```json
{
  "status": 200,
  "data": {
    "status": "ok",
    "url": "https://domain.com/api/resource/a3f9c12b4e8d7f6a.jpg",
    "filename": "a3f9c12b4e8d7f6a.jpg",
    "original_name": "foto-produk.jpg",
    "file_size": 204800,
    "is_image": true
  }
}
```

---

## 📊 Stock Endpoints (Custom)

### GET /GET_STOCK

Ambil semua komoditas beserta total stok saat ini.

```json
// Response
{
  "data": [
    {
      "id": 1,
      "code": "CBT001",
      "name": "Beras",
      "unit": "kg",
      "stock": 500,
      "last_update": "2025-01-15"
    }
  ]
}
```

### POST /RESTOCK

Tambah stok (direction: IN, movement_type: purchase)

```json
// Request
{ "supplier_id": 3, "commodity_id": 1, "qty": 100 }

// Response
{ "data": { "restock_id": "87" } }
```

### POST /CONSUME

Kurangi stok (direction: OUT, movement_type: consumption)

```json
// Request
{ "commodity_id": 1, "qty": 25 }

// Response
{ "data": { "consume_id": "88" } }
```

### POST /GET_LOGS

Riwayat pergerakan stok (maks 150 baris, DESC). Kedua param opsional.

```json
// Request (semua opsional)
{ "commodity_id": 1, "supplier_id": 3 }

// Response
{
  "data": [
    {
      "id": 1,
      "supplier_id": 3,
      "commodity_id": 1,
      "direction": "IN",
      "movement_type": "purchase",
      "qty": 100,
      "commodity_name": "Beras",
      "supplier_name": "PT Sumber Pangan"
    }
  ]
}
```

---

## 🤖 AI Agent Bridge (Full DB Access)

Endpoint khusus untuk AI Agent — eksekusi raw SQL langsung ke database.

> ⚠️ **Full access**: SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, dll.

### Autentikasi Agent

Dua layer auth diperlukan:

```
Authorization: Bearer <API_KEY> 'REPLACE_WITH_STRONG_KEY'  // Auth standar
x-agent-key: <AGENT_KEY>  ?? 'REPLACE_WITH_AGENT_KEY'   // Auth khusus agent
```

> `AGENT_KEY` dikonfigurasi terpisah di `config/index.php`

### ⚠️ Aturan Wajib: Template Zygote untuk CREATE TABLE

Jika membuat tabel baru via `agent-query`, **WAJIB** mengikuti template zygote berikut:

```sql
CREATE TABLE IF NOT EXISTS nama_tabel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- ... field yang dibutuhkan ...
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Struktur wajib:**

| Posisi  | Kolom         | Tipe                                                | Keterangan                                |
| ------- | ------------- | --------------------------------------------------- | ----------------------------------------- |
| Pertama | `id`          | `INT AUTO_INCREMENT PRIMARY KEY`                    | Primary key                               |
| Tengah  | `{fields}`    | sesuai kebutuhan                                    | Kolom bisnis                              |
| Akhir-3 | `created_on`  | `DATETIME DEFAULT CURRENT_TIMESTAMP`                | Waktu pembuatan                           |
| Akhir-2 | `modified_on` | `DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP` | Waktu update terakhir                     |
| Akhir-1 | `deleted`     | `TINYINT(1) DEFAULT 0`                              | Soft-delete flag (0 = aktif, 1 = dihapus) |

**Contoh:**

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

> ❌ Jangan buat tabel tanpa `id`, `created_on`, `modified_on`, `deleted`.
> ❌ Jangan pakai `deleted_on DATETIME` — gunakan `deleted TINYINT(1) DEFAULT 0`.

---

### POST /agent-query

Eksekusi raw SQL (single atau batch):

```json
// Single query
{ "sql": "SELECT * FROM users WHERE status = 'active' LIMIT 10" }

// DDL
{ "sql": "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL" }

// Batch (array)
{
  "sql": [
    "SHOW TABLES",
    "DESCRIBE users",
    "SELECT COUNT(*) as total FROM orders"
  ]
}
```

**Response untuk SELECT/SHOW:**

```json
{ "type": "query", "rows": [...], "row_count": 10 }
```

**Response untuk DDL/DML:**

```json
{ "type": "execute", "affected_rows": 1, "success": true }
```

### POST /agent-schema

Ambil schema lengkap (tabel + kolom + tipe + index):

```json
// Semua tabel
{}

// Filter tabel tertentu
{ "tables": ["users", "orders"] }
```

### POST /agent-tables

List semua tabel dengan row count & ukuran:

```json
// Response
[
  { "table": "users", "rows": 150, "data_size": 16384, "comment": "" },
  { "table": "orders", "rows": 5000, "data_size": 524288, "comment": "" }
]
```

---

## 📦 Response Format

### Standar Response

```json
{
  "status": 200,
  "error_message": null,
  "data": { ... }
}
```

### List Response (SELECT)

```json
{
  "status": 200,
  "error_message": null,
  "data": {
    "total_items": 150,
    "items": [...],
    "total_pages": 15,
    "current_page": 0
  }
}
```

### Error Response

```json
{
  "status": 400,
  "error_message": "Missing table or data",
  "data": null
}
```

### HTTP Status Codes

| Code | Keterangan                                  |
| ---- | ------------------------------------------- |
| 200  | Success                                     |
| 201  | Created (insert)                            |
| 400  | Bad Request (missing params)                |
| 401  | Unauthorized (invalid/missing Bearer Token) |
| 404  | Route not found                             |
| 405  | Method not allowed                          |
| 500  | Server error                                |

---

## 🧩 Quick Reference — Penggunaan di Client

### Contoh Fetch (JavaScript)

```javascript
const BASE_URL = "https://data.kinau.web.id/apicore-latest";
const API_KEY = "your-api-key";

// GET — Select dengan filter
const res = await fetch(`${BASE_URL}/orders?status=active&page=0&size=10`, {
  headers: { Authorization: `Bearer ${API_KEY}` },
});
const data = await res.json();

// POST — Insert
const res = await fetch(`${BASE_URL}/users`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "John", email: "john@mail.com" }),
});

// POST — Select dengan include (relasi)
const res = await fetch(`${BASE_URL}/orders`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    include: [
      {
        table: "order_items",
        alias: "items",
        foreign_key: "order_id",
        reference_key: "id",
        columns: ["product_name", "qty", "price"],
      },
    ],
    where: { status: "active" },
    page: 0,
    size: 10,
  }),
});

// PATCH — Update
const res = await fetch(`${BASE_URL}/users`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    data: { status: "inactive" },
    where: { id: 42 },
  }),
});

// DELETE
const res = await fetch(`${BASE_URL}/users`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ where: { id: 42 } }),
});
```

---

> **Sumber**: https://data.kinau.web.id/apicore-latest/docs
>
> Core REST API Engine © 2026 — PHP Native • PDO MySQL • Zero Dependencies

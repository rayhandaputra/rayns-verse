# AI Context: Kinau Email Integration (SMTP & IMAP)

Dokumen ini berisi konteks teknis untuk sistem manajemen email domain `kinau.id`. Gunakan informasi ini untuk mengimplementasikan fungsionalitas kirim, daftar, dan detail email pada UI.

## 1. Arsitektur API

Sistem menggunakan dua endpoint utama yang berbasis PHP:
- **Sender (SMTP):** `https://data.kinau.id/send_email.php`
- **Receiver (IMAP):** `https://data.kinau.id/mailbox.php`

---

## 2. Pengiriman Email (`send_email.php`)

Endpoint ini digunakan untuk mengirim email melalui server SMTP Rumahweb.

### Spesifikasi Request
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body Payload:**
| Key | Type | Description |
| :--- | :--- | :--- |
| `to` | string | Email tujuan (Required) |
| `subject` | string | Judul email (Required) |
| `body` | string | Isi email dalam format HTML (Required) |
| `from_name` | string | Nama pengirim kustom (Optional) |

### Struktur Respons (JSON)
- **Success (200):** `{"status": true, "message": "Email berhasil dikirim ke ..."}`
- **Error (400/500):** `{"status": false, "error": "...", "detail": "..."}`

---

## 3. Pembacaan Mailbox (`mailbox.php`)

Endpoint ini mengambil daftar email dari folder INBOX dan SPAM menggunakan protokol IMAP.

### Spesifikasi Request
- **Method:** `GET`
- **Query Parameters:**
| Parameter | Default | Description |
| :--- | :--- | :--- |
| `email` | `admin@kinau.id` | Alamat email akun |
| `password` | `Kinausecure...` | Password app/akun |

### Struktur Respons (JSON)
Data dikelompokkan berdasarkan folder (`inbox` dan `spam`):
```json
{
  "status": true,
  "data": {
    "inbox": [
      {
        "id": 123,
        "folder": "INBOX",
        "subject": "Judul Email",
        "from": "sender@example.com",
        "date": "Wed, 1 Apr 2026...",
        "seen": true
      }
    ],
    "spam": []
  }
}
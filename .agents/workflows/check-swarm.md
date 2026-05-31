---
description: Mengecek status kemajuan tugas dan membaca log aktivitas terakhir dari daemon Ruflo secara langsung dari shared memory.
---

[CRITICAL WORKFLOW]
1. Gunakan tool `workflow_status` atau `list_tasks` untuk menarik data status terbaru dari shared memory (.swarm/memory.db).
2. Jika ada file log di jalur `.claude-flow/logs/daemon.log`, gunakan tool read file/view log untuk membaca 15-20 baris terakhirnya.
3. Tampilkan persentase progress saat ini ke saya dan informasikan apakah agen di latar belakang sudah menuliskan respons kembalian (atau berhasil membuat file output `audit_db.txt`).
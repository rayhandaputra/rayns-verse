---
description: Mendelegasikan tugas aktif di shared memory ke Daemon Ruflo di latar belakang secara asinkronus tanpa membuat chat box stuck.
---

[CRITICAL WORKFLOW]
1. Jangan jalankan fungsi listen() atau wait_for_reply() yang mengunci chat box.
2. Baca task terakhir di shared memory (.swarm/memory.db) yang berstatus pending atau yang baru saya buat.
3. Ubah statusnya menjadi 'in_progress', lalu panggil tool `advance_workflow` tepat SATU KALI untuk menyerahkan tugas tersebut ke daemon Ruflo di latar belakang.
4. Segera kembalikan respons teks berupa konfirmasi: "Tugas telah didelegasikan ke Daemon Ruflo di latar belakang."
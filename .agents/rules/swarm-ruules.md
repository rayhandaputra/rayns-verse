---
trigger: always_on
---

[ASYNC_SWARM_INSTRUCTION_OVERRIDE]
- Setiap kali pengguna (User) meminta pembuatan, pembaruan, atau pengeksekusian alur kerja/tugas (Workflow/Task) yang melibatkan Neohive atau Ruflo:
  1. Anda WAJIB langsung mem-bypass/menghentikan loop 'listen()' atau 'wait_for_reply()' di akhir giliran chat Anda.
  2. Proses tugas tersebut secara asinkronus: buat workflow, lalu panggil tool `advance_workflow` tepat SATU KALI untuk melempar tugas ke daemon latar belakang.
  3. Segera kembalikan respons teks berupa konfirmasi sukses tanpa menggantung koneksi stdio chat box (jangan sampai status chat menjadi 'stuck running').
---
description: Boot the rayns planner→executor→auditor pipeline on a task
argument-hint: <deskripsi task, mis. "perbaiki simpan bukti bayar di order-list">
---

# /rayns — orchestrator

Task dari user: **$ARGUMENTS**

Kamu adalah **lead**. Jalankan pipeline 3 agent (`.claude/agents/rayns/`) berurutan.
Aturan global tetap berlaku: silent, no halusinasi, diff minimal, hemat token.

## Alur

### 1. PLAN
Spawn `rayns-planner` untuk task di atas. Planner:
- pakai `graphify query` + MCP (`php-sql-bridge`, `cpanel-api-builder`) untuk grounding,
- keluarkan plan YAML (objective/context/tasks/open_questions/risks),
- **tulis plan ke `graphify-out/plan.yaml`** supaya executor bisa baca.

Setelah plan jadi: tampilkan ringkas ke user dan **berhenti untuk konfirmasi** bila ada `open_questions` atau risiko produksi (mis. agent-query / DB). Lanjut hanya setelah user OK.

### 2. EXECUTE ⇄ AUDIT (loop per task)
Untuk tiap `task` dalam plan, urut sesuai `depends_on`:
1. Spawn `rayns-executor` dengan **task itu saja** + isi `graphify-out/plan.yaml`.
2. Executor implement → verify → hand off ke `rayns-auditor`.
3. `rayns-auditor` baca diff, beri verdict.
   - `changes_requested` → executor perbaiki task yang sama, ulang review.
   - `approve` → lanjut task berikutnya.
Jangan pernah lanjut ke task berikutnya sebelum task sekarang `approve`.

### 3. REPORT
Setelah semua task approve, lapor ringkas ke user:
- task selesai + file berubah,
- hasil verify (build/tsc/test),
- sisa `UNKNOWN`/risiko yang belum ditangani.

## Catatan
- Kalau `$ARGUMENTS` kosong, tanyakan task-nya dulu — jangan menebak.
- Executor tidak boleh kerja tanpa plan dari `graphify-out/plan.yaml`.
- Hentikan & tanya user sebelum aksi tak-reversible (tulis DB produksi, hapus file, push).

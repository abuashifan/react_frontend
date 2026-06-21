# Phase 26 Progress Report — Accounting Foundation & Opening Balance

Tanggal: 2026-06-21
Status: In Progress (Slice A selesai)
Scope finding: A13-047..058 + A13-085..115 (≈42, minus A13-048 yang di-defer ke Reports)

Eksekusi slice-per-slice (keputusan user):

- **Slice A — Jurnal Umum** ✅ DONE
- **Slice B — Saldo Awal (Opening Balance)** ✅ DONE
- Slice C — Periode Akuntansi (Period Lock) ⏳
- Slice D — Tahun Fiskal (Fiscal Year) ⏳

A13-048 (Reports/Laba Rugi blank) di-defer ke phase Reports (domain Reports, bukan accounting foundation) — keputusan user.

---

## Slice A — Jurnal Umum (selesai)

### Batch A1 — List contract
- A13-047 total debit/kredit di list (backend `withSum` aggregate).
- A13-049 search nomor/deskripsi server-side.
- A13-050 page size 50/100 dihormati.
- A13-051 void filter kirim `include_void`.
- A13-052 error/retry state (`QueryErrorState` shared baru).
- A13-094 filter `is_system_generated` + kolom Sumber + toggle jurnal sistem.

### Batch A2 — Form/detail contract
- A13-053 dimensi Departemen/Proyek per line.
- A13-054 lines via RHF `useFieldArray` + Zod (akun wajib, debit/kredit XOR, balanced) + nested backend error → row.
- A13-055 persistent draft create (`usePersistentFormDraft`).
- A13-056 save permission edit≠create.
- A13-057 badge System Generated + sembunyikan aksi.
- A13-058 aksi mengikuti workflow mode (auto-post / approve-post).
- A13-095 detail 404/error state.
- A13-097 revisi posted (`edit_reason`) saat `allow_edit_posted_transactions`.
- A13-098 control account ditolak backend → error dipetakan ke row.
- A13-099 presisi uang mengikuti `amount_precision`.
- A13-100 accessible name kontrol line + label `htmlFor`.

### Batch A3 — Backend security + verifikasi
- A13-096 exception handler aman: `ModelNotFoundException`/`NotFoundHttpException` → envelope `RESOURCE_NOT_FOUND` 404 tanpa stack trace/file path.

### Verifikasi Slice A
- Frontend build: pass; lint 0 error, 34 warning legacy.
- Playwright route-mock: full suite 21/21 (termasuk accounting/journal-form 2/2).
- Backend `JournalEntryTest`: 12/12 (43 assertions) — termasuk list totals/filter + safe 404.
- Pint: fixed (file yang diubah).
- **Live (PLAYWRIGHT_LIVE=1) 2/2**: render list+form tanpa crash/undefined/Invalid Date; **create jurnal manual end-to-end** (POST /journals) di app.finlite.my.id.

## Slice B — Saldo Awal (selesai)

Semua perbaikan frontend (backend OB sudah canonical: status `reopened`, totals termasuk system line, `blocking_errors` objek `{code,message}`).

- A13-085 status 500 → error/retry state (bukan "belum ada saldo awal").
- A13-086 status `reopened` ditambah ke type + badge bersama (`obStatusBadge`); batch reopened editable & tidak crash.
- A13-087 system line ditampilkan read-only (badge Sistem) dan ikut total.
- A13-088 `blocking_errors`/`warnings` objek `{code,message}` dirender via `obMessageText` (tidak crash render object).
- A13-089 persistent draft lokal manual lines per batch (restore + clear setelah simpan/post).
- A13-090 aksi pindah ke `FixedBottomBar`.
- A13-091 reopen pakai `ConfirmDialog` (copy reopen + alasan), bukan dialog Void.
- A13-092 accessible name pada input debit/kredit/keterangan + tombol hapus + selector akun.
- A13-093 post/lock pakai `ConfirmDialog` aplikasi, bukan `window.confirm`.

Komponen baru shared: `ConfirmDialog` (feedback). Verifikasi: build/lint 0 error, route-mock OB 3/3 (full suite 22/22), live read 1/1 (status+batch render).

## Catatan baseline backend
Full suite backend: 698 test, 639 pass, **59 fail pre-existing** di domain Purchase/VendorBill/GoodsReceipt/AP/FixedAsset/SourceType (mis. `purchase_order_lines has no column named line_classification`, SourceType enum tanpa `fixed_asset`). Dikonfirmasi pre-existing via stash perubahan Slice A — **bukan regresi Phase 26**. Ditangani di phase Purchase/Fixed-Assets terkait.

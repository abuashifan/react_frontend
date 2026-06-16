# Gap Master Index — Frontend vs Backend

Tanggal audit: 2026-06-16  
Source awal: Membaca seluruh `laravel_backend/app/Modules/*/Routes/api.php` secara langsung.  
Source aktif tambahan: `../audit_docs/audit-11-frontend-global-contract-map-16-06-26.md`.

> Catatan Audit-11:
> GAP-01 sampai GAP-06 tetap valid sebagai gap lama, tetapi harus dibaca bersama Audit-11 dan source code aktual. Beberapa area sudah punya mitigasi parsial di code, namun belum menjadi kontrak canonical.

---

## Kategori Gap

| Kode | Judul | Severity | File Detail |
|------|-------|----------|-------------|
| GAP-01 | P0 Contract Fixes — Permission key, ribbon path, HTTP method salah | 🔴 Critical | [gap-01-p0-contract-fixes.md](gap-01-p0-contract-fixes.md) |
| GAP-02 | Settings & Access endpoint mismatch | 🔴 Critical | [gap-02-settings-access-mismatch.md](gap-02-settings-access-mismatch.md) |
| GAP-03 | Module baru belum ada: Fixed Assets, Opening Balance, Period-End | 🔴 High | [gap-03-missing-modules.md](gap-03-missing-modules.md) |
| GAP-04 | Setup Wizard — onboarding pakai endpoint lama | 🟠 High | [gap-04-setup-wizard-refactor.md](gap-04-setup-wizard-refactor.md) |
| GAP-05 | Dashboard tidak punya backend endpoint | 🟡 Medium | [gap-05-dashboard-no-backend.md](gap-05-dashboard-no-backend.md) |
| GAP-06 | Report endpoint gaps — GRNI, deposits recon, export, AR/AP aging | 🟡 Medium | [gap-06-report-gaps.md](gap-06-report-gaps.md) |
| GAP-07 | Master Data DTO/action contract mismatch | 🔴 Critical | [gap-07-master-data-dto-contract.md](gap-07-master-data-dto-contract.md) |
| GAP-08 | Transaction document number DTO mismatch | 🟠 High | [gap-08-transaction-dto-number-contract.md](gap-08-transaction-dto-number-contract.md) |

---

## Urutan Implementasi yang Disarankan

```
Phase 8  → GAP-01: P0 Contract Fixes (permission keys, ribbon paths, HTTP methods)
Phase 9  → GAP-02: Settings & Access Management Refactor
Phase 14 → GAP-07: Master Data DTO/action contract fixes
Phase 15 → GAP-08: Transaction document number DTO contract fixes
Phase 16 → GAP-04 + GAP-03b: Setup Wizard + Opening Balance
Phase 17 → GAP-06 + GAP-05: Reports gaps + Dashboard fallback
Phase 18 → GAP-03c: Period-End Processing
Phase 19 → GAP-03a: Fixed Assets Module
```

Catatan:
- Nomor phase 10-13 lama masih ada sebagai dokumen historis untuk missing modules.
- Setelah Audit-11, Master Data DTO dan transaction DTO diprioritaskan lebih dulu karena memengaruhi menu yang sudah terlihat di UI.

---

## Ringkasan Dampak

| Gap | Dampak ke User Jika Dibiarkan |
|-----|-------------------------------|
| GAP-01 | Semua route guard menggunakan permission key salah → user punya akses di backend tapi frontend blokir atau sebaliknya |
| GAP-02 | Settings dan Users/Roles page kirim request ke endpoint yang tidak ada → semua gagal 404 |
| GAP-03 | Fixed Assets, Opening Balance, Period-End tidak bisa diakses sama sekali |
| GAP-04 | Onboarding wizard gagal saat finalize karena endpoint tidak ada |
| GAP-05 | Dashboard KPI card selalu error (endpoint tidak ada di backend) |
| GAP-06 | Tombol export PDF/Excel → 404; tab GRNI recon hilang; AR/AP aging pakai endpoint salah |
| GAP-07 | Master Data terlihat kosong/NaN/422 karena frontend field tidak cocok dengan backend request/model |
| GAP-08 | Nomor dokumen kosong/salah di banyak workspace list karena frontend pakai `number`, backend pakai field spesifik |

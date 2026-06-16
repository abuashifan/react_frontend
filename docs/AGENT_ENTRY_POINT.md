# AGENT_ENTRY_POINT.md — Seaside Escape ERP Frontend

> Dibaca setelah `/workspace/frontend/AGENTS.md`.
> Status dokumen ini: entry point aktif setelah Audit-11.

---

## 1. Entry Point Aktif

Untuk task frontend saat ini, agent **WAJIB membaca file ini setelah `AGENTS.md`**:

```text
docs/audit_docs/audit-11-frontend-global-contract-map-16-06-26.md
```

Audit-11 adalah peta global terbaru untuk:

- contract mismatch frontend vs backend;
- route/ribbon path mismatch;
- DTO mapping Master Data dan transaksi;
- endpoint yang masih 404/405;
- issue table/list/form yang belum selesai;
- urutan prioritas perbaikan;
- dokumen detail yang perlu dibuat berikutnya.

Jangan mulai dari audit lama atau prompt phase lama kecuali Audit-11 secara eksplisit merujuk ke file itu.

---

## 2. Status Dokumen Lama

Dokumen lama di folder berikut **bukan entry point utama lagi**:

```text
docs/gap_docs/
docs/issue_docs/
docs/praproduction_docs/
docs/design_docs/
docs/prompt/
docs/audit_docs/audit-00..audit-10*
```

Dokumen tersebut sekarang berfungsi sebagai:

- detail historis;
- bahan referensi saat Audit-11 menunjuk issue tertentu;
- template untuk membuat detail gap/issue/spec/prompt baru.

Jika dokumen lama bertentangan dengan Audit-11, source code aktual, atau Laravel route list aktual, gunakan urutan prioritas berikut:

```text
1. Backend route/source aktual
2. Frontend source aktual
3. Audit-11
4. Dokumen gap/issue/spec/prompt lama
```

---

## 3. Urutan Baca Minimum Setiap Sesi

```text
1. /workspace/frontend/AGENTS.md
2. /workspace/frontend/docs/AGENT_ENTRY_POINT.md
3. /workspace/frontend/docs/audit_docs/audit-11-frontend-global-contract-map-16-06-26.md
4. File detail yang disebut oleh Audit-11 sesuai A11 issue ID
5. Source code terkait
6. Backend route/controller/request/model terkait sebagai read-only reference
```

Untuk task UI/layout yang bukan API contract, tetap baca design doc yang relevan setelah Audit-11.

---

## 4. Mapping Cepat Audit-11

Gunakan A11 ID sebagai unit kerja. Jangan memperbaiki semua sekaligus.

| A11 ID | Area | Detail berikutnya |
|---|---|---|
| A11-01 | Route/ribbon canonical map | pakai `issue_docs/issue-07-route-ribbon-canonical-map.md` + `praproduction_docs/spec-34-route-ribbon-canonical-map.md` |
| A11-02 | Master Data DTO mismatch | pakai `gap_docs/gap-07-master-data-dto-contract.md` + `praproduction_docs/spec-32-master-data-dto-contract-fixes.md` |
| A11-03 | Master Data delete vs activate/deactivate | pakai `issue_docs/issue-09-master-data-delete-actions.md` + `spec-32` |
| A11-04 | Product table/form broken | pakai `issue_docs/issue-08-product-dto-and-table.md` + `spec-32` |
| A11-05 | Journal totals/account labels | pakai `issue_docs/issue-10-journal-list-totals-and-account-labels.md` + `praproduction_docs/spec-33-transaction-dto-number-contract.md` |
| A11-06 | Settings & Access endpoints | pakai `spec-27-settings-access-refactor.md` setelah verifikasi route |
| A11-07 | Dashboard endpoints missing | pakai `issue_docs/issue-11-dashboard-graceful-fallback.md` + `praproduction_docs/spec-35-shared-runtime-hardening.md` |
| A11-08 | Setup wizard endpoints | pakai `spec-30-setup-wizard-refactor.md` setelah verifikasi route |
| A11-09 | Opening Balance missing | pakai `spec-29-opening-balance-module.md` |
| A11-10 | Period-End missing | pakai `spec-31-period-end-module.md` |
| A11-11 | Fixed Assets missing | pakai `spec-28-fixed-assets-module.md` |
| A11-12 | Cash Bank reconciliation methods | update `issue-04-bank-recon-methods.md` dengan route aktual |
| A11-13 | Reports endpoint gaps | update `issue-06-report-endpoint-fixes.md` |
| A11-14 | Document number DTO mapping | pakai `gap_docs/gap-08-transaction-dto-number-contract.md` + `spec-33` |
| A11-15 | SearchableSelect selected label | pakai `issue_docs/issue-12-searchable-select-selected-options-audit.md` + `spec-35` |
| A11-16 | Formatter guards | pakai `issue_docs/issue-13-formatters-null-invalid-guard.md` + `spec-35` |
| A11-17 | API error handling | pakai `issue_docs/issue-14-api-error-display-and-form-errors.md` + `spec-35` |
| A11-18 | DataTable consistency | pakai `issue_docs/issue-15-datatable-reuse-and-sticky-column-audit.md` + `spec-35` |

---

## 5. Aturan Kerja dari Audit-11

Sebelum implementasi:

```text
1. Pilih satu A11 issue ID.
2. Baca bagian A11 terkait di Audit-11.
3. Untuk phase 14+, baca docs/prompt/prompt-guardrails-audit-11-implementation.md.
4. Baca prompt phase terkait jika sudah tersedia.
5. Baca source frontend aktual.
6. Baca backend route/controller/request/model aktual sebagai read-only.
7. Jika detail belum ada, buat dokumen detail di gap_docs/issue_docs/spec/prompt dulu.
8. Baru implementasi.
```

Setelah implementasi:

```text
1. Update docs/struktur_frontend.md jika ada file baru.
2. Jalankan npm run build.
3. Catat status fix di dokumen issue/gap terkait.
```

---

## 6. Canonical Rules yang Tetap Berlaku

Walaupun Audit-11 menjadi entry point utama, hard rules berikut tetap aktif:

```text
❌ Jangan fetch data langsung di component; gunakan TanStack Query.
❌ Jangan simpan data API di Zustand; Zustand hanya untuk UI state.
❌ Jangan hardcode API URL.
❌ Jangan edit src/components/ui/.
❌ Jangan render action button tanpa permission guard.
❌ Jangan ubah backend dari task frontend.

✅ API call di src/modules/{module}/services/.
✅ Form pakai React Hook Form + Zod.
✅ Props dan API response typed.
✅ Angka pakai tabular-nums.
✅ Untuk layout, ikuti tablet-first rules dan pakai dvh, bukan vh.
```

---

## 7. Build Check

```bash
cd /workspace/frontend
npm run build
```

Build harus 0 error sebelum task frontend dianggap selesai.

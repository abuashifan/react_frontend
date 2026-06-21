# AGENT_ENTRY_POINT.md — Seaside Escape ERP Frontend

> Dibaca setelah `/workspace/frontend/AGENTS.md`.
> Status dokumen ini: entry point aktif setelah Audit-13.

---

## 1. Entry Point Aktif

Untuk task remediation saat ini, agent **WAJIB membaca file berikut setelah `AGENTS.md`**:

```text
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/prompt/prompt-phase-24-remediation-foundation-router.md
```

Audit-13 adalah baseline runtime/source/contract terbaru:

- 105 area baseline sudah diaudit;
- 280 finding tercatat;
- mencakup frontend dan backend;
- mencakup contract, workflow, accounting/inventory integrity, permission, report, responsive, dan accessibility.

Spec-37 adalah spesifikasi canonical lintas sesi untuk contract, invariant, verification, dan handoff. GAP-10 adalah roadmap Phase 24–39. Prompt guardrails Audit-13 adalah checklist eksekusi wajib setiap phase. Jangan memilih finding secara acak di luar urutan dependency GAP-10 kecuali user secara eksplisit mengubah prioritas.

---

## 2. Status Dokumen Lama

Dokumen berikut **bukan entry point utama lagi**:

```text
docs/audit_docs/audit-00..audit-12*
docs/gap_docs/gap-01..gap-09*
docs/issue_docs/*
docs/praproduction_docs/spec-01..spec-36*
docs/prompt/prompt-phase-1..prompt-phase-23*
```

Dokumen tersebut sekarang berfungsi sebagai:

- detail historis;
- bahan referensi saat Audit-13/GAP-10 menunjuk issue atau primitive lama;
- template untuk membuat detail gap/issue/spec/prompt baru.

Jika dokumen lama bertentangan dengan roadmap aktif atau source aktual, gunakan urutan prioritas:

```text
1. Business rule/accounting invariant yang sudah disepakati
2. Backend source dan test aktual
3. Frontend source aktual
4. Audit-13
5. Spec-37
6. GAP-10
7. Audit-12/GAP-09 dan Audit-11
8. Dokumen gap/issue/spec/prompt historis lain
```

---

## 2b. Status Phase 1–23

Phase 1–23 sudah selesai secara tracking dan tidak perlu dijalankan ulang sebagai phase lama.

Catatan: `Done` berarti implementasi/build phase selesai pada saat itu, bukan berarti area tersebut bebas finding. Audit-13 adalah baseline baru dan Phase 24–39 adalah backlog aktif.

---

## 3. Urutan Baca Minimum Setiap Sesi

```text
1. /workspace/frontend/AGENTS.md
2. /workspace/frontend/docs/AGENT_ENTRY_POINT.md
3. /workspace/frontend/docs/praproduction_docs/spec-37-audit-13-remediation.md
4. /workspace/frontend/docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
5. /workspace/frontend/docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
6. /workspace/frontend/docs/prompt/prompt-guardrails-audit-13-implementation.md
7. /workspace/frontend/docs/prompt/prompt-phase-24-remediation-foundation-router.md
8. Bagian phase aktif di GAP-10
9. Issue/spec/prompt baru untuk phase tersebut, jika sudah dibuat
10. Audit-12/GAP-09 atau Audit-11 hanya jika dirujuk oleh phase aktif
11. Source frontend terkait
12. /workspace/laravel_backend/AGENTS.md
13. Dokumen backend-local wajib dan source/test backend terkait
```

Untuk task UI/layout, baca design doc relevan dan `spec-23-tablet-first-layout-rules.md`.

Untuk perubahan backend, ikuti reading order di `/workspace/laravel_backend/AGENTS.md`.

---

## 4. Mapping Cepat Audit-13 / GAP-10

| Phase | Fokus | Finding utama |
|---:|---|---|
| 24 | Test foundation, error containment, router/deep-link | A13-059, A13-254, A13-271 |
| 25 | Master Data dan Account Mapping | A13-004..046, A13-060..084, A13-255..257 |
| 26 | Accounting foundation dan Opening Balance | A13-047..058, A13-085..115 |
| 27 | Cash & Bank dan Rekonsiliasi | A13-116..135 |
| 28 | Sales transaction contract | A13-136..154 |
| 29 | AR subledger/report | A13-155..160 |
| 30 | Purchase transaction contract | A13-161..179 |
| 31 | AP subledger/report | A13-180..185 |
| 32 | Inventory integrity/workflow | A13-186..203 |
| 33 | Fixed Assets runtime/core | A13-204..214, A13-220..224, A13-229..231 |
| 34 | Fixed Assets lifecycle/report | A13-215..219, A13-225..228 |
| 35 | Period-End | A13-272..280 |
| 36 | Financial/operational reports | A13-232..253 |
| 37 | Settings, access, dashboard, router verification | A13-001..003, A13-258..270 |
| 38 | Cross-cutting UX/accessibility | P2/P3 tersisa |
| 39 | Full regression dan Audit-13 closure | A13-001..280 |

---

## 5. Mapping Historis Audit-12

Gunakan A12 issue group sebagai unit kerja. Jangan memperbaiki semua sekaligus.

| Issue | Area | Detail berikutnya |
|---|---|---|
| A12-12/A12-15 | Reports crash + endpoint fiktif | `issue_docs/issue-16-reports-runtime-contract.md` + `spec-36` + `prompt-phase-18` |
| A12-05/A12-13/A12-14 | Stock balance DTO/detail/filter | `issue_docs/issue-17-stock-balance-dto-detail.md` + `spec-36` + `prompt-phase-19` |
| A12-01/A12-02 | Multi-select filter + date range | `issue_docs/issue-18-transaction-list-filters.md` + `spec-36` + `prompt-phase-20` |
| A12-06/A12-07 | Row checkbox + bulk void | `issue_docs/issue-19-datatable-selection-bulk-void.md` + `spec-36` + `prompt-phase-20` |
| A12-08 | Persistent form draft | `issue_docs/issue-20-persistent-form-draft.md` + `spec-36` + `prompt-phase-21` |
| A12-09 | SearchableSelect preload/labels | `issue_docs/issue-21-searchable-select-preload.md` + `spec-36` + `prompt-phase-22` |
| A12-11 | Date input normalization | `issue_docs/issue-22-date-input-normalization.md` + `spec-36` + `prompt-phase-22` |
| A12-03 | Close all primary tabs | `issue_docs/issue-23-primary-tab-close-all.md` + `spec-36` + `prompt-phase-23` |
| A12-04 | Fixed assets ribbon diagnostic | `issue_docs/issue-24-fixed-assets-ribbon-empty.md` + `spec-36` + `prompt-phase-23` |
| A12-10 | Document edit/view mode policy | `issue_docs/issue-25-document-edit-mode-policy.md` + `spec-36` + `prompt-phase-22` |
| A12-16 | Lint debt cleanup | `issue_docs/issue-26-lint-debt-cleanup.md` + `spec-36` + `prompt-phase-23` |

---

## 6. Mapping Historis Audit-11

Audit-11 tetap historis dan relevan untuk contract mismatch yang belum disentuh ulang.

| A11 ID | Area | Detail berikutnya |
|---|---|---|
| A11-01 | Route/ribbon canonical map | `issue_docs/issue-07-route-ribbon-canonical-map.md` + `praproduction_docs/spec-34-route-ribbon-canonical-map.md` |
| A11-02 | Master Data DTO mismatch | `gap_docs/gap-07-master-data-dto-contract.md` + `praproduction_docs/spec-32-master-data-dto-contract-fixes.md` |
| A11-03 | Master Data delete vs activate/deactivate | `issue_docs/issue-09-master-data-delete-actions.md` + `spec-32` |
| A11-04 | Product table/form broken | `issue_docs/issue-08-product-dto-and-table.md` + `spec-32` |
| A11-05 | Journal totals/account labels | `issue_docs/issue-10-journal-list-totals-and-account-labels.md` + `praproduction_docs/spec-33-transaction-dto-number-contract.md` |
| A11-06 | Settings & Access endpoints | `spec-27-settings-access-refactor.md` setelah verifikasi route |
| A11-07 | Dashboard endpoints missing | `issue_docs/issue-11-dashboard-graceful-fallback.md` + `praproduction_docs/spec-35-shared-runtime-hardening.md` |
| A11-08 | Setup wizard endpoints | `spec-30-setup-wizard-refactor.md` setelah verifikasi route |
| A11-09 | Opening Balance missing | `spec-29-opening-balance-module.md` |
| A11-10 | Period-End missing | `spec-31-period-end-module.md` |
| A11-11 | Fixed Assets missing | `spec-28-fixed-assets-module.md` |
| A11-12 | Cash Bank reconciliation methods | `issue-04-bank-recon-methods.md` |
| A11-13 | Reports endpoint gaps | `issue-06-report-endpoint-fixes.md` |
| A11-14 | Document number DTO mapping | `gap_docs/gap-08-transaction-dto-number-contract.md` + `spec-33` |
| A11-15 | SearchableSelect selected label | `issue_docs/issue-12-searchable-select-selected-options-audit.md` + `spec-35` |
| A11-16 | Formatter guards | `issue_docs/issue-13-formatters-null-invalid-guard.md` + `spec-35` |
| A11-17 | API error handling | `issue_docs/issue-14-api-error-display-and-form-errors.md` + `spec-35` |
| A11-18 | DataTable consistency | `issue_docs/issue-15-datatable-reuse-and-sticky-column-audit.md` + `spec-35` |

---

## 7. Aturan Kerja Audit-13

Sebelum implementasi:

```text
1. Pilih satu phase aktif GAP-10 (24–39).
2. Terapkan guardrail dan checklist startup Spec-37.
3. Terapkan `prompt-guardrails-audit-13-implementation.md`.
4. Baca seluruh scope, dependency, dan exit criteria phase tersebut.
5. Baca finding Audit-13 yang masuk phase.
6. Buat/baca issue detail dan prompt phase baru.
7. Baca source frontend aktual.
8. Baca backend `AGENTS.md`, dokumen backend-local, source, migration, dan test aktual.
9. Tetapkan kontrak request/response/permission/lifecycle canonical.
10. Implementasikan frontend dan/atau backend.
11. Tambahkan automated test dan jalankan runtime verification.
```

Setelah implementasi:

```text
1. Jalankan mandatory phase validation gate dari Spec-37 §17.1.
2. Rekonsiliasi seluruh finding coverage phase satu per satu.
3. Pastikan total finding phase = total checklist = total `verified`.
4. Jika satu finding gagal atau regression baru ditemukan, kembalikan phase ke `in-progress`.
5. Update finding Audit-13 beserta evidence runtime dan automated test.
6. Update GAP-10 dan dokumen issue/spec/prompt phase.
7. Update `docs/struktur_frontend.md` jika ada file baru.
8. Jalankan frontend build/lint/Playwright scope terkait.
9. Jika backend berubah, jalankan feature test terkait dan Pint.
10. Update AGENTS.md section 6A/6C/6D.
```

---

## 8. Canonical Rules yang Tetap Berlaku

```text
❌ Jangan fetch data langsung di component; gunakan TanStack Query.
❌ Jangan simpan data API di Zustand; Zustand hanya untuk UI state.
❌ Jangan hardcode API URL.
❌ Jangan edit src/components/ui/.
❌ Jangan render action button tanpa permission guard.
❌ Jangan menambah endpoint fiktif.

✅ API call di src/modules/{module}/services/.
✅ Form pakai React Hook Form + Zod.
✅ Props dan API response typed.
✅ Angka pakai tabular-nums.
✅ Untuk layout, ikuti tablet-first rules dan pakai dvh, bukan vh.
✅ Backend boleh diubah secara scoped setelah membaca `/workspace/laravel_backend/AGENTS.md`.
✅ Perubahan backend wajib menjaga tenancy/accounting invariants dan memiliki test terkait.
```

---

## 9. Verification Check

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <scope>

# Jika backend diubah
cd /workspace/laravel_backend
php artisan test --filter=<scope>
vendor/bin/pint --test
```

Finding hanya boleh menjadi `verified` setelah automated test dan runtime outcome terkait lulus. Phase hanya boleh ditutup setelah seluruh finding pada coverage phase telah diverifikasi satu per satu dan tidak ada regression baru yang belum selesai.

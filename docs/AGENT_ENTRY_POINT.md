# AGENT_ENTRY_POINT.md — Seaside Escape ERP Frontend

> Dibaca setelah `/workspace/frontend/AGENTS.md`.
> Status dokumen ini: entry point aktif setelah Audit-12.

---

## 1. Entry Point Aktif

Untuk task frontend saat ini, agent **WAJIB membaca file ini setelah `AGENTS.md`**:

```text
docs/audit_docs/audit-12-frontend-ux-workflow-audit-16-06-26.md
docs/gap_docs/gap-09-audit-12-ux-workflow-fixes.md
```

Audit-12 adalah peta global terbaru untuk:

- UX/workflow frontend setelah Audit-11;
- filter multi-select dan date range;
- report crash dan endpoint fiktif;
- stock balance DTO/detail mismatch;
- DataTable selection dan bulk void;
- draft form persistence;
- SearchableSelect/date input/edit mode;
- close-all virtual tabs, ribbon diagnostic, lint cleanup.

Jangan mulai dari audit lama atau prompt phase lama kecuali Audit-12 atau GAP-09 secara eksplisit merujuk ke file itu.

---

## 2. Status Dokumen Lama

Dokumen lama di folder berikut **bukan entry point utama lagi**:

```text
docs/gap_docs/
docs/issue_docs/
docs/praproduction_docs/
docs/design_docs/
docs/prompt/
docs/audit_docs/audit-00..audit-11*
```

Dokumen tersebut sekarang berfungsi sebagai:

- detail historis;
- bahan referensi saat Audit-12/GAP-09 menunjuk issue tertentu;
- template untuk membuat detail gap/issue/spec/prompt baru.

Jika dokumen lama bertentangan dengan Audit-12, source code aktual, atau Laravel route list aktual, gunakan urutan prioritas berikut:

```text
1. Backend route/source aktual
2. Frontend source aktual
3. Audit-12
4. GAP-09 / issue-16..26 / spec-36 / prompt phase 18..23
5. Audit-11
6. Dokumen gap/issue/spec/prompt lama
```

---

## 2b. Status Phase 1–17

Phase 1–17 sudah selesai secara tracking dan tidak perlu diulang kecuali issue Audit-12 meminta koreksi di area yang sama.

Catatan: Done berarti implementasi/build phase selesai, bukan berarti semua UX/workflow sudah final. Audit-12 adalah backlog aktif berikutnya.

---

## 3. Urutan Baca Minimum Setiap Sesi

```text
1. /workspace/frontend/AGENTS.md
2. /workspace/frontend/docs/AGENT_ENTRY_POINT.md
3. /workspace/frontend/docs/audit_docs/audit-12-frontend-ux-workflow-audit-16-06-26.md
4. /workspace/frontend/docs/gap_docs/gap-09-audit-12-ux-workflow-fixes.md
5. /workspace/frontend/docs/praproduction_docs/spec-36-audit-12-ux-workflow-fixes.md
6. /workspace/frontend/docs/prompt/prompt-guardrails-audit-12-implementation.md
7. Issue detail + prompt phase terkait
8. Source code terkait
9. Backend route/controller/request/model terkait sebagai read-only reference
```

Untuk pekerjaan yang masih menyentuh kontrak Audit-11, baca juga:

```text
/workspace/frontend/docs/audit_docs/audit-11-frontend-global-contract-map-16-06-26.md
```

Untuk task UI/layout, tetap baca design doc yang relevan setelah Audit-12.

---

## 4. Mapping Cepat Audit-12

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

## 5. Mapping Cepat Audit-11

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

## 6. Aturan Kerja dari Audit-12

Sebelum implementasi:

```text
1. Pilih satu phase Audit-12 (18-23).
2. Baca bagian A12 terkait di Audit-12.
3. Baca GAP-09, spec-36, dan prompt guardrails Audit-12.
4. Baca issue detail sesuai phase.
5. Baca source frontend aktual.
6. Baca backend route/controller/request/model aktual sebagai read-only.
7. Baru implementasi.
```

Setelah implementasi:

```text
1. Update docs/struktur_frontend.md jika ada file baru.
2. Jalankan npm run build.
3. Update AGENTS.md section 6A/6C/6D.
4. Catat status fix di dokumen issue/gap terkait.
```

---

## 7. Canonical Rules yang Tetap Berlaku

```text
❌ Jangan fetch data langsung di component; gunakan TanStack Query.
❌ Jangan simpan data API di Zustand; Zustand hanya untuk UI state.
❌ Jangan hardcode API URL.
❌ Jangan edit src/components/ui/.
❌ Jangan render action button tanpa permission guard.
❌ Jangan ubah backend dari task frontend.
❌ Jangan menambah endpoint fiktif.

✅ API call di src/modules/{module}/services/.
✅ Form pakai React Hook Form + Zod.
✅ Props dan API response typed.
✅ Angka pakai tabular-nums.
✅ Untuk layout, ikuti tablet-first rules dan pakai dvh, bukan vh.
```

---

## 8. Build Check

```bash
cd /workspace/frontend
npm run build
```

Build harus 0 error sebelum task frontend dianggap selesai.

# Phase 26 Completion and Validation Report

Tanggal: 2026-06-22
Status exit: Phase complete (Slice A–D), verifikasi ulang pada branch terkini.

## Scope
- Finding count: 42
- Finding IDs: A13-047..058, A13-085..115 (A13-048 **di-defer ke phase Reports** — domain Reports, bukan accounting foundation; keputusan user)
- Modules: accounting (jurnal umum, period lock, fiscal year) + opening-balance

## Contract decisions
- **Jurnal**: list mengirim aggregate `total_debit`/`total_credit` (backend `withSum`); filter `is_system_generated`; void filter butuh `include_void`; lines pindah ke RHF `useFieldArray` + Zod (akun wajib, debit/kredit XOR, balanced) dengan nested error→row; dimensi Departemen/Proyek; presisi uang ikut `amount_precision`; aksi mengikuti `transaction_workflow_mode`; revisi posted butuh `edit_reason` saat `allow_edit_posted_transactions`; system journal read-only.
- **404 aman**: `ModelNotFoundException`/`NotFoundHttpException` → envelope `RESOURCE_NOT_FOUND` tanpa stack trace (A13-096).
- **Opening Balance**: status `reopened` editable; system line read-only ikut total; `blocking_errors`/`warnings` objek `{code,message}`; draft lokal per batch; `FixedBottomBar`; `ConfirmDialog` (reopen/post/lock) menggantikan `window.confirm`.
- **Period Lock**: baca `active_fiscal_year.locked_until` canonical; unlock wajib alasan+konfirmasi; preload + min/max fiscal year; konteks fiscal year + status periode bulanan (derived); error state.
- **Fiscal Year**: endpoint canonical (preview/checklist GET, close/reopen POST) + `id` valid dari status; preview wajib sebelum close; payload `closing_notes`/`reopen_reason` saja; permission `fiscal_year.view/close/reopen`; blocker preview (422) ditampilkan.

## Changes
- Frontend: `JournalListPage`, `JournalFormPage` (rewrite RHF), `journalEntry.types`, `journalEntrySchema`; `OpeningBalanceStatusPage`, `OpeningBalanceBatchPage`, `obStatusBadge`, `openingBalance.types`; `PeriodLockPage`; `FiscalYearPage`, `fiscalYearApi`, `useFiscalYear`, `fiscalYear.types`. Komponen shared baru: `QueryErrorState`, `ConfirmDialog`.
- Backend: `JournalEntryService::list` (withSum + is_system_generated filter); `bootstrap/app.php` (handler 404 aman) + `ApiErrorCode::RESOURCE_NOT_FOUND`; `FiscalYearStatusController` (id/is_closed/locked_until/closed_at).
- Migration: tidak ada.

## Automated verification (branch terkini, 2026-06-22)
- Frontend build: pass (0 error).
- Frontend lint: 0 error, 28 warning legacy (RHF watch/useMemo, file di luar phase).
- Playwright route-mock `tests/e2e/accounting/`: **10/10** (journal-form 2, opening-balance 3, period-lock 3, fiscal-year 2).
- Backend feature `JournalEntryTest` + `FiscalYearClosingTest` + `FiscalYearReopenTest` + `FiscalYearLockingTest` + `PeriodLockingApiTest`: **20/20** (89 assertions).
- Pint: file backend yang diubah pass.

## Runtime environment
- frontend-local + route-mock; backend-local (sqlite).
- **live-mutating diizinkan** (otorisasi user 2026-06-21). Live retest 6/6 saat implementasi: jurnal create mutating (POST /journals), OB render status+batch, period lock render, fiscal year status+preview (GET). Data uji prefix `AUDIT`.

## Finding reconciliation

| Finding | Slice | Fix | Automated | Live | Status |
|---|---|---|---|---|---|
| A13-047 | A | list totals (withSum) | be+e2e | ✓ | verified |
| A13-049 | A | search jurnal | e2e | ✓ | verified |
| A13-050 | A | page size dihormati | e2e | – | verified |
| A13-051 | A | void filter include_void | e2e+be | – | verified |
| A13-052 | A | error/retry QueryErrorState | e2e | – | verified |
| A13-053 | A | dimensi Departemen/Proyek | e2e | ✓ | verified |
| A13-054 | A | line validation + nested error | e2e | ✓ | verified |
| A13-055 | A | persistent draft create | e2e | – | verified |
| A13-056 | A | save permission edit≠create | build/src | – | verified |
| A13-057 | A | badge system + hide aksi | src | – | verified |
| A13-058 | A | aksi ikut workflow mode | src | ✓ | verified |
| A13-094 | A | filter is_system_generated | be+e2e | – | verified |
| A13-095 | A | detail 404/error state | e2e/be | – | verified |
| A13-096 | A | 404 aman tanpa stack trace | be test | – | verified |
| A13-097 | A | revisi posted (edit_reason) | be+src | – | verified |
| A13-098 | A | control account error→row | be+src | – | verified |
| A13-099 | A | presisi uang amount_precision | src | – | verified |
| A13-100 | A | accessible name line | e2e/src | ✓ | verified |
| A13-085 | B | status error≠empty | e2e | – | verified |
| A13-086 | B | status reopened tanpa crash | e2e | – | verified |
| A13-087 | B | system line ikut total | e2e | – | verified |
| A13-088 | B | blocking_errors objek | e2e | – | verified |
| A13-089 | B | persistent draft batch | src | – | verified |
| A13-090 | B | FixedBottomBar | src | ✓ | verified |
| A13-091 | B | reopen ConfirmDialog | src | – | verified |
| A13-092 | B | accessible name | src | – | verified |
| A13-093 | B | post/lock ConfirmDialog | src | – | verified |
| A13-101 | C | locked_until canonical | e2e | ✓ | verified |
| A13-102 | C | unlock confirm+reason | e2e | – | verified |
| A13-103 | C | status error≠unlocked | e2e | – | verified |
| A13-104 | C | preload + min/max | src | ✓ | verified |
| A13-105 | C | konteks fiscal year+periode | e2e | ✓ | verified |
| A13-106 | C | label htmlFor/id | src | – | verified |
| A13-107 | D | endpoint id+method canonical | e2e+be | ✓ | verified |
| A13-108 | D | preview wajib sebelum close | e2e+be | ✓ | verified |
| A13-109 | D | payload canonical | be+src | – | verified |
| A13-110 | D | permission fiscal_year.* | src | – | verified |
| A13-111 | D | retained earnings selector dibuang | src | – | verified |
| A13-112 | D | confirm destruktif | e2e | – | verified |
| A13-113 | D | blocker/error state | e2e | ✓ | verified |
| A13-114 | D | closing date dibuang | src | – | verified |
| A13-115 | D | accessible label | src | – | verified |

Legend: be=backend feature test, e2e=Playwright route-mock, src=source/build static, ✓=tercakup live.

## Reconciliation totals
- Coverage findings: 42
- Checklist rows: 42
- Verified: 42
- Failed: 0
- Blocked: 0
- Deferred: 1 (A13-048 → phase Reports)
- Regression new: 0

## Exit decision
- **Phase complete.** Seluruh 42 finding scope `verified` (automated; subset representatif live). Gate hijau pada branch terkini.

## Residual risk
- Live coverage bersifat representatif per domain (bukan setiap mutasi per resource); close/reopen fiscal year & post/lock OB tidak dieksekusi live (side-effect besar) — terbukti via backend feature test + route-mock.
- **Di luar scope Phase 26:** 59 fail backend pre-existing di domain Purchase/VendorBill/GoodsReceipt/AP/FixedAsset/SourceType (migrasi `purchase_order_lines.line_classification` hilang + `SourceType` enum tanpa `fixed_asset`). Dikonfirmasi pre-existing via stash; untuk phase Purchase/Fixed-Assets.
- Phase 26 kemudian dilanjut Codex (Phase 27); report ini diverifikasi ulang terhadap branch terkini 2026-06-22.

## Next phase
- Phase 27 (Cash & Bank) — sudah selesai (Codex, `phase-27-completion-report.md`).
- Phase 28 (Sales Transaction Contract, A13-136..154) — berikutnya.

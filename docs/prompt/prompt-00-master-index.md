# Master Issue Index — Seaside Escape ERP Frontend

> Generated dari `22-implementation-roadmap.md`
> Total issue: 114 issues across 7 phases + 6 gap-fix phases (8–13)

---

## Status Legend

| Icon | Arti |
|---|---|
| ✅ | Done |
| ⚠️ | Ada error / belum bersih |
| ❓ | Belum terkonfirmasi |
| ⏳ | Belum dimulai |

---

## Phase 1 — Foundation & Auth

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 1A — Project Setup | `phase-1A-project-setup.md` | ✅ Done | 14 |
| 1B — Auth Pages | `phase-1B-auth-pages.md` | ✅ Done | 7 |
| 1C — App Shell & Layout | `phase-1C-app-shell-layout.md` | ❓ Belum terkonfirmasi | 7 |
| 1D — Shared Components | `phase-1D-shared-components.md` | ⚠️ DataTable error | 15 |
| 1E — Error Pages & Onboarding | `phase-1E-error-onboarding.md` | ⚠️ Step4 + onboardingApi error | 13 |

**Phase 1 Total: 56 issues**

---

## Phase 2 — Master Data

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 2A — COA & Kontak | `phase-2-master-data.md` | ⏳ | 4 |
| 2B — Produk & Inventory Master | `phase-2-master-data.md` | ⏳ | 5 |
| 2C — Supporting Master Data | `phase-2-master-data.md` | ⏳ | 4 |

**Phase 2 Total: 13 issues**

---

## Phase 3 — Sales Module

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 3A — Sales Quotation & Order | `phase-3-sales.md` | ⏳ | 5 |
| 3B — Delivery Order & Proforma | `phase-3-sales.md` | ⏳ | 4 |
| 3C — Sales Invoice | `phase-3-sales.md` | ⏳ | 4 |
| 3D — Receipt, Deposit & Return | `phase-3-sales.md` | ⏳ | 6 |
| 3E — AR Summary | `phase-3-sales.md` | ⏳ | 5 |

**Phase 3 Total: 24 issues**

---

## Phase 4 — Purchase Module

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 4A — Purchase Request & Order | `phase-4-purchase.md` | ⏳ | 4 |
| 4B — Goods Receipt & Vendor Bill | `phase-4-purchase.md` | ⏳ | 4 |
| 4C — Payment, Deposit & Return | `phase-4-purchase.md` | ⏳ | 6 |
| 4D — AP Summary | `phase-4-purchase.md` | ⏳ | 5 |

**Phase 4 Total: 19 issues**

---

## Phase 5 — Inventory Module

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 5A — Stock Balance & Movement | `phase-5-inventory.md` | ⏳ | 5 |
| 5B — Adjustment & Opname | `phase-5-inventory.md` | ⏳ | 4 |

**Phase 5 Total: 9 issues**

---

## Phase 6 — Accounting & Reports

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 6A — Manual Journal & Accounting | `phase-6-accounting-reports.md` | ⏳ | 4 |
| 6B — Cash & Bank | `phase-6-accounting-reports.md` | ⏳ | 4 |
| 6C — Report Infrastructure | `phase-6-accounting-reports.md` | ⏳ | 7 |
| 6D — Financial Statement Reports | `phase-6-accounting-reports.md` | ⏳ | 5 |
| 6E — Tabular Reports | `phase-6-accounting-reports.md` | ⏳ | 8 |

**Phase 6 Total: 28 issues**

---

## Phase 7 — Dashboard & Settings

| Sub-phase | File | Status | Jumlah Issue |
|---|---|---|---|
| 7A — Dashboard | `phase-7-dashboard-settings.md` | ✅ Done | 6 |
| 7B — Settings | `phase-7-dashboard-settings.md` | ✅ Done | 8 |

**Phase 7 Total: 14 issues**

---

## Phase 8 — P0 Contract Fixes (Gap Fix)

| Task | File | Status |
|---|---|---|
| Permission key fixes (all modules) | `prompt-phase-8-p0-contract-fixes.md` | ⏳ |
| Ribbon path verification | `prompt-phase-8-p0-contract-fixes.md` | ⏳ |
| FiscalYear HTTP method fixes | `prompt-phase-8-p0-contract-fixes.md` | ⏳ |
| BankRecon HTTP method fixes | `prompt-phase-8-p0-contract-fixes.md` | ⏳ |
| Report endpoint fixes | `prompt-phase-8-p0-contract-fixes.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-26-p0-contract-fixes.md`

---

## Phase 9 — Settings & Access Management Refactor

| Task | File | Status |
|---|---|---|
| companySettingsApi split 3 endpoints | `prompt-phase-9-settings-access-refactor.md` | ⏳ |
| accessApi (users, roles, invitations, audit) | `prompt-phase-9-settings-access-refactor.md` | ⏳ |
| CompanySettingsPage 4-tab refactor | `prompt-phase-9-settings-access-refactor.md` | ⏳ |
| UsersPage → /access/company-users | `prompt-phase-9-settings-access-refactor.md` | ⏳ |
| RolesPage → /access/roles | `prompt-phase-9-settings-access-refactor.md` | ⏳ |
| InvitationsPage (baru) | `prompt-phase-9-settings-access-refactor.md` | ⏳ |
| AccessAuditPage (baru) | `prompt-phase-9-settings-access-refactor.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-27-settings-access-refactor.md`

---

## Phase 10 — Fixed Assets Module (Baru)

| Task | File | Status |
|---|---|---|
| Types + services + hooks | `prompt-phase-10-fixed-assets.md` | ⏳ |
| FixedAssetListPage | `prompt-phase-10-fixed-assets.md` | ⏳ |
| FixedAssetFormPage + dialogs | `prompt-phase-10-fixed-assets.md` | ⏳ |
| FixedAssetCategoryPage | `prompt-phase-10-fixed-assets.md` | ⏳ |
| 4 report pages | `prompt-phase-10-fixed-assets.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-28-fixed-assets-module.md`

---

## Phase 11 — Opening Balance Module (Baru)

| Task | File | Status |
|---|---|---|
| Types + services + hooks | `prompt-phase-11-opening-balance.md` | ⏳ |
| OpeningBalanceStatusPage | `prompt-phase-11-opening-balance.md` | ⏳ |
| OpeningBalanceBatchPage (editable table) | `prompt-phase-11-opening-balance.md` | ⏳ |
| Fix onboarding Step5 | `prompt-phase-11-opening-balance.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-29-opening-balance-module.md`

---

## Phase 12 — Setup Wizard Refactor

| Task | File | Status |
|---|---|---|
| Rewrite onboardingApi.ts → setupApi | `prompt-phase-12-setup-wizard.md` | ⏳ |
| OnboardingPage state dari GET /setup/status | `prompt-phase-12-setup-wizard.md` | ⏳ |
| Step1 → GET/PATCH /settings/company | `prompt-phase-12-setup-wizard.md` | ⏳ |
| Step2 → confirm COA template endpoint | `prompt-phase-12-setup-wizard.md` | ⏳ |
| Step6 → POST /setup/finalize | `prompt-phase-12-setup-wizard.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-30-setup-wizard-refactor.md`

---

## Phase 13 — Period-End Processing (Baru)

| Task | File | Status |
|---|---|---|
| periodEndApi + usePeriodEnd | `prompt-phase-13-period-end.md` | ⏳ |
| PeriodEndPage (period selector + checklist) | `prompt-phase-13-period-end.md` | ⏳ |
| Route + ribbon item di accounting | `prompt-phase-13-period-end.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-31-period-end-module.md`

---

## Audit-11 Guardrails — Wajib untuk Phase 14+

| File | Status | Isi |
|---|---|---|
| `prompt-guardrails-audit-11-implementation.md` | ✅ Tersedia | Guardrails viewport, topbar, ribbon, virtual tabs, sessionStorage, hidden URL, API/data rules |

Guardrails ini wajib dibaca sebelum phase 14, 15, 16, dan 17.

---

## Audit-13 Guardrails — Wajib untuk Phase 24–39

| File | Status | Isi |
|---|---|---|
| `prompt-guardrails-audit-13-implementation.md` | ✅ Tersedia | Scope discipline, supersession aturan lama, contract freeze, frontend/backend safety, phase dependency, mandatory validation gate, completion report |

Guardrails Audit-13 mengalahkan guardrail historis yang bertentangan. Secara khusus, aturan Audit-11 untuk mempertahankan memory router/hidden URL telah superseded oleh A13-059/A13-271 dan Phase 24.

Referensi wajib:

```text
praproduction_docs/spec-37-audit-13-remediation.md
gap_docs/gap-10-audit-13-remediation-roadmap.md
audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
```

Status berikutnya:

```text
Phase aktif     : Phase 24
Issue Phase 24 : selesai — issue-27-phase-24-runtime-router-foundation.md
Prompt Phase 24: selesai — prompt-phase-24-remediation-foundation-router.md
```

---

## Phase 24 — Test Foundation, Global Runtime Containment, and Router Canonicalization

| Task | File | Status |
|---|---|---|
| Playwright regression foundation | `prompt-phase-24-remediation-foundation-router.md` | ✅ Tersedia |
| Router canonicalization | `prompt-phase-24-remediation-foundation-router.md` | ✅ Tersedia |
| Safe error containment | `prompt-phase-24-remediation-foundation-router.md` | ✅ Tersedia |
| Auth/session bootstrap and destination handling | `prompt-phase-24-remediation-foundation-router.md` | ✅ Tersedia |
| Tab/URL sync verification | `prompt-phase-24-remediation-foundation-router.md` | ✅ Tersedia |

**Referensi**: `praproduction_docs/spec-37-audit-13-remediation.md`, `issue_docs/issue-27-phase-24-runtime-router-foundation.md`

---

## Audit-13 Phase Prompt Tracker

| Phase | Prompt File | Status |
|---:|---|---|
| 25 | `prompt-phase-25-master-data-account-mapping-canonical.md` | ✅ Ada |
| 26 | `prompt-phase-26-accounting-foundation-opening-balance.md` | ✅ Ada |
| 27 | `prompt-phase-27-cash-bank-contract-reconciliation.md` | ✅ Ada |
| 28 | `prompt-phase-28-sales-transaction-contract.md` | ✅ Ada |
| 29 | `prompt-phase-29-ar-subledger-reports.md` | ✅ Ada |
| 30 | `prompt-phase-30-purchase-transaction-contract.md` | ✅ Ada |
| 31 | `prompt-phase-31-ap-subledger-reports.md` | ✅ Ada |
| 32 | `prompt-phase-32-inventory-integrity-workflow.md` | ✅ Ada |
| 33 | `prompt-phase-33-fixed-assets-runtime-core.md` | ✅ Ada |
| 34 | `prompt-phase-34-fixed-assets-lifecycle-reports.md` | ✅ Ada |
| 35 | `prompt-phase-35-period-end-processing.md` | ✅ Ada |
| 36 | `prompt-phase-36-financial-operational-reports.md` | ✅ Ada |
| 37 | `prompt-phase-37-settings-access-dashboard-router.md` | ✅ Ada |
| 38 | `prompt-phase-38-cross-cutting-ux-accessibility-consistency.md` | ✅ Ada |
| 39 | `prompt-phase-39-full-regression-data-repair-audit-closure.md` | ✅ Ada |

---

## Phase 14 — Master Data DTO & Action Contract Fixes

| Task | File | Status |
|---|---|---|
| COA DTO contract | `prompt-phase-14-master-data-dto-contract-fixes.md` | ⏳ |
| Product DTO/table/form | `prompt-phase-14-master-data-dto-contract-fixes.md` | ⏳ |
| Simple Master DTOs | `prompt-phase-14-master-data-dto-contract-fixes.md` | ⏳ |
| Delete -> activate/deactivate | `prompt-phase-14-master-data-dto-contract-fixes.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-32-master-data-dto-contract-fixes.md`

---

## Phase 15 — Transaction Document Number & Journal Display

| Task | File | Status |
|---|---|---|
| Document number service adapters | `prompt-phase-15-transaction-dto-number-contract.md` | ⏳ |
| Journal totals display | `prompt-phase-15-transaction-dto-number-contract.md` | ⏳ |
| Journal account selected labels | `prompt-phase-15-transaction-dto-number-contract.md` | ⏳ |
| Formatter guards for lists | `prompt-phase-15-transaction-dto-number-contract.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-33-transaction-dto-number-contract.md`

---

## Phase 16 — Route/Ribbon/Virtual Tab Canonical Map

| Task | File | Status |
|---|---|---|
| Ribbon path fixes | `prompt-phase-16-route-ribbon-canonical-map.md` | ⏳ |
| Route family resolution | `prompt-phase-16-route-ribbon-canonical-map.md` | ⏳ |
| Virtual tab sync verification | `prompt-phase-16-route-ribbon-canonical-map.md` | ⏳ |
| Hidden URL verification | `prompt-phase-16-route-ribbon-canonical-map.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-34-route-ribbon-canonical-map.md`

---

## Phase 17 — Shared Runtime Hardening

| Task | File | Status |
|---|---|---|
| API error helper / validation display | `prompt-phase-17-shared-runtime-hardening.md` | ⏳ |
| SearchableSelect selected options audit | `prompt-phase-17-shared-runtime-hardening.md` | ⏳ |
| Dashboard fallback | `prompt-phase-17-shared-runtime-hardening.md` | ⏳ |
| DataTable consistency audit | `prompt-phase-17-shared-runtime-hardening.md` | ⏳ |

**Referensi**: `praproduction_docs/spec-35-shared-runtime-hardening.md`

---

## Ringkasan Total

| Phase | Total Issue | Status |
|---|---|---|
| Phase 1 — Foundation | 56 | ⚠️ Belum bersih (1C, 1D, 1E) |
| Phase 2 — Master Data | 13 | ✅ Done |
| Phase 3 — Sales | 24 | ✅ Done |
| Phase 4 — Purchase | 19 | ✅ Done |
| Phase 5 — Inventory | 9 | ✅ Done |
| Phase 6 — Accounting | 28 | ✅ Done |
| Phase 7 — Dashboard & Settings | 14 | ✅ Done |
| Phase 8 — P0 Contract Fixes | ~15 files | ⏳ |
| Phase 9 — Settings/Access Refactor | ~12 files | ⏳ |
| Phase 10 — Fixed Assets Module | ~12 files | ⏳ |
| Phase 11 — Opening Balance | ~7 files | ⏳ |
| Phase 12 — Setup Wizard Refactor | ~6 files | ⏳ |
| Phase 13 — Period-End | ~3 files | ⏳ |
| Phase 14 — Master Data DTO/action | contract fixes | ⏳ |
| Phase 15 — Transaction DTO number | contract fixes | ⏳ |
| Phase 16 — Route/Ribbon/Tabs | navigation fixes | ⏳ |
| Phase 17 — Shared Runtime Hardening | resilience fixes | ⏳ |

---

## Prioritas Jika Waktu Terbatas (MVP)

```
1. Phase 1 ✅ (wajib — fondasi semua)
2. Phase 2 (wajib — master data dibutuhkan semua modul)
3. ISSUE-3C-01 + 3C-02 — Sales Invoice saja (fitur paling kritis)
4. ISSUE-4B-03 + 4B-04 — Vendor Bill saja (AP dasar)
5. Sub-phase 7A — Dashboard (ringkasan untuk owner)
6. Lanjutkan phase lainnya
```

---

## Issue yang Harus Di-fix Sekarang (Blocker)

```
ISSUE-1D-02 — DataTable.tsx (build error)
ISSUE-1E-11 — Step4MasterData.tsx (build error)
ISSUE-1E-11 — onboardingApi.ts (build error)
```

Ketiganya harus bersih sebelum `npm run build` sukses dan Phase 2 bisa dimulai.

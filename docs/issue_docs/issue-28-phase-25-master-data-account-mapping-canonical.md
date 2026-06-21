# Issue-28 — Phase 25 Master Data and Account Mapping Canonical

Tanggal dibuat: 2026-06-21  
Status: In Progress  
Phase: 25  
Severity tertinggi: Critical  
Finding canonical: A13-004..046, A13-060..084, A13-255..257  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 25 menstabilkan master data dan account mapping sebagai dependency untuk seluruh transaksi, accounting, fixed assets, dan reporting downstream. Focus utama:

- master data CRUD/lifecycle yang masih mismatch;
- account mapping save/response contract;
- global save variant dan draft/accessibility issues yang muncul pada master pages;
- search/pagination/activate-deactivate server-side yang canonical.

Phase ini harus menghasilkan adapter contract yang stabil sebelum phase transaksi berikutnya dimulai.

---

## Scope Finding

- A13-004..046
- A13-060..084
- A13-255..257

Cluster domain:

1. chart of accounts;
2. contact;
3. product;
4. category;
5. unit;
6. warehouse;
7. payment term;
8. department;
9. project;
10. account mapping.

---

## Root Cause

Masalah yang berulang:

- DTO list/detail/form tidak konsisten;
- frontend masih bergantung pada field legacy atau inferred shape;
- account mapping save contract tidak canonical;
- label relation tidak selalu tersedia untuk edit/detail;
- lifecycle activate/deactivate/delete berbeda antar resource;
- pagination/search/filters tidak selalu server-side;
- draft/empty/error states belum seragam pada master forms.

---

## Candidate Frontend Files

```text
src/modules/master-data/pages/*
src/modules/master-data/services/*
src/modules/master-data/hooks/*
src/components/shared/form/SearchableSelect.tsx
src/lib/apiError.ts
src/stores/useDraftStore.ts atau draft helper yang sudah ada
```

## Candidate Backend Files

```text
app/Modules/MasterData/*
app/Modules/Accounts/*
routes/api.php atau module route files terkait
tests/Feature/*
```

---

## Acceptance

- save ke `/undefined` tidak terjadi;
- create/edit utama berhasil dengan DTO canonical;
- relation tampil sebagai label, bukan ID mentah;
- pagination/search berperilaku server-side;
- required mapping tidak bisa kosong secara diam-diam;
- lifecycle action sesuai backend contract;
- draft dan validation state konsisten pada semua form scope.

---

## Test Plan

- feature test resource master data;
- feature test account mapping response/save;
- Playwright create/edit/view master data sample;
- verify selected label on edit;
- verify error/empty/loading distinction;
- verify permission and lifecycle state;
- verify no regression pada tab/ribbon/navigation.

## Progress 2026-06-21 — Account Mapping Slice

Implemented:

- frontend memakai `mapping_key` canonical, bukan `key`;
- selected account memakai `account_name`/`account_code`, bukan fallback ID;
- hanya mapping `visible_in_settings` yang dirender dan dikelompokkan per `settings_section`;
- required mapping tidak dapat di-clear dan account search difilter ke akun aktif/tipe yang diizinkan;
- save hanya mengirim mapping dirty melalui satu bulk PATCH;
- backend bulk update memvalidasi seluruh payload sebelum transaction sehingga atomic;
- load error, retry, save error, dirty count, dan accessible name selector tersedia;
- HTTP base URL tidak lagi menghasilkan literal `undefined` saat env base URL kosong.

Automated evidence:

- frontend build: pass;
- frontend lint: 0 error, 34 warning legacy;
- Playwright `tests/e2e/master-data/account-mapping.spec.ts`: 1/1 pass;
- Playwright `tests/e2e/master-data/core-master-data.spec.ts`: 2/2 pass;
- backend `AccountMappingTest`: 3/3 pass;
- backend `ChartOfAccountTest`: 7/7 pass;
- backend MasterData feature scope: 31/31 pass;
- Pint scoped files: pass.

Status finding account-mapping: implementation fixed, runtime live retest masih diperlukan sebelum `verified`.

### Core master-data slice

COA, Contact, Product, Department, Project, dan Payment Term sudah mendapat
normalisasi list/form/lifecycle utama. Build dan lint lulus. Status tetap
`fixed`/implementation-only sampai Playwright cluster dan runtime real selesai.

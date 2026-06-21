# Issue-29 — Phase 26 Accounting Foundation and Opening Balance

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 26  
Severity tertinggi: Critical  
Finding canonical: A13-047..058, A13-085..115  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 26 menstabilkan accounting foundation sebelum transaksi lanjutan:

- journal list/detail/create contract;
- posted/read-only lifecycle;
- opening balance status/preview/batch;
- fiscal year close/reopen;
- period lock/date guard behavior.

Phase ini harus menghilangkan crash, hidden contract mismatch, dan status yang disamarkan sebagai empty/ready ketika backend sebenarnya error.

---

## Scope Finding

- A13-047..058
- A13-085..115

---

## Root Cause

- journal DTO/formatter dan relation labels tidak canonical;
- opening balance status/preview contract tidak stabil;
- fiscal year close/reopen melakukan request yang tidak sesuai contract;
- period lock representation dan blocker object belum aman;
- posted/approved state tidak diperlakukan sebagai immutable secara UI;
- date/period guard backend dan frontend belum sinkron.

---

## Candidate Frontend Files

```text
src/modules/accounting/pages/*
src/modules/accounting/services/*
src/modules/opening-balance/pages/*
src/modules/opening-balance/services/*
src/modules/opening-balance/hooks/*
src/components/shared/feedback/*
```

## Candidate Backend Files

```text
app/Modules/Accounting/*
app/Modules/OpeningBalance/*
tests/Feature/*
```

---

## Acceptance

- journal list/detail konsisten dan balanced;
- opening balance blocker tidak crash;
- lock aktif terbaca benar;
- close/reopen hanya lewat preview/checklist canonical;
- period/fiscal guards teruji;
- posted item tidak editable secara UI walau dipanggil langsung.

---

## Test Plan

- feature test journal totals/source metadata;
- feature test opening balance status/preview;
- feature test fiscal year close/reopen;
- Playwright journal list/detail/form;
- Playwright opening balance status/batch;
- verify period lock and date guard behavior;
- verify immutable posted state.


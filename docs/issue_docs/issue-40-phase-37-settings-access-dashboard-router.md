# Issue-40 — Phase 37 Settings, Access Safety, Dashboard, and Router

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 37  
Severity tertinggi: Critical  
Finding canonical: A13-001..003, A13-258..270  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 37 menstabilkan settings, access safety, dashboard, dan router verification setelah domain utama stabil.

---

## Scope Finding

- A13-001..003
- A13-258..270

---

## Root Cause

- dashboard endpoint/summary contract masih belum aman;
- settings/access safety belum menutup self/last-owner cases dengan benar;
- company preferences and transaction settings contract belum canonical;
- router settings deep-link/refresh masih terganggu oleh bootstrap/session behavior;
- audit/access pages belum konsisten pada pagination/filter.

---

## Candidate Frontend Files

```text
src/modules/dashboard/pages/*
src/modules/dashboard/services/*
src/modules/settings/pages/*
src/modules/settings/services/*
src/router/*
src/components/shared/feedback/*
```

## Candidate Backend Files

```text
app/Modules/Dashboard/*
app/Modules/Settings/*
app/Modules/Access/*
tests/Feature/*
```

---

## Acceptance

- dashboard tidak bergantung endpoint fiktif;
- self/last-owner tidak dapat dihapus/dinonaktifkan;
- settings save contract benar;
- users/roles/invitations/audit pages stabil;
- refresh/deep-link settings stabil;
- router and auth redirect tetap aman.

---

## Test Plan

- feature test dashboard/settings/access safety;
- Playwright dashboard/settings/access pages;
- verify owner guard and permission matrix;
- verify deep-link/refresh `/settings/*`;
- verify fallback/empty/error states.


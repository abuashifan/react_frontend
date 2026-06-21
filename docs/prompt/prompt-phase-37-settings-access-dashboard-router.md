# Prompt — Phase 37: Settings, Access Safety, Dashboard, and Router

**Phase**: 37  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-40-phase-37-settings-access-dashboard-router.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-40-phase-37-settings-access-dashboard-router.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/dashboard/*
src/modules/settings/*
src/router/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Dashboard/Settings/Access yang relevan.

---

## 1. Tujuan Phase

Phase 37 menstabilkan settings, access safety, dashboard, dan router verification setelah domain utama stabil.

---

## 2. Non-Negotiable Guardrails

- Jangan membiarkan dashboard bergantung endpoint fiktif.
- Jangan membiarkan self/last-owner remove/deactivate lolos.
- Jangan memutus deep-link/refresh settings.
- Jangan mempertahankan hidden URL behavior jika itu menghalangi canonical routing.

---

## 3. Tugas Utama

### Step 1 - Dashboard and settings contract

Pastikan dashboard fallback jujur dan settings contract canonical.

### Step 2 - Access safety

Pastikan:

- self/last-owner guard server-side dan UI;
- users/roles/invitations/audit pages stabil;
- permission matrix tetap akurat.

### Step 3 - Router verification

Pastikan `/settings/*` deep-link/refresh bekerja dan auth redirect aman.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- dashboard tidak crash;
- settings save contract benar;
- access safety benar;
- deep-link/refresh `/settings/*` stabil;
- no regression pada shell/navigation.

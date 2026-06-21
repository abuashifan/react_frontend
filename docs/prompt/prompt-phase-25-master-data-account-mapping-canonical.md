# Prompt — Phase 25: Master Data and Account Mapping Canonical

**Phase**: 25  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-28-phase-25-master-data-account-mapping-canonical.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-28-phase-25-master-data-account-mapping-canonical.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/master-data/*
src/components/shared/form/SearchableSelect.tsx
src/lib/apiError.ts
```

Jika backend diperbaiki, baca juga backend `AGENTS.md` dan source/test master data yang relevan.

---

## 1. Tujuan Phase

Phase 25 menstabilkan master data dan account mapping sebagai dependency untuk seluruh phase berikutnya. Fokus:

- DTO list/detail/form yang canonical;
- relation label untuk edit/detail;
- account mapping save/response contract;
- lifecycle activate/deactivate yang konsisten;
- search/pagination/filter server-side;
- draft dan validation state yang seragam.

---

## 2. Non-Negotiable Guardrails

- Jangan menambah alias DTO baru di `http.ts` sebagai solusi utama.
- Jangan menyembunyikan field wajib yang hilang dengan fallback palsu.
- Jangan menghapus action semesta jika backend memakai activate/deactivate.
- Jangan membuat `selectedOptions` kosong untuk field edit yang sudah punya value.
- Jangan edit `src/components/ui/`.

---

## 3. Tugas Utama

### Step 1 - Audit master data DTO

Periksa semua resource master data yang masuk scope issue:

- COA;
- contact;
- product;
- category;
- unit;
- warehouse;
- payment term;
- department;
- project;
- account mapping.

Pastikan request/response adapter per resource mengikuti backend aktual.

### Step 2 - Fix account mapping

Pastikan:

- save tidak pernah ke `/undefined`;
- label relation lengkap;
- required mapping tidak bisa kosong secara diam-diam;
- metadata account type/required/active state ikut tervalidasi;
- list/detail/save contract stabil.

### Step 3 - Normalisasi master CRUD

Untuk resource master yang masih mismatch:

- gunakan field canonical backend;
- pastikan edit/detail menampilkan label relation;
- jaga pagination/search server-side;
- rollout draft hanya jika benar-benar dibutuhkan pada form scope.

### Step 4 - Activate/deactivate

Ganti delete/restore yang tidak canonical menjadi activate/deactivate sesuai backend contract.

### Step 5 - Accessibility and error states

- form edit/detail harus menampilkan selected label;
- error/empty/loading states harus berbeda;
- tidak ada `NaN`/`Invalid Date`;
- no crash pada selected async option.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- COA list/form memakai code/name/type yang benar;
- product form mengirim field backend yang canonical;
- account mapping save tidak ke `/undefined`;
- inactive action memanggil endpoint benar;
- selected relation tidak kosong pada edit/detail;
- navigation/topbar/ribbon/tab tetap tidak regress.

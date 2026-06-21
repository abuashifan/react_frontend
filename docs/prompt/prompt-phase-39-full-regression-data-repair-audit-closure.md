# Prompt — Phase 39: Full Regression, Data Repair, and Audit Closure

**Phase**: 39  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-42-phase-39-full-regression-data-repair-audit-closure.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-42-phase-39-full-regression-data-repair-audit-closure.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
```

Jika backend berubah, baca backend `AGENTS.md` dan semua file domain yang masih perlu bukti final.

---

## 1. Tujuan Phase

Phase 39 adalah penutup Audit-13:

- regression penuh;
- data repair bila diperlukan;
- smoke read-only seluruh area baseline;
- mutation test pada tenant disposable;
- final reconciliation status seluruh finding.

---

## 2. Non-Negotiable Guardrails

- Jangan menutup phase hanya dengan build/lint hijau.
- Jangan melakukan mutation live.
- Jangan menandai finding sebagai selesai tanpa evidence per finding.
- Jangan mengabaikan regression baru yang muncul selama closure.

---

## 3. Tugas Utama

### Step 1 - Full regression

Jalankan regression yang mencakup semua phase 24–38 dan coverage baseline Audit-13.

### Step 2 - Data repair

Jika ada legacy data yang perlu diperbaiki, gunakan migration/repair command/testable script yang aman.

### Step 3 - Final reconciliation

Pastikan setiap finding memiliki status akhir yang sah:

- verified;
- wont-fix;
- duplicate;
- atau status lain yang disetujui eksplisit.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <full-regression-scope>
```

Jika backend berubah:

```bash
cd /workspace/laravel_backend
php artisan test
vendor/bin/pint --test
```

Manual checks:

- seluruh area baseline smoke read-only;
- mutation hanya di tenant disposable;
- audit closure evidence lengkap;
- no open P0/P1.

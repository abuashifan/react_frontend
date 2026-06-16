# Prompt — Phase 17: Shared Runtime Hardening

**Phase**: 17  
**Estimasi**: 1-2 sesi  
**Referensi**: `spec-35-shared-runtime-hardening.md`, issue-11, issue-12, issue-13, issue-14, issue-15  
**Guardrails wajib**: `prompt-guardrails-audit-11-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-11-implementation.md
docs/praproduction_docs/spec-35-shared-runtime-hardening.md
docs/issue_docs/issue-11-dashboard-graceful-fallback.md
docs/issue_docs/issue-12-searchable-select-selected-options-audit.md
docs/issue_docs/issue-13-formatters-null-invalid-guard.md
docs/issue_docs/issue-14-api-error-display-and-form-errors.md
docs/issue_docs/issue-15-datatable-reuse-and-sticky-column-audit.md
docs/design_docs/design-C1-datatable.md
docs/design_docs/design-C4-tablet-datatable-viewport.md
docs/praproduction_docs/spec-23-tablet-first-layout-rules.md
```

---

## 1. Non-Negotiable Guardrails

- Jangan redesign shell.
- Jangan mengubah topbar/ribbon/virtual tab architecture.
- Jangan mengubah hidden URL behavior.
- Jangan mengubah `sessionStorage` tab persistence.
- Jangan mengubah AppShell root scroll model.
- Jangan edit `src/components/ui/`.
- Jangan pakai mock dashboard data yang terlihat sebagai data real.

---

## 2. Tugas Utama

### Step 1 — Formatter Guards

If not already done in phase 15, guard:

```text
formatCurrency
formatNumber
formatDate
```

Missing/invalid values should show `-`; zero remains valid.

### Step 2 — API Error Helper

Add shared helper if needed:

```text
src/lib/apiError.ts
```

Must preserve Laravel `message` and `errors`.

### Step 3 — SearchableSelect Selected Options

Audit forms using `SearchableSelect`.

For edit/detail forms:

- keep value as ID;
- provide `selectedOptions`;
- derive label from backend relation when available.

### Step 4 — Dashboard Fallback

For missing `/dashboard/*` endpoints:

- do not crash;
- do not show fake real data;
- show clear fallback/empty state;
- avoid aggressive retry loops.

### Step 5 — DataTable Consistency

Audit list pages:

- DataTable receives arrays.
- Runtime guard remains only safety.
- Selection checkbox appears only with real bulk action.
- Sticky column offsets do not overlap at tablet viewport.
- COA custom table has migration plan or documented reason.

---

## 3. Verification

Run:

```bash
cd /workspace/frontend
npm run build
```

Manual checks:

- Dashboard loads without crash when dashboard endpoints fail.
- 422 form validation displays useful field/message feedback.
- No selected async select appears empty when value exists.
- No `NaN` or `Invalid Date` appears.
- DataTable works at tablet viewport without sticky overlap.
- Topbar/ribbon/tabs/hidden URL behavior unchanged.
- No `h-screen`, `min-h-screen`, or `100vh` added by changed files.

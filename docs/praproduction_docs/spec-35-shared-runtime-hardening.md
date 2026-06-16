# Spec-35 — Shared Runtime Hardening

**Phase**: 17  
**Tipe**: Shared UI/data resilience  
**Severity**: Medium  
**Referensi**: Audit-11 A11-07, A11-15, A11-16, A11-17, A11-18; issue-11; issue-12; issue-13; issue-14; issue-15  
**Scope**: Shared components, error display, dashboard fallback, DataTable consistency.

---

## 1. Tujuan

Mengurangi crash dan tampilan misleading setelah kontrak DTO utama diperbaiki.

Spec ini berisi hardening lintas module:

- dashboard graceful fallback;
- SearchableSelect selected label;
- formatter null/invalid guards;
- Laravel validation error display;
- DataTable consistency and sticky column audit.

---

## 2. Dashboard Fallback

Backend belum menyediakan `/dashboard/*` saat audit.

Rules:

- Dashboard tidak boleh crash jika endpoint 404.
- Jangan tampilkan mock data sebagai data real.
- Gunakan empty/not-available state yang jelas.
- Hindari retry agresif untuk endpoint yang diketahui belum tersedia.

Files:

```text
src/modules/dashboard/services/dashboardApi.ts
src/modules/dashboard/hooks/useDashboardData.ts
src/modules/dashboard/pages/DashboardPage.tsx
src/modules/dashboard/components/*
```

---

## 3. SearchableSelect Selected Labels

Rules:

- Value form tetap ID.
- Label selected value berasal dari `selectedOptions`.
- Page edit/detail wajib membentuk selected option dari relation backend jika ada.
- Label domain harus informatif:

```text
Account: {account_code} - {account_name}
Contact: {contact_code} - {name}
Product: {product_code} - {product_name}
```

---

## 4. Formatter Guards

Rules:

```text
null / undefined / "" / NaN / invalid date -> "-"
0 remains valid and displays as 0 or Rp 0 depending formatter
```

Do not use direct formatting like:

```ts
Number(value).toLocaleString()
```

Use shared helpers.

---

## 5. API Error Display

Rules:

- Preserve Laravel `message`.
- Preserve Laravel `errors` for 422.
- Form pages should map field errors to React Hook Form `setError()` when field names match.
- If UI field differs from backend field, adapter must map error field names.

Recommended helper:

```text
src/lib/apiError.ts
```

Do not create a helper inside a page.

---

## 6. DataTable Consistency

Rules:

- DataTable should receive arrays only; runtime guard remains as safety.
- Pages should not rely on DataTable guard to hide DTO bugs.
- Selection checkbox only appears when a page has a real bulk action.
- Sticky left offsets must be consistent and tested on tablet width.
- COA custom table needs explicit justification or migration plan.

Files:

```text
src/components/shared/table/DataTable.tsx
src/components/shared/table/TablePagination.tsx
src/components/shared/table/BulkActionBar.tsx
src/modules/**/pages/*ListPage.tsx
docs/design_docs/design-C1-datatable.md
docs/design_docs/design-C4-tablet-datatable-viewport.md
```

---

## 7. Implementation Order

1. Formatter guards.
2. API error helper and form error mapping.
3. SearchableSelect selected option audit.
4. Dashboard fallback.
5. DataTable consistency pass after DTO fixes.
6. Build.

---

## 8. Non-Scope

- Do not redesign the whole visual system.
- Do not add backend dashboard endpoints.
- Do not convert all custom tables before API/DTO bugs are fixed.
- Do not edit `src/components/ui/`.

---

## 9. Acceptance Criteria

- Runtime crashes from non-array table data are prevented and root causes remain visible in service/page code.
- Common invalid values render gracefully.
- Laravel validation details are not discarded.
- Dashboard is usable as an app entry screen even without backend dashboard endpoints.
- Build succeeds.

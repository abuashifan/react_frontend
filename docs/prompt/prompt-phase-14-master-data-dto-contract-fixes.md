# Prompt — Phase 14: Master Data DTO & Action Contract Fixes

**Phase**: 14  
**Estimasi**: 1-2 sesi  
**Referensi**: `spec-32-master-data-dto-contract-fixes.md`, GAP-07, issue-08, issue-09  
**Guardrails wajib**: `prompt-guardrails-audit-11-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-11-implementation.md
docs/praproduction_docs/spec-32-master-data-dto-contract-fixes.md
docs/gap_docs/gap-07-master-data-dto-contract.md
docs/issue_docs/issue-08-product-dto-and-table.md
docs/issue_docs/issue-09-master-data-delete-actions.md
docs/praproduction_docs/spec-12-api-integration.md
docs/praproduction_docs/spec-08-form-architecture.md
docs/praproduction_docs/spec-09-table-and-list.md
```

Backend source (boleh diperbaiki bila kontrak end-to-end memerlukannya; ikuti backend `AGENTS.md`):

```text
/workspace/laravel_backend/app/Modules/MasterData/Routes/api.php
/workspace/laravel_backend/app/Http/Requests/MasterData/*
/workspace/laravel_backend/app/Models/Tenant/*
```

---

## 1. Non-Negotiable Guardrails

- Jangan ubah Topbar navigation behavior.
- Jangan ubah router ke BrowserRouter/createBrowserRouter.
- Jangan ubah tab persistence dari `sessionStorage`.
- Jangan expose internal route di address bar.
- Jangan ubah shell height/topbar/ribbon/tabs tokens.
- Jangan memakai `DELETE` untuk Master Data jika backend hanya punya activate/deactivate.
- Jangan menambah alias Master Data di `http.ts`.

---

## 2. Tugas Utama

### Step 1 — COA Contract

Fix:

```text
code/name/type/parent_id -> account_code/account_name/account_type/parent_account_id
```

Files:

```text
src/modules/master-data/types/coa.types.ts
src/modules/master-data/schemas/coaSchema.ts
src/modules/master-data/services/coaApi.ts
src/modules/master-data/hooks/useCoaList.ts
src/modules/master-data/pages/CoaListPage.tsx
src/modules/master-data/pages/CoaFormPage.tsx
```

Search label:

```text
account_code - account_name
```

### Step 2 — Product Contract

Fix Product type/schema/service/list/form sesuai backend:

```text
product_code
product_name
product_type
product_category_id
unit_id
is_stock_item
sales_account_id
purchase_account_id
inventory_account_id
cogs_account_id
```

Remove from Product Master UI for this phase:

```text
sell_price
buy_price
```

### Step 3 — Simple Master DTO

Fix DTO/payload for:

```text
contacts
units
warehouses
payment-terms
product-categories
departments
projects
```

Follow `spec-32` mapping. Check backend request files before editing each resource.

### Step 4 — Activate/Deactivate

Replace delete actions:

```text
delete -> deactivate
restore/reactivate -> activate
```

Affected services:

```text
kategoriProdukApi
satuanApi
gudangApi
paymentTermsApi
departemenApi
proyekApi
```

UI copy:

```text
Hapus -> Nonaktifkan
Pulihkan -> Aktifkan
```

---

## 3. Verification

Run:

```bash
cd /workspace/frontend
npm run build
```

Manual checks:

- COA list/form shows account code/name/type.
- Product list has no `NaN`.
- Product form submits backend field names.
- Master Data inactive actions call `PATCH /deactivate`.
- Topbar only opens ribbon.
- Address bar remains root while internal page changes.
- No `h-screen`, `min-h-screen`, or `100vh` added by changed files.

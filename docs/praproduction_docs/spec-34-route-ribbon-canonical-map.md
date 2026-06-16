# Spec-34 — Route, Ribbon, and Virtual Tab Canonical Map

**Phase**: 16  
**Tipe**: Navigation contract fix  
**Severity**: Critical  
**Referensi**: Audit-11 A11-01; GAP-01; issue-02; issue-07  
**Scope**: UI route/ribbon/tab state only. API endpoint changes belong to service specs.

---

## 1. Tujuan

Memastikan semua ribbon item dan virtual tabs membuka route frontend yang benar, tanpa membuat user melihat path internal di address bar.

Shell saat ini memakai memory router dan virtual tab state. Karena itu navigasi harus benar di tiga lapisan:

```text
Ribbon item -> internal route -> active primary/secondary tab
```

---

## 2. Canonical Route Map

| Area | Current risky path | Canonical frontend route | Backend API path |
|---|---|---|---|
| COA | `/master-data/chart-of-accounts` | `/master-data/coa` | `/master-data/chart-of-accounts` |
| Bank Transfer | `/cash-bank/transfers` | `/cash-bank/bank-transfers` | `/cash-bank/bank-transfers` |
| Bank Reconciliation | `/cash-bank/reconciliations` | `/cash-bank/bank-reconciliations` | `/cash-bank/bank-reconciliations` |
| Sales AR | `/sales/ar` | `/sales/ar/summary` | `/sales/ar/*` |
| Purchase AP | `/purchase/ap` | `/purchase/ap/summary` | `/purchase/ap/*` |

Reports:

| Area | Frontend route | API endpoint |
|---|---|---|
| AR Aging report page | `/reports/ar-aging` | `/sales/ar/aging` |
| AP Aging report page | `/reports/ap-aging` | `/purchase/ap/aging` |

Jangan mengganti report API menjadi `/reports/ar-aging` atau `/reports/ap-aging`.

---

## 3. Files

```text
src/router/moduleConfig.ts
src/router/index.tsx
src/router/guards.tsx
src/modules/*/routes.tsx
src/components/shared/layout/AppShell.tsx
src/components/shared/layout/RibbonPanel.tsx
src/components/shared/layout/PrimaryTabs.tsx
src/components/shared/layout/SecondaryTabs.tsx
src/stores/useTabStore.ts
```

---

## 4. Rules

1. `moduleConfig.ts` may contain only frontend routes, never raw API endpoint paths unless they are intentionally identical.
2. Parent menu items that do not have a page must route to a default child page.
3. `findRibbonItemByPath()` must match list/create/detail route families.
4. Primary/secondary tab click must navigate to the active route associated with that tab.
5. Memory router may hide internal URLs, but internal route state must remain deterministic.
6. Do not create placeholder pages to mask a wrong route.

---

## 5. Detail/Create Route Resolution

Route families should resolve to the same ribbon item:

```text
/sales/orders
/sales/orders/create
/sales/orders/{id}
```

All should activate:

```text
Module: sales
Ribbon: orders
Primary tab: Sales Order
Secondary tab: Daftar or Baru/Detail depending route
```

---

## 6. Implementation Order

1. Update `moduleConfig.ts` paths.
2. Ensure AR/AP parent ribbon routes point to summary defaults.
3. Verify frontend route files have matching routes for all ribbon paths.
4. Verify `findRibbonItemByPath()` still resolves nested create/detail paths.
5. Verify AppShell URL-to-tab sync after memory router changes.
6. Manually click all ribbon items.
7. Run build.

---

## 7. Acceptance Criteria

- No ribbon item opens app 404.
- COA route works while COA API remains `/master-data/chart-of-accounts`.
- Bank Transfer/Reconciliation route names match existing page routes.
- Sales AR and Purchase AP open summary pages.
- Reports AR/AP pages can render without changing their API endpoints incorrectly.
- Address bar can remain `app.finlite.my.id` while internal navigation works.
- `npm run build` succeeds.

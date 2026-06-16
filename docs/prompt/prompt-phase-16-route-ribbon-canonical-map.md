# Prompt — Phase 16: Route, Ribbon, and Virtual Tab Canonical Map

**Phase**: 16  
**Estimasi**: 1 sesi  
**Referensi**: `spec-34-route-ribbon-canonical-map.md`, issue-07, issue-02  
**Guardrails wajib**: `prompt-guardrails-audit-11-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-11-implementation.md
docs/praproduction_docs/spec-34-route-ribbon-canonical-map.md
docs/issue_docs/issue-07-route-ribbon-canonical-map.md
docs/issue_docs/issue-02-ribbon-paths.md
docs/design_docs/design-A1-topbar-ribbon.md
docs/praproduction_docs/spec-23-tablet-first-layout-rules.md
```

---

## 1. Non-Negotiable Guardrails

Topbar:

- Topbar module buttons must not navigate to module routes.
- Topbar only sets active module and opens/closes ribbon.

Ribbon:

- Ribbon items may navigate internal memory route.
- Ribbon paths must be frontend routes, not API endpoints.

Virtual tabs:

- Tab state remains in Zustand persist with `sessionStorage`.
- Route paths remain stored in primary/secondary tab state.
- Do not move tab state to URL, query string, hash, localStorage, or backend.

URL:

- Keep `createMemoryRouter`.
- Do not switch to BrowserRouter/createBrowserRouter.
- Browser address bar must remain root/hidden from internal route changes.

Viewport:

- Keep AppShell `h-dvh overflow-hidden`.
- Do not change topbar/ribbon/primary/secondary tab heights.

---

## 2. Tugas Utama

### Step 1 — Fix Ribbon Paths

Update `src/router/moduleConfig.ts`:

```text
/master-data/chart-of-accounts -> /master-data/coa
/cash-bank/transfers -> /cash-bank/bank-transfers
/cash-bank/reconciliations -> /cash-bank/bank-reconciliations
/sales/ar -> /sales/ar/summary
/purchase/ap -> /purchase/ap/summary
```

Keep report UI routes:

```text
/reports/ar-aging
/reports/ap-aging
```

But report API endpoints must stay:

```text
/sales/ar/aging
/purchase/ap/aging
```

### Step 2 — Verify Route Families

Ensure list/create/detail routes resolve to same ribbon item:

```text
/sales/orders
/sales/orders/create
/sales/orders/{id}
```

### Step 3 — Verify Hidden URL

`src/router/index.tsx` should still:

```text
createMemoryRouter(...)
replace browser history path to "/"
```

Do not expose internal route in browser address bar.

---

## 3. Verification

Run:

```bash
cd /workspace/frontend
npm run build
```

Manual checks:

- Clicking topbar module opens ribbon only.
- Clicking COA ribbon opens COA workspace.
- Clicking Bank Transfer/Reconciliation ribbon opens correct workspace.
- Clicking Sales AR opens AR Summary.
- Clicking Purchase AP opens AP Summary.
- Create/detail routes create correct secondary tab.
- Switching primary/secondary tabs restores internal route from state.
- Browser address bar still shows app root.
- Session refresh restores tabs from `sessionStorage`.
- No viewport regression or double scroll.

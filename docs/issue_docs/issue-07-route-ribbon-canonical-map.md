# Issue-07 — Route/Ribbon Canonical Map

**Tipe**: Bug navigasi  
**Severity**: Critical  
**Sumber**: Audit-11 A11-01, GAP-01, `issue-02-ribbon-paths.md`  
**Status**: Belum selesai

---

## Ringkasan

Beberapa item ribbon dan virtual tab mengarah ke path yang tidak punya route frontend. Karena shell sekarang menavigasi dari ribbon/tab state, mismatch path akan langsung terlihat sebagai 404 atau halaman kosong.

Issue ini adalah peta aktif. `issue-02` hanya mencatat 3 mismatch awal.

---

## Mismatch Aktif

| Area | Path di ribbon saat audit | Route frontend canonical | Catatan |
|---|---|---|---|
| COA | `/master-data/chart-of-accounts` | `/master-data/coa` | API backend tetap `/master-data/chart-of-accounts`; jangan samakan API path dengan UI route. |
| Bank Transfer | `/cash-bank/transfers` | `/cash-bank/bank-transfers` | Service sudah pakai `/cash-bank/bank-transfers`. |
| Bank Reconciliation | `/cash-bank/reconciliations` | `/cash-bank/bank-reconciliations` | Service sudah pakai `/cash-bank/bank-reconciliations`. |
| Sales AR parent | `/sales/ar` | pilih default `/sales/ar/summary` | Frontend hanya punya subroute AR. |
| Purchase AP parent | `/purchase/ap` | pilih default `/purchase/ap/summary` | Frontend hanya punya subroute AP. |

Area reports perlu dicek saat implementasi:

| Area | Path ribbon | Risiko |
|---|---|---|
| AR Aging report | `/reports/ar-aging` | Route UI bisa benar, tetapi API harus tetap `/sales/ar/aging`. |
| AP Aging report | `/reports/ap-aging` | Route UI bisa benar, tetapi API harus tetap `/purchase/ap/aging`. |

---

## File Terkena

```text
src/router/moduleConfig.ts
src/components/shared/layout/AppShell.tsx
src/components/shared/layout/RibbonPanel.tsx
src/components/shared/layout/PrimaryTabs.tsx
src/components/shared/layout/SecondaryTabs.tsx
src/router/routes.tsx atau module route files terkait
```

Jika route canonical ditambah/diubah, cek juga tab state:

```text
src/stores/useTabStore.ts
```

---

## Prinsip Fix

- Bedakan UI route dan API endpoint. COA adalah contoh utama: UI route `/master-data/coa`, API endpoint `/master-data/chart-of-accounts`.
- Parent ribbon yang tidak punya halaman sendiri harus diarahkan ke default child route.
- `findRibbonItemByPath()` harus bisa resolve route detail/create ke ribbon list yang benar.
- Jangan membuat placeholder route hanya untuk menutupi mismatch jika halaman canonical sudah ada.

---

## Acceptance Criteria

- Semua ribbon item membuka halaman nyata, bukan 404.
- Create/detail path tetap mengaktifkan ribbon item dan virtual tab yang benar.
- AR/AP parent ribbon membuka summary default.
- Memory router tetap bisa memulihkan state internal tanpa memperlihatkan URL internal ke user.
- Setelah implementasi, `npm run build` sukses.

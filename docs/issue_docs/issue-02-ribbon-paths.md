# Issue-02 — Ribbon Path Salah (3 Item)

**Tipe**: Bug  
**Severity**: High  
**Estimasi fix**: 5 menit (1 file, 3 baris)  
**File**: `src/router/moduleConfig.ts`

---

## Deskripsi

3 ribbon item mengarah ke path yang tidak sesuai dengan route yang terdaftar di frontend. Klik ribbon → 404.

> Status Audit-11: issue ini tetap valid, tetapi bukan lagi daftar lengkap.
> Gunakan `issue-07-route-ribbon-canonical-map.md` sebagai peta aktif untuk semua mismatch route/ribbon/tab.

---

## Fix

Di `src/router/moduleConfig.ts`, ubah:

```ts
// SEBELUM (salah):
{ id: 'chart-of-accounts', path: '/master-data/chart-of-accounts' }
{ id: 'transfers',         path: '/cash-bank/transfers' }
{ id: 'reconciliations',   path: '/cash-bank/reconciliations' }

// SESUDAH (benar):
{ id: 'chart-of-accounts', path: '/master-data/coa' }
{ id: 'transfers',         path: '/cash-bank/bank-transfers' }
{ id: 'reconciliations',   path: '/cash-bank/bank-reconciliations' }
```

---

## Verifikasi

Setelah fix, klik ketiga ribbon item tersebut → harus menampilkan halaman yang sesuai, bukan 404.

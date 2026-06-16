# Issue-04 — Bank Reconciliation HTTP Method Salah + Endpoint Tidak Ada

**Tipe**: Bug  
**Severity**: Critical  
**Estimasi fix**: 20 menit (2 file)  
**Files**: `src/modules/cash-bank/services/cashBankApi.ts`, `src/modules/cash-bank/hooks/useCashBankList.ts`, `src/modules/cash-bank/pages/BankReconciliationFormPage.tsx`
**Status Audit-11**: masih valid. Path canonical saat ini adalah `/cash-bank/bank-reconciliations/*`, bukan path lama `/cash-bank/reconciliations/*`.

---

## Masalah 1: refresh-lines dan mark-lines pakai PATCH, harusnya POST

```ts
// SEBELUM (salah) — cashBankApi.ts:
refreshLines: (id: number) =>
  http.patch(`/cash-bank/bank-reconciliations/${id}/refresh-lines`)

markLines: (id: number, payload: MarkLinesPayload) =>
  http.patch(`/cash-bank/bank-reconciliations/${id}/mark-lines`, payload)

// SESUDAH (benar):
refreshLines: (id: number) =>
  http.post(`/cash-bank/bank-reconciliations/${id}/refresh-lines`)

markLines: (id: number, payload: MarkLinesPayload) =>
  http.post(`/cash-bank/bank-reconciliations/${id}/mark-lines`, payload)
```

---

## Masalah 2: finalize endpoint tidak ada di backend

`cashBankApi.ts` punya:
```ts
finalize: (id: number) =>
  http.patch(`/cash-bank/bank-reconciliations/${id}/finalize`)
```

**Endpoint ini tidak ada di backend** (`laravel_backend/app/Modules/CashBank/Routes/api.php` tidak punya route `finalize` untuk bank reconciliation).

Audit-11 juga menemukan `void` bank reconciliation di frontend:

```ts
void: (id: number, reason: string) =>
  http.patch(`/cash-bank/bank-reconciliations/${id}/void`, { reason })
```

Route `void` juga perlu diverifikasi terhadap Laravel route list aktual. Jika backend tidak menyediakan route ini, tombol/handler void harus disembunyikan atau backend perlu menambahkan kontraknya.

### Opsi solusi

**Opsi A**: Hapus tombol Finalize dari UI (dan hapus `finalize` dari api + hook).  
**Opsi B**: Minta backend tambah endpoint `POST /cash-bank/bank-reconciliations/{id}/finalize`.

Rekomendasikan **Opsi A** untuk sementara sambil konfirmasi ke backend.

---

## Fix

### `cashBankApi.ts`

```ts
// Ubah refresh-lines dan mark-lines ke POST
// Hapus finalize dari bankReconciliationApi
```

### `useCashBankList.ts`

```ts
// Di useBankReconciliationMutations():
// Hapus: finalize: useMutation(...)
```

### `BankReconciliationFormPage.tsx`

```ts
// Hapus tombol "Finalisasi" dan handler-nya
// Status rekonsiliasi tidak punya state 'finalized' dari backend
// Cek apakah backend punya status selain draft/void untuk rekonsiliasi
```

Jika route `void` tidak ada, hapus/disable tombol void reconciliation juga. Jangan samakan dengan void cash receipt/payment/transfer karena resource dan route-nya berbeda.

---

## Tambahan: Backend punya PATCH /{id} untuk update

Backend punya:
```
PATCH /cash-bank/bank-reconciliations/{id}  permission: cash_bank.edit
```

Tapi frontend tidak punya endpoint ini di service. Ini mungkin untuk update `statement_ending_balance` atau field lain tanpa trigger action.

Tambahkan di `cashBankApi.ts`:
```ts
update: (id: number, payload: Partial<BankReconciliationPayload>) =>
  http.patch(`/cash-bank/bank-reconciliations/${id}`, payload)
```

---

## Acceptance Criteria Tambahan Audit-11

- `refreshLines` dan `markLines` memakai `POST`.
- Tidak ada tombol/action yang memanggil endpoint reconciliation yang tidak tersedia di backend.
- `useBankReconciliationMutations()` hanya expose mutation yang punya route backend.
- UI copy menjelaskan aksi yang benar: refresh lines, mark cleared/uncleared, update statement balance.

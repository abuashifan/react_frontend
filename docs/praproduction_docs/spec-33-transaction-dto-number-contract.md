# Spec-33 — Transaction Document Number & Journal Display Contract

**Phase**: 15  
**Tipe**: DTO mapping + list/detail display fixes  
**Severity**: High  
**Referensi**: Audit-11 A11-05, A11-14, A11-15, A11-16; GAP-08; issue-10; issue-12; issue-13  
**Scope**: Sales, Purchase, Cash & Bank, Inventory, Accounting transaction/workspace list.

---

## 1. Tujuan

Membuat nomor dokumen dan nilai utama transaksi tampil konsisten di semua workspace list tanpa bergantung pada alias global di `http.ts`.

Termasuk:

- document number mapping;
- journal list totals;
- journal account selected label;
- formatter guard untuk angka/tanggal transaksi.

---

## 2. Prinsip

1. Backend field spesifik adalah source of truth.
2. UI boleh memakai `number` sebagai canonical display field, tetapi harus dibentuk di adapter service/module.
3. `src/services/http.ts` tidak boleh menjadi tempat utama business DTO mapping.
4. Existing alias global di `http.ts` boleh dipertahankan sebagai fallback sementara, tetapi jangan ditambah sebagai solusi utama.
5. Jangan tampilkan `Rp 0` jika angka sebenarnya tidak tersedia.
6. Jangan tampilkan select kosong jika ID sudah ada dan relation tersedia.

---

## 3. Document Number Field Map

### Sales

| Resource | Backend field | UI canonical |
|---|---|---|
| Quotation | `quotation_number` | `number` |
| Sales Order | `order_number` | `number` |
| Delivery Order | `delivery_number` | `number` |
| Proforma | `proforma_number` | `number` |
| Sales Invoice | `invoice_number` | `number` |
| Sales Receipt | `receipt_number` | `number` |
| Sales Return | `return_number` | `number` |
| Customer Deposit | `deposit_number` | `number` |

### Purchase

| Resource | Backend field | UI canonical |
|---|---|---|
| Purchase Request | `request_number` | `number` |
| Purchase Order | `order_number` | `number` |
| Goods Receipt | `receipt_number` atau `goods_receipt_number` | `number` |
| Vendor Bill | `bill_number` | `number` |
| Vendor Payment | `payment_number` | `number` |
| Purchase Return | `return_number` | `number` |
| Vendor Deposit | `deposit_number` | `number` |

Jika backend memakai field berbeda untuk Goods Receipt, baca source backend aktual sebelum implementasi.

### Cash & Bank

| Resource | Backend field | UI canonical |
|---|---|---|
| Cash Receipt | `receipt_number` | `number` |
| Cash Payment | `payment_number` | `number` |
| Bank Transfer | `transfer_number` | `number` |
| Bank Reconciliation | `reconciliation_number` | `number` |

### Inventory

| Resource | Backend field | UI canonical |
|---|---|---|
| Stock Adjustment | `adjustment_number` | `number` |
| Stock Movement | `movement_number` | `number` |
| Stock Opname | `opname_number` | `number` |

### Accounting

| Resource | Backend field | UI canonical |
|---|---|---|
| Journal Entry | `journal_number` | `number` or keep `journal_number` if page is explicit |

---

## 4. Adapter Pattern

Per service list/detail:

```ts
interface QuotationBackendDto {
  id: number
  quotation_number: string
  date: string
}

interface QuotationListItem {
  id: number
  number: string
  date: string
}

function toQuotationListItem(row: QuotationBackendDto): QuotationListItem {
  return {
    id: row.id,
    number: row.quotation_number,
    date: row.date,
  }
}
```

Untuk paginated response, adapter harus menjaga `meta`:

```ts
return {
  ...response,
  data: response.data.map(toQuotationListItem),
}
```

---

## 5. Journal List Totals

Spec:

1. Jika backend list menyediakan `total_debit` dan `total_credit`, tampilkan angka tersebut.
2. Jika backend list menyediakan `lines`, hitung total dari lines.
3. Jika tidak ada aggregate dan tidak ada lines, tampilkan `-` atau label "Belum tersedia"; jangan tampilkan `Rp 0`.
4. Jika bisnis membutuhkan total di list, rekomendasi permanen adalah backend menambah aggregate di list endpoint.

---

## 6. Journal Account Labels

Pada detail/edit journal:

- Form state tetap menyimpan `account_id`.
- `SearchableSelect` harus menerima `selectedOptions` dari `line.account`.
- Label akun:

```text
{account_code} - {account_name}
```

Jika relation account tidak tersedia, page boleh fetch account by ID atau menampilkan placeholder jujur seperti `Akun #123`.

---

## 7. Formatter Guard

Sebelum memperbaiki semua list, pastikan shared formatter aman:

```text
formatCurrency(null)      -> "-"
formatCurrency(undefined) -> "-"
formatCurrency("")        -> "-"
formatCurrency("abc")     -> "-"
formatDate(null)          -> "-"
formatDate("invalid")     -> "-"
```

Jangan gunakan `Number(value).toLocaleString()` langsung di page.

---

## 8. File Area

```text
src/services/http.ts
src/lib/utils.ts
src/modules/sales/types/*.types.ts
src/modules/sales/services/*Api.ts
src/modules/sales/pages/*ListPage.tsx
src/modules/purchase/types/*.types.ts
src/modules/purchase/services/*Api.ts
src/modules/purchase/pages/*ListPage.tsx
src/modules/cash-bank/types/*.types.ts
src/modules/cash-bank/services/cashBankApi.ts
src/modules/cash-bank/pages/*ListPage.tsx
src/modules/inventory/types/*.types.ts
src/modules/inventory/services/*Api.ts
src/modules/inventory/pages/*ListPage.tsx
src/modules/accounting/types/journalEntry.types.ts
src/modules/accounting/services/journalEntryApi.ts
src/modules/accounting/pages/JournalListPage.tsx
src/modules/accounting/pages/JournalFormPage.tsx
src/components/shared/form/SearchableSelect.tsx
```

---

## 9. Implementation Order

1. Add/adjust formatter guards in `src/lib/utils.ts`.
2. Pick one module at a time: Sales, Purchase, CashBank, Inventory, Accounting.
3. For each service, map backend number field to UI `number` in adapter.
4. Update list page columns only if adapter cannot preserve existing shape.
5. Fix Journal totals display.
6. Fix Journal detail `selectedOptions` for account lines.
7. Keep `http.ts` alias only as documented fallback; avoid expanding it.
8. Run build.

---

## 10. Acceptance Criteria

- Semua workspace list menampilkan nomor dokumen utama.
- Journal list tidak menampilkan total palsu.
- Journal detail menampilkan label akun.
- Tidak ada `NaN` atau `Invalid Date` dari formatter shared.
- TypeScript type sesuai dengan shape yang dipakai page.
- `npm run build` succeeds.

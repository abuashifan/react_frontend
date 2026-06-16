# Issue-13 — Formatter Null and Invalid Guards

**Tipe**: Shared utility hardening  
**Severity**: Medium  
**Sumber**: Audit-11 A11-16  
**Status**: Belum selesai

---

## Ringkasan

Beberapa angka/tanggal bisa tampil sebagai `NaN`, `Invalid Date`, atau fallback yang menyesatkan karena parsing dilakukan langsung di page atau formatter shared belum menjaga input invalid.

---

## Root Cause

- `formatCurrency`, `formatNumber`, dan `formatDate` belum cukup defensif terhadap `null`, `undefined`, string kosong, dan invalid date.
- Page tertentu melakukan `Number(value)` langsung.
- DTO mismatch membuat field yang diparsing tidak ada, contoh `sell_price` pada Product.

---

## File Terkena

```text
src/lib/utils.ts
src/modules/master-data/pages/ProdukListPage.tsx
src/modules/**/pages/*ListPage.tsx
src/modules/**/pages/*FormPage.tsx
```

---

## Prinsip Fix

- Formatter shared harus menerima input kosong/invalid dan mengembalikan fallback konsisten.
- Gunakan `tabular-nums` untuk angka sesuai rule frontend.
- Hilangkan parsing ad-hoc di page jika bisa memakai formatter shared.
- Jangan menyembunyikan DTO mismatch dengan fallback terlalu agresif. Untuk field wajib yang hilang, catat di issue DTO terkait.

---

## Acceptance Criteria

- Tidak ada `NaN` atau `Invalid Date` yang terlihat di UI.
- Field kosong tampil sebagai `-` atau empty state yang konsisten.
- Formatter tidak melempar runtime error untuk input invalid.
- Product price issue tetap diselesaikan di `issue-08`, bukan hanya ditutup dengan formatter.

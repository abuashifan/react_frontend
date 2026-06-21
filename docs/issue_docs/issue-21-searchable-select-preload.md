# Issue-21 — SearchableSelect Preload, Search UX, and Selected Labels

**Tipe**: Shared async select UX  
**Severity**: High  
**Sumber**: Audit-12 A12-09  
**Status**: ✅ Done (Phase 22, 2026-06-16)

> Resolusi: `SearchableSelect` kini preload opsi awal saat dropdown dibuka
> (`onSearch('')` — service list mengembalikan top aktif), gate `MIN_CHARS`
> dihapus, placeholder diganti "Ketik untuk mencari...", empty state hanya
> tampil setelah pencarian selesai. Debounce 300ms dipertahankan. Label edit
> tetap di-resolve via `selectedOptions` yang sudah diisi form dari relation
> backend (value form tetap ID, bukan object).

---

## Ringkasan

SearchableSelect mendukung async search, tetapi user merasa akun/customer/product belum bisa dicari karena dropdown kosong sampai minimal dua karakter. Pada edit/detail, label juga bisa hilang jika page tidak memberi `selectedOptions`.

---

## Root Cause

- `MIN_CHARS = 2` tanpa initial options saat dropdown dibuka.
- Beberapa form line item tidak membentuk `selectedOptions` dari relation backend.
- Ada penggunaan `selectedOptions={[]}` yang membuat label edit tidak dapat di-resolve.
- Mapping label harus mengikuti DTO canonical:
  - account: `account_code - account_name`;
  - contact: `contact_code - name`;
  - product: `product_code - product_name`.

---

## File Terkena

```text
src/components/shared/form/SearchableSelect.tsx
src/modules/**/pages/*FormPage.tsx
src/modules/master-data/services/coaApi.ts
src/modules/master-data/services/kontakApi.ts
src/modules/master-data/services/produkApi.ts
```

---

## Prinsip Fix

- Saat dropdown dibuka, lakukan initial search query kosong untuk top aktif jika service mendukung.
- Placeholder input harus menjelaskan bisa ketik untuk mencari, bukan hanya minimal karakter.
- `selectedOptions` wajib diisi dari relation backend pada form edit/detail.
- Jangan ubah value form dari ID menjadi object.
- Tetap collision-aware terhadap viewport.

---

## Acceptance Criteria

- Dropdown akun/customer/product menampilkan opsi awal atau loading/empty state yang jelas saat dibuka.
- Search tetap debounce.
- Edit/detail tidak menampilkan `ID x` jika relation tersedia.
- Build pass.

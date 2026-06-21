# Issue-20 — Persistent Unsaved Form Draft

**Tipe**: Form UX + local persistence  
**Severity**: Critical  
**Sumber**: Audit-12 A12-08  
**Status**: Done — Phase 21 (2026-06-16)

---

## Ringkasan

Data form yang belum disimpan hilang saat user pindah tab atau refresh. `useTabStore` sudah punya `formState`, tetapi form pages belum memakai action tersebut dan belum ada draft storage khusus.

---

## Root Cause

- React Hook Form state berada lokal di page.
- Virtual tab navigation dapat unmount form.
- Store tab persist ke `sessionStorage`, bukan draft yang dirancang untuk restore form.
- Tidak ada hook reusable untuk watch/debounce/restore/clear draft.

---

## File Terkena

```text
src/stores/useTabStore.ts
src/modules/**/pages/*FormPage.tsx
```

Calon helper:

```text
src/hooks/usePersistentFormDraft.ts
```

---

## Prinsip Fix

- Gunakan React Hook Form `useWatch`, bukan `watch()` langsung di render.
- Draft key harus stabil:
  - app namespace;
  - company id;
  - route/module;
  - document id atau `new`.
- Simpan ke `localStorage` untuk bertahan refresh, kecuali ada alasan privacy untuk session-only.
- Debounce write agar tidak menulis storage setiap keystroke.
- Clear draft saat save berhasil, post/void berhasil, discard, atau cancel eksplisit.
- Untuk line item state di luar RHF, hook harus support serializer tambahan.

---

## Acceptance Criteria

- Form create/edit dapat restore draft setelah pindah tab/refresh.
- User tidak kehilangan line items.
- Draft lama tidak menimpa data backend setelah save sukses.
- Ada mekanisme discard/clear.
- Build pass.

---

## Implementation Notes — Phase 21

- Menambahkan `src/hooks/usePersistentFormDraft.ts` berbasis React Hook Form `useWatch`, key `localStorage` per company + module/document id, debounce write, restore otomatis, dan `clearDraft`/`discardDraft`.
- Rollout awal:
  - `SalesInvoiceFormPage`
  - `VendorBillFormPage`
  - `StockAdjustmentFormPage`
  - `BankTransferFormPage`
- Line items di luar RHF ikut tersimpan melalui payload `extra` pada Sales Invoice, Vendor Bill, dan Stock Adjustment.
- Nilai select pada form yang disentuh Phase 21 memakai `useWatch` agar draft watcher tidak bergantung pada `watch()` render langsung.
- Draft dibersihkan setelah save/create/update, approve, post, dan void sukses.
- Tombol `Buang Draft` muncul saat draft lokal berhasil direstore, lalu mengembalikan form ke data backend/default dan menghapus draft lokal.
- Verifikasi:
  - `npm run build` ✅
  - `npx eslint src/hooks/usePersistentFormDraft.ts` ✅
  - `npm run lint` masih tertahan lint debt lama A12-16 / Phase 23.

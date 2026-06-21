# Spec-36 — Audit-12 UX and Workflow Fixes

**Phase**: 18-23  
**Tipe**: UX/workflow hardening after Audit-11  
**Referensi**: Audit-12 A12-01..A12-16, GAP-09, issue-16..issue-26  
**Status**: Planned

---

## 1. Tujuan

Spec ini menjadi kontrak implementasi untuk perbaikan Audit-12:

- reports adapter dan runtime guard;
- stock balance DTO/detail route;
- filter multi-select dan date range;
- DataTable row selection dan bulk void;
- persistent form draft;
- SearchableSelect preload/selected labels;
- date input normalization;
- close-all primary tabs;
- fixed-assets ribbon diagnostic;
- document edit/view policy;
- lint debt cleanup.

---

## 2. Urutan Phase

| Phase | Scope | Issue |
|---|---|---|
| 18 | Reports contract hardening | issue-16 |
| 19 | Stock balance contract fixes | issue-17 |
| 20 | Filter and table bulk workflow | issue-18, issue-19 |
| 21 | Persistent form drafts | issue-20 |
| 22 | Select/date/edit-mode UX | issue-21, issue-22, issue-25 |
| 23 | Tabs/ribbon/lint cleanup | issue-23, issue-24, issue-26 |

---

## 3. Global Rules

- Frontend tidak boleh menambah/memanggil endpoint fiktif baru.
- Backend route/controller/model/test boleh diubah bila diperlukan untuk kontrak end-to-end, dengan mengikuti `/workspace/laravel_backend/AGENTS.md`.
- Perubahan backend wajib menjaga tenant isolation, permission, accounting integrity, transaction atomicity, dan memiliki feature test relevan.
- Semua API call tetap di `src/modules/{module}/services/`.
- Server state tetap TanStack Query.
- Zustand hanya untuk UI state; draft form gunakan hook/storage khusus.
- Semua action button harus permission guarded.
- Semua page tetap mengikuti `spec-23` tablet-first scroll/height rules.
- Build wajib pass setelah tiap phase.

---

## 4. Reports

Service `reportsApi` menjadi adapter boundary. Page harus menerima shape stabil atau empty state.

Rules:

- Runtime guard wajib sebelum akses nested property.
- `Array.isArray` untuk list/sections/accounts.
- Missing totals harus fallback ke angka valid atau `-`, bukan crash.
- Export PDF/Excel disembunyikan atau disabled sampai backend route ada.
- Transaction report disembunyikan sampai backend route tersedia.

---

## 5. Stock Balance

Rules:

- Product relation canonical:
  - `product_code`;
  - `product_name`;
  - `description`.
- UI boleh expose alias display `product.code/name/description` dari service adapter.
- Detail route tidak boleh memakai `/inventory/stock-balances/{productId}/{warehouseId}` jika backend belum punya route itu.
- Unsupported filters tidak boleh tampil sebagai backend filter aktif.

---

## 6. Filters

Rules:

- Checkbox filter berarti multi-select.
- Single-select harus memakai radio/select, bukan checkbox.
- Date range memakai `date_from` dan `date_to` hanya setelah endpoint diverifikasi.
- Multi-select serializer harus dipilih per endpoint dan dicatat di service/hook.
- Reset filter harus reset page ke 1.

---

## 7. DataTable Selection and Bulk Void

Rules:

- Checkbox selection muncul jika page punya action bulk yang nyata.
- Bulk void tanpa backend bulk endpoint boleh loop per id dengan progress dan partial failure summary.
- Gunakan `VoidConfirmDialog`.
- Invalidate query setelah bulk selesai.

---

## 8. Persistent Draft

Rules:

- Hook draft memakai `useWatch` + debounce.
- Storage key mencakup company id + route/module + document id/new.
- Draft clear saat save/post/void/discard/cancel.
- Hook harus bisa menerima serializer tambahan untuk line items non-RHF.
- Jangan menyimpan draft di Zustand sebagai server data.

---

## 9. SearchableSelect

Rules:

- Dropdown boleh melakukan initial search query kosong saat dibuka.
- Minimal search chars boleh tetap ada untuk typed search, tetapi empty open state harus jelas.
- Edit/detail wajib memberi `selectedOptions` dari relation backend.
- Value form tetap ID.

---

## 10. Date Input

Rules:

- Tambahkan `toDateInputValue`.
- Gunakan helper untuk semua reset/default edit.
- `formatDate` hanya untuk display.

---

## 11. Tabs, Ribbon, Edit Mode, Lint

Rules:

- Close all primary tabs menyisakan dashboard.
- Ribbon kosong karena permission harus menampilkan empty state kecil.
- Document read-only harus punya alasan visual.
- Lint cleanup tidak dicampur dengan behavior fix besar.

---

## 12. Verification

Minimal tiap phase:

```bash
npm run build
```

Tambahan:

```bash
npm run lint
```

Lint boleh dicatat masih gagal sampai Phase 23, tetapi error baru dari file yang disentuh harus dihindari.

# Issue-23 — Close All Primary Virtual Tabs

**Tipe**: Virtual tab UX  
**Severity**: Medium  
**Sumber**: Audit-12 A12-03  
**Status**: Done — Phase 23 (2026-06-16)

---

## Ringkasan

Primary tabs hanya bisa ditutup satu per satu. User membutuhkan tombol close all untuk membersihkan semua tab non-dashboard.

---

## File Terkena

```text
src/stores/useTabStore.ts
src/components/shared/layout/PrimaryTabs.tsx
```

---

## Prinsip Fix

- Tambah action `closeAllPrimaryTabs()`.
- Dashboard tetap pinned dan tidak ikut ditutup.
- Active tab kembali ke dashboard.
- Secondary tabs untuk tab yang ditutup ikut dibersihkan.
- Tambahkan icon button dengan tooltip di ujung kanan PrimaryTabs.

---

## Acceptance Criteria

- Tombol close all tampil hanya jika ada tab non-dashboard.
- Klik close all menyisakan Dashboard saja.
- Navigation pindah ke `/`.
- Build pass.

---

## Implementation Notes — Phase 23

- Menambahkan `closeAllPrimaryTabs()` di `src/stores/useTabStore.ts`.
- PrimaryTabs sekarang menampilkan icon button `Close All` dengan tooltip di ujung kanan hanya saat ada tab non-dashboard.
- Aksi close all membersihkan secondary tabs turunan, mengembalikan active tab ke Dashboard, dan navigasi ke `/` bila perlu.
- Verifikasi:
  - `npm run build` ✅
  - `npm run lint` ✅ 0 error

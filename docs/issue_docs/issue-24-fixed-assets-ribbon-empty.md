# Issue-24 — Fixed Assets Ribbon Empty Diagnostic

**Tipe**: Navigation permission diagnostic  
**Severity**: Medium  
**Sumber**: Audit-12 A12-04  
**Status**: Done — Phase 23 (2026-06-16)

---

## Ringkasan

Source code sudah berisi ribbon items Aktiva Tetap, tetapi user melaporkan ribbon kosong. Kemungkinan penyebab adalah permission payload, cache/build lama, atau filtering PermissionGuard.

---

## File Terkena

```text
src/router/moduleConfig.ts
src/components/shared/layout/RibbonPanel.tsx
src/hooks/usePermission.ts
src/stores/useAuthStore.ts
```

---

## Prinsip Fix

- Jangan menghapus permission guard.
- Jika module aktif tetapi semua item tersaring, tampilkan empty state kecil:
  - tidak ada menu tersedia untuk permission user;
  - bukan error fatal.
- Tambahkan diagnostic dev-friendly tanpa membocorkan informasi sensitif.
- Verifikasi permission keys:
  - `fixed_assets.view`;
  - `fixed_assets.settings.view`;
  - `fixed_assets.reports.view`.

---

## Acceptance Criteria

- Ribbon tidak tampak blank tanpa penjelasan.
- User dengan permission benar melihat menu Aktiva Tetap.
- Build pass.

---

## Implementation Notes — Phase 23

- `RibbonPanel` sekarang menampilkan empty diagnostic kecil saat module aktif tetapi semua item tersaring permission.
- Diagnostic ini tidak menghapus permission guard dan hanya memberi penjelasan singkat bahwa tidak ada menu yang tersedia untuk permission aktif.
- Verifikasi permission yang dipakai tetap sesuai:
  - `fixed_assets.view`
  - `fixed_assets.settings.view`
  - `fixed_assets.reports.view`
- Build pass pada `npm run build` ✅

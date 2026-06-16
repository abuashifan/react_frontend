# Phase 1B — Auth Pages

**Label:** `form`, `ui-component`
**Status:** ✅ Done (setelah fix baseURL `/api/v1` → `/api`)
**Verifikasi:** Login berhasil, token tersimpan, redirect benar.
**Commit:** `feat(auth): login flow, company picker, route guards`

---

## Issues

### ISSUE-1B-01 — Login Page (split screen)
- Layout split screen: kiri branding, kanan form
- Form: email + password + tombol login
- Error handling per tipe: 422 validation, 404 wrong endpoint, 500 server, network error
- Loading state saat submit
- File: `src/modules/auth/pages/LoginPage.tsx`

### ISSUE-1B-02 — Company Picker Page (card grid)
- Tampilkan daftar company dari `GET /api/companies`
- Layout card grid per company
- Klik company → `POST /api/companies/select` → fetch permissions → `navigate('/')` — AppShell render Dashboard tab secara default
- File: `src/modules/auth/pages/CompanyPickerPage.tsx`

### ISSUE-1B-03 — Auth flow post-login
- 1 company → langsung set active company → fetch permissions → `navigate('/')` — AppShell render Dashboard tab secara default
- 2+ company → redirect `/select-company`
- Simpan token + user ke `useAuthStore`

### ISSUE-1B-04 — Route Guards (ProtectedRoute)
- Cek token di store — jika tidak ada → redirect `/login`
- Cek active company — jika tidak ada → redirect `/select-company`
- File: `src/router/guards.tsx`

### ISSUE-1B-05 — Session Timeout
- Idle timer: deteksi inaktivitas user (mouse, keyboard, touch)
- Warning dialog muncul X menit sebelum timeout
- Auto logout jika tidak ada respons
- Konfigurasi durasi dari company settings

### ISSUE-1B-06 — usePermission hook
- `usePermission(permission: string): boolean`
- Baca dari `useAuthStore.permissions`
- File: `src/hooks/usePermission.ts`

### ISSUE-1B-07 — PermissionGuard component
- Wrap children dengan permission check
- Jika tidak punya permission → render `null` atau fallback
- File: `src/components/shared/PermissionGuard.tsx`

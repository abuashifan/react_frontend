# Issue-11 — Dashboard Graceful Fallback

**Tipe**: Missing backend endpoint + UX fallback  
**Severity**: Medium  
**Sumber**: Audit-11 A11-07, GAP-05  
**Status**: Selesai — Phase 17

---

## Ringkasan

Frontend dashboard memanggil endpoint `/dashboard/*`, tetapi backend saat audit tidak menyediakan route dashboard. Dashboard harus tetap aman sebagai halaman pertama user.

---

## Endpoint Bermasalah

```text
/dashboard/summary
/dashboard/pending
/dashboard/chart
/dashboard/activities
```

File utama:

```text
src/modules/dashboard/services/dashboardApi.ts
src/modules/dashboard/hooks/useDashboardData.ts
src/modules/dashboard/pages/DashboardPage.tsx
src/modules/dashboard/components/*
```

---

## Prinsip Fix

- Jangan biarkan dashboard menampilkan error merah besar hanya karena endpoint belum ada.
- Jika backend belum punya endpoint, tampilkan empty/fallback state yang jelas.
- Jangan membuat mock data yang terlihat seperti data real.
- Pisahkan status "belum ada endpoint" dari "data kosong".

---

## Acceptance Criteria

- Dashboard tidak crash saat semua endpoint `/dashboard/*` 404.
- User melihat state kosong atau not-yet-available yang rapi.
- Query retry tidak membanjiri backend untuk endpoint yang memang belum ada.
- Jika nanti backend dashboard tersedia, service bisa diaktifkan tanpa refactor besar.

## Catatan Implementasi Phase 17

- `useDashboardData` menonaktifkan retry untuk error 404 dashboard dan membatasi retry error lain.
- `DashboardPage` memisahkan state endpoint belum tersedia dari data kosong.
- KPI, pending alert, chart, dan recent activity menampilkan fallback eksplisit tanpa mock data.

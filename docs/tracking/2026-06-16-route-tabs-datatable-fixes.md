# Tracking: Route, Virtual Tabs, URL Masking, dan DataTable Fixes

Tanggal: 2026-06-16
Area: App shell, ribbon/tabs, router, DataTable, journal API
Status: Implemented, build passed

## Ringkasan Perubahan

Perubahan ini menyelesaikan dua masalah utama:

1. Workspace list dan form tidak tampil karena virtual tab belum tersinkron dengan route aktif.
2. Halaman Jurnal Umum crash dengan error `data.map is not a function` karena response paginated Laravel tidak sesuai shape yang diasumsikan `DataTable`.

Perubahan tambahan:

- URL aplikasi disembunyikan dari user dengan memory router, sehingga address bar tetap menampilkan domain utama.
- Aksi journal approve/post/void disesuaikan ke method backend yang benar.

## Perubahan Route dan Virtual Tabs

File terkait:

- `src/components/shared/layout/RibbonPanel.tsx`
- `src/components/shared/layout/PrimaryTabs.tsx`
- `src/components/shared/layout/SecondaryTabs.tsx`
- `src/components/shared/layout/AppShell.tsx`
- `src/router/moduleConfig.ts`

Perubahan yang dilakukan:

- `RibbonPanel` membuka primary tab dari item ribbon.
- `PrimaryTabs` dan `SecondaryTabs` mengaktifkan tab dan menjaga path internal tab aktif.
- `AppShell` menyinkronkan route internal ke virtual primary/secondary tab.
- `moduleConfig` menyediakan lookup ribbon item berdasarkan path.

Contoh hasil sinkronisasi:

- `/sales/orders` membuka tab Sales Order + secondary tab `Daftar`.
- `/sales/orders/create` membuka tab Sales Order + secondary tab `Baru`.
- `/sales/orders/:id` membuka tab Sales Order + secondary tab detail/form.

Catatan keputusan lanjutan:

- Awalnya tab memakai route browser langsung.
- Setelah requirement URL disembunyikan, router diganti ke memory router. Route tetap dipakai secara internal oleh React Router, tetapi address bar browser dibersihkan kembali ke `/`.

## URL Masking

File terkait:

- `src/router/index.tsx`
- `src/components/shared/layout/AppShell.tsx`

Perubahan yang dilakukan:

- `createBrowserRouter` diganti menjadi `createMemoryRouter`.
- Initial route tetap dibaca dari `window.location.pathname`, sehingga direct load seperti `/accounting/journals` masih bisa diproses saat pertama kali masuk.
- Setelah route awal dibaca, browser history di-replace ke `/`.
- `AppShell` bisa memulihkan route internal dari tab state ketika browser berada di `/`.

Efek user-facing:

- User melihat `app.finlite.my.id` saja di address bar.
- Route internal tetap berjalan untuk render list/form.
- Trade-off: user tidak punya URL spesifik yang bisa dicopy untuk halaman tertentu.

## DataTable dan Paginated Response Fix

File terkait:

- `src/services/http.ts`
- `src/components/shared/table/DataTable.tsx`

Perubahan yang dilakukan:

- `http.ts` menormalisasi response paginated Laravel dari:

```ts
{
  success: true,
  data: {
    data: [],
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1
  }
}
```

menjadi shape frontend:

```ts
{
  success: true,
  data: [],
  meta: {
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1
  }
}
```

- `DataTable` sekarang defensif terhadap runtime non-array dengan normalisasi lokal ke `rows`.
- Error `data.map is not a function` tidak lagi menjatuhkan halaman.

## Journal API Method Fix

File terkait:

- `src/modules/accounting/services/journalEntryApi.ts`

Perubahan yang dilakukan:

- `approve`, `post`, dan `void` diganti dari `PATCH` ke `POST` agar sesuai route backend:
  - `POST /journals/{id}/approve`
  - `POST /journals/{id}/post`
  - `POST /journals/{id}/void`

## Verifikasi

Command:

```bash
npm run build
```

Hasil:

- TypeScript build sukses.
- Vite production build sukses.
- Ada warning chunk size dari Vite, tetapi bukan blocker untuk perubahan ini.

## Catatan Lanjutan

- Semua list workspace tetap harus memakai reusable `DataTable` di `src/components/shared/table/DataTable.tsx`.
- Jika ada kolom dokumen kosong, cek mapping field per modul terlebih dahulu. Contoh: Quotation frontend membaca `number`, sementara backend memakai `quotation_number`.
- Karena URL disembunyikan dengan memory router, fitur shareable deep link tidak tersedia kecuali dibuat mekanisme khusus.

# 06 — Responsive Rules

## Filosofi: Compact Scaling, Bukan Reflow

Seaside Escape ERP menggunakan pendekatan **compact scaling** — bukan responsive reflow seperti website pada umumnya.

> Pada layar kecil (tablet), UI **tidak** di-stack ulang menjadi layout mobile.
> UI **tetap seperti desktop**, tapi typography, padding, dan ukuran komponen di-scale down secara proporsional.
> Tujuannya: user tablet melihat tampilan yang sama dengan user desktop, hanya lebih compact.

Analogi: Microsoft Excel di tablet — tetap terlihat seperti spreadsheet, bukan versi mobile yang disederhanakan.

---

## Breakpoint Target

| Breakpoint | Width | Target Device | Behavior |
|---|---|---|---|
| `< 768px` | Mobile | Smartphone | Single column, touch-friendly, layout disederhanakan |
| `768px+` | Tablet | iPad mini 6+ | **Desktop-like layout**, compact scaling |
| `1024px+` | Desktop | iPad Pro, laptop | Full desktop layout, normal sizing |
| `1280px+` | Large desktop | Monitor | Optimal experience |

**Primary target: 768px+** — semua fitur harus berfungsi sempurna di sini.

---

## Compact Scaling Rules

### Typography

```
Mobile (<768px):
  body: 14px (lebih besar untuk touch)
  label: 13px
  table header: 11px

Tablet (768px - 1023px):
  body: 13px        ← diperkecil
  label: 12px
  table header: 10px
  amount: 13px

Desktop (1024px+):
  body: 14px        ← normal
  label: 12px
  table header: 11px
  amount: 14px
```

Tailwind implementation:
```tsx
// Body text
className="text-[13px] lg:text-sm"

// Table header
className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wide"

// Amount
className="text-[13px] lg:text-sm tabular-nums"
```

### Spacing & Padding

```
Mobile:
  content padding: 12px
  card padding: 12px
  table cell: 6px 10px
  button height: 36px (touch target)

Tablet (768px+):
  content padding: 16px    ← compact
  card padding: 16px
  table cell: 8px 12px     ← compact
  button height: 32px

Desktop (1024px+):
  content padding: 24px    ← normal
  card padding: 20px
  table cell: 10px 16px    ← normal
  button height: 36px
```

Tailwind:
```tsx
// Content padding
className="p-3 md:p-4 lg:p-6"

// Table cell
className="px-3 py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2.5"

// Card
className="p-3 md:p-4 lg:p-5"
```

### Row Height Table

```
Tablet (768px+): 36px
Desktop (1024px+): 40px
```

```tsx
className="h-9 lg:h-10"
```

---

## Form Layout Rules

### Header Section

```
Mobile (<768px):
  Layout: single column, stack ke bawah

Tablet (768px+) → Desktop:
  Layout: 2-column grid
  Gap: 16px (tablet) / 20px (desktop)
```

```tsx
// Form header grid
className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5"
```

### Field Width di 2-Column Grid

```
Full width (span 2 kolom):
  - Deskripsi/Notes (textarea)
  - Field yang membutuhkan banyak ruang

Half width (1 kolom):
  - Customer/Vendor
  - Tanggal
  - Nomor dokumen
  - Payment term
  - Warehouse
  - Due date
```

---

## Table Rules

### Horizontal Scroll

Semua table di workspace list **wajib** support horizontal scroll:

```tsx
// Wrapper wajib ada
<div className="overflow-x-auto">
  <table className="min-w-full">
    ...
  </table>
</div>
```

### Kolom Fixed (Sticky)

Kolom berikut **wajib sticky** agar tidak hilang saat horizontal scroll:

```tsx
// Kolom checkbox (pertama)
className="sticky left-0 z-10 bg-white"

// Kolom nomor transaksi (kedua)
className="sticky left-8 z-10 bg-white"
// (left-8 = lebar kolom checkbox)
```

### Minimum Column Width

```
Checkbox column   : 32px (w-8)
Nomor transaksi   : 140px (min-w-[140px])
Nama/Deskripsi    : 180px (min-w-[180px])
Tanggal           : 100px (min-w-[100px])
Amount/Angka      : 120px (min-w-[120px])
Status            : 100px (min-w-[100px])
```

---

## Sidebar Behavior

### Filter Sidebar

```
Mobile (<768px):
  Sidebar DISEMBUNYIKAN default
  Ada toggle button untuk buka sebagai overlay/drawer

Tablet (768px+):
  Sidebar tampil default (220px)
  Bisa di-collapse menjadi 0px (toggle)
  Content area menyesuaikan (flex)

Desktop (1024px+):
  Sidebar selalu tampil (220px)
  Toggle tetap ada tapi jarang dipakai
```

### Collapse Behavior

```tsx
// Sidebar collapse
<aside className={cn(
  "transition-all duration-200",
  isSidebarCollapsed 
    ? "w-0 overflow-hidden" 
    : "w-[220px]"
)}>
```

---

## Ribbon Panel

```
Mobile (<768px):
  Ribbon DISEMBUNYIKAN
  Navigasi via bottom tab bar (mobile-specific)

Tablet (768px+):
  Ribbon overlay tampil on demand (64px, fixed top 52px)
  Item bisa scroll horizontal jika overflow

Desktop (1024px+):
  Ribbon overlay tampil on demand
  Semua item terlihat tanpa scroll (jika layar cukup)
```

---

## Fixed Bottom Bar

```
Mobile (<768px):
  Tetap fixed bottom
  Tombol full width atau stack

Tablet (768px+):
  Fixed bottom, tombol di kanan
  Height: 56px

Desktop (1024px+):
  Fixed bottom, tombol di kanan
  Height: 56px
```

---

## Mobile-Specific Rules (<768px)

Di bawah 768 px (HP 360–430 px) aplikasi memakai tata letak HP khusus. Tablet dan desktop tidak
berubah. Pemicunya `useIsMobile()` (`src/hooks/useIsMobile.ts`, `max-width: 767px`).

| Area | Perilaku di HP | Komponen |
|---|---|---|
| Navigasi | Topbar memuat judul halaman aktif dan perusahaan. Ikon modul, ribbon, dan deretan tab primer diganti navigasi bawah: **Beranda**, **Menu** (modul → halaman), **Tab** (halaman yang sedang dibuka, bisa ditutup). Navigasi bawah disembunyikan di tampilan formulir karena formulir punya aksi sendiri. | `MobileNav`, `MobileSheet`, `AppShell`, `Topbar` |
| Tab sekunder | Hanya tampil bila ada lebih dari satu (daftar + formulir) supaya jalan kembali ke daftar tetap ada. | `AppShell`, `SecondaryTabs` |
| Daftar | `DataTable` menampilkan kartu: kolom pertama jadi judul (atau kolom ber-`meta.mobileTitle`), kolom lain pasangan label–nilai, kolom `actions` di kaki kartu, pilihan urutan di atas. `mobileCards={false}` mempertahankan tabel. | `DataTable` |
| Filter | Sidebar filter pindah ke sheet dari bawah lewat tombol **Filter**. | `WorkspaceLayout`, `FilterSidebar` |
| Formulir | Satu kolom. Baris item (`LineItemsTable`) menjadi kartu bertumpuk, label di atas isian, tanpa gulir horizontal. | `FormLayout`, `LineItemsTable` |
| Dialog | Dialog Radix biasa memenuhi layar; `AlertDialog` tetap di tengah; sheet bawah memakai `data-mobile-sheet`. Isian 16 px agar iOS tidak memperbesar halaman. | `src/index.css` |
| Laporan | **Tidak disusun ulang.** Halaman laporan (`/reports`, `/fixed-assets/reports`, `/sales/ar`, `/purchase/ap`) tampil seperti membuka PDF: selebar kertas A4 lalu diperkecil (CSS `zoom`) sampai pas dengan lebar layar, dapat dicubit untuk memperbesar. Tabel yang lebih lebar dari kertas melebarkan dasarnya supaya tidak terpotong. Saat mencetak, perbesaran dikembalikan. | `ReportZoomViewport`, `WorkspaceLayout` |
| Dashboard | Kartu KPI dua kolom dengan angka yang mengecil, padding rapat. | `KpiCards`, `DashboardPage` |

Aturan tambahan:

1. **Touch target** minimum 40–44 px untuk tombol dan baris yang bisa diketuk.
2. **Jangan** menambah `user-scalable=no`; laporan bergantung pada cubit-zoom.
3. Halaman baru yang memakai `DataTable`, `LineItemsTable`, `WorkspaceLayout`, dan `FormLayout` otomatis mengikuti tata letak HP. Halaman dengan tabel buatan sendiri perlu diperiksa di 390 px.

---

## Viewport Meta

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**DILARANG** menggunakan `user-scalable=no` — accessibility requirement.

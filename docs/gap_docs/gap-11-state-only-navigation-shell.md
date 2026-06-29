# GAP-11 — State-Only Navigation Shell

**Severity**: 🟡 Medium
**Tipe**: Navigation state vs browser URL mismatch
**Status**: Deferred — dikerjakan setelah Design-I2 (semua phase Reports) selesai

---

## Ringkasan

Klik menu topbar/ribbon saat ini masih mendorong route browser dengan `navigate(item.path)`, sehingga address bar berubah dan navigasi masih bergantung pada `react-router` path.

Target yang diinginkan adalah:

- navigasi menu hanya mengubah state shell/tab;
- URL browser tetap stabil atau tidak menjadi sumber utama perpindahan view;
- view switching dilakukan dari state aplikasi, bukan dari route path.

---

## Perilaku Saat Ini

- Klik modul di topbar membuka ribbon lewat state.
- Klik item ribbon masih memanggil `navigate(item.path)`.
- `AppShell.tsx` masih menyinkronkan tab aktif dari `location.pathname`.
- `moduleConfig.ts` masih mendefinisikan path untuk ribbon items sebagai sumber navigasi utama.

---

## Dampak

- Address bar browser berubah saat user berpindah menu.
- Perpindahan view masih bergantung pada route path, bukan state shell.
- Navigasi tab/ribbon sulit dipisahkan dari routing browser.
- Pola ini menyulitkan target UX jika shell ingin benar-benar state-driven.

---

## File Terkait

- `src/components/shared/layout/Topbar.tsx`
- `src/components/shared/layout/RibbonPanel.tsx`
- `src/components/shared/layout/AppShell.tsx`
- `src/router/moduleConfig.ts`
- `src/router/index.tsx`

---

## Catatan Implementasi

Gap ini sengaja tidak dibuka sebagai bagian dari Phase 33.
Fokus saat ini tetap pada remediation Phase 33 sampai Phase 39 selesai.
Setelah itu, gap ini bisa ditelusuri lagi lebih detail untuk refactor navigasi shell/state.

---

## Temuan Analisis (2026-06-28)

### Temuan 1 — Browser URL sudah tidak berubah

`src/router/index.tsx` sudah memakai `createMemoryRouter` (bukan `createBrowserRouter`),
dan baris 23–25 mereset browser URL ke `/` saat aplikasi dimuat:

```ts
if (window.location.pathname !== '/') {
  window.history.replaceState(window.history.state, '', '/')
}
export const router = createMemoryRouter([...], { initialEntries: [initialEntry] })
```

Semua `navigate()` hanya mengubah state memory router internal — address bar browser
**tidak berubah**. Gap di level browser URL sudah terpenuhi.

### Temuan 2 — Dua sumber kebenaran yang dijaga manual

Meski browser URL tidak berubah, ada **dua state paralel** yang harus selalu sinkron:

```
Zustand (useTabStore)       ←── dijaga manual ──→       Memory Router (path internal)
```

Setiap aksi navigasi saat ini memanggil keduanya:
- `RibbonPanel.tsx:88` — `openPrimaryTab()` + `navigate(item.path)`
- `PrimaryTabs.tsx:36-37` — `setActivePrimaryTab()` + `navigate(pathForPrimaryTab(tabId))`
- `SecondaryTabs.tsx:30-31` — `setActiveSecondaryTab()` + `navigate(path)`

`AppShell.tsx` punya 3 `useEffect` yang mensinkronkan tab state **dari** router path
(router adalah sumber kebenaran, bukan Zustand).

### Temuan 3 — Tidak ada bug sekarang, tapi ada risiko maintenance

Implementasi saat ini **konsisten dan tidak ada bug**. Risiko muncul di masa depan
jika developer menambah navigasi programatik dan lupa memanggil salah satu dari dua
sisi (Zustand atau navigate). Contoh skenario rentan:

| Skenario | Konsekuensi |
|----------|-------------|
| Navigasi programatik setelah save form hanya panggil `navigate()` | Tab tidak update — tab UI dan konten tidak sinkron |
| Navigasi setelah save form hanya panggil Zustand action | Konten tidak berubah — user tetap di halaman lama |
| AppShell effects direfactor tanpa memahami ketiga efek | Restorasi tab saat reload bisa gagal |

---

## Rencana Implementasi — Pendekatan "Router Mengikuti State"

**Prinsip:** Balik arah dependency. Zustand menjadi satu-satunya sumber kebenaran.
Memory router hanya *mengikuti* tab state, bukan sebaliknya. Komponen navigasi
tidak boleh memanggil `navigate()` secara langsung.

```
SEBELUM: user action → navigate() → AppShell effect → Zustand update
SESUDAH: user action → Zustand update → AppShell effect → navigate()
```

React Router tetap dipakai untuk merender konten (tidak perlu component registry baru).
Yang berubah hanya arah dependency dan siapa yang memanggil `navigate()`.

---

## File yang Diubah

### `src/components/shared/layout/AppShell.tsx`

**Tujuan:** Jadikan AppShell sebagai satu-satunya tempat yang memanggil `navigate()`,
berdasarkan perubahan tab state — bukan sebaliknya.

**Hapus:**
- `useEffect` #1 (baris 36–62): restore navigasi saat path `/` — diganti oleh efek baru
- `useEffect` #2 (baris 64–68): detect module dari path — dipindah ke dalam `openPrimaryTab` di store
- `useEffect` #3 (baris 70–120): buka tab dari perubahan `location.pathname` — ini yang paling krusial dihapus; inilah yang membuat router menjadi sumber kebenaran

**Tambah:**
```ts
// Satu efek pengganti: router mengikuti active secondary tab
useEffect(() => {
  const tab = getActiveSecondaryTab()
  const targetPath = tab?.path ?? getActivePrimaryTab()?.path ?? '/'
  if (location.pathname !== targetPath) {
    navigate(targetPath, { replace: true })
  }
}, [activePrimaryTabId, activeSecondaryTabId])
```

**Hapus import:** `useLocation` tidak lagi dibutuhkan untuk logika tab.

---

### `src/components/shared/layout/RibbonPanel.tsx`

**Tujuan:** Ribbon hanya update Zustand — tidak memanggil navigate().

**Hapus:**
- `import { useNavigate } from 'react-router-dom'` (baris 1)
- `const navigate = useNavigate()` (baris 51)
- `navigate(item.path)` di `handleItemClick` (baris 88)

**Tidak berubah:** `openPrimaryTab({...})` tetap ada — ini yang mendriving konten via AppShell.

---

### `src/components/shared/layout/PrimaryTabs.tsx`

**Tujuan:** Tab click hanya update Zustand — konten ikut karena AppShell bereaksi pada perubahan state.

**Hapus:**
- `import { useNavigate } from 'react-router-dom'` (baris 1)
- `const navigate = useNavigate()` (baris 11)
- `navigate(pathForPrimaryTab(tabId))` di `activateTab` (baris 37)
- `navigate(fallbackTab ? pathForPrimaryTab(fallbackTab.id) : '/')` di `closeTab` (baris 49)
- Fungsi `pathForPrimaryTab` tidak lagi dibutuhkan di sini — dipindah ke AppShell atau store

**Tidak berubah:** `setActivePrimaryTab(tabId)` dan `closePrimaryTab(tabId)` tetap ada.

---

### `src/components/shared/layout/SecondaryTabs.tsx`

**Tujuan:** Secondary tab click hanya update Zustand.

**Hapus:**
- `import { useNavigate } from 'react-router-dom'` (baris 1)
- `const navigate = useNavigate()` (baris 11)
- `navigate(path)` di `activateTab` (baris 31)
- `navigate(fallbackTab.path)` di `closeTab` (baris 46)

**Tidak berubah:** `setActiveSecondaryTab(...)` dan `closeSecondaryTab(...)` tetap ada.

---

### `src/stores/useTabStore.ts`

**Tujuan:** Tidak ada perubahan struktural. Tambah satu selector helper untuk AppShell:

**Tambah:**
```ts
// Helper: kembalikan path yang seharusnya dirender sekarang
getActiveContentPath: () => {
  const { activePrimaryTabId, primaryTabs, secondaryTabs, activeSecondaryTabId } = get()
  if (!activePrimaryTabId || activePrimaryTabId === 'dashboard') return '/'
  const activeSecId = activeSecondaryTabId[activePrimaryTabId]
  const activeSec = (secondaryTabs[activePrimaryTabId] ?? []).find((t) => t.id === activeSecId)
  const activePrimary = primaryTabs.find((t) => t.id === activePrimaryTabId)
  return activeSec?.path ?? activePrimary?.path ?? '/'
}
```

---

## File yang Tidak Berubah

| File | Alasan |
|------|--------|
| `src/router/index.tsx` | `createMemoryRouter` sudah benar; routes tetap dipakai untuk rendering |
| `src/router/moduleConfig.ts` | Path di sini tetap dipakai sebagai identifier tab dan label |
| `src/components/shared/layout/Topbar.tsx` | Topbar hanya memanggil `setActiveModule()` + `openRibbon()` — tidak ada `navigate()` untuk konten |

---

## File yang Ditambahkan

Tidak ada file baru. Refactor ini murni perubahan pada file existing.

---

## Urutan Pengerjaan

```
1. Tambah getActiveContentPath() di useTabStore.ts
2. Refactor AppShell.tsx — hapus 3 useEffect, tambah 1 efek baru
3. Refactor RibbonPanel.tsx — hapus navigate()
4. Refactor PrimaryTabs.tsx — hapus navigate()
5. Refactor SecondaryTabs.tsx — hapus navigate()
6. tsc --noEmit --skipLibCheck  ← 0 error
7. Manual test semua skenario:
   - Ribbon klik → konten berubah ✓
   - Primary tab switch → konten berubah ✓
   - Secondary tab switch → konten berubah ✓
   - Tutup tab → fallback ke tab sebelumnya ✓
   - Reload halaman → tab state restore dari sessionStorage ✓
   - Navigasi form (create/edit) → secondary tab terbuka ✓
```

**Status implementasi:** ⏳ Ditangguhkan — dikerjakan setelah Design-I2 Phase 1–4 selesai.

---

---

# Design-I2 — Reports Navigation Restructure

**Prasyarat**: Phase 36 selesai ✅ (2026-06-28)
**Status**: ⏳ Belum mulai

Design-I2 adalah langkah awal menuju tujuan gap-11 di atas — merapikan struktur navigasi
modul Reports. Ini bukan penyelesaian gap-11, tapi berkontribusi ke arahnya.

---

## Keputusan Desain (sesi 2026-06-28)

| # | Topik | Keputusan |
|---|-------|-----------|
| 1 | Rekonsiliasi | **Opsi A** — ribbon direct link ke `/reports/reconciliation` (bypass category page); ReconciliationPage tetap pakai 6 tab internal |
| 2 | Domain Keuangan | Isi: Neraca, Laba Rugi, Arus Kas, Ringkasan Keuangan — **tanpa Neraca Saldo** |
| 3 | Neraca Saldo | Ada di domain Buku Besar saja (tidak duplikat ke Keuangan) |
| 4 | Shortcut ribbon | Ditangguhkan |
| 5 | Fixed Assets | Halaman read-only di modul Reports (`/reports/fixed-assets/*`), bukan cross-module ke `/fixed-assets` |
| 6 | Kategori coming soon | Tetap ditampilkan di domain panel (Sales, Purchase, Tax) |

### Pola navigasi baru

```
SEBELUM: 12 ribbon item → langsung ke halaman laporan (1 klik)

SESUDAH: ~10 ribbon item kategori → ReportCategoryPage → klik card → halaman laporan (2 klik)
         [Kecuali Rekonsiliasi: tetap 1 klik langsung ke ReconciliationPage]
```

### Domain yang ada di ribbon

| id | Label | Path | Catatan |
|----|-------|------|---------|
| `financial` | Keuangan | `/reports/financial` | category page |
| `gl` | Buku Besar | `/reports/gl` | category page |
| `sales` | Penjualan | `/reports/sales` | category page (semua coming soon dulu) |
| `purchase` | Pembelian | `/reports/purchase` | category page (semua coming soon dulu) |
| `ar` | Piutang | `/reports/ar` | category page |
| `ap` | Hutang | `/reports/ap` | category page |
| `reconciliation` | Rekonsiliasi | `/reports/reconciliation` | **direct ke ReconciliationPage** |
| `inventory` | Persediaan | `/reports/inventory` | category page |
| `fixed-assets` | Aktiva Tetap | `/reports/fixed-assets` | category page |
| `cash-bank` | Kas & Bank | `/reports/cash-bank` | category page |

---

## Phase 1 — Data Kategori + Infrastruktur Navigasi

**Tujuan:** Bangun "backbone" navigasi — konstanta domain, komponen grid card, halaman
category, dan redirect dari `/reports` ke kategori default. Setelah phase ini URL
`/reports/financial` sudah bisa diakses meski ribbon belum diubah.

### Baca Dulu

| File | Baris | Alasan |
|------|-------|--------|
| `src/modules/reports/pages/ReportIndexPage.tsx` | 1–64 | Pahami struktur yang akan diganti menjadi redirect |
| `src/modules/reports/routes.tsx` | 1–39 | Pahami urutan route existing sebelum tambah `:categoryPath` di akhir |

### Tambah (file baru)

**`src/modules/reports/constants/reportCategories.ts`**

Single source of truth untuk semua domain dan laporan. Interface:
```ts
interface ReportEntry  { id, title, description, path, permission?, comingSoon? }
interface ReportDomain { id, label, categoryPath, reports: ReportEntry[] }
```
Export: `REPORT_DOMAINS`, `DOMAIN_BY_PATH`, `DEFAULT_DOMAIN = 'financial'`

Domain `financial`: Neraca, Laba Rugi, Arus Kas, Ringkasan Keuangan (**tanpa Neraca Saldo**)
Domain `gl`: Buku Besar, Neraca Saldo, Buku Besar per Akun
Domain `fixed-assets`: path mengarah ke `/reports/fixed-assets/*` (bukan `/fixed-assets/reports/*`)

---

**`src/modules/reports/components/ReportDomainPanel.tsx`**

Props: `{ domainId: string }`. Render grid card laporan untuk satu domain.
Card yang `comingSoon: true` dirender dengan `opacity-50 cursor-not-allowed` dan badge "Segera".
Card aktif navigasi ke `report.path` via `useNavigate`.

---

**`src/modules/reports/pages/ReportCategoryPage.tsx`**

Route: `/reports/:categoryPath`. Baca `categoryPath` dari `useParams`, lookup domain
via `DOMAIN_BY_PATH`, render `<WorkspaceLayout>` + `<ReportDomainPanel>`.
Jika domain tidak ditemukan: pesan "Kategori tidak ditemukan".

### Ubah (file existing)

| File | Baris | Perubahan |
|------|-------|-----------|
| `src/modules/reports/pages/ReportIndexPage.tsx` | 1–64 (ganti semua) | Ganti seluruh isi dengan `useEffect(() => navigate('/reports/financial', { replace: true }), [])` — return `null` |
| `src/modules/reports/routes.tsx` | baris 6–18 (lazy imports) | Tambah `const ReportCategoryPage = lazy(...)` |
| `src/modules/reports/routes.tsx` | baris 39 (akhir array) | Tambah `{ path: '/reports/:categoryPath', element: wrap(<ReportCategoryPage />) }` — **wajib paling akhir** |

⚠️ Route `:categoryPath` harus selalu di posisi paling akhir array `reportsRoutes`.
Semua route spesifik (`/reports/trial-balance`, dll.) di atas baris ini akan tetap berfungsi.

### Tracking Phase 1

- [ ] `reportCategories.ts` dibuat
- [ ] `ReportDomainPanel.tsx` dibuat
- [ ] `ReportCategoryPage.tsx` dibuat
- [ ] `ReportIndexPage.tsx` diganti menjadi redirect
- [ ] `routes.tsx` diperbarui (import + route `:categoryPath`)
- [ ] `tsc --noEmit --skipLibCheck` 0 error
- [ ] Manual: `/reports` → redirect ke `/reports/financial` ✓
- [ ] Manual: `/reports/gl` → domain panel Buku Besar tampil ✓
- [ ] Manual: `/reports/financial` → 4 card (tanpa Neraca Saldo) ✓
- [ ] Manual: klik card aktif → halaman laporan muncul ✓
- [ ] Manual: `/reports/nonexistent` → pesan "Kategori tidak ditemukan" ✓

---

## Phase 2 — Ribbon Update

**Tujuan:** Ganti 12 ribbon item individual menjadi 10 item kategori di `moduleConfig.ts`.
Setelah phase ini user bisa klik ribbon → category page → pilih laporan.

### Baca Dulu

| File | Baris | Alasan |
|------|-------|--------|
| `src/router/moduleConfig.ts` | 1–12 (imports) | Cek icon yang sudah ada sebelum tambah import baru |
| `src/router/moduleConfig.ts` | 130–147 (reports ribbonItems) | Ini blok yang akan diganti seluruhnya |

### Icon yang dibutuhkan (semua sudah ada di import baris 1–12)

`BarChart3` · `BookMarked` · `TrendingUp` · `TrendingDown` · `Clock` ·
`RefreshCcw` · `Package` · `Building2` · `Landmark` — tidak perlu tambah import baru.

### Ubah

| File | Baris | Perubahan |
|------|-------|-----------|
| `src/router/moduleConfig.ts` | 133–146 (isi `ribbonItems` reports) | Ganti 12 item → 10 item kategori sesuai tabel domain di atas |

Ribbon item Rekonsiliasi:
```ts
{ id: 'reconciliation', label: 'Rekonsiliasi', icon: RefreshCcw,
  path: '/reports/reconciliation',   // ← tetap direct ke halaman, bukan category
  permission: 'reports.view' }
```

### Tracking Phase 2

- [ ] `moduleConfig.ts` ribbonItems diperbarui (12 → 10 item)
- [ ] Rekonsiliasi tetap direct link ke `/reports/reconciliation`
- [ ] `tsc --noEmit --skipLibCheck` 0 error
- [ ] Manual: klik "Keuangan" di ribbon → `/reports/financial` terbuka ✓
- [ ] Manual: klik "Rekonsiliasi" di ribbon → ReconciliationPage langsung (bukan domain panel) ✓
- [ ] Manual: klik "Buku Besar" → domain panel dengan Neraca Saldo ada ✓
- [ ] Manual: klik card "Neraca Saldo" di domain Buku Besar → TrialBalancePage ✓
- [ ] Manual: klik "Penjualan" → domain panel dengan semua card "Segera" ✓

---

## Phase 3 — Cash Bank Statement Page

**Tujuan:** Surface endpoint `/cash-bank/reports/account-statement` yang sudah ada di
backend tapi belum ada halaman frontend. Setelah phase ini domain Kas & Bank menampilkan
laporan aktif pertamanya.

### Baca Dulu

| File | Baris | Alasan |
|------|-------|--------|
| `src/modules/reports/routes.tsx` | 1–39 | Posisi tambah route baru (sebelum `:categoryPath`) |
| `src/modules/reports/components/ReportFilterParameter.tsx` | semua | Pahami prop yang tersedia (mode `range`) |
| `app/Http/Controllers/Api/CashBank/CashBankReportController.php` | semua | Shape response & param yang diterima |

### Tambah

1. Type `AccountStatementLine` + `AccountStatementReport` di `reports.types.ts`
2. Method `reportsApi.cashBankStatement(params)` di `reportsApi.ts` (termasuk adapter)
3. `src/modules/reports/pages/CashBankStatementPage.tsx` — filter tanggal + summary cards + DataTable

### Ubah

| File | Baris | Perubahan |
|------|-------|-----------|
| `src/modules/reports/routes.tsx` | lazy imports + routes array | Tambah lazy import + route `/reports/account-statement` sebelum `:categoryPath` |
| `src/modules/reports/constants/reportCategories.ts` | domain `cash-bank` | Hapus `comingSoon: true` dari entry `account-statement` |

### Tracking Phase 3

- [ ] Type + adapter `cashBankStatement` dibuat
- [ ] `CashBankStatementPage.tsx` dibuat
- [ ] `routes.tsx` diperbarui
- [ ] `reportCategories.ts` diperbarui (hapus comingSoon)
- [ ] `tsc --noEmit --skipLibCheck` 0 error
- [ ] Manual: `/reports/cash-bank` → card "Mutasi Rekening" tampil tanpa badge "Segera" ✓
- [ ] Manual: klik card → halaman Mutasi Rekening dengan filter + DataTable ✓

---

## Phase 4 — Fixed Assets Report Pages

**Tujuan:** Buat 4 halaman laporan Aktiva Tetap yang read-only di dalam modul Reports.
User tidak berpindah modul. Backend endpoint sudah ada — ini pekerjaan frontend saja.

### Parameter Backend (dari `FixedAssetReportController.php` baris 1–71)

| Endpoint | Parameter | Format | Wajib |
|----------|-----------|--------|-------|
| `GET /fixed-assets/reports/register` | `as_of_period` | `Y-m` (bulan) | Ya |
| `GET /fixed-assets/reports/depreciation` | `period_from`, `period_to`, `mode` | `Y-m`, `Y-m`, `detail\|yearly_summary` | `period_to` wajib |
| `GET /fixed-assets/reports/disposals` | `disposal_date_from`, `disposal_date_to` | `Y-m-d` | Tidak |
| `GET /fixed-assets/reports/reconciliation` | `as_of_period` | `Y-m` (bulan) | Ya |

⚠️ Register dan Reconciliation memakai format **bulan** (`Y-m`), bukan tanggal penuh.
`ReportFilterParameter` belum support `<input type="month">`. Tangani inline per halaman
dengan `<input type="month">` biasa, atau extend `ReportFilterParameter` dengan `mode="month"`.

### Baca Dulu

| File | Baris | Alasan |
|------|-------|--------|
| `app/Http/Controllers/Api/FixedAssets/FixedAssetReportController.php` | 1–71 | Sudah dibaca — param sudah diketahui |
| `app/Services/FixedAssets/FixedAssetReportService.php` | semua | **Wajib baca** — pahami shape response sebelum buat types & adapter |
| `src/modules/reports/components/ReportFilterParameter.tsx` | semua | Pahami prop yang ada sebelum putuskan extend atau bypass |
| `src/modules/reports/routes.tsx` | 1–39 | Posisi tambah 4 route baru |

### Tambah

1. Types untuk 4 response shape di `reports.types.ts`
2. 4 method adapter di `reportsApi.ts`
3. `src/modules/reports/pages/FixedAssetRegisterReportPage.tsx` — filter: bulan tunggal
4. `src/modules/reports/pages/FixedAssetDepreciationReportPage.tsx` — filter: range bulan + toggle mode
5. `src/modules/reports/pages/FixedAssetDisposalsReportPage.tsx` — filter: range tanggal (bisa pakai ReportFilterParameter biasa)
6. `src/modules/reports/pages/FixedAssetReconciliationReportPage.tsx` — filter: bulan tunggal

### Ubah

| File | Baris | Perubahan |
|------|-------|-----------|
| `src/modules/reports/routes.tsx` | lazy imports + routes array | Tambah 4 lazy import + 4 route `/reports/fixed-assets/*` sebelum `:categoryPath` |
| `src/modules/reports/constants/reportCategories.ts` | domain `fixed-assets` | Ganti path dari `/fixed-assets/reports/*` → `/reports/fixed-assets/*`; hapus `comingSoon` |

### Tracking Phase 4

- [ ] Baca `FixedAssetReportService.php` — catat shape response tiap endpoint
- [ ] Types + adapters 4 endpoint dibuat
- [ ] `FixedAssetRegisterReportPage.tsx` dibuat
- [ ] `FixedAssetDepreciationReportPage.tsx` dibuat
- [ ] `FixedAssetDisposalsReportPage.tsx` dibuat
- [ ] `FixedAssetReconciliationReportPage.tsx` dibuat
- [ ] `routes.tsx` diperbarui (4 route baru)
- [ ] `reportCategories.ts` diperbarui (path + hapus comingSoon)
- [ ] `tsc --noEmit --skipLibCheck` 0 error
- [ ] Manual: `/reports/fixed-assets` → 4 card, tidak ada badge "Segera" ✓
- [ ] Manual: klik setiap card → halaman masing-masing muncul, modul tidak berpindah ✓

---

## Tracking Keseluruhan Design-I2

| Phase | Status | Catatan |
|-------|--------|---------|
| Phase 1 — Navigasi Core | ⏳ Belum mulai | |
| Phase 2 — Ribbon Update | ⏳ Belum mulai | Bergantung pada Phase 1 |
| Phase 3 — Cash Bank Statement | ⏳ Belum mulai | Independen dari Phase 1–2 |
| Phase 4 — Fixed Assets Reports | ⏳ Belum mulai | Wajib baca FixedAssetReportService dulu |

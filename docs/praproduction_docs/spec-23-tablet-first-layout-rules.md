# spec-23-tablet-first-layout-rules.md — Tablet-First Layout Rules

**Produk:** Seaside Escape ERP Frontend  
**Tanggal:** 2026-06-14  
**Status:** Canonical addendum untuk responsive, shell, scroll, dan viewport tablet  
**Berlaku untuk:** semua page shell, dashboard, workspace list, form transaksi, reports, settings, overlay, dan navigation

---

## 1. Tujuan Dokumen

Dokumen ini menutup gap audit desain tablet-first dan menjadi satu sumber kebenaran untuk membangun ERP frontend yang:

- small-screen friendly;
- tetap desktop-like pada tablet landscape;
- tidak berubah menjadi mobile card stack pada 1024px ke atas;
- tidak menimbulkan double scroll, clipped content, atau fixed bar overlap;
- konsisten antara dashboard, workspace list, form, settings, dan reports.

Dokumen ini melengkapi, bukan mengganti:

- `spec-04-design-tokens.md`
- `spec-05-layout-and-navigation.md`
- `spec-06-responsive-rules.md`
- `spec-08-form-architecture.md`
- `spec-09-table-and-list.md`
- `spec-16-reports-module.md`
- `spec-20-dashboard.md`
- semua `design-*.md`

Jika ada konflik, aturan di dokumen ini menang untuk hal berikut:

1. viewport tablet landscape;
2. shell height math;
3. root scroll model;
4. fixed bottom bar height;
5. desktop view behavior pada tablet landscape.

> **Data viewport**: riset browser UI tax, safe visible estimates, dan matrix test terintegrasi dari `spec-25-viewport-list.md` (riset 2026-06-14). Angka-angka di §3.1–3.3 dan §10 bersumber dari dokumen tersebut.

---

## 2. Prinsip Utama

### 2.1 Tablet Landscape adalah Target Utama

Primary viewport target adalah **tablet landscape 1024px ke atas**.

ERP ini tidak boleh didesain hanya untuk desktop besar. Desktop besar adalah perluasan dari tablet landscape, bukan baseline utama.

### 2.2 Desktop-Like, Bukan Mobile Reflow

Pada viewport `>= 1024px`:

- dashboard tetap dashboard desktop;
- topbar tetap topbar desktop;
- ribbon tetap ribbon desktop bila page membutuhkan ribbon;
- table tetap table, bukan card list;
- form tetap form desktop compact, bukan wizard mobile;
- sidebar dapat compact/collapse, tetapi tidak berubah menjadi drawer mobile kecuali viewport `< 768px`.

### 2.3 Compact Scaling, Bukan Reflow Agresif

Untuk tablet landscape, gunakan strategi:

1. kurangi padding;
2. pakai compact row height;
3. batasi tinggi widget;
4. gunakan internal scroll yang jelas;
5. gunakan horizontal scroll terkontrol untuk table/ribbon;
6. collapse widget sekunder bila perlu.

Jangan memakai strategi:

- mengubah table menjadi card;
- memecah form menjadi mobile stack panjang;
- membuat page-level vertical scroll tanpa batas;
- membiarkan fixed bar menutup content.

---

## 3. Viewport Baseline Wajib

Semua layout utama wajib diuji pada viewport berikut:

| Viewport | Nama | Status | Catatan |
|---|---:|---|---|
| 1024×768 | Tablet landscape minimum | Wajib | Baseline paling ketat |
| 1173×~550 | Short landscape (MatePad-class) | Wajib | dvh ~550px setelah browser chrome ~90px |
| 1180×820 | Tablet landscape modern | Wajib | iPad landscape class |
| 1280×800 | Small laptop / tablet large | Wajib | Density umum |
| 1366×768 | Short desktop | Wajib | Tinggi sama ketat dengan tablet |
| 1440×900 | Desktop normal | Wajib | Expansion behavior |
| 768×1024 | Tablet portrait | Sekunder | Boleh lebih compact, bukan target utama dashboard desktop |
| <768 width | Mobile | Terpisah | Gunakan mobile navigation rules |

### Catatan MatePad-class viewport

Beberapa tablet Android landscape memiliki browser chrome yang memakan ~80–90px dari tinggi layar fisik. Dengan layar fisik 640px dan chrome ~90px, `100dvh` menjadi **~550px** — lebih pendek 130px dari baseline `1024×768`.

Semua layout yang memakai `h-screen` atau `min-h-screen` **wajib diganti ke `h-dvh` / `min-h-dvh`** agar benar mengacu dynamic viewport (menyesuaikan chrome browser yang muncul/hilang).

Acceptance untuk 1024×768:

- Topbar terlihat penuh.
- Ribbon overlay tidak menutup Primary Tabs saat muncul.
- Primary tabs dan secondary tabs tidak tertutup.
- Content tidak tertutup bottom bar.
- Dashboard masih terbaca sebagai desktop dashboard.
- Workspace table tidak memaksa page horizontal overflow.
- Form action bar tetap terlihat.
- Dialog, dropdown, toast tidak keluar viewport.

Acceptance tambahan untuk short landscape (dvh ≤ 620px):

- Tidak ada vertical scroll di luar scroll region yang ditentukan.
- Login page fit-to-screen tanpa scroll (lihat §7.3).
- Ilustrasi dekoratif tersembunyi.
- Padding panel dan card berkurang ke compact tier.
- Form fields dan tombol tetap fully accessible.

### 3.1 Browser Priority

Urutan prioritas pengujian berdasarkan market share May 2026:

1. **Chrome Android / Chrome tablet** — 66.41% global share
2. **Safari iPadOS / iOS** — 25.25%
3. **Samsung Internet Android** — 2.44%
4. **Chrome iOS** (WebKit-based)
5. **Firefox Android/iOS** — secondary smoke test
6. **Edge, Opera, UC** — secondary smoke test

### 3.2 Browser UI Tax per Device Class

Estimasi budget konservatif vertical space yang dikonsumsi browser UI (address bar, toolbar, tab bar):

| Device class | Browser | UI tax saat visible |
|---|---|---:|
| Android tablet landscape | Chrome Android | 64–120px |
| Android tablet landscape | Samsung Internet | 80–128px |
| iPad landscape | Safari iPadOS | 64–112px |
| iPad landscape | Chrome / Firefox (iPadOS) | 80–128px |
| Laptop 1366×768 | Chrome / Edge / Firefox | 72–120px |
| PWA standalone / fullscreen | Semua platform | 0px (safe-area only) |

**Implikasi desain:**

- Baseline `1024×768` di browser mode realistis bisa turun ke **1024×656–704px** (dvh).
- Jangan hanya test di viewport ideal (fullscreen/PWA) — test juga saat address bar visible.
- Mode PWA standalone direkomendasikan untuk deployment tablet ERP operasional.

### 3.3 Realistic Test Viewports — Browser Mode

Test matrix wajib untuk tablet landscape **saat address bar browser terlihat**:

| Viewport (browser mode) | Dasar device | Work area setelah bottom bar 56px |
|---|---|---:|
| 1024×656 | iPad 9.7 / browser | ~600px |
| 1024×704 | iPad 9.7 / browser (chrome minimal) | ~648px |
| 1133×632 | iPad mini 8.3 / browser | ~576px |
| 1180×708 | iPad 10 / Air 10.9 / browser | ~652px |
| 1205×625 | Galaxy Tab S9 / browser | ~569px |
| 1280×680 | Android tablet 10" / browser | ~624px |
| 1366×648 | Laptop kecil / browser | ~592px |

**Kesimpulan:** Layout wajib usable pada area kerja **~600px** (worst-case tablet landscape browser mode). DataTable, FormLayout, dan Dashboard tidak boleh memaksa page-level scroll pada kondisi ini.

Phone portrait smoke test (sekunder — bukan target utama):

| Viewport | Catatan |
|---|---|
| 360×640 | Minimum phone |
| 390×716 | iPhone base class, browser mode |
| 412×787 | Pixel / Samsung flagship, browser mode |

---

## 4. Canonical Shell Tokens

Semua height shell harus merujuk ke token berikut.

| Token | Nilai | Keterangan |
|---|---:|---|
| `--shell-topbar-h` | `52px` | Topbar fixed |
| `--shell-ribbon-h` | `64px` | Ribbon overlay height |
| `--shell-ribbon-z` | `60` | Ribbon overlay z-index |
| `--shell-primary-tabs-h` | `36px` | Module primary tabs |
| `--shell-secondary-tabs-h` | `32px` | Page secondary tabs |
| `--shell-bottom-bar-h` | `56px` | Fixed bottom bar canonical |
| `--shell-content-gap` | `16px` | Breathing room tablet/desktop |
| `--shell-content-gap-compact` | `12px` | Breathing room viewport pendek |
| `--shell-safe-bottom` | `env(safe-area-inset-bottom, 0px)` | Safe area bawah |

### 4.1 Keputusan Bottom Bar

Nilai canonical fixed bottom bar adalah **56px**.

Semua dokumen yang masih menyebut `60px` harus dianggap outdated dan perlu disinkronkan ke `56px`.

### 4.2 CSS Variable Rekomendasi

```css
:root {
  --shell-topbar-h: 52px;
  --shell-ribbon-h: 64px;
  --shell-ribbon-z: 60;
  --shell-primary-tabs-h: 36px;
  --shell-secondary-tabs-h: 32px;
  --shell-bottom-bar-h: 56px;
  --shell-content-gap: 16px;
  --shell-content-gap-compact: 12px;
}
```

### 4.3 Unit Wajib: `dvh` bukan `vh`

Semua height berbasis viewport wajib memakai `dvh` (dynamic viewport height), bukan `vh`.

```css
/* ❌ Jangan pakai */
height: 100vh;
min-height: 100vh;

/* ✅ Wajib */
height: 100dvh;
min-height: 100dvh;
```

`dvh` menyesuaikan dengan browser chrome yang muncul/hilang — penting untuk tablet Android dan mobile Safari. `vh` menggunakan tinggi penuh layar dan mengabaikan chrome, sehingga content terpotong di device dengan chrome besar.

Di Tailwind: gunakan `h-dvh` dan `min-h-dvh`. Kelas `h-screen` (= `height: 100vh`) **tidak boleh** dipakai untuk root layout page.

---

## 5. Canonical Shell Height Formula

### 5.1 Workspace List

Workspace list dengan ribbon overlay:

```text
occupiedTop = topbar + primaryTabs + secondaryTabs + contentGap
            = 52 + 36 + 32 + 16
            = 136px
```

Content height:

```text
contentHeight = 100dvh - occupiedTop
```

Pada `1024×768`, content height = `632px`.
Ribbon adalah overlay dan tidak masuk perhitungan `occupiedTop`.

### 5.3 Form View dengan Bottom Bar

Form view tanpa ribbon visual, dengan fixed bottom bar:

```text
occupiedTop = topbar + primaryTabs + secondaryTabs + contentGap
            = 52 + 36 + 32 + 16
            = 136px

occupiedBottom = bottomBar + safeBottom
               = 56px + safeBottom

formContentHeight = 100dvh - occupiedTop - occupiedBottom
```

Pada `1024×768`, form content height = `576px` sebelum safe area.

### 5.4 Dashboard View

Dashboard memakai Primary Tabs pinned tanpa Secondary Tabs:

```text
occupiedTop = topbar + primaryTabs + contentGap
            = 52 + 36 + 16
            = 104px
dashboardContentHeight = 100dvh - occupiedTop
```

### 5.5 Reports / Settings View

Reports dan settings mengikuti workspace shell. Ribbon tetap overlay jika module/ribbon
dibuka dari Topbar.

```text
occupiedTop = 52 + 36 + 32 + 16 = 136px
```

---

## 6. Root Scroll Model

### 6.1 Root Shell

Pastikan `html`, `body`, dan `#root` tidak menjadi scroll container:

```css
html,
body,
#root {
  height: 100%;
  overflow: hidden;
}
```

Root application shell wajib:

```css
height: 100dvh;
overflow: hidden;
```

`body` dan root app tidak boleh menjadi scroll container utama untuk workspace/form/dashboard.

### 6.2 Scroll Region

Scroll hanya boleh terjadi pada region berikut:

| Page type | Scroll region utama | Fixed region |
|---|---|---|
| Dashboard | dashboard content viewport | topbar, tabs |
| Workspace list | table body atau workspace content region | topbar, ribbon, tabs, pagination jika sticky |
| Form | form body region | topbar, tabs, bottom action bar |
| Reports | report content / preview body | topbar, tabs, filter header |
| Settings | settings content body | topbar, tabs, side nav jika sticky |
| Overlay | overlay body bila konten tinggi | overlay footer |

### 6.3 Larangan

Dilarang:

- double vertical scroll di shell + content;
- bottom bar ikut scroll keluar viewport;
- toast menutup CTA utama;
- dropdown melewati viewport atau tertutup bottom bar;
- table pagination jatuh jauh di bawah fold tanpa akses cepat;
- form submit button hanya muncul setelah page scroll panjang.

---

## 7. Density Rules

### 7.1 Tablet Landscape Density

Untuk `1024px <= width < 1280px`:

| Elemen | Tablet value |
|---|---:|
| Page padding X | `16px` |
| Page padding Y | `12px` atau `16px` |
| Card padding | `12px` |
| Table row height | `36px` |
| Input height | `34px` |
| Button height | `34px` untuk dense, `36px` default |
| KPI card min height | `76px` |
| Chart height | `160px–180px` |
| Section gap | `12px` |

### 7.2 Short Viewport Density

Untuk height `<= 768px` (dvh):

- gunakan `--shell-content-gap-compact: 12px`;
- batasi chart height ke `160px` bila diperlukan;
- batasi activity list max-height;
- table body wajib internal scroll bila rows melebihi available height;
- form sections dapat memiliki compact vertical spacing;
- ribbon tetap 64px dan tidak boleh menjadi 2 row.

### 7.3 Ultra-Short Viewport — Auth Page (dvh ≤ 620px)

Berlaku untuk halaman auth (Login, Company Picker) yang berada di luar AppShell.

**Trigger:** `@media (max-height: 620px)` — menargetkan MatePad-class dan device serupa dengan browser chrome besar.

#### Login Page compact rules

| Elemen | Normal (dvh > 620px) | Compact (dvh ≤ 620px) |
|---|---|---|
| Root container | `h-dvh flex` | `min-h-dvh flex` (allow natural height, no overflow) |
| Left panel: ilustrasi | `block` | `hidden` |
| Left panel: padding Y | `p-10` | `py-4 px-8` |
| Left panel: logo margin-bottom | `mb-8` | `mb-4` |
| Left panel: feature list gap | `gap-5` | `gap-3` |
| Left panel: feature icon | `w-7 h-7` | `w-5 h-5` |
| Right panel: padding | `p-10` | `p-4` |
| Form card: padding Y | `py-9` (36px) | `py-5` (20px) |
| Form card: padding X | `px-10` (40px) | `px-6` (24px) |
| Form card: heading size | `text-[22px]` | `text-[18px]` |
| Form card: heading margin | `mb-1.5` | `mb-1` |
| Form card: sub-heading margin | `mb-7` | `mb-4` |
| Form fields: gap | `space-y-4` | `space-y-3` |
| Form button: margin-top | `mt-2` | `mt-1` |
| "Lupa password" text | `mt-6` | `mt-3` |

**Implementasi Tailwind:**

Tailwind tidak memiliki built-in height breakpoint. Gunakan arbitrary variant:

```tsx
// Contoh: ilustrasi — tampil di md ke atas, hidden di max-height compact
className="hidden md:block [@media(max-height:620px)]:hidden"

// Contoh: padding card
className="py-9 px-10 [@media(max-height:620px)]:py-5 [@media(max-height:620px)]:px-6"
```

**Target hasil:** Layout login fit dalam dvh ~550px tanpa overflow, semua form fields, checkbox, dan tombol Masuk tetap accessible dan visible dalam single screen.

#### Company Picker compact rules

| Elemen | Normal (dvh > 620px) | Compact (dvh ≤ 620px) |
|---|---|---|
| Root container | `min-h-dvh` | `min-h-dvh` |
| Header padding Y | `py-4` | `py-2` |
| Content padding | `p-6` | `p-4` |
| Content justify | `justify-center` | `justify-start pt-6` |
| Heading margin | `mb-8` | `mb-4` |
| Heading font | `text-xl` | `text-base` |
| Grid gap | `gap-4` | `gap-2` |
| Grid margin | `mb-8` | `mb-4` |
| Grid scroll | — | `max-h-[260px] overflow-y-auto` |
| Company card padding | `p-5` | `p-3` |
| Company icon size | `w-12 h-12` | `w-9 h-9` |

---

### 7.4 Canonical Height Rules — Semua Halaman

Berlaku untuk **semua halaman** di aplikasi ini — standalone (auth, error, onboarding) maupun halaman dalam AppShell.

#### 7.4.1 Unit Wajib

| Situasi | Class wajib | Dilarang |
|---|---|---|
| Halaman harus mengisi penuh viewport | `h-dvh` | `h-screen` |
| Halaman bisa lebih tinggi tapi minimal penuh | `min-h-dvh` | `min-h-screen` |
| Elemen tinggi berbasis viewport | `calc(100dvh - Xpx)` | `calc(100vh - Xpx)` |
| Root AppShell | `h-dvh overflow-hidden` | `min-h-screen` atau `h-screen` |

`h-screen` dan `min-h-screen` menggunakan `100vh` yang **mengabaikan browser chrome** pada tablet/mobile. Hasilnya halaman melebar melebihi area terlihat → scroll vertikal tidak diinginkan.

#### 7.4.2 Compact Mode Wajib untuk Halaman Standalone

Setiap halaman standalone (berada di luar AppShell) WAJIB punya compact mode untuk `@media (max-height: 620px)`.

**Checklist minimum compact mode:**

```
✅ Kurangi padding vertikal (py-*) pada semua section utama
✅ Kurangi margin antar section heading/content
✅ Sembunyikan elemen dekoratif (ilustrasi, hero image, dsb.)
✅ Kurangi font-size heading (bukan body text)
✅ Jika konten bisa overflow (list panjang): tambah max-height + overflow-y-auto pada area list
✅ Pastikan CTA utama (tombol submit/pilih/next) tetap visible tanpa scroll
```

**Template implementasi Tailwind:**

```tsx
// Root halaman standalone
<div className="min-h-dvh bg-[#EFEFED] flex flex-col">

  {/* Header yang bisa dikompres */}
  <header className="py-4 [@media(max-height:620px)]:py-2 flex-shrink-0">
    ...
  </header>

  {/* Content area */}
  <div className="flex-1 flex flex-col items-center justify-center p-6
                  [@media(max-height:620px)]:p-4
                  [@media(max-height:620px)]:justify-start
                  [@media(max-height:620px)]:pt-4">

    {/* Elemen dekoratif — selalu hidden di compact */}
    <img className="block [@media(max-height:620px)]:hidden" ... />

    {/* Heading dengan margin compact */}
    <h1 className="text-xl mb-8 [@media(max-height:620px)]:text-base [@media(max-height:620px)]:mb-4">
      ...
    </h1>

    {/* List dengan cap tinggi di compact */}
    <div className="gap-4 mb-8
                    [@media(max-height:620px)]:gap-2
                    [@media(max-height:620px)]:mb-4
                    [@media(max-height:620px)]:max-h-[280px]
                    [@media(max-height:620px)]:overflow-y-auto">
      ...
    </div>

    {/* CTA selalu visible */}
    <button className="...">Submit</button>
  </div>
</div>
```

#### 7.4.3 Compact Mode untuk Halaman dalam AppShell

Halaman dalam AppShell (dashboard, workspace, form) sudah terlindungi oleh `h-dvh overflow-hidden` root AppShell. Yang perlu diperhatikan:

- Jangan buat konten yang membutuhkan page-level scroll — AppShell root sudah `overflow-hidden`
- Scroll hanya boleh di scroll region yang ditentukan (§6.2)
- Untuk viewport pendek (dvh ≤ 620px), gunakan compact token `--shell-content-gap-compact: 12px`

#### 7.4.4 Trigger Breakpoint

```
@media (max-height: 620px)
```

Memilih 620px karena:
- MatePad 11 landscape: layar 640px − chrome ~90px = dvh ~550px ✓
- Samsung Galaxy Tab landscape (720px layar) − chrome: dvh ~630px → tidak trigger, tidak butuh compact ✓
- iPad mini 6 landscape (810px layar) − chrome: dvh ~720px → tidak trigger ✓
- Threshold aman: device yang trigger compact adalah device yang memang membutuhkannya

---

## 8. Layout Family Rules

### 8.1 Dashboard

Dashboard pada tablet landscape harus menampilkan:

1. KPI summary row;
2. pending action/alert summary;
3. minimal satu insight visual atau recent activity;
4. tanpa scroll panjang untuk membaca konteks utama.

Dashboard boleh vertical scroll, tetapi scroll tidak boleh menjadi cara utama untuk menemukan KPI dan pending action.

### 8.2 Workspace List

Workspace list harus:

- memakai table layout;
- memiliki horizontal scroll internal jika kolom lebar;
- menjaga sticky checkbox/number column;
- memakai sticky header bila body scroll internal aktif;
- menjaga pagination reachable.

### 8.3 Form Transaksi

Form transaksi harus:

- memiliki fixed bottom action bar 56px;
- memiliki form body scroll region;
- menghitung padding-bottom terhadap bottom bar;
- menjaga summary dan line items usable tanpa scroll berlebihan;
- tidak membuat submit/post/approve CTA hilang dari viewport.

### 8.4 Reports

Report page harus:

- memiliki filter area compact;
- preview/report body boleh scroll internal;
- export/print action selalu reachable;
- print preview tidak tergantung page-level scroll uncontrolled.

### 8.5 Settings

Settings page harus:

- memakai compact two-pane layout pada tablet landscape;
- side navigation tidak boleh terlalu lebar;
- form settings memakai section card dense;
- save action selalu terlihat atau sticky di section footer.

---

## 9. Sidebar Rules

Default filter sidebar width: `220px`.

Untuk viewport tablet sempit:

| Condition | Behavior |
|---|---|
| width >= 1280px | Sidebar expanded default |
| 1024px <= width < 1280px | Sidebar boleh expanded jika content min-width aman |
| content area < 760px | Sidebar auto-collapse diperbolehkan |
| user manually expands | State user menang sampai route/module berubah |
| width < 768px | Gunakan mobile behavior / drawer / bottom nav |

Sidebar collapse tidak boleh menghilangkan filter aktif. Filter aktif wajib tetap terlihat via chip/count di header workspace.

---

## 10. Overlay Collision Rules

Semua overlay harus collision-aware terhadap viewport, topbar, dan bottom bar.

| Komponen | Rule |
|---|---|
| Dropdown / Select | flip ke atas jika ruang bawah tidak cukup; `max-height: calc(100dvh - 160px)` sebagai fallback |
| Popover | max-height berbasis available viewport |
| Dialog | `max-height: calc(100dvh - 96px)`, internal scroll |
| Toast | offset bottom bertambah jika bottom bar visible |
| Command menu | centered, max-height aman |
| Calendar popover | collision boundary viewport content |

**FixedBottomBar** wajib menyertakan safe area inset untuk device dengan notch / home indicator:

```css
.fixed-bottom-bar {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

Di Tailwind: gunakan `pb-safe` jika plugin tersedia, atau tambahkan CSS variable `--shell-safe-bottom` dari §4.

---

## 11. Keyboard dan Focus Minimum

Semua interactive element wajib punya focus indicator yang terlihat.

Default focus visual:

```css
outline: none;
box-shadow: 0 0 0 3px rgba(92, 158, 173, 0.18);
border-color: #5c9ead;
```

Keyboard minimum:

- `Tab` berpindah antar interactive element secara logis.
- `Enter` menjalankan primary action pada focused button/link.
- `Space` toggle checkbox/switch.
- `Escape` menutup dropdown/popover/dialog yang boleh ditutup.
- Dialog destructive mengikuti behavior dialog masing-masing dan tidak boleh accidental dismiss jika destructive action.

---

## 12. Z-Index Canonical

| Layer | Z-index |
|---|---:|
| Content | 0 |
| Sticky table header | 20 |
| Sticky table column | 25 |
| Secondary tabs | 37 |
| Primary tabs | 38 |
| Bottom action bar | 40 |
| Topbar | 50 |
| Ribbon backdrop | 59 |
| Ribbon overlay | 60 |
| Dropdown / Popover | 70 |
| Dialog overlay | 80 |
| Dialog content | 90 |
| Toast | 100 |

Gunakan class arbitrary Tailwind yang valid untuk nilai non-default, misalnya `z-[45]`. Jangan memakai `z-45` kecuali sudah didaftarkan di Tailwind config.

---

## 13. Acceptance Checklist

Sebelum implementation dianggap selesai, cek:

- [ ] 1024×768 tidak memiliki horizontal overflow di root.
- [ ] 1180×820 tidak punya clipped bottom bar atau clipped dialog.
- [ ] 1280×800 tetap compact dan tidak terlalu kosong.
- [ ] Short landscape (dvh ~550px): login page fit tanpa vertical scroll.
- [ ] Short landscape (dvh ~550px): ilustrasi branding tersembunyi.
- [ ] Short landscape (dvh ~550px): form card padding compact, semua fields visible.
- [ ] Dashboard tetap desktop-like pada tablet landscape.
- [ ] Workspace table header tetap terbaca saat scroll.
- [ ] Pagination reachable tanpa page scroll panjang.
- [ ] Form action bar selalu terlihat.
- [ ] Dropdown dekat bawah viewport flip atau menyesuaikan height.
- [ ] Toast tidak menutup CTA bottom bar.
- [ ] Focus ring terlihat pada keyboard navigation.
- [ ] Tidak ada double vertical scrollbar pada shell.
- [ ] Semua ukuran bottom bar memakai 56px.
- [ ] Root layout page memakai `h-dvh` / `min-h-dvh`, bukan `h-screen` / `vh`.
- [ ] Setiap halaman standalone punya compact mode `@media(max-height:620px)` (§7.4.2).
- [ ] Tidak ada `min-h-screen` atau `h-screen` di file manapun — grep untuk verifikasi.
- [ ] Test di `1024×656` (browser mode) — DataTable, FormLayout, Dashboard tetap usable tanpa page scroll.
- [ ] Test di `1180×708` dan `1280×680` (browser mode) — tidak ada overflow atau clipped content.
- [ ] Dialog tidak melebihi `calc(100dvh - 96px)`; konten dalam dialog bisa scroll internal.
- [ ] Dropdown / Select tidak melewati bottom viewport — flip atau max-height aktif.
- [ ] FixedBottomBar memakai `padding-bottom: env(safe-area-inset-bottom)` untuk device dengan notch.

---

## 14. Update Dokumen Terkait

Setelah dokumen ini masuk, update minimal:

- `docs/struktur_frontend.md` untuk menambahkan file baru.
- `spec-04-design-tokens.md` agar bottom bar menjadi 56px.
- `spec-05-layout-and-navigation.md` agar merujuk formula shell canonical.
- `spec-06-responsive-rules.md` agar merujuk viewport baseline dari dokumen ini.
- `design-A1-topbar-ribbon.md` agar tidak memakai offset yang berbeda.
- `design-H1-dashboard.md` agar merujuk `design-H2-dashboard-tablet-landscape.md`.

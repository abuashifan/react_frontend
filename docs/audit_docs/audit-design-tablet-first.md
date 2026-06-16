# Audit Desain Tablet-First ERP

Scope:
- Audit hanya pada dokumen markdown di `docs/`, dengan fokus utama pada design docs dan aturan layout/responsive yang mempengaruhi implementasi frontend tablet-friendly.
- Referensi yang paling sering dipakai dalam audit ini: `docs/design_docs/*.md`, `docs/praproduction_docs/spec-04-design-tokens.md`, `docs/praproduction_docs/spec-05-layout-and-navigation.md`, `docs/praproduction_docs/spec-06-responsive-rules.md`, `docs/praproduction_docs/spec-08-form-architecture.md`, `docs/praproduction_docs/spec-09-table-and-list.md`, `docs/praproduction_docs/spec-10-document-workflow.md`, `docs/praproduction_docs/spec-16-reports-module.md`, `docs/praproduction_docs/spec-20-dashboard.md`.

## A. Executive Summary

Kesiapan dokumen untuk membangun frontend ERP yang tablet-friendly: **58/100**.

Kesimpulan:
- Dokumen desain sudah cukup kuat untuk arah visual dasar, tetapi belum cukup presisi untuk layout shell, viewport behavior, dan scroll governance di tablet landscape.
- Ada beberapa konflik ukuran dan offset antar dokumen, terutama tinggi fixed bottom bar, padding content, dan perilaku shell dashboard versus workspace/form.
- Tablet landscape belum dipagari dengan aturan eksplisit untuk 1024x768, 1180x820, 1280x800, dan 1366x768, sehingga implementasi masih bergantung pada inferensi developer.

Risiko terbesar:
- Shell layout fixed yang tidak punya canonical viewport math, sehingga content bisa tertutup topbar/ribbon/action bar atau memunculkan scroll ganda.
- Form dan dashboard belum punya aturan internal scroll, max-height, dan fit-in-viewport yang tegas.
- Dialog, dropdown, dan toast belum punya aturan collision/offset yang aman untuk viewport pendek dan bar fixed di bawah.

## B. Temuan Detail

### 1. Shell offset tidak konsisten antar dokumen

- Severity: High
- File: `docs/design_docs/design-A1-topbar-ribbon.md`, `docs/design_docs/design-D1-form-layout.md`, `docs/design_docs/design-D3-bottom-action-bar.md`, `docs/design_docs/design-H1-dashboard.md`, `docs/praproduction_docs/spec-04-design-tokens.md`
- Section: `Layout Offset Dinamis`, `Content Area Specs`, `Anatomi`, `Content Padding`, `Layout`
- Problem:
  - Tinggi fixed bottom bar tidak seragam: 56px di design docs A1/D1/D3, tetapi 60px di design tokens.
  - Padding top content juga tidak seragam: A1 menghitung 184px/120px, D1 tidak memakai formula shell yang sama, H1 memakai 136px untuk dashboard.
  - Tidak ada satu rumus canonical untuk `topbar + ribbon + primary tabs + secondary tabs + breathing room + bottom bar`.
- Impact:
  - Implementasi bisa menghasilkan content overlap, sticky bar tertutup, atau whitespace berlebih pada tablet landscape.
  - Dev akan mengambil keputusan sendiri saat tidak ada satu sumber kebenaran.
- Recommendation:
  - Tetapkan satu formula shell yang canonical dan pakai di semua dokumen.
  - Samakan tinggi bottom bar di seluruh dokumen dan turunkan ke design tokens.
  - Nyatakan bahwa semua page content harus mengikuti offset shell, bukan hardcode per page.
- Suggested rule text:
  - `Shell height MUST be computed from canonical tokens: topbar 52px, ribbon 64px or 0px, primary tabs 36px, secondary tabs 32px, bottom bar 56px. Content area MUST use the same formula across all pages.`

### 2. Tidak ada aturan eksplisit viewport baseline untuk tablet landscape prioritas

- Severity: High
- File: `docs/design_docs/design-A1-topbar-ribbon.md`, `docs/design_docs/design-D1-form-layout.md`, `docs/design_docs/design-H1-dashboard.md`, `docs/praproduction_docs/spec-06-responsive-rules.md`
- Section: `Layout`, `Content Area`, `Content Padding`, `Layout Grid`
- Problem:
  - Spec responsive menyebut breakpoint umum, tetapi design docs tidak menegaskan prioritas viewport target yang harus dipatuhi saat desain diimplementasikan.
  - Tidak ada daftar viewport minimum yang wajib diuji seperti 1024x768, 1180x820, 1280x800, dan 1366x768.
- Impact:
  - Dashboard, form, dan table bisa tampak benar di satu layar tetapi pecah di tablet landscape lain.
  - Tidak ada common test target untuk spacing, density, dan visible action area.
- Recommendation:
  - Tambahkan rule viewport baseline ke dokumen desain global.
  - Jadikan tablet landscape sebagai target utama sebelum desktop besar.
- Suggested rule text:
  - `Primary target viewport adalah tablet landscape 1024x768 ke atas, dengan prioritas pengujian 1024x768, 1180x820, 1280x800, dan 1366x768. Semua layout harus tetap usable pada viewport ini tanpa horizontal overflow dan tanpa page-level vertical scroll yang tidak perlu.`

### 3. Page-level vertical scroll belum dibatasi dan belum ada internal scroll region yang tegas

- Severity: High
- File: `docs/design_docs/design-A1-topbar-ribbon.md`, `docs/design_docs/design-D1-form-layout.md`, `docs/design_docs/design-C1-datatable.md`, `docs/design_docs/design-H1-dashboard.md`
- Section: `Content Area`, `Form Layout Rules`, `Table Rules`, `Section 3 — Grafik`, `Section 4 — Aktivitas Terbaru`
- Problem:
  - Dokumen menyebut fixed bars dan horizontal scroll, tetapi tidak pernah mendefinisikan area mana yang harus scroll dan area mana yang harus tetap fixed.
  - Tidak ada aturan `height: 100dvh`, `overflow: hidden` pada shell, atau region internal yang menampung scroll utama.
  - Dashboard dan form sangat mungkin jatuh ke page-level scroll tanpa batas yang jelas.
- Impact:
  - Action bar bisa terlepas dari viewport.
  - Pada tablet landscape, user harus scroll terlalu jauh untuk berpindah dari header ke action bar atau summary.
- Recommendation:
  - Definisikan satu scroll model global: shell fixed, content region scrollable, bars tetap visible.
  - Tambahkan larangan page-level overflow default untuk workspace/form.
- Suggested rule text:
  - `App shell harus memakai height: 100dvh dan overflow: hidden. Scroll utama hanya boleh terjadi di content region yang ditentukan. Topbar, ribbon, tabs, dan fixed bottom bar tidak boleh ikut scroll keluar viewport.`

### 4. Form layout belum punya max-height dan internal scroll rule

- Severity: High
- File: `docs/design_docs/design-D1-form-layout.md`, `docs/design_docs/design-D2-line-items-table.md`, `docs/design_docs/design-D4-form-summary.md`, `docs/praproduction_docs/spec-08-form-architecture.md`
- Section: `Content Area Specs`, `FormSection`, `LineItemsTable`, `FormSummary`
- Problem:
  - D1 mengatur padding dan fixed bottom bar, tetapi tidak mendefinisikan max-height content, internal scroll per section, atau batas tinggi untuk form panjang.
  - Line items table hanya punya horizontal scroll; tidak ada aturan agar form tetap nyaman di viewport pendek.
  - Form summary tidak punya aturan sticky/anchored behavior pada viewport tablet.
- Impact:
  - Form transaksi panjang akan mendorong action bar keluar layar atau menyebabkan vertical scroll yang terlalu panjang.
  - User tablet landscape kehilangan efisiensi kerja karena harus bolak-balik ke bawah untuk action bar.
- Recommendation:
  - Tambahkan aturan form body scroll region, max-height, dan bottom padding yang canonical.
  - Tentukan apakah summary tetap di bawah tabel atau sticky pada viewport tertentu.
- Suggested rule text:
  - `Form view harus memiliki scroll region internal dengan max-height berbasis viewport. Fixed bottom bar selalu diperhitungkan dalam padding-bottom content. Form panjang tidak boleh memaksa user kehilangan action bar di bawah fold pada tablet landscape.`

### 5. DataTable belum punya aturan sticky header, table viewport height, dan footer visibility

- Severity: High
- File: `docs/design_docs/design-C1-datatable.md`, `docs/praproduction_docs/spec-09-table-and-list.md`
- Section: `Anatomi`, `Spesifikasi Tabel`, `Pagination`
- Problem:
  - DataTable sudah mendefinisikan horizontal scroll dan sticky checkbox/number columns, tetapi tidak mendefinisikan sticky table header.
  - Tidak ada batas tinggi viewport untuk list workspace, sehingga 25/50/100 rows tetap bisa membuat page terlalu panjang di tablet.
  - Pagination dan bulk action bar tidak dipagari sebagai area yang harus tetap terlihat dalam viewport workspace.
- Impact:
  - User kehilangan konteks kolom saat scroll vertikal.
  - Footer pagination bisa jatuh jauh di bawah fold.
  - Bulk action bar menjadi kurang usable jika list panjang.
- Recommendation:
  - Tambahkan aturan apakah list workspace menggunakan table body scroll internal atau page scroll.
  - Jika page scroll dipertahankan, dokumentasikan dengan tegas batas tinggi minimum dan perilaku sticky header.
- Suggested rule text:
  - `Workspace table harus memiliki definisi viewport height yang jelas. Jika tabel tumbuh melewati satu layar tablet, header table dan pagination harus tetap mudah diakses, dan developer harus memakai internal scroll region atau sticky header yang eksplisit.`

### 6. Ribbon belum punya aturan overflow yang cukup tegas di design docs

- Severity: Medium
- File: `docs/design_docs/design-A1-topbar-ribbon.md`, `docs/praproduction_docs/spec-05-layout-and-navigation.md`
- Section: `ZONE 2 — RIBBON`, `Ribbon Content Per Modul`
- Problem:
  - Ribbon memiliki banyak item per modul, tetapi design doc tidak secara eksplisit menyatakan apakah bar harus horizontal scroll, wrap, atau collapse otomatis ketika ruang sempit.
  - Label diizinkan wrap 2 baris, namun tinggi ribbon tetap 64px; aturan ini tidak cukup untuk menjamin semua item tetap muat tanpa overflow aneh.
- Impact:
  - Di tablet landscape dengan modul yang banyak item, ribbon bisa overflow atau tampak terpotong.
  - Implementasi bisa berbeda antar developer.
- Recommendation:
  - Tetapkan bahwa ribbon menggunakan satu baris horizontal scroll saat item tidak muat, dengan wrap label yang tetap dibatasi.
- Suggested rule text:
  - `Ribbon harus tetap satu baris visual. Jika total item melebihi lebar viewport, gunakan horizontal scroll internal; jangan ubah menjadi multi-row. Label boleh wrap dua baris, tetapi item tidak boleh memaksa tinggi ribbon melewati 64px.`

### 7. Filter sidebar belum punya compact-density rule untuk tablet sempit

- Severity: Medium
- File: `docs/design_docs/design-C2-filter-sidebar.md`, `docs/design_docs/design-A1-topbar-ribbon.md`, `docs/praproduction_docs/spec-06-responsive-rules.md`
- Section: `Spesifikasi Container`, `Collapsed State`, `Sidebar Behavior`
- Problem:
  - Sidebar width fixed 220px tanpa aturan penyesuaian pada 1024x768 atau 1180x820.
  - Design docs mengizinkan sidebar tampil default pada tablet, tetapi tidak menjelaskan kapan harus compact, auto-collapse, atau tetap visible.
- Impact:
  - Content area workspace menjadi terlalu sempit di tablet landscape yang lebih kecil.
  - Table/list dan form bisa terasa sesak, terutama saat topbar, tabs, dan ribbon aktif bersamaan.
- Recommendation:
  - Tambahkan compact sidebar rule untuk tablet sempit dan threshold auto-collapse jika diperlukan.
- Suggested rule text:
  - `Pada viewport tablet sempit, filter sidebar harus mendukung compact density. Jika ruang content area turun di bawah batas minimum yang nyaman, sidebar boleh auto-collapse tetapi state harus tetap dapat dipulihkan user.`

### 8. SearchableSelect belum punya aturan viewport collision dan constrained dropdown height

- Severity: Medium
- File: `docs/design_docs/design-C3-searchable-select.md`
- Section: `Dropdown Panel`, `Behavior Rules`, `Ukuran Varian`
- Problem:
  - Dropdown panel hanya menyebut `max-height: 280px`, tetapi tidak menjelaskan perilaku ketika select berada dekat bottom bar atau bottom edge viewport.
  - Tidak ada aturan flip upward, collision boundary, atau penyesuaian tinggi terhadap viewport kecil.
- Impact:
  - Dropdown bisa terpotong oleh viewport atau fixed bottom bar.
  - Pada tablet landscape, select di bagian bawah form mudah tertutup oleh panel dropdown.
- Recommendation:
  - Tambahkan aturan collision-aware positioning dan max-height berbasis viewport.
- Suggested rule text:
  - `SearchableSelect dropdown harus collision-aware. Jika ruang bawah tidak cukup, panel wajib flip ke atas. Max-height harus dibatasi oleh viewport dan tidak boleh menutupi fixed bottom bar.`

### 9. Void confirm dialog belum aman untuk viewport pendek

- Severity: High
- File: `docs/design_docs/design-E3-void-dialog.md`
- Section: `Spesifikasi Dialog`, `Input Alasan`, `Footer Tombol`
- Problem:
  - Dialog hanya punya `max-width: 400px` dan tidak memiliki `max-height`, `overflow-y`, atau aturan scroll internal.
  - Konten textarea reason dan tombol footer bisa keluar dari layar jika viewport pendek atau jika keyboard virtual aktif di tablet.
- Impact:
  - User bisa kehilangan tombol aksi atau tidak bisa membaca seluruh isi dialog.
  - Pada tablet landscape, dialog destruktif menjadi tidak andal.
- Recommendation:
  - Tambahkan max-height berbasis viewport, scroll internal, dan footer yang tetap terlihat.
- Suggested rule text:
  - `Void dialog harus memiliki max-height berbasis viewport dan internal scroll bila konten melebihi ruang layar. Footer tombol harus tetap reachable pada tablet landscape dan tidak boleh keluar viewport.`

### 10. Toast placement berpotensi konflik dengan bottom action bar

- Severity: Medium
- File: `docs/design_docs/design-E2-toast.md`, `docs/design_docs/design-D3-bottom-action-bar.md`
- Section: `Spesifikasi Container`, `Visibility Rules`
- Problem:
  - Toast ditempatkan fixed bottom-right tanpa offset eksplisit terhadap fixed bottom bar.
  - Bottom bar juga fixed di bawah viewport ketika form view aktif.
- Impact:
  - Toast dapat menumpuk di atas action bar atau menutupi CTA pada viewport pendek.
- Recommendation:
  - Tambahkan offset bottom dinamis berdasarkan presence bottom bar atau safe area.
- Suggested rule text:
  - `Toast container harus menghormati fixed bottom bar. Jika bottom bar visible, toast wajib diberi bottom offset tambahan agar tidak menumpuk CTA utama.`

### 11. Dashboard belum punya tablet-landscape fit rule dan prioritas above-the-fold

- Severity: High
- File: `docs/design_docs/design-H1-dashboard.md`, `docs/praproduction_docs/spec-20-dashboard.md`
- Section: `Layout Grid`, `Section 3 — Grafik`, `Content Padding`
- Problem:
  - Dashboard mendefinisikan empat section, tetapi tidak ada aturan bahwa dashboard harus tetap fit pada tablet landscape tanpa scroll vertikal yang berlebihan.
  - Chart height tetap 200px, pending cards dan activity list tidak punya batas fit-in-viewport atau prioritas tampil.
  - Tidak ada rule collapse untuk widget sekunder pada viewport pendek.
- Impact:
  - Dashboard akan menjadi halaman yang sangat panjang di tablet landscape.
  - KPI dan pending items mungkin tidak benar-benar menjadi ringkasan cepat di layar tablet.
- Recommendation:
  - Tambahkan aturan fit dashboard untuk tablet landscape, termasuk prioritas widget, batas tinggi chart, dan compact density untuk activity list.
- Suggested rule text:
  - `Dashboard pada tablet landscape harus diprioritaskan agar section KPI, pending alerts, dan setidaknya satu section insight tetap terbaca tanpa scroll panjang. Widget sekunder boleh dipadatkan, tetapi chart dan activity list harus dibatasi tinggi maksimumnya.`

### 12. Tidak ada one-source-of-truth untuk bottom bar height

- Severity: Medium
- File: `docs/design_docs/design-D1-form-layout.md`, `docs/design_docs/design-D3-bottom-action-bar.md`, `docs/praproduction_docs/spec-04-design-tokens.md`
- Section: `Fixed Bottom Bar`, `Navigation Bar (Bawah)`, `Layout Dimensions`
- Problem:
  - Design docs konsisten di 56px, tetapi design tokens menyebut 60px.
  - Ini bukan sekadar angka kecil; ia mempengaruhi padding bawah content, hit target, dan perhitungan shell height.
- Impact:
  - Implementasi bisa bergeser 4px di banyak halaman.
  - Dalam layout fixed, selisih ini cukup untuk memunculkan clipping atau whitespace yang tidak perlu.
- Recommendation:
  - Pilih satu nilai canonical dan update semua dokumen agar sama.
- Suggested rule text:
  - `Fixed bottom bar memiliki satu tinggi canonical yang sama di seluruh docs. Semua perhitungan shell, padding-bottom, dan sticky footer harus merujuk ke nilai ini tanpa pengecualian.`

## C. Daftar Aturan yang Hilang

- Viewport baseline eksplisit untuk tablet landscape.
- Prioritas desain untuk 1024x768, 1180x820, 1280x800, dan 1366x768.
- Shell height calculation yang canonical untuk topbar, ribbon, tabs, dan bottom bar.
- Aturan `height: 100dvh` dan `overflow: hidden` untuk root shell.
- Definisi internal scroll region mana yang boleh scroll dan mana yang harus fixed.
- Larangan page-level overflow default untuk workspace/form/dashboard.
- Compact density mode untuk tablet sempit.
- Aturan max-height form body dan behavior scroll untuk form panjang.
- Aturan table viewport height, sticky header, dan footer visibility.
- Aturan dashboard fit-in-viewport untuk tablet landscape.
- Aturan collision-aware positioning untuk dropdown, dialog, dan toast.
- Aturan overflow behavior untuk ribbon saat item tidak muat.
- Satu nilai canonical untuk fixed bottom bar height.

## D. Patch Proposal Dokumen

### 1. Global responsive rules

```md
## Global Responsive Rules

- Primary target viewport adalah tablet landscape 1024x768 ke atas.
- Prioritas pengujian wajib mencakup 1024x768, 1180x820, 1280x800, dan 1366x768.
- Layout ERP harus compact, desktop-like, dan tidak reflow menjadi mobile card stack kecuali pada viewport di bawah breakpoint mobile yang eksplisit.
- Root shell harus menggunakan `height: 100dvh` dan `overflow: hidden`.
- Scroll utama hanya boleh terjadi di content region yang ditentukan.
- Page-level vertical scroll tidak boleh menjadi default perilaku layout utama.
```

### 2. Tablet-first viewport rules

```md
## Tablet-First Viewport Rules

- Tablet landscape adalah target utama, bukan desktop besar.
- Sidebar, ribbon, table, form, dan dashboard harus dirancang untuk tetap usable pada 1024px lebar minimum.
- Jika ruang horizontal tidak cukup, gunakan compact density atau internal scroll yang jelas, bukan overflow tak terkendali.
- Komponen fixed harus selalu diperhitungkan dalam height calc viewport.
```

### 3. Layout shell rules

```md
## Layout Shell Rules

- Topbar height adalah 52px.
- Ribbon height adalah 64px saat expanded dan 0px saat collapsed.
- Primary tabs height adalah 36px.
- Secondary tabs height adalah 32px.
- Fixed bottom bar memakai satu tinggi canonical di seluruh docs.
- Content area harus menghitung semua offset shell secara konsisten.
- Bottom bar, tabs, dan topbar tidak boleh tertutup oleh konten.
```

### 4. Table/list rules

```md
## Table/List Rules

- Semua workspace list memakai DataTable.
- Horizontal scroll diizinkan, tetapi kolom wajib tetap terbaca dan sticky column harus jelas.
- Table header dan pagination harus tetap mudah diakses pada viewport tablet.
- Jika table memanjang melebihi viewport, gunakan internal scroll region atau sticky header yang eksplisit.
- No action column di list workspace.
```

### 5. Form rules

```md
## Form Rules

- Form transaksi harus memiliki max-height berbasis viewport dan internal scroll region yang jelas.
- Fixed bottom bar selalu diperhitungkan dalam padding-bottom content.
- Form panjang tidak boleh membuat action bar hilang di bawah fold pada tablet.
- Summary dan line items harus tetap bisa dipakai tanpa vertical scroll berlebihan.
```

### 6. Dashboard/report rules

```md
## Dashboard and Report Rules

- Dashboard harus punya fit-in-viewport rule untuk tablet landscape.
- Chart height harus dibatasi agar KPI dan pending widgets tetap terbaca dalam satu layar.
- Widget sekunder boleh dipadatkan atau dipindah ke bawah, tetapi ringkasan utama harus tetap above the fold.
- Report filter pages harus punya behavior collapse/compact yang jelas pada viewport tablet.
```

### 7. Modal/drawer rules

```md
## Modal/Drawer Rules

- Semua dialog dan drawer harus collision-aware terhadap viewport dan fixed bars.
- Dialog harus punya max-height berbasis viewport dan internal scroll jika konten melebihi ruang.
- Dropdown/popover harus flip ke atas jika ruang bawah tidak cukup.
- Toast harus menghormati fixed bottom bar dan tidak menumpuk CTA utama.
```

## E. Final Decision

**FAIL**

Alasan:
- Dokumen desain belum aman untuk dipakai langsung sebagai source of truth untuk membangun frontend ERP yang tablet-friendly.
- Gap terbesar ada di shell height math, viewport baseline, internal scroll governance, dan dashboard/form fit rules.
- Ada konflik ukuran yang nyata antar dokumen yang harus diselesaikan sebelum implementasi dimulai.

VIEWPORT RESEARCH SNAPSHOT — untuk Seaside Escape ERP Frontend
Tanggal riset: 2026-06-14
Satuan: CSS pixel, bukan physical pixel.
Catatan: "after address bar" = estimasi safe visual viewport saat browser UI/address bar terlihat.
Tidak ada angka absolut universal karena browser UI berubah oleh scroll, OS, zoom, tab mode, keyboard, safe-area, dan versi browser.

================================================================================
1) BROWSER PRIORITY — mobile/tablet browser yang perlu dites
================================================================================

Global mobile browser share May 2026:
- Chrome             : 66.41%
- Safari             : 25.25%
- Samsung Internet   : 2.44%
- Opera              : 1.62%
- UC Browser         : 1.11%
- Firefox            : 0.71%

Praktis untuk project ERP:
1. Chrome Android / Chrome tablet
2. Safari iPadOS / iOS
3. Samsung Internet Android
4. Chrome iOS
5. Firefox Android/iOS
6. Edge Android/iOS, Opera, UC sebagai secondary smoke test

================================================================================
2) KONSEP ANGKA YANG DIPAKAI
================================================================================

lvh / layout_css_viewport:
- Tinggi besar ketika browser chrome/address bar collapsed/hidden.
- Banyak daftar device viewport memakai angka ini atau logical CSS screen size.

svh / safe_visible_estimate:
- Tinggi kecil saat address bar / toolbar browser terlihat.
- Ini yang paling penting untuk menghindari bottom action, pagination, toast, dialog,
  dan table footer ketutup.

dvh:
- Tinggi dinamis yang mengikuti visual viewport saat browser UI muncul/hilang.
- Untuk shell app: root sebaiknya height: 100dvh; overflow: hidden.

vh:
- Jangan jadikan dasar utama mobile/tablet browser.
- Pada browser modern, vh umumnya setara lvh, sehingga bisa terlalu tinggi saat
  address bar terlihat.

================================================================================
3) ESTIMASI BROWSER UI TAX / ADDRESS BAR TAX
================================================================================

Angka berikut adalah budget konservatif untuk desain, bukan spesifikasi absolut.

Device class                  Browser                  Vertical UI tax visible
--------------------------------------------------------------------------------
iPhone Safari                 Safari iOS               64–120px
iPhone Chrome                 Chrome iOS / WebKit      80–128px
iPhone Firefox                Firefox iOS / WebKit     80–128px
Android phone Chrome          Chrome Android           64–128px
Android phone Samsung         Samsung Internet         80–140px
Android phone Firefox         Firefox Android          64–128px
iPad Safari landscape         Safari iPadOS            64–112px
iPad Chrome/Firefox landscape iPadOS browsers          80–128px
Android tablet Chrome         Chrome Android tablet    64–120px
Android tablet Samsung        Samsung Internet         80–128px
Desktop browser 1366x768      Chrome/Edge/Firefox      72–120px if tabs/bookmarks visible
PWA standalone/fullscreen     Any supported platform   0–safe-area only

Rule desain:
- Untuk tablet landscape browser mode, jangan hanya test 1024×768 / 1180×820.
- Test juga versi "address bar visible":
  1024×656
  1024×704
  1180×708
  1180×756
  1280×680
  1280×744
  1366×648
  1366×688

================================================================================
4) TABLET LANDSCAPE — target utama ERP
================================================================================

Columns:
- lvh/layout = CSS viewport besar/logical.
- safe visible = estimasi setelah address bar/browser UI terlihat.
- app after fixed bottom 56 = sisa tinggi area kerja jika ada bottom bar 56px.

Device / scenario                    lvh/layout      safe visible       app after 56
------------------------------------------------------------------------------------
iPad 9.7 / old iPad landscape         1024×768        1024×656–704       1024×600–648
iPad mini 8.3 landscape               1133×744        1133×632–680       1133×576–624
iPad 10 / iPad Air 10.9 landscape     1180×820        1180×708–756       1180×652–700
iPad Pro 11 old landscape             1194×834        1194×722–770       1194×666–714
iPad Pro 11 M4 landscape              1210×834        1210×722–770       1210×666–714
Android tablet common 10" landscape   1280×800        1280×680–736       1280×624–680
Galaxy Tab S9 landscape approx        1205×753        1205×625–689       1205×569–633
iPad Pro/Air 13 landscape             1366×1024       1366×912–960       1366×856–904
iPad Pro 13 M4 landscape              1376×1032       1376×920–968       1376×864–912
Small laptop / desktop browser        1366×768        1366×648–696       1366×592–640

Kesimpulan tablet:
- Baseline project 1024×768 tetap penting, tetapi browser mode realistis bisa
  turun menjadi sekitar 1024×656–704.
- Untuk DataTable, FormLayout, dan Dashboard, desain aman bila masih usable pada:
  1024×656
  1180×708
  1280×680
  1366×648
- Jika ingin pengalaman ERP maksimal, PWA standalone/fullscreen jauh lebih stabil
  karena menghilangkan address bar tax.

================================================================================
5) PHONE PORTRAIT — small-screen fallback
================================================================================

Device / scenario                    lvh/layout      safe visible       app after 56
------------------------------------------------------------------------------------
iPhone SE 2022                        375×667         375×539–603        375×483–547
iPhone 14 / 15 base class             390–393×844–852 390–393×716–788    390–393×660–732
iPhone 16 Pro                         402×874         402×746–810        402×690–754
iPhone 16 Pro Max                     440×956         440×828–892        440×772–836
Pixel 8 / Pixel 9 class               412×915         412×787–851        412×731–795
Galaxy S24                            360×780         360×652–716        360×596–660
Galaxy S24 Ultra                      384×824         384×696–760        384×640–704
Generic Android 360×800               360×800         360×672–736        360×616–680
Generic Android 412×915               412×915         412×787–851        412×731–795

Kesimpulan phone:
- 360px width masih wajib aman.
- Untuk mobile page, jangan butuh viewport tinggi penuh.
- Gunakan bottom navigation/mobile layout di bawah 768px.
- Dialog, dropdown, searchable select harus punya max-height berbasis dvh:
  max-height: calc(100dvh - reservedTop - reservedBottom)

================================================================================
6) REKOMENDASI BREAKPOINT DAN TEST MATRIX UNTUK PROJECT
================================================================================

Primary tablet landscape test:
- 1024×768 fullscreen/PWA
- 1024×656 browser address visible worst case
- 1180×820 fullscreen/PWA
- 1180×708 browser address visible
- 1280×800 fullscreen/PWA
- 1280×680 browser address visible
- 1366×768 desktop-like short viewport
- 1366×648 desktop browser chrome visible

Phone smoke test:
- 360×640
- 360×716
- 390×716
- 393×788
- 412×787
- 440×828

Desktop/laptop:
- 1366×768
- 1440×900
- 1536×864
- 1920×1080

================================================================================
7) CSS RULE YANG PALING AMAN UNTUK SHELL ERP
================================================================================

Root:
html,
body,
#root {
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}

.app-shell {
  height: 100dvh;
  overflow: hidden;
}

Main content:
.app-content {
  min-height: 0;
  overflow: hidden;
}

Internal scroll region:
.workspace-scroll,
.table-scroll,
.form-scroll {
  min-height: 0;
  overflow: auto;
}

Fixed bottom bar:
.fixed-bottom-bar {
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom);
}

Overlay/dropdown/dialog:
.overlay-panel {
  max-height: calc(100dvh - 96px);
  overflow: auto;
}

Tablet landscape safe assumption:
- Jangan desain komponen yang butuh full 768px height.
- Anggap height efektif terburuk tablet browser:
  1024×656 dengan bottom bar => area kerja sekitar 600px.
- DataTable harus tetap usable dengan header + toolbar + table body + pagination
  pada area kerja 600–650px.
- Form transaksi harus menjadikan line items / content sebagai internal scroll,
  bukan body page scroll.

================================================================================
8) PRIORITAS UNTUK MEMAKSIMALKAN TAMPILAN APLIKASI
================================================================================

P0:
- Pakai 100dvh untuk shell.
- overflow hidden di root shell.
- Semua scroll di internal region.
- Test 1024×656 dan 1180×708, bukan hanya 1024×768 dan 1180×820.
- Bottom action bar fixed 56px, tidak boleh menutup content.

P1:
- Dashboard tablet landscape tetap desktop compact view.
- Table pagination dan bulk action harus tetap terlihat di viewport pendek.
- Dropdown/searchable select pakai collision rule + max-height 100dvh.
- Dialog jangan lebih tinggi dari calc(100dvh - 48/64/96px).

P2:
- Dorong mode PWA standalone untuk tablet operasional.
- Sediakan QA route/debug kecil untuk membaca:
  window.innerWidth
  window.innerHeight
  window.visualViewport?.width
  window.visualViewport?.height
  CSS.supports("height: 100dvh")
  env(safe-area-inset-bottom) via computed style
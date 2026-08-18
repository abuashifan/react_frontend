# F1 — Onboarding Wizard

> Wizard 6 step untuk setup perusahaan baru.
> Muncul sekali saat perusahaan pertama kali dibuat.

---

## Layout Wizard

```
┌──────────────────────────────────────────────────────────┐
│  ■ Seaside Escape ERP — Setup Perusahaan                 │  ← header bar
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│  ✅ 1. Info   │  [Konten step aktif]                      │
│     Perusahaan│                                           │
│              │                                           │
│  ✅ 2. Template│                                          │
│     COA      │                                           │
│              │                                           │
│  ▶ 3. Account │                                          │
│     Mapping  │                                           │
│              │                                           │
│  ○ 4. Master  │                                          │
│     Data     │                                           │
│              │                                           │
│  ○ 5. Opening │                                          │
│     Balance  │                                           │
│              │                                           │
│  ○ 6. Selesai │                                          │
│              │                                           │
│              ├───────────────────────────────────────────┤
│              │  [← Kembali]           [Lanjutkan →]     │  ← nav bar
└──────────────┴───────────────────────────────────────────┘
```

---

## Header Bar

```
height        : 52px
bg            : #326273
padding       : 0 24px
display       : flex items-center gap-8px

Logo mark     : 24x24px, rounded-md, bg #5c9ead
Product name  : "Seaside Escape ERP" — 14px, font-weight 600, color #ffffff
Separator     : "—", color rgba(255,255,255,0.4)
Subtitle      : "Setup Perusahaan Baru" — 13px, color rgba(255,255,255,0.7)
```

---

## Step Sidebar

```
width         : 220px
bg            : #ffffff
border-right  : 1px solid #d9e2e5
padding       : 24px 16px
flex-shrink   : 0

Setiap step item:
  display     : flex items-start gap-10px
  padding     : 10px 12px
  border-radius: 8px
  cursor      : pointer (jika bisa diakses)
  margin-bottom: 4px

  Icon/Indicator (24x24px, flex-shrink-0):
    completed : ✅ bg #D1FAE5, CheckCircle 14px color #065F46
    active    : ▶ bg #EFF9FB, circle color #5c9ead
    pending   : ○ bg #f1f5f9, circle outline color #d9e2e5
    incomplete: ⚠️ bg #FEF3C7, AlertTriangle 14px color #92400E

  Teks:
    Step number : "1." — 11px, color sesuai status
    Step label  : font 13px, font-weight sesuai status
    Sub-label   : 11px, color #94a3b8 (opsional, misal "45 akun")

  Per status:
    completed   : label color #065F46, font-weight 500
    active      : label color #326273, font-weight 600, bg #EFF9FB
    pending     : label color #64748b, font-weight 400
    incomplete  : label color #92400E, font-weight 500
```

---

## Content Area

```
flex          : 1
bg            : #EFEFED (page-bg)
padding       : 32px
overflow-y    : auto
```

> **Root wrapper wajib `h-dvh`, bukan `min-h-dvh`** (fix 2026-08-18): dengan `min-h-dvh` pada
> `<div>` terluar `OnboardingPage`, tinggi wrapper flex bisa tumbuh melebihi viewport mengikuti
> konten, sehingga `<main class="overflow-y-auto">` tidak pernah benar-benar jadi scroll
> container -- yang scroll malah window/document, dan elemen `sticky` di dalamnya tidak pernah
> "nempel" karena tidak ada scroll container internal untuk dijadikan acuan. `h-dvh` (tinggi
> pasti, bukan minimum) memaksa `<main>` benar-benar terkurung tingginya sehingga
> `overflow-y-auto` dan `position: sticky` di dalamnya berfungsi seperti seharusnya.

---

## Navigation Bar (Bawah)

```
height        : 56px
bg            : #ffffff
border-top    : 1px solid #d9e2e5
padding       : 0 24px
display       : flex items-center justify-between

[← Kembali]:
  variant     : outline
  disabled    : di step 1
  color       : #64748b

[Lanjutkan →] / [Selesai] (step 6):
  variant     : primary (bg #e39774)
  disabled    : jika step belum valid (wajib isi belum lengkap)
  loading     : saat menyimpan data step
```

> **Status implementasi (2026-08-18):** bar ini belum jadi satu komponen bersama yang dirender
> `OnboardingPage` di luar `<main>` seperti digambarkan di atas. Step **Template COA** dan
> **Account Mapping** (dua step yang dilaporkan tombolnya "hilang" saat konten panjang) memakai
> `sticky bottom-0` pada baris tombol mereka sendiri, nempel ke scroll container `<main>` — secara
> visual hasilnya sama (bar selalu terlihat di bawah tanpa perlu discroll), tanpa refactor state
> lintas step. Step lain (`Step1CompanyInfo`, `StepModuleSelection`, `Step4MasterData`,
> `Step5OpeningBalance`) masih memakai tombol inline biasa (tidak sticky) karena kontennya pendek
> dan belum ada laporan masalah serupa — pola sticky yang sama tinggal diterapkan kalau suatu saat
> dibutuhkan.

---

## Step 1 — Informasi Perusahaan

```
Form 2 kolom:
  Nama Perusahaan*  | NPWP
  Alamat (span 2)
  Bulan Fiskal*     | Mata Uang (default IDR)

Validasi sebelum Lanjutkan:
  Nama perusahaan wajib diisi
  Bulan mulai tahun fiskal wajib dipilih
```

---

## Step 2 — Pilih Template COA

```
Grid card 2-3 kolom (jumlah akun diambil dari GET /setup/coa-templates, bukan hardcode):
  ┌──────────────┐  ┌──────────────┐
  │ 🔥 Agen Gas  │  │ 🛒 Dagang    │
  │ 42 akun      │  │ 41 akun      │
  └──────────────┘  └──────────────┘
  ┌──────────────┐  ┌──────────────┐
  │ 💼 Jasa      │  │ 🏭 Manufaktur│
  │ 31 akun      │  │ 43 akun      │
  └──────────────┘  └──────────────┘
  ┌──────────────┐
  │ 📄 Kosong    │
  │ 0 akun       │
  └──────────────┘

Card specs:
  bg          : #ffffff | border 1px solid #d9e2e5 | border-radius 10px
  padding     : 20px
  hover       : border-color #5c9ead
  selected    : border 2px solid #5c9ead | bg #EFF9FB
               checkmark di pojok kanan atas (Check 16px, color #5c9ead)
  icon        : 32px, bg #EFF9FB, border-radius 8px, icon 18px color #5c9ead
  nama        : 14px, font-weight 600, color #24323a, margin-top 10px
  jumlah akun : 12px, color #64748b
  badge "Kustom" (amber #92400E/#FEF3C7) : muncul kalau template ini sudah diedit user

Preview & edit — floating modal (`CoaTemplateModal`), BUKAN accordion inline:
  Klik card mana pun (terpilih atau belum) → buka Dialog
  DialogContent: max-h-[calc(100dvh-48px)], w-[calc(100vw-32px)], max-w-720px
  Mode preview (default):
    DataTable in-memory (data statis template, pagination client-side 25/halaman)
    Kolom: Kode (indent 16px per level dari parent_code) | Nama Akun | Tipe
    Footer: "<N> akun" kiri, [Tutup] [Edit] kanan
  Mode edit (tombol Edit):
    LineItemsTable: Kode | Nama Akun | Tipe (Select) | Induk (Select, dibatasi ke kode
    yang sudah ada di baris sebelumnya) | Kas/Bank (Checkbox, hanya untuk tipe asset)
    Tombol "+ Tambah Akun" (LineItemsTable bawaan), hapus per baris
    Footer: [Batal] [Simpan] -- Simpan commit draft ke state Step 2, balik ke mode preview

Warning ganti template (kalau sudah pernah apply):
  AlertDialog: "Mengganti template COA akan mengganti ulang akun yang sudah dibuat dari
  template sebelumnya dan mereset Account Mapping yang sudah dikonfigurasi."
  [Batal] [Ya, Ganti Template]

Lanjutkan:
  POST /setup/coa-templates/apply { template_id, accounts } -- accounts = draft hasil edit
  kalau ada, kalau tidak accounts asli template. Backend membuat chart_of_accounts sungguhan
  dan mensinkronkan Account Mapping otomatis sebelum lanjut ke Step 3.
```

---

## Step 3 — Account Mapping

```
List mapping: label → SearchableSelect COA + tombol ikon cari (Search, 34px/9-lg persegi,
  border #d9e2e5, hover border+text #5c9ead) di sebelah kanannya
Pre-filled otomatis dari akun yang dibuat Step 2 (kode akun template cocok dengan
  default_account_codes di account_mappings.php backend)
User bisa ubah lewat SearchableSelect (ketik cepat) ATAU tombol cari (buka AccountPickerDialog
  -- filter No Akun/Nama Akun terpisah + tabel berpaginasi, mode single-select: klik baris
  langsung pilih & tutup, accountType difilter otomatis kalau mapping cuma izinkan 1 tipe akun)

Layout per row:
  Label mapping : 14px, color #24323a, min-width 200px
  SearchableSelect: flex-1
  Tombol cari   : shrink-0, di sebelah kanan SearchableSelect

Validasi: semua mapping required harus terisi
```

---

## Step 4 — Master Data Dasar

```
3 section card (Gudang, Satuan, Syarat Pembayaran):

Setiap section:
  Header: nama + "Minimal 1 item wajib ditambahkan"
  List item yang sudah ditambahkan (badge kecil)
  Tombol "+ Tambah {nama}" → mini form inline

Mini form inline:
  Muncul di bawah list
  Field sesuai entitas (misal Gudang: Nama*, Alamat)
  [Batal] [Simpan]
  height transition 0 → auto

Progress:
  Gudang     : ✓ 1 gudang / ⚠ Belum ada
  Satuan     : ✓ 2 satuan / ⚠ Belum ada
  Syarat Bayar: ✓ 1 syarat / ⚠ Belum ada

Lanjutkan disabled jika salah satu masih 0 item
```

---

## Step 5 — Opening Balance

```
Header: "Saldo Awal Akun"
  Tombol "Lewati, isi nanti →" di kanan (text button, color #5c9ead)

Tanggal opening balance:
  DatePicker, default hari ini

Tabel saldo per akun:
  Kolom: Kode Akun | Nama Akun | Debit | Kredit
  Hanya tampilkan akun postable (bukan parent/header)
  Input debit/kredit: number, tabular-nums
  Satu baris = debit ATAU kredit (tidak keduanya)

Validasi: total debit harus = total kredit
  Tampilkan di bawah tabel: "Debit: X | Kredit: X" dengan status ✓ atau ✗
```

---

## Step 6 — Selesai

```
Layout centered:

  Icon: CheckCircle 48px, color #065F46, bg #D1FAE5, circle 72px

  Title: "Setup Selesai!"
    font: 22px, font-weight 700, color #24323a

  Subtitle: "Perusahaan Anda sudah siap digunakan."
    font: 14px, color #64748b

  Summary card (bg #f8fbfc, border, border-radius 8px, padding 16px):
    Template COA    : Agen Gas (45 akun)
    Account Mapping : ✓ Selesai
    Gudang          : 1 gudang
    Satuan          : 2 satuan
    Opening Balance : Belum diisi / ✓ Selesai

  Tombol "Mulai Gunakan Seaside Escape →"
    bg #e39774 | color white | padding 12px 28px | border-radius 8px
    margin-top: 24px
```

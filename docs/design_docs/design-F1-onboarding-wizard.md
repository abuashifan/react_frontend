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
Grid card 2 kolom:
  ┌──────────────┐  ┌──────────────┐
  │ 🔥 Agen Gas  │  │ 🛒 Dagang    │
  │ 45 akun      │  │ 52 akun      │
  └──────────────┘  └──────────────┘
  ┌──────────────┐  ┌──────────────┐
  │ 💼 Jasa      │  │ 🏭 Manufaktur│
  │ 38 akun      │  │ 68 akun      │
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

Preview tree COA:
  Klik card → expand panel accordion di bawah grid
  Tampilkan tree 2 level (parent + children)
  font 12px | indent 16px per level | max-height 200px, overflow scroll

Warning ganti template (jika step 3 sudah diisi):
  AlertDialog dengan pesan: "Mengganti template akan mereset Account Mapping."
  [Batal] [Ya, Ganti Template]
```

---

## Step 3 — Account Mapping

```
List mapping: label → SearchableSelect COA
Pre-filled dari template yang dipilih
User bisa ubah

Layout per row:
  Label mapping : 14px, color #24323a, min-width 200px
  SearchableSelect: flex-1

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

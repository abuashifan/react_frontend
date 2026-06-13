# 18 — Onboarding Wizard

## Trigger

Wizard muncul ketika perusahaan baru pertama kali dibuat.
User tidak bisa masuk ke app sebelum wizard selesai.

Route: `/onboarding`

---

## Layout Wizard

```
┌─────────────────────────────────────────────────────────┐
│  🌊 Seaside Escape ERP — Setup Perusahaan Baru          │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  ✅ 1. Informasi  │  Konten step aktif                   │
│     Perusahaan   │                                      │
│                  │                                      │
│  ✅ 2. Template   │                                      │
│     COA          │                                      │
│                  │                                      │
│  ▶ 3. Account    │                                      │
│     Mapping      │                                      │
│                  │                                      │
│  ○ 4. Master     │                                      │
│     Data         │                                      │
│                  │                                      │
│  ○ 5. Opening    │                                      │
│     Balance      │                                      │
│                  │                                      │
│  ○ 6. Selesai    │                                      │
│                  │                                      │
│                  ├──────────────────────────────────────┤
│                  │  [← Kembali]        [Lanjutkan →]   │
└──────────────────┴──────────────────────────────────────┘
```

---

## Step Status Indicator

```tsx
type StepStatus = 'completed' | 'active' | 'pending' | 'incomplete'

// Sidebar item styling per status
const stepStyles = {
  completed:  'text-[#065F46] font-medium',   // ✅ hijau
  active:     'text-[#5c9ead] font-semibold', // ▶ teal bold
  pending:    'text-[#64748b]',               // ○ abu
  incomplete: 'text-amber-600',               // ⚠️ amber — dikunjungi tapi belum lengkap
}

const stepIcons = {
  completed:  '✅',
  active:     '▶',
  pending:    '○',
  incomplete: '⚠️',
}
```

---

## Navigasi Antar Step

```typescript
// Rules navigasi
const canNavigateTo = (targetStep: number, currentProgress: StepProgress) => {
  // Bisa navigasi ke step yang sudah dikunjungi
  if (currentProgress.visitedSteps.includes(targetStep)) return true
  // Bisa ke step aktif
  if (targetStep === currentProgress.currentStep) return true
  // Tidak bisa skip ke step yang belum dikunjungi
  return false
}
```

**Warning ganti template COA:**
```tsx
// Ketika user kembali ke Step 2 dan ganti template
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogTitle>Ganti Template COA?</AlertDialogTitle>
    <AlertDialogDescription>
      Mengganti template COA akan mereset Account Mapping
      yang sudah Anda konfigurasi di Step 3.
      Lanjutkan?
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmChangeTemplate}>
        Ya, Ganti Template
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Step 1 — Informasi Perusahaan

```tsx
// Fields
const companyInfoSchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  address: z.string().optional(),
  npwp: z.string().optional(),
  fiscal_year_start: z.string().min(1, 'Bulan mulai tahun fiskal wajib diisi'),
  currency: z.string().default('IDR'),
})

// Form layout — 2 kolom
<FormSection title="Informasi Dasar">
  <FormField name="name" label="Nama Perusahaan" required />
  <FormField name="npwp" label="NPWP" />
  <FormField name="address" label="Alamat" className="md:col-span-2" />
  <FormField name="fiscal_year_start" label="Bulan Mulai Tahun Fiskal" required>
    <Select>
      <SelectItem value="1">Januari</SelectItem>
      <SelectItem value="4">April</SelectItem>
      <SelectItem value="7">Juli</SelectItem>
      <SelectItem value="10">Oktober</SelectItem>
    </Select>
  </FormField>
  <FormField name="currency" label="Mata Uang">
    <Select defaultValue="IDR">
      <SelectItem value="IDR">IDR — Rupiah Indonesia</SelectItem>
      <SelectItem value="USD">USD — US Dollar</SelectItem>
    </Select>
  </FormField>
</FormSection>
```

---

## Step 2 — Pilih Template COA

Grid card per industri:

```tsx
const COA_TEMPLATES = [
  {
    id: 'gas_agent',
    label: 'Agen Gas',
    description: 'COA standar untuk bisnis distribusi gas LPG',
    icon: Flame,
    accountCount: 45,
  },
  {
    id: 'trading',
    label: 'Perdagangan Umum',
    description: 'COA standar untuk bisnis dagang barang',
    icon: ShoppingCart,
    accountCount: 52,
  },
  {
    id: 'service',
    label: 'Jasa',
    description: 'COA standar untuk bisnis jasa dan konsultan',
    icon: Briefcase,
    accountCount: 38,
  },
  {
    id: 'manufacture',
    label: 'Manufaktur',
    description: 'COA standar untuk bisnis produksi',
    icon: Factory,
    accountCount: 68,
  },
  {
    id: 'blank',
    label: 'Kosong',
    description: 'Mulai dari nol, buat COA sendiri',
    icon: FileText,
    accountCount: 0,
  },
]

// Preview akun sebelum konfirmasi
// Klik card → expand panel preview di bawah grid
// Tampilkan tree COA dari template tersebut
```

---

## Step 3 — Account Mapping

Pre-filled dari template COA yang dipilih.
User bisa ubah mapping menggunakan SearchableSelect.

```tsx
// Sections
const MAPPING_SECTIONS = [
  {
    title: 'Penjualan',
    mappings: [
      { key: 'sales.accounts_receivable', label: 'Akun Piutang Usaha (AR)', required: true },
      { key: 'sales.revenue',             label: 'Akun Pendapatan',          required: true },
      { key: 'sales.customer_deposit',    label: 'Akun Deposit Customer',    required: true },
      { key: 'sales.return',              label: 'Akun Retur Penjualan',     required: false },
      { key: 'sales.tax_output',          label: 'Akun Pajak Keluaran',      required: false },
    ]
  },
  {
    title: 'Pembelian',
    mappings: [
      { key: 'purchase.accounts_payable',    label: 'Akun Hutang Usaha (AP)',     required: true },
      { key: 'purchase.expense',             label: 'Akun Beban Pembelian',       required: true },
      { key: 'purchase.vendor_deposit',      label: 'Akun Deposit Vendor',        required: true },
      { key: 'purchase.return',              label: 'Akun Retur Pembelian',       required: false },
      { key: 'purchase.tax_input',           label: 'Akun Pajak Masukan',         required: false },
      { key: 'purchase.inventory_interim',   label: 'Akun Persediaan Interim',    required: false },
    ]
  },
  {
    title: 'Persediaan',
    mappings: [
      { key: 'inventory.asset',             label: 'Akun Aset Persediaan',       required: true },
      { key: 'inventory.cogs',              label: 'Akun HPP',                   required: true },
      { key: 'inventory.adjustment_gain',   label: 'Akun Selisih Lebih Opname', required: false },
      { key: 'inventory.adjustment_loss',   label: 'Akun Selisih Kurang Opname',required: false },
    ]
  },
  {
    title: 'Kas & Bank',
    mappings: [
      { key: 'cash_bank.default_cash',      label: 'Akun Kas Default',           required: true },
      { key: 'cash_bank.default_bank',      label: 'Akun Bank Default',          required: true },
    ]
  },
  {
    title: 'Pembukaan & Penutupan',
    mappings: [
      { key: 'opening_balance.equity',       label: 'Akun Ekuitas Opening',      required: true },
      { key: 'closing.retained_earnings',    label: 'Akun Laba Ditahan',         required: true },
      { key: 'closing.current_year_earnings',label: 'Akun Laba Tahun Berjalan',  required: true },
    ]
  },
]
```

Field required harus diisi sebelum bisa lanjut ke step berikutnya.

---

## Step 4 — Master Data Dasar

Minimal wajib sebelum bisa transaksi:

```tsx
// Warehouse — minimal satu
<MasterDataQuickAdd
  title="Gudang"
  description="Tambahkan minimal satu gudang untuk menyimpan stok."
  addLabel="+ Tambah Gudang"
  fields={['name', 'address']}
  existing={warehouses}
/>

// Satuan — minimal satu
<MasterDataQuickAdd
  title="Satuan"
  description="Tambahkan satuan produk (pcs, kg, liter, tabung, dll.)"
  addLabel="+ Tambah Satuan"
  fields={['name', 'symbol']}
  existing={units}
/>

// Payment Term — minimal satu
<MasterDataQuickAdd
  title="Syarat Pembayaran"
  description="Tambahkan syarat pembayaran (COD, Net 30, dll.)"
  addLabel="+ Tambah Syarat Bayar"
  fields={['name', 'days']}
  existing={paymentTerms}
/>
```

Minimal 1 item per kategori sebelum bisa lanjut.

---

## Step 5 — Opening Balance

```tsx
// Bisa di-skip
<div className="flex items-center justify-between mb-4">
  <h3>Saldo Awal Akun</h3>
  <button onClick={handleSkip} className="text-sm text-[#5c9ead]">
    Lewati, isi nanti →
  </button>
</div>

// Tanggal opening balance
<FormField name="opening_date" label="Tanggal Saldo Awal" required>
  <DatePicker />
</FormField>

// Table input saldo per akun
// Hanya akun yang bisa di-post (bukan parent/header)
<OpeningBalanceTable accounts={postableAccounts} />
```

---

## Step 6 — Selesai

```tsx
<div className="text-center py-12">
  <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
    <CheckCircle className="w-8 h-8 text-[#065F46]" />
  </div>
  <h2 className="text-xl font-semibold text-[#24323a] mb-2">
    Setup Selesai!
  </h2>
  <p className="text-[#64748b] text-sm mb-6">
    Perusahaan Anda sudah siap. Mulai gunakan Seaside Escape ERP.
  </p>

  {/* Summary */}
  <div className="bg-[#f8fbfc] rounded-lg p-4 text-left mb-8 max-w-sm mx-auto">
    <div className="text-xs font-semibold text-[#64748b] uppercase mb-3">Ringkasan Setup</div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-[#64748b]">Template COA</span>
        <span className="font-medium">Agen Gas (45 akun)</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#64748b]">Account Mapping</span>
        <span className="font-medium text-[#065F46]">✓ Selesai</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#64748b]">Gudang</span>
        <span className="font-medium">1 gudang</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#64748b]">Opening Balance</span>
        <span className="font-medium text-[#64748b]">Belum diisi</span>
      </div>
    </div>
  </div>

  <Button
    className="bg-[#e39774] hover:bg-[#d4845e] px-8"
    onClick={() => navigate('/dashboard')}
  >
    Mulai Gunakan Seaside Escape →
  </Button>
</div>
```

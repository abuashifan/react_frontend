# 19 — Settings Module

## Navigasi

Settings diakses via **tab di topbar ribbon**, sejajar dengan modul lain.

### Ribbon Settings:

```
[Perusahaan] [Transaksi] [Standar Akun] [Akun & Periode] 
[Pengguna] [Role & Akses] [Preferensi Saya]
```

Setiap item ribbon membuka workspace settings yang berbeda.
Tidak ada sidebar filter di settings — full width content area.

---

## 1. Perusahaan

```tsx
// Fields
const companySettingsSchema = z.object({
  name:               z.string().min(1),
  address:            z.string().optional(),
  npwp:               z.string().optional(),
  phone:              z.string().optional(),
  email:              z.string().email().optional(),
  fiscal_year_start:  z.number().min(1).max(12),
  currency:           z.string().default('IDR'),
})
```

Form 2-kolom standar. Tombol Simpan di fixed bottom bar.

---

## 2. Transaksi

### Auto-post Setting

```tsx
<FormSection title="Alur Posting Transaksi">
  <div className="md:col-span-2">
    <label className="flex items-start gap-3 cursor-pointer">
      <Switch
        checked={settings.auto_post_enabled}
        onCheckedChange={handleAutoPostChange}
      />
      <div>
        <p className="font-medium text-sm">Auto-post Aktif</p>
        <p className="text-xs text-[#64748b] mt-0.5">
          Transaksi langsung berstatus Posted saat dibuat.
          Draft dan Approve di-skip.
        </p>
      </div>
    </label>
  </div>
</FormSection>
```

### Approval Workflow per Dokumen

Hanya muncul jika **auto-post TIDAK aktif**:

```tsx
{!settings.auto_post_enabled && (
  <FormSection title="Approval Workflow">
    <p className="md:col-span-2 text-xs text-[#64748b]">
      Pilih dokumen yang memerlukan persetujuan sebelum dapat diposting.
    </p>
    {APPROVAL_DOCUMENTS.map(doc => (
      <label key={doc.key} className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={settings.approval_required[doc.key]}
          onCheckedChange={v => updateApproval(doc.key, v)}
        />
        <span className="text-sm">{doc.label}</span>
      </label>
    ))}
  </FormSection>
)}

const APPROVAL_DOCUMENTS = [
  { key: 'sales_quotation',   label: 'Penawaran Penjualan' },
  { key: 'sales_order',       label: 'Sales Order' },
  { key: 'sales_invoice',     label: 'Invoice Penjualan' },
  { key: 'purchase_request',  label: 'Permintaan Pembelian' },
  { key: 'purchase_order',    label: 'Purchase Order' },
  { key: 'vendor_bill',       label: 'Tagihan Vendor' },
  { key: 'stock_adjustment',  label: 'Penyesuaian Stok' },
  { key: 'manual_journal',    label: 'Jurnal Manual' },
]
```

### Format Nomor Dokumen

```tsx
<FormSection title="Format Nomor Dokumen">
  {DOCUMENT_NUMBER_FORMATS.map(doc => (
    <FormField key={doc.key} label={doc.label}>
      <Input
        value={settings.number_formats[doc.key]}
        placeholder={doc.placeholder}
      />
      <p className="text-[10px] text-[#64748b] mt-1">
        Variabel: {'{YYYY}'} tahun, {'{MM}'} bulan, {'{####}'} nomor urut
      </p>
    </FormField>
  ))}
</FormSection>

const DOCUMENT_NUMBER_FORMATS = [
  { key: 'sales_invoice',   label: 'Invoice Penjualan',   placeholder: 'INV-{YYYY}-{####}' },
  { key: 'sales_order',     label: 'Sales Order',          placeholder: 'SO-{YYYY}-{####}' },
  { key: 'delivery_order',  label: 'Delivery Order',       placeholder: 'DO-{YYYY}-{####}' },
  { key: 'purchase_order',  label: 'Purchase Order',       placeholder: 'PO-{YYYY}-{####}' },
  { key: 'vendor_bill',     label: 'Tagihan Vendor',       placeholder: 'BILL-{YYYY}-{####}' },
  { key: 'goods_receipt',   label: 'Penerimaan Barang',    placeholder: 'GR-{YYYY}-{####}' },
  { key: 'manual_journal',  label: 'Jurnal Manual',        placeholder: 'JNL-{YYYY}-{####}' },
]
```

### Session Timeout

```tsx
<FormSection title="Keamanan">
  <FormField label="Batas Waktu Sesi (menit)">
    <Select value={String(settings.session_timeout_minutes)}>
      <SelectItem value="15">15 menit</SelectItem>
      <SelectItem value="30">30 menit (default)</SelectItem>
      <SelectItem value="60">60 menit</SelectItem>
      <SelectItem value="120">120 menit</SelectItem>
    </Select>
    <p className="text-[10px] text-[#64748b] mt-1">
      User akan otomatis logout setelah tidak aktif selama waktu ini.
    </p>
  </FormField>
</FormSection>
```

---

## 3. Standar Akun (Account Mapping)

Semua field menggunakan **SearchableSelect** — ketik nama atau kode akun.

```tsx
const ACCOUNT_MAPPING_SECTIONS = [
  {
    title: 'Penjualan',
    mappings: [
      { key: 'sales.accounts_receivable', label: 'Akun Piutang Usaha (AR)', required: true },
      { key: 'sales.revenue',             label: 'Akun Pendapatan',          required: true },
      { key: 'sales.customer_deposit',    label: 'Akun Deposit Customer',    required: true },
      { key: 'sales.return',              label: 'Akun Retur Penjualan',     required: false },
      { key: 'sales.tax_output',          label: 'Akun Pajak Keluaran (PPN Keluaran)', required: false },
    ]
  },
  {
    title: 'Pembelian',
    mappings: [
      { key: 'purchase.accounts_payable',   label: 'Akun Hutang Usaha (AP)',      required: true },
      { key: 'purchase.expense',            label: 'Akun Beban Pembelian',        required: true },
      { key: 'purchase.vendor_deposit',     label: 'Akun Deposit Vendor',         required: true },
      { key: 'purchase.return',             label: 'Akun Retur Pembelian',        required: false },
      { key: 'purchase.tax_input',          label: 'Akun Pajak Masukan (PPN Masukan)', required: false },
      { key: 'purchase.inventory_interim',  label: 'Akun Persediaan Interim (GRNI)', required: false },
    ]
  },
  {
    title: 'Persediaan',
    mappings: [
      { key: 'inventory.asset',            label: 'Akun Aset Persediaan',        required: true },
      { key: 'inventory.cogs',             label: 'Akun Harga Pokok Penjualan',  required: true },
      { key: 'inventory.adjustment_gain',  label: 'Akun Selisih Lebih Opname',  required: false },
      { key: 'inventory.adjustment_loss',  label: 'Akun Selisih Kurang Opname', required: false },
    ]
  },
  {
    title: 'Kas & Bank',
    mappings: [
      { key: 'cash_bank.default_cash', label: 'Akun Kas Default',  required: true },
      { key: 'cash_bank.default_bank', label: 'Akun Bank Default', required: true },
    ]
  },
  {
    title: 'Pembukaan & Penutupan',
    mappings: [
      { key: 'opening_balance.equity',        label: 'Akun Ekuitas Opening Balance', required: true },
      { key: 'closing.retained_earnings',     label: 'Akun Laba Ditahan',            required: true },
      { key: 'closing.current_year_earnings', label: 'Akun Laba Tahun Berjalan',     required: true },
    ]
  },
]
```

**Warning saat mengubah mapping:**
```
⚠️ Perubahan standar akun akan mempengaruhi semua transaksi
   yang diposting setelah perubahan ini disimpan.
   Transaksi yang sudah diposting tidak berubah.
```

---

## 4. Akun & Periode

```tsx
// Fiscal Year status
// Period lock management
// Sesuai endpoint:
// GET  /accounting/fiscal-year/status
// PATCH /accounting/fiscal-years/{id}/close
// PATCH /accounting/fiscal-years/{id}/reopen
// PATCH /accounting/period-locks
```

Tampilkan daftar tahun fiskal dengan status dan tombol aksi.
Period lock: input tanggal lock + tombol Apply.

---

## 5. Pengguna

```tsx
// List user dengan DataTable standar
// Kolom: Nama | Email | Role | Status | Terakhir Login
// Aksi: Tambah User | Nonaktifkan | Reset Password (oleh admin)

// Tidak ada lupa password di login page
// Reset password hanya bisa dilakukan admin dari sini
```

---

## 6. Role & Akses

```tsx
// Daftar role yang tersedia
// Klik role → tampilkan daftar permission dengan checkbox
// Permission dikelompokkan per modul

const PERMISSION_GROUPS = [
  {
    module: 'Penjualan',
    permissions: [
      'sales.quotations.view', 'sales.quotations.create', 'sales.quotations.approve',
      'sales.orders.view', 'sales.orders.create', 'sales.orders.approve',
      'sales.invoices.view', 'sales.invoices.create', 'sales.invoices.post', 'sales.invoices.void',
      // dst...
    ]
  },
  // dst per modul
]
```

---

## 7. Preferensi Saya

Setting personal per user — tidak mempengaruhi user lain:

```tsx
const userPreferencesSchema = z.object({
  language:       z.enum(['id', 'en']).default('id'),
  date_format:    z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  number_format:  z.enum(['1.000,00', '1,000.00']).default('1.000,00'),
})
```

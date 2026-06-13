# 13 — Filter & Search

## Arsitektur Filter

Filter panel adalah **contextual** — konten filter ditentukan oleh:
1. Modul aktif (Sales, Purchase, Inventory, dll.)
2. Workspace aktif (Invoice, Receipt, Jurnal, Aktiva, dll.)
3. Company setting (auto-post ON/OFF → filter status muncul/tidak)

Filter state disimpan di URL query params — sehingga URL bisa di-share dan di-bookmark.

---

## Filter Universal (Semua Workspace)

### Search Bar

```tsx
// Selalu ada di bagian atas content area (bukan sidebar)
// Bukan di dalam sidebar filter

<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
  <input
    type="text"
    placeholder="Cari di semua kolom..."
    className="w-full pl-9 pr-4 h-9 rounded-md border border-[#d9e2e5] 
               bg-white text-[13px] lg:text-sm
               focus:outline-none focus:ring-2 focus:ring-[#5c9ead]"
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
  />
</div>
```

Behavior:
- Debounce 400ms sebelum trigger API search
- Search semua kolom (backend yang handle)
- Clear button (×) muncul jika ada query

---

## Filter per Workspace

### Filter Map

```typescript
// Konfigurasi filter per workspace
const filterConfig: Record<string, FilterConfig[]> = {

  // Sales & AR — semua workspace kecuali disebutkan
  'sales.invoices': [
    FILTER_DATE_RANGE,
    FILTER_PAYMENT_STATUS,
    FILTER_CUSTOMER,
    FILTER_DOCUMENT_STATUS,  // Hanya jika auto-post DISABLED
  ],
  'sales.orders': [
    FILTER_DATE_RANGE,
    FILTER_CUSTOMER,
    FILTER_DOCUMENT_STATUS,
  ],
  'sales.receipts': [
    FILTER_DATE_RANGE,
    FILTER_CUSTOMER,
  ],
  'sales.quotations': [
    FILTER_DATE_RANGE,
    FILTER_CUSTOMER,
    FILTER_DOCUMENT_STATUS,
  ],

  // Purchase & AP
  'purchase.bills': [
    FILTER_DATE_RANGE,
    FILTER_PAYMENT_STATUS,
    FILTER_VENDOR,
    FILTER_DOCUMENT_STATUS,
  ],
  'purchase.orders': [
    FILTER_DATE_RANGE,
    FILTER_VENDOR,
    FILTER_DOCUMENT_STATUS,
  ],

  // Inventory — tidak ada date filter
  'inventory.stock-balances': [
    FILTER_PRODUCT_TYPE,
    FILTER_PRODUCT_CATEGORY,
  ],
  'inventory.stock-movements': [
    FILTER_DATE_RANGE,
    FILTER_MOVEMENT_TYPE,
  ],

  // Jurnal Umum
  'accounting.journals': [
    FILTER_DATE_RANGE,
    FILTER_JOURNAL_TYPE,
    FILTER_DOCUMENT_STATUS,
  ],

  // Aktiva
  'master-data.assets': [
    FILTER_ASSET_TYPE,
    FILTER_DEPRECIATION_METHOD,
  ],

  // Master Produk
  'master-data.products': [
    FILTER_PRODUCT_TYPE,
    FILTER_PRODUCT_CATEGORY,
    FILTER_INVENTORY_TYPE,
  ],
}
```

---

## Filter Components

### Filter Date Range

```tsx
// Tampil di semua workspace kecuali Persediaan/Stock Balance
<FilterSection title="Periode">
  <div className="space-y-2">
    <label className="text-xs font-medium text-[#64748b]">Dari</label>
    <input
      type="date"
      value={filters.date_from}
      onChange={e => updateFilter('date_from', e.target.value)}
      className="w-full h-8 px-2 text-xs rounded-md border border-[#d9e2e5]"
    />
    <label className="text-xs font-medium text-[#64748b]">Sampai</label>
    <input
      type="date"
      value={filters.date_to}
      onChange={e => updateFilter('date_to', e.target.value)}
      className="w-full h-8 px-2 text-xs rounded-md border border-[#d9e2e5]"
    />
  </div>

  {/* Quick date shortcuts */}
  <div className="flex flex-wrap gap-1 mt-2">
    {['Hari ini', 'Minggu ini', 'Bulan ini', 'Tahun ini'].map(label => (
      <button
        key={label}
        onClick={() => applyDatePreset(label)}
        className="text-[10px] px-2 py-1 rounded bg-[#f1f5f9] text-[#475569] 
                   hover:bg-[#e2e8f0] hover:text-[#326273]"
      >
        {label}
      </button>
    ))}
  </div>
</FilterSection>
```

### Filter Payment Status (AR/AP)

```tsx
// Untuk workspace Invoice, Bill, AR, AP
<FilterSection title="Status Pembayaran">
  {[
    { value: 'nihil', label: 'Nihil' },
    { value: 'unpaid', label: 'Belum Dibayar' },
    { value: 'partial_paid', label: 'Sebagian Dibayar' },
    { value: 'paid', label: 'Lunas' },
  ].map(option => (
    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
      <Checkbox
        checked={filters.payment_status?.includes(option.value)}
        onCheckedChange={(checked) => toggleFilter('payment_status', option.value, checked)}
      />
      <span className="text-xs text-[#24323a]">{option.label}</span>
    </label>
  ))}
</FilterSection>
```

### Filter Customer / Vendor

```tsx
// SearchableSelect untuk pilih customer/vendor
<FilterSection title="Customer">
  <SearchableSelect
    value={filters.customer_id}
    onChange={(id) => updateFilter('customer_id', id)}
    onSearch={searchCustomers}
    placeholder="Pilih customer..."
  />
</FilterSection>
```

### Filter Status Dokumen

```tsx
// HANYA TAMPIL jika auto-post DISABLED
{!isAutoPost && (
  <FilterSection title="Status Dokumen">
    {availableStatuses.map(status => (
      <label key={status} className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={filters.status?.includes(status)}
          onCheckedChange={(checked) => toggleFilter('status', status, checked)}
        />
        <DocumentStatusBadge status={status} size="sm" />
      </label>
    ))}
  </FilterSection>
)}
```

### Filter Journal Type

```tsx
// Hanya di workspace Jurnal Umum
<FilterSection title="Tipe Jurnal">
  {[
    { value: 'manual', label: 'Jurnal Umum' },
    { value: 'inventory_rollover', label: 'Barang Roll Over' },
    { value: 'period_closing', label: 'Akhir Periode' },
    { value: 'depreciation', label: 'Depresiasi' },
  ].map(option => (
    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
      <Checkbox ... />
      <span className="text-xs">{option.label}</span>
    </label>
  ))}
</FilterSection>

// Jurnal system-generated = read-only, tampilkan badge
```

### Filter Asset (Aktiva)

```tsx
<FilterSection title="Tipe Aset">
  <Select value={filters.asset_type} onValueChange={v => updateFilter('asset_type', v)}>
    <SelectItem value="">Semua</SelectItem>
    <SelectItem value="tangible">Aset Berwujud</SelectItem>
    <SelectItem value="intangible">Aset Tidak Berwujud</SelectItem>
  </Select>
</FilterSection>

<FilterSection title="Metode Penyusutan">
  <Select value={filters.depreciation_method} onValueChange={v => updateFilter('depreciation_method', v)}>
    <SelectItem value="">Semua</SelectItem>
    <SelectItem value="straight_line">Garis Lurus</SelectItem>
    <SelectItem value="declining_balance">Saldo Menurun</SelectItem>
  </Select>
</FilterSection>
```

### Filter Produk (Master Barang)

```tsx
<FilterSection title="Tipe Barang">
  {[
    { value: 'service', label: 'Jasa' },
    { value: 'inventory', label: 'Persediaan' },
    { value: 'non_inventory', label: 'Non-Persediaan' },
  ].map(option => (
    <label key={option.value} className="flex items-center gap-2">
      <Checkbox ... />
      <span className="text-xs">{option.label}</span>
    </label>
  ))}
</FilterSection>

<FilterSection title="Kategori">
  <SearchableSelect
    value={filters.category_id}
    onChange={v => updateFilter('category_id', v)}
    onSearch={searchCategories}
    placeholder="Pilih kategori..."
  />
</FilterSection>
```

---

## Filter Sidebar Structure

```tsx
// FilterSidebar.tsx
<aside className={cn(
  "h-full bg-white border-r border-[#d9e2e5] overflow-y-auto",
  "transition-all duration-200",
  isCollapsed ? "w-0 overflow-hidden" : "w-[220px]"
)}>
  <div className="p-3">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
        Filter
      </span>
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="text-[10px] text-[#5c9ead] hover:text-[#326273]"
        >
          Reset
        </button>
      )}
    </div>

    {/* Active filter count badge */}
    {activeFilterCount > 0 && (
      <div className="mb-3 px-2 py-1 bg-[#EFF9FB] rounded text-xs text-[#326273]">
        {activeFilterCount} filter aktif
      </div>
    )}

    {/* Dynamic filter sections */}
    {filterConfigs.map(config => (
      <DynamicFilterSection key={config.id} config={config} ... />
    ))}
  </div>
</aside>
```

---

## Filter State di URL

```typescript
// Filter state di-sync ke URL query params
// Contoh URL: /sales/invoices?page=1&per_page=25&status=posted&date_from=2026-01-01

// Hook untuk sync filter ke URL
export function useFilterState(defaults: FilterDefaults) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => ({
    page: Number(searchParams.get('page') || '1'),
    per_page: (Number(searchParams.get('per_page') || '25')) as 25 | 50 | 100,
    search: searchParams.get('search') || '',
    status: searchParams.getAll('status'),
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    customer_id: searchParams.get('customer_id')
      ? Number(searchParams.get('customer_id'))
      : undefined,
    payment_status: searchParams.getAll('payment_status'),
    ...defaults,
  }), [searchParams])

  const updateFilter = (key: string, value: unknown) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === '' || value === null || value === undefined) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
      next.set('page', '1')  // Reset ke page 1 saat filter berubah
      return next
    })
  }

  return { filters, updateFilter }
}
```

---

## FilterSection Component

```tsx
// Wrapper untuk setiap grup filter
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-[#d9e2e5] pb-3 mb-3 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide">
          {title}
        </span>
        <ChevronDown className={cn(
          "w-3 h-3 text-[#64748b] transition-transform",
          !isOpen && "-rotate-90"
        )} />
      </button>
      {isOpen && <div className="space-y-1.5">{children}</div>}
    </div>
  )
}
```

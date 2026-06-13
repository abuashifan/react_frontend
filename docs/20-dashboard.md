# 20 — Dashboard

## Overview

Dashboard adalah halaman pertama setelah login.
Route: `/dashboard`

**Prinsip:** Menjawab satu pertanyaan — *"Apa yang perlu aku perhatikan hari ini?"*

**Permission-aware:** Widget yang butuh permission tertentu tidak dirender jika user tidak punya akses. Layout dan struktur sama untuk semua user.

---

## Layout

```
┌────────────────────────────────────────────────────────┐
│  TOPBAR                                                │
├────────────────────────────────────────────────────────┤
│  (tidak ada ribbon di dashboard)                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Section 1 — KPI Cards (4 kolom)                      │
│  [Piutang] [Hutang] [Kas & Bank] [Laba Bulan Ini]     │
│                                                        │
│  Section 2 — Dokumen Pending                          │
│  Alert cards yang butuh perhatian                     │
│                                                        │
│  Section 3 — Grafik (2 kolom)                        │
│  [Penjualan vs Pembelian]  [Arus Kas]                 │
│                                                        │
│  Section 4 — Aktivitas Terbaru                        │
│  List transaksi terakhir                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Section 1 — KPI Cards

```tsx
// 4 kartu dalam satu baris
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard
    title="Total Piutang"
    value={summary.total_receivable}
    trend={summary.receivable_trend}
    permission="sales.ar.view"
    icon={TrendingUp}
    color="teal"
  />
  <KpiCard
    title="Total Hutang"
    value={summary.total_payable}
    trend={summary.payable_trend}
    permission="purchase.ap.view"
    icon={TrendingDown}
    color="coral"
  />
  <KpiCard
    title="Kas & Bank"
    value={summary.cash_balance}
    permission="cash_bank.view"
    icon={Wallet}
    color="teal"
  />
  <KpiCard
    title="Laba Bulan Ini"
    value={summary.current_month_profit}
    trend={summary.profit_trend}
    permission="reports.view"
    icon={BarChart2}
    color={summary.current_month_profit >= 0 ? 'green' : 'red'}
  />
</div>
```

### KpiCard Component

```tsx
interface KpiCardProps {
  title: string
  value: string | number
  trend?: number        // persentase vs bulan lalu
  permission?: string
  icon: LucideIcon
  color: 'teal' | 'coral' | 'green' | 'red'
}

// Styling
<div className="bg-white rounded-lg border border-[#d9e2e5] p-4">
  <div className="flex items-center justify-between mb-3">
    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
      {title}
    </span>
    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", iconBg)}>
      <Icon className="w-4 h-4" />
    </div>
  </div>
  <div className="text-xl font-bold tabular-nums text-[#24323a]">
    {formatCurrency(value)}
  </div>
  {trend !== undefined && (
    <div className={cn("text-xs mt-1", trend >= 0 ? "text-[#065F46]" : "text-[#991B1B]")}>
      {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs bulan lalu
    </div>
  )}
</div>
```

---

## Section 2 — Dokumen Pending

Alert cards yang menunjukkan item yang butuh perhatian segera.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">

  {/* Invoice menunggu approval */}
  <PermissionGuard permission="sales.invoices.approve">
    {pendingApprovals.invoices > 0 && (
      <PendingCard
        icon={FileText}
        label="Invoice menunggu approval"
        count={pendingApprovals.invoices}
        href="/sales/invoices?status=draft"
        variant="warning"
      />
    )}
  </PermissionGuard>

  {/* Bill menunggu pembayaran */}
  <PermissionGuard permission="purchase.ap.view">
    {pendingPayments.bills > 0 && (
      <PendingCard
        icon={Receipt}
        label="Tagihan menunggu pembayaran"
        count={pendingPayments.bills}
        href="/purchase/bills?payment_status=unpaid"
        variant="warning"
      />
    )}
  </PermissionGuard>

  {/* Stok di bawah minimum */}
  <PermissionGuard permission="inventory.stock.view">
    {lowStock.count > 0 && (
      <PendingCard
        icon={Package}
        label="Produk stok di bawah minimum"
        count={lowStock.count}
        href="/inventory/reports/low-stock"
        variant="danger"
      />
    )}
  </PermissionGuard>

  {/* Warning periode akuntansi */}
  <PermissionGuard permission="accounting.fiscal-years.manage">
    {fiscalYear.days_remaining <= 30 && (
      <PendingCard
        icon={Calendar}
        label={`Periode akuntansi berakhir dalam ${fiscalYear.days_remaining} hari`}
        href="/settings/akun-periode"
        variant="info"
      />
    )}
  </PermissionGuard>

</div>
```

### PendingCard Component

```tsx
interface PendingCardProps {
  icon: LucideIcon
  label: string
  count?: number
  href: string
  variant: 'warning' | 'danger' | 'info'
}

const variantStyles = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger:  'border-red-200 bg-red-50 text-red-800',
  info:    'border-[#d9e2e5] bg-[#EFF9FB] text-[#326273]',
}

// Render
<Link to={href}>
  <div className={cn(
    "flex items-center justify-between p-3 rounded-lg border cursor-pointer",
    "transition-opacity hover:opacity-80",
    variantStyles[variant]
  )}>
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {count && (
        <span className="text-xs font-bold tabular-nums">{count}</span>
      )}
      <ChevronRight className="w-3 h-3 opacity-60" />
    </div>
  </div>
</Link>
```

---

## Section 3 — Grafik (Recharts)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {/* Penjualan vs Pembelian — 6 bulan */}
  <PermissionGuard permission="reports.view">
    <ChartCard title="Penjualan vs Pembelian" subtitle="6 bulan terakhir">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={salesVsPurchaseData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d9e2e5" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(v) => formatCurrencyShort(v)}
          />
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{ fontSize: 12, borderColor: '#d9e2e5' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="penjualan"
            name="Penjualan"
            stroke="#5c9ead"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="pembelian"
            name="Pembelian"
            stroke="#e39774"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  </PermissionGuard>

  {/* Arus Kas — 3 bulan */}
  <PermissionGuard permission="reports.view">
    <ChartCard title="Arus Kas" subtitle="3 bulan terakhir">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={cashFlowData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d9e2e5" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(v) => formatCurrencyShort(v)}
          />
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{ fontSize: 12, borderColor: '#d9e2e5' }}
          />
          <Bar dataKey="masuk"  name="Penerimaan" fill="#5c9ead" radius={[3,3,0,0]} />
          <Bar dataKey="keluar" name="Pengeluaran" fill="#e39774" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  </PermissionGuard>

</div>
```

### ChartCard Component

```tsx
interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

<div className="bg-white rounded-lg border border-[#d9e2e5] p-4">
  <div className="mb-4">
    <h3 className="text-sm font-semibold text-[#24323a]">{title}</h3>
    {subtitle && (
      <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>
    )}
  </div>
  {children}
</div>
```

---

## Section 4 — Aktivitas Terbaru

```tsx
<div className="bg-white rounded-lg border border-[#d9e2e5]">
  <div className="p-4 border-b border-[#d9e2e5] flex items-center justify-between">
    <h3 className="text-sm font-semibold text-[#24323a]">Aktivitas Terbaru</h3>
    <span className="text-xs text-[#64748b]">10 transaksi terakhir</span>
  </div>

  <div className="divide-y divide-[#d9e2e5]">
    {recentActivities.map(activity => (
      <Link key={activity.id} to={activity.href}>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fbfc] transition-colors">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
            activity.iconBg
          )}>
            <activity.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#24323a] truncate">
              {activity.title}
            </p>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              {activity.subtitle}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-medium tabular-nums text-[#24323a]">
              {formatCurrency(activity.amount)}
            </p>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              {formatTimeAgo(activity.created_at)}
            </p>
          </div>
          <DocumentStatusBadge status={activity.status} size="sm" />
        </div>
      </Link>
    ))}
  </div>
</div>
```

---

## API Calls Dashboard

```typescript
// Semua data dashboard dari endpoint dedicated
// GET /reports/financial-summary
// GET /sales/ar/open-invoices (untuk pending count)
// GET /purchase/ap/open-bills (untuk pending count)
// GET /inventory/reports/low-stock (untuk low stock count)
// GET /accounting/fiscal-year/status

// Semua di-fetch parallel dengan Promise.all via TanStack Query
export function useDashboardData() {
  return useQueries({
    queries: [
      { queryKey: ['dashboard-summary'],    queryFn: dashboardApi.summary },
      { queryKey: ['dashboard-pending'],    queryFn: dashboardApi.pending },
      { queryKey: ['dashboard-chart'],      queryFn: dashboardApi.chartData },
      { queryKey: ['dashboard-activities'], queryFn: dashboardApi.recentActivities },
    ]
  })
}
```

---

## Loading State

Semua section menggunakan skeleton saat loading:

```tsx
// KPI cards skeleton
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {Array.from({length: 4}).map((_, i) => (
    <div key={i} className="bg-white rounded-lg border border-[#d9e2e5] p-4">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  ))}
</div>
```

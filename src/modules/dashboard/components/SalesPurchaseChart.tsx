import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { ChartMonthData } from '../types/dashboard.types'

function formatShort(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

interface Props { data?: ChartMonthData[]; isLoading?: boolean; isUnavailable?: boolean }

export function SalesPurchaseChart({ data, isLoading, isUnavailable }: Props) {
  return (
    <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
      <p className="mb-1 text-[13px] font-semibold text-[#1e293b]">Penjualan vs Pembelian</p>
      <p className="mb-4 text-[11px] text-[#64748b]">6 bulan terakhir</p>
      {isUnavailable ? (
        <div className="h-[200px]">
          <EmptyState title="Grafik belum tersedia" description="Endpoint chart dashboard belum tersedia." />
        </div>
      ) : isLoading ? (
        <div className="flex h-[200px] items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5c9ead] border-t-transparent" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2e5" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatShort} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v))]} contentStyle={{ fontSize: 12, borderColor: '#d9e2e5', borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="penjualan" name="Penjualan" stroke="#5c9ead" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pembelian" name="Pembelian" stroke="#e39774" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CashFlowMonthData } from '../types/dashboard.types'

function formatShort(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

interface Props { data?: CashFlowMonthData[]; isLoading?: boolean }

export function CashFlowChart({ data, isLoading }: Props) {
  return (
    <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
      <p className="mb-1 text-[13px] font-semibold text-[#1e293b]">Arus Kas</p>
      <p className="mb-4 text-[11px] text-[#64748b]">3 bulan terakhir</p>
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5c9ead] border-t-transparent" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2e5" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatShort} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v))]} contentStyle={{ fontSize: 12, borderColor: '#d9e2e5', borderRadius: 6 }} />
            <Bar dataKey="masuk" name="Penerimaan" fill="#5c9ead" radius={[3, 3, 0, 0]} />
            <Bar dataKey="keluar" name="Pengeluaran" fill="#e39774" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

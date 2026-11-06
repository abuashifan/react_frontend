import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { useAdminPlans, useClientUserMutations } from '../hooks/useClientUsers'
import type { ClientPosSubscription, ClientUser } from '@/types/admin.types'

const STATE_LABELS: Record<ClientPosSubscription['state'], string> = {
  none: 'Belum berlangganan',
  active: 'Aktif',
  grace: 'Masa tenggang',
  expired: 'Habis (hanya-baca)',
  cancelled: 'Dibatalkan',
}

const STATE_BADGE_CLASS: Record<ClientPosSubscription['state'], string> = {
  none: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
  active: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]',
  grace: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]',
  expired: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]',
}

const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-[#64748b]'
const statLabelClass = 'text-[#94a3b8] uppercase text-[10px] font-semibold tracking-wide'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatLimit(value: number | null | undefined): string {
  return value === null || value === undefined ? 'Tanpa batas' : String(value)
}

function formatPrice(value: string): string {
  const amount = Number(value)
  return amount > 0 ? `Rp ${amount.toLocaleString('id-ID')}` : 'Rp 0'
}

/**
 * Langganan Finlite Kasir milik client. Terpisah dari paket akuntansi
 * (`users.plan_id`): client Kasir bisa tidak punya paket akuntansi sama sekali.
 * Langganan habis membuat toko hanya-baca, tidak mengunci login.
 * Pembayaran masih manual: admin memulai/memperpanjang setelah uang diterima.
 */
export function PosSubscriptionSection({ client }: { client: ClientUser }) {
  const { toast } = useToast()
  const { subscribe, renew, unlock } = useClientUserMutations()
  const { data: plansResponse } = useAdminPlans('pos')
  const plans = plansResponse?.data ?? []

  const sub = client.pos_subscription
  const state = sub?.state ?? 'none'
  const currentPlanId = plans.find((plan) => plan.code === sub?.plan_code)?.id
  const [planId, setPlanId] = useState<number | null>(null)
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')

  const selectedPlanId = planId ?? currentPlanId ?? plans.find((plan) => plan.code === 'pos')?.id ?? null
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null
  const locked = state === 'expired' || state === 'cancelled'
  const busy = subscribe.isPending || renew.isPending || unlock.isPending
  const history = client.subscription.history.filter((row) => row.product === 'pos')

  const handleSave = async () => {
    if (!selectedPlanId) {
      toast.error('Pilih paket Kasir dulu.')
      return
    }
    try {
      if (state === 'none') {
        await subscribe.mutateAsync({ id: client.id, payload: { plan_id: selectedPlanId, billing_cycle: cycle } })
        toast.success('Langganan Kasir dimulai.')
      } else {
        await renew.mutateAsync({
          id: client.id,
          payload: { plan_id: selectedPlanId, billing_cycle: cycle, product: 'pos' },
        })
        toast.success('Langganan Kasir diperpanjang.')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan langganan Kasir.'))
    }
  }

  const handleUnlock = async () => {
    try {
      await unlock.mutateAsync({ id: client.id, product: 'pos' })
      toast.success('Toko Kasir dibuka kembali selama 7 hari.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuka toko.'))
    }
  }

  return (
    <section className="bg-white border border-[#d9e2e5] rounded-lg p-5 mt-3 flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-[14px] font-semibold text-[#24323a]">Langganan Finlite Kasir</h2>
          <Badge className={cn('text-[10px] px-1.5 py-0', STATE_BADGE_CLASS[state])}>{STATE_LABELS[state]}</Badge>
          {sub?.is_trial && (
            <Badge className="text-[10px] px-1.5 py-0 bg-[#EFF9FB] text-[#326273] hover:bg-[#EFF9FB]">
              Masa coba
            </Badge>
          )}
          {!client.email_verified && (
            <Badge className="text-[10px] px-1.5 py-0 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]">
              Email belum diverifikasi
            </Badge>
          )}
        </div>
        <p className="text-[12px] text-[#64748b]">
          Terpisah dari paket Finlite Accounting. Saat habis, toko jadi hanya-baca: data tetap bisa
          dilihat, transaksi baru tidak bisa disimpan. Login tidak dikunci.
        </p>
      </div>

      {sub && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
          <div>
            <p className={statLabelClass}>Paket</p>
            <p className="text-[#24323a] mt-0.5">{sub.plan_name ?? '—'}</p>
          </div>
          <div>
            <p className={statLabelClass}>Berakhir</p>
            <p className="text-[#24323a] mt-0.5 tabular-nums">{formatDate(sub.ends_at)}</p>
          </div>
          <div>
            <p className={statLabelClass}>Sisa Hari</p>
            <p className={cn('mt-0.5 tabular-nums font-semibold', locked ? 'text-[#991B1B]' : 'text-[#24323a]')}>
              {sub.days_remaining ?? '—'}
            </p>
          </div>
          <div>
            <p className={statLabelClass}>Batas</p>
            <p className="text-[#24323a] mt-0.5 tabular-nums">
              {formatLimit(sub.limits?.users)} pengguna · {formatLimit(sub.limits?.products)} produk
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-[#f1f5f9] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">
          {state === 'none' ? 'Mulai Langganan Kasir' : 'Perpanjang / Ganti Paket Kasir'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-col gap-1 flex-1">
            <Label className={labelClass}>Paket</Label>
            <select
              className={selectClass}
              value={selectedPlanId ?? ''}
              onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : null)}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {plan.max_users} pengguna, {formatLimit(plan.max_products).toLowerCase()} produk
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:w-40">
            <Label className={labelClass}>Siklus</Label>
            <select
              className={selectClass}
              value={cycle}
              onChange={(e) => setCycle(e.target.value as 'monthly' | 'yearly')}
            >
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy || !selectedPlanId}
            className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]"
          >
            {busy ? 'Menyimpan...' : state === 'none' ? 'Mulai Langganan' : 'Perpanjang'}
          </Button>
        </div>
        {selectedPlan && (
          <p className="text-[11px] text-[#64748b] mt-2 tabular-nums">
            Harga tercatat: {formatPrice(cycle === 'yearly' ? selectedPlan.yearly_price : selectedPlan.monthly_price)}
            {cycle === 'yearly' ? ' / tahun' : ' / bulan'}. Perpanjangan dimulai tepat saat periode
            sebelumnya berakhir.
          </p>
        )}
      </div>

      {locked && (
        <div className="border-t border-[#f1f5f9] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">Jalur Pemulihan</p>
          <p className="text-[12px] text-[#64748b] mb-2">
            Membuka toko selama masa tenggang 7 hari tanpa mencatat pembayaran.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleUnlock()}
            disabled={busy}
            className="h-9 text-[13px]"
          >
            {unlock.isPending ? 'Membuka...' : 'Buka Toko (7 hari)'}
          </Button>
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-[#f1f5f9] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">Riwayat Kasir</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[#94a3b8] border-b border-[#f1f5f9]">
                  <th className="py-1.5 font-medium">Paket</th>
                  <th className="py-1.5 font-medium">Siklus</th>
                  <th className="py-1.5 font-medium">Harga</th>
                  <th className="py-1.5 font-medium">Mulai</th>
                  <th className="py-1.5 font-medium">Berakhir</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-[#f8fafc] last:border-0">
                    <td className="py-1.5 text-[#24323a]">{row.plan_name ?? '—'}</td>
                    <td className="py-1.5 text-[#24323a]">{row.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</td>
                    <td className="py-1.5 text-[#24323a] tabular-nums">{row.price}</td>
                    <td className="py-1.5 text-[#24323a] tabular-nums">{formatDate(row.starts_at)}</td>
                    <td className="py-1.5 text-[#24323a] tabular-nums">{formatDate(row.ends_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

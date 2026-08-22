import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { useAdminPlans, useClientUserMutations } from '../hooks/useClientUsers'
import type { AdminPlan, ClientUser } from '@/types/admin.types'

const STATE_LABELS: Record<ClientUser['subscription']['state'], string> = {
  none: 'Belum pernah berlangganan',
  active: 'Aktif',
  grace: 'Masa tenggang',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
}

const STATE_BADGE_CLASS: Record<ClientUser['subscription']['state'], string> = {
  none: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
  active: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]',
  grace: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]',
  expired: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]',
}

const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Tab Siklus Langganan (Fase 3, skema tier §4d) — terpisah dari tab "Kuota
 * Paket" (`plan_id`, jumlah perusahaan/user): itu menentukan APA yang boleh
 * dipakai client, ini menentukan SAMPAI KAPAN. Dua sumbu yang berbeda.
 */
export function SubscriptionCycleSection({ client }: { client: ClientUser }) {
  const { toast } = useToast()
  const { data: plansResponse } = useAdminPlans()
  const plans = plansResponse?.data ?? []
  const { subscribe, renew, unlock } = useClientUserMutations()

  const [planId, setPlanId] = useState<string>('')
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')

  const { subscription } = client
  const locked = subscription.state === 'expired' || subscription.state === 'cancelled'
  const busy = subscribe.isPending || renew.isPending || unlock.isPending

  const handleSubscribe = async () => {
    if (!planId) {
      toast.error('Pilih paket dulu.')
      return
    }
    try {
      await subscribe.mutateAsync({ id: client.id, payload: { plan_id: Number(planId), billing_cycle: cycle } })
      toast.success('Langganan dimulai.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal memulai langganan.'))
    }
  }

  const handleRenew = async () => {
    try {
      await renew.mutateAsync({
        id: client.id,
        payload: planId ? { plan_id: Number(planId), billing_cycle: cycle } : undefined,
      })
      toast.success('Langganan diperpanjang.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal memperpanjang langganan.'))
    }
  }

  const handleUnlock = async () => {
    try {
      await unlock.mutateAsync(client.id)
      toast.success(`Akses ${client.name} dibuka kembali selama 7 hari.`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuka kunci.'))
    }
  }

  return (
    <section className="bg-white border border-[#d9e2e5] rounded-lg p-5 mt-3 flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[14px] font-semibold text-[#24323a]">Siklus Langganan</h2>
          <Badge className={cn('text-[10px] px-1.5 py-0', STATE_BADGE_CLASS[subscription.state])}>
            {STATE_LABELS[subscription.state]}
          </Badge>
        </div>
        <p className="text-[12px] text-[#64748b]">
          Kedaluwarsa mengunci penuh setelah tenggang 7 hari — client tidak bisa login sama sekali
          sampai diperpanjang atau dibuka manual.
        </p>
      </div>

      {subscription.state !== 'none' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
          <div>
            <p className="text-[#94a3b8] uppercase text-[10px] font-semibold tracking-wide">Paket</p>
            <p className="text-[#24323a] mt-0.5">{subscription.plan_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[#94a3b8] uppercase text-[10px] font-semibold tracking-wide">Siklus</p>
            <p className="text-[#24323a] mt-0.5">
              {subscription.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
            </p>
          </div>
          <div>
            <p className="text-[#94a3b8] uppercase text-[10px] font-semibold tracking-wide">Berakhir</p>
            <p className="text-[#24323a] mt-0.5 tabular-nums">{formatDate(subscription.ends_at)}</p>
          </div>
          <div>
            <p className="text-[#94a3b8] uppercase text-[10px] font-semibold tracking-wide">Sisa Hari</p>
            <p className={cn('mt-0.5 tabular-nums font-semibold', locked ? 'text-[#991B1B]' : 'text-[#24323a]')}>
              {subscription.days_remaining ?? '—'}
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-[#f1f5f9] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">
          {subscription.state === 'none' ? 'Mulai Langganan' : 'Perpanjang / Ganti Paket'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-col gap-1 flex-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Paket {subscription.state !== 'none' && '(kosongkan untuk lanjut paket sama)'}
            </Label>
            <select className={selectClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">
                {subscription.state === 'none' ? 'Pilih paket' : 'Lanjut paket sekarang'}
              </option>
              {plans.map((plan: AdminPlan) => (
                <option key={plan.id} value={String(plan.id)}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:w-40">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Siklus
            </Label>
            <select
              className={selectClass}
              value={cycle}
              onChange={(e) => setCycle(e.target.value as 'monthly' | 'yearly')}
            >
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          {subscription.state === 'none' ? (
            <Button
              type="button"
              onClick={() => void handleSubscribe()}
              disabled={busy}
              className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]"
            >
              {subscribe.isPending ? 'Memulai...' : 'Mulai Langganan'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleRenew()}
              disabled={busy}
              className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]"
            >
              {renew.isPending ? 'Memperpanjang...' : 'Perpanjang'}
            </Button>
          )}
        </div>
      </div>

      {locked && (
        <div className="border-t border-[#f1f5f9] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">
            Jalur Pemulihan
          </p>
          <p className="text-[12px] text-[#64748b] mb-2">
            Membuka akses selama 7 hari lagi TANPA mencatatnya sebagai perpanjangan berbayar — dipakai
            saat client butuh akses sementara sebelum benar-benar membayar.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleUnlock()}
            disabled={busy}
            className="h-9 text-[13px]"
          >
            {unlock.isPending ? 'Membuka...' : 'Buka Kunci (7 hari)'}
          </Button>
        </div>
      )}

      {subscription.history.length > 0 && (
        <div className="border-t border-[#f1f5f9] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">
            Riwayat Penagihan
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[#94a3b8] border-b border-[#f1f5f9]">
                  <th className="py-1.5 font-medium">Paket</th>
                  <th className="py-1.5 font-medium">Siklus</th>
                  <th className="py-1.5 font-medium">Harga</th>
                  <th className="py-1.5 font-medium">Mulai</th>
                  <th className="py-1.5 font-medium">Berakhir</th>
                  <th className="py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscription.history.map((row) => (
                  <tr key={row.id} className="border-b border-[#f8fafc] last:border-0">
                    <td className="py-1.5 text-[#24323a]">{row.plan_name ?? '—'}</td>
                    <td className="py-1.5 text-[#24323a]">
                      {row.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                    </td>
                    <td className="py-1.5 text-[#24323a] tabular-nums">{row.price}</td>
                    <td className="py-1.5 text-[#24323a] tabular-nums">{formatDate(row.starts_at)}</td>
                    <td className="py-1.5 text-[#24323a] tabular-nums">{formatDate(row.ends_at)}</td>
                    <td className="py-1.5 text-[#24323a]">
                      {row.cancelled_at ? 'Dibatalkan' : '—'}
                    </td>
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

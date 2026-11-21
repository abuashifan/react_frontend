import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { FormField } from '@/components/shared/form/FormField'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { coaApi } from '@/modules/master-data/services/coaApi'
import type { SelectOption } from '@/types/common.types'

export interface SettlementDiscount {
  settlement_discount_amount?: number
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
  accountOption?: SelectOption<number>
}

interface SettlementDiscountDialogProps {
  documentNumber: string
  grandTotal?: number
  balanceDue: number
  cashAmount: number
  value: SettlementDiscount
  readOnly: boolean
  onSave: (discount: SettlementDiscount, cashAmount: number) => void
  onClose: () => void
}

const schema = z.object({
  accountId: z.number().int().positive().nullable(),
  amount: z.number().nonnegative().max(999999999999.99),
  note: z.string().trim().max(240, 'Catatan maksimal 240 karakter.'),
}).superRefine((value, context) => {
  if (value.amount > 0 && value.accountId === null) {
    context.addIssue({ code: 'custom', path: ['accountId'], message: 'Pilih akun untuk potongan pelunasan.' })
  }
})

async function searchDiscountAccounts(query: string) {
  const [revenue, expense] = await Promise.all([
    coaApi.search(query, { account_type: 'revenue', is_active: true }),
    coaApi.search(query, { account_type: 'expense', is_active: true }),
  ])
  return [...revenue.slice(0, Math.max(5, 10 - expense.length)), ...expense.slice(0, Math.max(5, 10 - revenue.length))]
}

export function SettlementDiscountDialog({
  documentNumber, grandTotal, balanceDue, cashAmount, value, readOnly, onSave, onClose,
}: SettlementDiscountDialogProps) {
  const id = useId()
  const [accountOption, setAccountOption] = useState(value.accountOption)
  const { control, register, setError, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: value.settlement_discount_account_id ?? null,
      amount: value.settlement_discount_amount ?? 0,
      note: value.settlement_discount_note ?? '',
    },
  })
  const amount = useWatch({ control, name: 'amount' })
  const remainingAfterDiscount = Number((balanceDue - amount).toFixed(2))
  const cashAfterDiscount = Math.min(cashAmount, Math.max(0, remainingAfterDiscount))

  const submit = handleSubmit(({ amount, accountId, note }) => {
    if (readOnly) return
    if (amount > 0 && amount >= balanceDue) {
      setError('amount', { message: 'Potongan harus kurang dari sisa tagihan karena masih ada kas yang dialokasikan.' })
      return
    }
    onSave({
      settlement_discount_amount: amount,
      settlement_discount_account_id: amount > 0 ? accountId : null,
      settlement_discount_note: amount > 0 ? note || null : null,
      accountOption: amount > 0 ? accountOption : undefined,
    }, cashAfterDiscount)
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-48px)] w-[calc(100%_-_32px)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Info Potongan</DialogTitle>
          <DialogDescription>Potongan pelunasan untuk faktur {documentNumber}.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          {grandTotal !== undefined && (
            <>
              <dt>Nilai faktur</dt>
              <dd className="text-right tabular-nums">{formatCurrency(grandTotal)}</dd>
            </>
          )}
          <dt>Sisa sebelum transaksi ini</dt>
          <dd className="text-right font-medium tabular-nums">{formatCurrency(balanceDue)}</dd>
        </dl>
        <form className="space-y-4" onSubmit={(event) => { event.stopPropagation(); void submit(event) }}>
          <FormField label="Akun potongan" htmlFor={`${id}-account`}>
            <Controller control={control} name="accountId" render={({ field }) => (
              <SearchableSelect
                cacheKey="coa"
                triggerId={`${id}-account`}
                triggerAriaLabel="Akun potongan"
                value={field.value}
                onChange={(selected, option) => { field.onChange(selected); setAccountOption(option) }}
                onSearch={searchDiscountAccounts}
                selectedOptions={accountOption ? [accountOption] : undefined}
                disabled={readOnly}
                placeholder="Cari akun pendapatan atau beban"
                error={errors.accountId?.message}
              />
            )} />
          </FormField>
          <FormField label="Nominal potongan" htmlFor={`${id}-amount`} error={errors.amount?.message}>
            <Controller control={control} name="amount" render={({ field }) => (
              <AmountInput id={`${id}-amount`} value={field.value} onChange={field.onChange} disabled={readOnly} decimals={2} />
            )} />
          </FormField>
          <FormField label="Keterangan potongan" htmlFor={`${id}-note`} error={errors.note?.message}>
            <Textarea id={`${id}-note`} {...register('note')} maxLength={240} rows={2} disabled={readOnly} />
          </FormField>
          {cashAfterDiscount !== cashAmount && (
            <p className="text-sm text-muted-foreground">
              Kas pada baris ini menjadi <span className="font-medium tabular-nums">{formatCurrency(cashAfterDiscount)}</span>.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Tutup' : 'Batal'}</Button>
            {!readOnly && <Button type="submit">Simpan potongan</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

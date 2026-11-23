import { useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { FieldError } from '@/components/shared/form/FieldError'
import { LineItemsTable, FLUSH_INPUT_CLASS, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import { AccountPickerDialog } from '@/modules/master-data/components/AccountPickerDialog'
import type { SelectOption } from '@/types/common.types'

export interface SettlementDiscount {
  settlement_discount_amount?: number
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
  accountOption?: SelectOption<number>
}

export interface SettlementDiscountSelection {
  id: number
  restoreFocus: () => void
}

interface SettlementDiscountCellProps {
  documentNumber: string
  amount?: number
  onOpen: (restoreFocus: () => void) => void
}

export function SettlementDiscountCell({ documentNumber, amount, onOpen }: SettlementDiscountCellProps) {
  const restoringFocus = useRef(false)
  const open = (input: HTMLInputElement) => {
    onOpen(() => {
      if (!input.isConnected) return
      restoringFocus.current = true
      input.focus({ preventScroll: true })
      restoringFocus.current = false
    })
  }

  return (
    <Input
      type="text"
      readOnly
      aria-label={`Discount ${documentNumber}`}
      aria-haspopup="dialog"
      inputMode="none"
      value={formatCurrency(amount ?? 0)}
      className={cn(FLUSH_INPUT_CLASS, 'h-8 cursor-pointer text-right text-[12px] tabular-nums')}
      onFocus={(event) => { if (!restoringFocus.current) open(event.currentTarget) }}
      onClick={(event) => open(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open(event.currentTarget)
        }
      }}
    />
  )
}

interface SettlementDiscountDialogProps {
  documentNumber: string
  grandTotal?: number
  balanceDue: number
  cashAmount: number
  value: SettlementDiscount
  readOnly: boolean
  preferredAccountType: 'expense' | 'revenue'
  onSave: (discount: SettlementDiscount, cashAmount: number) => void
  onClose: () => void
  onRestoreFocus: () => void
}

const expenseAccount = { value: 'expense', label: 'Beban' } as const
const revenueAccount = { value: 'revenue', label: 'Pendapatan' } as const

const schema = z.object({
  accountId: z.number().int().positive().nullable(),
  amount: z.number().nonnegative().max(999999999999.99),
  note: z.string().trim().max(240, 'Keterangan maksimal 240 karakter.'),
}).superRefine((value, context) => {
  if (value.amount > 0 && value.accountId === null) {
    context.addIssue({ code: 'custom', path: ['accountId'], message: 'Pilih akun untuk potongan pelunasan.' })
  }
})

export function SettlementDiscountDialog({
  documentNumber, grandTotal, balanceDue, cashAmount, value, readOnly,
  preferredAccountType, onSave, onClose, onRestoreFocus,
}: SettlementDiscountDialogProps) {
  const [accountOption, setAccountOption] = useState(value.accountOption)
  const [pickingAccount, setPickingAccount] = useState(false)
  const {
    control, register, setError, setValue, handleSubmit, formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: value.settlement_discount_account_id ?? null,
      amount: value.settlement_discount_amount ?? 0,
      note: value.settlement_discount_note ?? '',
    },
  })
  const amount = useWatch({ control, name: 'amount' })
  const remainingAfterDiscount = Number((balanceDue - amount).toFixed(2))
  // Baris yang tadinya melunasi sisa penuh (kas + potongan lama = sisa) tetap melunasi penuh
  // saat potongan diubah, termasuk saat potongan dikurangi atau dihapus. Kas yang sengaja
  // diisi lebih kecil hanya dipangkas bila melebihi sisa.
  const settlesInFull = Number((cashAmount + (value.settlement_discount_amount ?? 0)).toFixed(2)) >= balanceDue
  const cashAfterDiscount = settlesInFull
    ? Math.max(0, remainingAfterDiscount)
    : Math.min(cashAmount, Math.max(0, remainingAfterDiscount))
  const accountCode = accountOption?.sublabel
  const accountName = accountOption?.label
  const accountTypes = preferredAccountType === 'expense'
    ? [expenseAccount, revenueAccount]
    : [revenueAccount, expenseAccount]

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

  const columns: LineItemColumn<SettlementDiscount>[] = [
    {
      id: 'account',
      header: 'No. Akun',
      width: 130,
      render: () => readOnly ? <span className="tabular-nums">{accountCode ?? '—'}</span> : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Akun potongan"
            aria-haspopup="dialog"
            className="h-8 px-2 text-[12px] tabular-nums text-[#326273]"
            onClick={() => setPickingAccount(true)}
          >
            {accountCode ?? 'Pilih akun'}
          </Button>
          <FieldError message={errors.accountId?.message} />
        </>
      ),
    },
    {
      id: 'account_name',
      header: 'Nama Akun',
      width: 175,
      render: () => accountName ?? '—',
    },
    {
      id: 'note',
      header: 'Keterangan',
      width: 165,
      render: ({ item }) => readOnly ? item.settlement_discount_note || '—' : (
        <>
          <Input
            aria-label="Keterangan potongan"
            {...register('note')}
            maxLength={240}
            className={cn(FLUSH_INPUT_CLASS, 'h-8 text-[12px]')}
          />
          <FieldError message={errors.note?.message} />
        </>
      ),
    },
    {
      id: 'amount',
      header: 'Jumlah',
      width: 135,
      align: 'right',
      render: ({ item }) => readOnly ? formatCurrency(item.settlement_discount_amount ?? 0) : (
        <>
          <Controller control={control} name="amount" render={({ field }) => (
            <AmountInput ariaLabel="Nominal potongan" value={field.value} onChange={field.onChange} decimals={2} className={FLUSH_INPUT_CLASS} />
          )} />
          <FieldError message={errors.amount?.message} />
        </>
      ),
    },
  ]

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="flex max-h-[calc(100dvh-96px)] w-[calc(100vw-32px)] max-w-[760px] flex-col gap-0 overflow-hidden p-0"
        onCloseAutoFocus={(event) => { event.preventDefault(); onRestoreFocus() }}
      >
        <DialogHeader className="shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="text-[14px] font-semibold text-white">Info Potongan</DialogTitle>
          <DialogDescription className="sr-only">Potongan pelunasan faktur {documentNumber}</DialogDescription>
        </DialogHeader>
        <form className="flex min-h-0 flex-col" onSubmit={(event) => { event.stopPropagation(); void submit(event) }}>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 rounded-md border border-[#d9e2e5] px-3 py-2 text-[12px]">
              <dt>No. Faktur</dt>
              <dd className="font-medium">{documentNumber}</dd>
              {grandTotal !== undefined && (
                <>
                  <dt>Nilai faktur</dt>
                  <dd className="tabular-nums">{formatCurrency(grandTotal)}</dd>
                </>
              )}
              <dt>Sisa sebelum transaksi ini</dt>
              <dd className="tabular-nums">{formatCurrency(balanceDue)}</dd>
            </dl>
            <LineItemsTable items={[value]} columns={columns} isReadOnly={readOnly} />
            {!readOnly && cashAfterDiscount !== cashAmount && (
              <p className="text-[12px] text-muted-foreground">
                Kas pada baris ini menjadi <span className="font-medium tabular-nums">{formatCurrency(cashAfterDiscount)}</span>.
              </p>
            )}
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-[#d9e2e5] px-4 py-2.5 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Tutup' : 'Batal'}</Button>
            {!readOnly && <Button type="submit">Simpan potongan</Button>}
          </DialogFooter>
        </form>
        {pickingAccount && (
          <AccountPickerDialog
            open
            title="Pilih Akun Potongan"
            multiple={false}
            accountTypes={accountTypes}
            onClose={() => setPickingAccount(false)}
            onConfirm={([account]) => {
              if (!account) return
              setAccountOption({ value: account.id, label: account.account_name, sublabel: account.account_code })
              setValue('accountId', account.id, { shouldValidate: true })
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

import { formatCurrency } from '@/lib/utils'

interface FormSummaryProps {
  subtotal: number
  taxAmount?: number
  discountAmount?: number
  dppAmount?: number
  grandTotal: number
  paidAmount?: number
  balanceDue?: number
  currency?: string
}

function SummaryRow({
  label,
  value,
  currency,
  valueClassName,
}: {
  label: string
  value: number
  currency: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-[3px] text-[13px]">
      <span className="text-[#64748b]">{label}</span>
      <span className={`text-right tabular-nums text-[#24323a] ${valueClassName ?? ''}`}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  )
}

/** Right-aligned transaction totals summary. */
export function FormSummary({
  subtotal,
  taxAmount = 0,
  discountAmount = 0,
  dppAmount,
  grandTotal,
  paidAmount,
  balanceDue,
  currency = 'IDR',
}: FormSummaryProps) {
  const hasDiscount = discountAmount > 0
  const hasTax = taxAmount > 0
  const hasPayment = paidAmount !== undefined

  return (
    <div className="flex justify-end pt-3">
      <div className="w-full min-w-[280px] max-w-[360px]">
        <SummaryRow label="Subtotal" value={subtotal} currency={currency} />
        {hasDiscount && (
          <SummaryRow
            label="Diskon"
            value={-discountAmount}
            currency={currency}
            valueClassName="text-[#991B1B]"
          />
        )}
        {hasTax && (
          <SummaryRow label="DPP" value={dppAmount ?? subtotal - discountAmount} currency={currency} />
        )}
        {hasTax && <SummaryRow label="Pajak" value={taxAmount} currency={currency} />}

        <div className="mt-1 border-t border-[#d9e2e5] pt-2">
          <div className="flex items-center justify-between gap-6 text-[15px] font-bold text-[#24323a]">
            <span>Grand Total</span>
            <span className="text-right tabular-nums">{formatCurrency(grandTotal, currency)}</span>
          </div>
        </div>

        {hasPayment && (
          <div className="mt-2 border-t border-[#f1f5f9] pt-2">
            <SummaryRow
              label="Dibayar"
              value={paidAmount}
              currency={currency}
              valueClassName="text-[#065F46]"
            />
            {balanceDue !== undefined && (
              <SummaryRow
                label="Sisa"
                value={balanceDue}
                currency={currency}
                valueClassName={balanceDue > 0 ? 'text-[#991B1B] font-medium' : 'text-[#065F46] font-medium'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

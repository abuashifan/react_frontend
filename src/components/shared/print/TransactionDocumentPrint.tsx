import type { ReactNode } from 'react'
import type { CompanyProfile } from '@/modules/settings/types/settings.types'
import { cn } from '@/lib/utils'
import type { PrintPaper } from './printDocument'

export interface PrintParty {
  /** Judul blok, mis. "Kepada", "Vendor", "Diterima dari". */
  label: string
  name?: string | null
  /** Baris tambahan (alamat, telepon, NPWP); yang kosong dilewati. */
  lines?: Array<string | null | undefined>
}

export interface PrintColumn {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  /** Lebar kolom CSS, mis. "12%". */
  width?: string
}

export interface PrintTotal {
  label: string
  value: string
  strong?: boolean
}

/** Data satu dokumen cetak; dibentuk oleh fungsi pemetaan per jenis dokumen. */
export interface TransactionPrintData {
  title: string
  number?: string | null
  /** Status dokumen; draft/void diberi cap supaya tidak dikira dokumen final. */
  status?: string | null
  meta: Array<{ label: string; value: ReactNode }>
  party?: PrintParty
  columns: PrintColumn[]
  rows: Array<Record<string, ReactNode>>
  totals?: PrintTotal[]
  /** Nominal dalam kata (kwitansi, bukti kas). */
  amountInWords?: string
  notes?: string | null
  signatures: string[]
}

const STATUS_STAMP: Record<string, string> = {
  draft: 'DRAFT',
  void: 'VOID',
  cancelled: 'DIBATALKAN',
}

function compact(lines: Array<string | null | undefined>): string[] {
  return lines.map((line) => (line ?? '').trim()).filter(Boolean)
}

interface Props {
  data: TransactionPrintData
  letterhead?: CompanyProfile | null
  paper: PrintPaper
  printedAt?: Date
}

/**
 * Tata letak cetak dokumen transaksi: kop perusahaan, judul + nomor, pihak
 * lawan, info dokumen, tabel baris, total, terbilang, catatan, tanda tangan.
 * Komponen murni (tanpa hook aplikasi) karena juga dirender di iframe cetak.
 */
export function TransactionDocumentPrint({ data, letterhead, paper, printedAt = new Date() }: Props) {
  const half = paper === 'half-a4'
  const stamp = data.status ? STATUS_STAMP[data.status.toLowerCase()] : undefined
  const companyLines = compact([
    letterhead?.address,
    compact([letterhead?.city, letterhead?.province, letterhead?.postal_code]).join(', '),
    compact([letterhead?.phone ? `Telp. ${letterhead.phone}` : null, letterhead?.email]).join(' · '),
    letterhead?.tax_number ? `NPWP ${letterhead.tax_number}` : null,
  ])
  const partyLines = compact(data.party?.lines ?? [])

  return (
    <div className={cn('bg-white font-sans text-[#111827]', half ? 'text-[9.5px]' : 'text-[11px]')}>
      {/* Kop & judul */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-[#111827] pb-2">
        <div className="min-w-0">
          <p className={cn('font-bold leading-tight', half ? 'text-[13px]' : 'text-[16px]')}>{letterhead?.legal_name || letterhead?.name || ''}</p>
          {companyLines.map((line) => <p key={line} className="leading-snug text-[#374151]">{line}</p>)}
        </div>
        <div className="shrink-0 text-right">
          <p className={cn('font-bold uppercase tracking-wide', half ? 'text-[14px]' : 'text-[18px]')}>{data.title}</p>
          {data.number && <p className="tabular-nums font-semibold">{data.number}</p>}
          {stamp && <p className="mt-1 inline-block border-2 border-[#b91c1c] px-2 text-[11px] font-bold tracking-widest text-[#b91c1c]">{stamp}</p>}
        </div>
      </div>

      {/* Pihak lawan & info dokumen */}
      <div className="mt-2 flex items-start justify-between gap-6">
        {data.party ? (
          <div className="min-w-0 max-w-[55%]">
            <p className="text-[#6b7280]">{data.party.label}</p>
            <p className="font-semibold">{data.party.name || '-'}</p>
            {partyLines.map((line) => <p key={line} className="leading-snug">{line}</p>)}
          </div>
        ) : <div />}
        <table className="shrink-0 border-collapse">
          <tbody>
            {data.meta.map((m) => (
              <tr key={m.label}>
                <td className="py-[1px] pr-3 text-[#6b7280]">{m.label}</td>
                <td className="py-[1px] font-medium tabular-nums">{m.value ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Baris dokumen */}
      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className="border-y border-[#111827]">
            <th className="w-[4%] px-1 py-1 text-left font-semibold">No</th>
            {data.columns.map((c) => (
              <th key={c.key} style={{ width: c.width }} className={cn('px-1 py-1 font-semibold', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-b border-[#d1d5db] align-top" style={{ breakInside: 'avoid' }}>
              <td className="px-1 py-1 tabular-nums">{i + 1}</td>
              {data.columns.map((c) => (
                <td key={c.key} className={cn('px-1 py-1', c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left')}>
                  {row[c.key] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      {data.totals && data.totals.length > 0 && (
        <div className="mt-2 flex justify-end">
          <table className="border-collapse" style={{ minWidth: half ? '45%' : '38%' }}>
            <tbody>
              {data.totals.map((t) => (
                <tr key={t.label} className={cn(t.strong && 'border-t border-[#111827]')}>
                  <td className={cn('py-[2px] pr-4', t.strong ? 'font-bold' : 'text-[#374151]')}>{t.label}</td>
                  <td className={cn('py-[2px] text-right tabular-nums', t.strong && 'font-bold')}>{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.amountInWords && (
        <p className="mt-2 border border-[#d1d5db] px-2 py-1 italic">Terbilang: {data.amountInWords}</p>
      )}

      {data.notes && (
        <div className="mt-2">
          <p className="text-[#6b7280]">Catatan</p>
          <p className="whitespace-pre-line">{data.notes}</p>
        </div>
      )}

      {/* Tanda tangan */}
      <div className={cn('flex justify-between gap-4', half ? 'mt-4' : 'mt-8')} style={{ breakInside: 'avoid' }}>
        {data.signatures.map((label) => (
          <div key={label} className="flex-1 text-center">
            <p>{label}</p>
            <div className={half ? 'h-10' : 'h-16'} />
            <p className="mx-auto w-4/5 border-t border-[#111827] pt-0.5 text-[#6b7280]">Nama &amp; tanda tangan</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-right text-[8px] text-[#9ca3af]">
        Dicetak {printedAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    </div>
  )
}

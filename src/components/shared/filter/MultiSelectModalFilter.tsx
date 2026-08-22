import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FilterSection } from '@/components/shared/layout/FilterSidebar'

export interface MultiSelectModalOption<T extends string> {
  value: T
  label: string
}

export interface MultiSelectModalGroup<T extends string> {
  label: string
  options: MultiSelectModalOption<T>[]
}

interface MultiSelectModalFilterProps<T extends string> {
  title: string
  groups: MultiSelectModalGroup<T>[]
  value: T[]
  onChange: (value: T[]) => void
  /** Teks tombol saat belum ada pilihan, mis. "Semua jenis". */
  emptyLabel: string
  /** Satuan untuk ringkasan banyak pilihan, mis. "jenis" → "3 jenis dipilih". */
  itemNoun: string
  note?: string
}

/**
 * Filter multi-pilih yang daftar opsinya dibuka di modal, bukan digelar di
 * sidebar seperti `MultiCheckboxFilter`.
 *
 * Dipakai saat opsinya terlalu banyak untuk dirender inline: sidebar filter
 * lebarnya hanya 220px, jadi puluhan checkbox membuat section lain (Status,
 * Tanggal) terdorong jauh ke bawah dan sidebar jadi scroll panjang. Di modal,
 * opsi bisa dikelompokkan dan disusun dua kolom.
 *
 * Pilihan di modal ditahan di draft lokal dan baru diteruskan ke pemanggil
 * saat "Terapkan" — mencentang lima jenis tidak memicu lima kali refetch
 * daftar. Menutup modal lewat "Batal", tombol X, Esc, atau klik overlay
 * membuang draft.
 */
export function MultiSelectModalFilter<T extends string>({
  title,
  groups,
  value,
  onChange,
  emptyLabel,
  itemNoun,
  note,
}: MultiSelectModalFilterProps<T>) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<T[]>(value)

  const openModal = () => {
    // Draft selalu disinkronkan dari nilai aktif saat dibuka, supaya sisa
    // centang yang tidak jadi diterapkan pada sesi sebelumnya tidak terbawa.
    setDraft(value)
    setOpen(true)
  }

  const toggleDraft = (nextValue: T) => {
    setDraft((current) =>
      current.includes(nextValue)
        ? current.filter((item) => item !== nextValue)
        : [...current, nextValue],
    )
  }

  const apply = () => {
    onChange(draft)
    setOpen(false)
  }

  const selectedLabel = groups
    .flatMap((group) => group.options)
    .find((option) => option.value === value[0])?.label

  const summary =
    value.length === 0
      ? emptyLabel
      : value.length === 1
        ? (selectedLabel ?? value[0])
        : `${value.length} ${itemNoun} dipilih`

  return (
    <FilterSection title={title}>
      <Button
        type="button"
        variant="outline"
        onClick={openModal}
        className="h-8 w-full justify-between gap-1 px-2 text-[12px] font-normal text-[#334155]"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
      </Button>

      {note && <p className="text-[11px] leading-4 text-[#94a3b8]">{note}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        {/* max-height mengikuti spec-23 §10: dialog maksimal 100dvh - 96px,
            scroll internal di badan opsi supaya header dan footer tetap
            terlihat di viewport pendek. Lebarnya ditahan 520px — cukup untuk
            dua kolom label, dan masih menyisakan margin di iPad mini (768px). */}
        <DialogContent className="flex max-h-[calc(100dvh-96px)] max-w-[520px] flex-col gap-2.5 p-4">
          <DialogHeader>
            <DialogTitle className="text-[14px]">{title}</DialogTitle>
          </DialogHeader>

          {/* Grup dipaketkan dengan CSS multi-column, bukan grid.
              Grid menyejajarkan tinggi tiap baris sel, sehingga grup pendek
              (Umum cuma 1 opsi) menyisakan lubang setinggi grup terpanjang di
              baris yang sama — modal jadi jauh lebih tinggi dari isinya.
              `columns` mengalirkan grup mengisi ruang yang tersisa, dan
              `break-inside-avoid` menjaga satu grup tidak terbelah dua kolom. */}
          <div className="columns-1 gap-x-5 overflow-y-auto sm:columns-2">
            {groups.map((group) => (
              <div key={group.label} className="mb-2.5 break-inside-avoid last:mb-0">
                <p className="pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                  {group.label}
                </p>
                {group.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-[3px] hover:bg-[#f8fbfc]"
                  >
                    <Checkbox
                      checked={draft.includes(option.value)}
                      onCheckedChange={() => toggleDraft(option.value)}
                    />
                    <span className="text-[12px] leading-4 text-[#334155]">{option.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 border-t border-[#f1f5f9] pt-2.5 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[12px] text-[#64748b]"
              disabled={draft.length === 0}
              onClick={() => setDraft([])}
            >
              Bersihkan
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="button" size="sm" className="h-8 bg-[#5c9ead] text-[12px] hover:bg-[#4a8a9b]" onClick={apply}>
                Terapkan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FilterSection>
  )
}

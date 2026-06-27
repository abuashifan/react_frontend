import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { SelectOption } from '@/types/common.types'

interface SearchableSelectBaseProps {
  onSearch: (query: string) => Promise<SelectOption<number>[]>
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  triggerId?: string
  triggerAriaLabel?: string
  size?: 'sm' | 'md'
  selectedOptions?: SelectOption<number>[]
}

interface SearchableSelectSingleProps extends SearchableSelectBaseProps {
  multiple?: false
  value: number | null
  /** `option` tersedia saat user memilih dari hasil pencarian (berguna untuk preload label). */
  onChange: (value: number | null, option?: SelectOption<number>) => void
}

interface SearchableSelectMultipleProps extends SearchableSelectBaseProps {
  multiple: true
  value: number[]
  onChange: (value: number[]) => void
}

type SearchableSelectProps = SearchableSelectSingleProps | SearchableSelectMultipleProps

const DEBOUNCE_MS = 300
const MAX_RESULTS = 10

export function SearchableSelect({
  multiple,
  value,
  onChange,
  onSearch,
  placeholder = 'Ketik untuk mencari...',
  disabled,
  error,
  label,
  triggerId,
  triggerAriaLabel,
  size = 'md',
  selectedOptions = [],
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SelectOption<number>[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [localSelected, setLocalSelected] = useState<SelectOption<number>[]>(selectedOptions)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value !== null ? [value] : []),
    [value],
  )

  const knownSelectedOptions = useMemo(() => {
    const byValue = new Map<number, SelectOption<number>>()
    selectedOptions.forEach((option) => byValue.set(option.value, option))
    localSelected.forEach((option) => byValue.set(option.value, option))
    return Array.from(byValue.values())
  }, [localSelected, selectedOptions])

  const displayLabel = useMemo(() => {
    if (selectedValues.length === 0) return null
    const labels = selectedValues
      .map((selectedValue) => knownSelectedOptions.find((opt) => opt.value === selectedValue)?.label)
      .filter((selectedLabel): selectedLabel is string => Boolean(selectedLabel))

    if (labels.length === 0) {
      return multiple ? `${selectedValues.length} item dipilih` : `ID ${selectedValues[0]}`
    }

    return multiple ? labels.join(', ') : labels[0]
  }, [knownSelectedOptions, multiple, selectedValues])

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)

      setIsSearching(true)
      debounceRef.current = setTimeout(async () => {
        try {
          // Query kosong = preload opsi awal (service mengembalikan top aktif).
          const results = await onSearch(q)
          setOptions(results.slice(0, MAX_RESULTS))
          setActiveIndex(-1)
        } catch {
          setOptions([])
        } finally {
          setIsSearching(false)
          setHasSearched(true)
        }
      }, DEBOUNCE_MS)
    },
    [onSearch],
  )

  const handleOpen = (next: boolean) => {
    setOpen(next)
    if (next) {
      setQuery('')
      setOptions([])
      setHasSearched(false)
      // Preload opsi awal begitu dropdown dibuka agar langsung usable.
      search('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleSelect = (opt: SelectOption<number>) => {
    setLocalSelected((current) => {
      const withoutCurrent = current.filter((item) => item.value !== opt.value)
      return [...withoutCurrent, opt]
    })

    if (multiple) {
      const exists = value.includes(opt.value)
      onChange(exists ? value.filter((item) => item !== opt.value) : [...value, opt.value])
    } else {
      onChange(opt.value, opt)
      setOpen(false)
      setQuery('')
      setOptions([])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalSelected([])
    if (multiple) {
      onChange([])
    } else {
      onChange(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(options[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showEmpty = !isSearching && hasSearched && options.length === 0
  const hasValue = selectedValues.length > 0

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[12px] font-medium text-[#24323a]">{label}</span>}

      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={triggerAriaLabel ?? label ?? placeholder}
            className={cn(
              'flex w-full items-center justify-between rounded-md border bg-white px-2.5 text-left',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]/30',
              size === 'sm' ? 'h-[30px] text-[12px]' : 'h-[34px] lg:h-9 text-[13px] lg:text-sm',
              error ? 'border-red-400 focus-visible:ring-red-500/20' : 'border-[#d9e2e5] hover:border-[#5c9ead]',
              disabled && 'cursor-not-allowed bg-[#f8fbfc] text-[#94a3b8] opacity-60',
            )}
            onKeyDown={handleKeyDown}
          >
            <span className={cn('truncate', !displayLabel && 'text-[#94a3b8]')}>
              {displayLabel ?? placeholder}
            </span>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {hasValue && !disabled && (
                <span onClick={handleClear}>
                  <X className="w-3.5 h-3.5 text-[#94a3b8] hover:text-[#24323a] transition-colors" />
                </span>
              )}
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#94a3b8]" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-lg border-[#d9e2e5] p-0 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          align="start"
          sideOffset={4}
          collisionPadding={12}
        >
          {/* Search input */}
          <div className="sticky top-0 z-10 border-b border-[#f1f5f9] bg-white px-2 pb-1 pt-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                search(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik untuk mencari..."
              className="h-7 w-full rounded border border-[#d9e2e5] px-2 text-[12px] outline-none focus:border-[#5c9ead] focus:shadow-[0_0_0_3px_rgba(92,158,173,0.12)]"
            />
          </div>

          {/* Results */}
          <div role="listbox" className="max-h-[min(280px,calc(100dvh-96px))] overflow-y-auto py-1">
            {isSearching && (
              <div className="flex h-10 items-center justify-center gap-2 px-3 text-[13px] text-[#64748b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mencari...
              </div>
            )}

            {showEmpty && (
              <p className="flex h-10 items-center justify-center px-3 text-[13px] text-[#94a3b8]">
                Tidak ditemukan
              </p>
            )}

            {options.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt)}
                className={cn(
                  'flex h-9 w-full items-center justify-between gap-2 px-3 text-left text-[13px]',
                  'transition-colors hover:bg-[#EFF9FB] hover:text-[#326273]',
                  activeIndex === idx && 'bg-[#EFF9FB] text-[#326273]',
                )}
              >
                <span className="min-w-0 truncate">{opt.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {opt.sublabel && (
                    <span className="text-[11px] tabular-nums text-[#94a3b8]">{opt.sublabel}</span>
                  )}
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      selectedValues.includes(opt.value) ? 'text-[#5c9ead]' : 'invisible',
                    )}
                  />
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

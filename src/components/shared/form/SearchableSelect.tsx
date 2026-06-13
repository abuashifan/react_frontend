import { useState, useRef, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { SelectOption } from '@/types/common.types'

interface SearchableSelectProps {
  value: number | null
  onChange: (value: number | null) => void
  onSearch: (query: string) => Promise<SelectOption<number>[]>
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
}

const MIN_CHARS = 2
const DEBOUNCE_MS = 300
const MAX_RESULTS = 10

export function SearchableSelect({
  value,
  onChange,
  onSearch,
  placeholder = 'Ketik untuk mencari...',
  disabled,
  error,
  label,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SelectOption<number>[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  // Track previous value to detect external resets without useEffect
  const [prevValue, setPrevValue] = useState<number | null>(value)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync label when parent resets value to null — calling setState during render
  // is the React-recommended pattern for getDerivedStateFromProps in function components
  if (prevValue !== value) {
    setPrevValue(value)
    if (value === null) setSelectedLabel(null)
  }

  const displayLabel = selectedLabel

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (q.length < MIN_CHARS) {
        setOptions([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await onSearch(q)
          setOptions(results.slice(0, MAX_RESULTS))
          setActiveIndex(-1)
        } catch {
          setOptions([])
        } finally {
          setIsSearching(false)
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
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleSelect = (opt: SelectOption<number>) => {
    setSelectedLabel(opt.label)
    onChange(opt.value)
    setOpen(false)
    setQuery('')
    setOptions([])
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLabel(null)
    onChange(null)
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

  const showTip = query.length > 0 && query.length < MIN_CHARS
  const showEmpty = !isSearching && query.length >= MIN_CHARS && options.length === 0

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[12px] font-medium text-[#24323a]">{label}</span>}

      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn(
              'flex items-center justify-between w-full h-9 px-3 text-[13px] rounded-md border bg-white',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]',
              error ? 'border-red-400' : 'border-[#d9e2e5] hover:border-[#5c9ead]',
              disabled && 'opacity-50 cursor-not-allowed bg-[#f8fafc]',
            )}
            onKeyDown={handleKeyDown}
          >
            <span className={cn('truncate', !displayLabel && 'text-[#94a3b8]')}>
              {displayLabel ?? placeholder}
            </span>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {value !== null && !disabled && (
                <span onClick={handleClear}>
                  <X className="w-3.5 h-3.5 text-[#94a3b8] hover:text-[#24323a] transition-colors" />
                </span>
              )}
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#94a3b8]" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)] shadow-md"
          align="start"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="px-2 pt-2 pb-1 border-b border-[#f1f5f9]">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                search(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik minimal 2 karakter..."
              className="w-full h-7 px-2 text-[12px] border border-[#d9e2e5] rounded outline-none focus:border-[#5c9ead]"
            />
          </div>

          {/* Results */}
          <div role="listbox" className="max-h-[200px] overflow-y-auto py-1">
            {isSearching && (
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#64748b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mencari...
              </div>
            )}

            {showTip && (
              <p className="px-3 py-2 text-[12px] text-[#94a3b8]">
                Ketik {MIN_CHARS - query.length} karakter lagi untuk mencari
              </p>
            )}

            {showEmpty && (
              <p className="px-3 py-2 text-[12px] text-[#64748b]">Tidak ada hasil</p>
            )}

            {options.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-[12px] text-left',
                  'hover:bg-[#f1f5f9] transition-colors',
                  activeIndex === idx && 'bg-[#f1f5f9]',
                )}
              >
                <Check
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    opt.value === value ? 'text-[#5c9ead]' : 'invisible',
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

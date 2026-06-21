import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface MasterDataSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function MasterDataSearch({ value, onChange, placeholder }: MasterDataSearchProps) {
  return (
    <div className="relative mb-3 max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pl-9 pr-9 text-[13px]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#64748b] hover:text-[#24323a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

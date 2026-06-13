import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'number'
  placeholder?: string
}

export interface QuickAddItem {
  id: number
  name: string
}

interface MasterDataQuickAddProps {
  title: string
  description: string
  addLabel: string
  fields: FieldDef[]
  items: QuickAddItem[]
  onAdd: (data: Record<string, string | number>) => Promise<QuickAddItem>
  onRemove?: (id: number) => void
  minRequired?: number
}

export function MasterDataQuickAdd({
  title,
  description,
  addLabel,
  fields,
  items,
  onAdd,
  onRemove,
  minRequired = 1,
}: MasterDataQuickAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFulfilled = items.length >= minRequired

  const handleSubmit = async () => {
    const missing = fields.find((f) => !form[f.name]?.trim())
    if (missing) {
      setError(`${missing.label} wajib diisi`)
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const data: Record<string, string | number> = {}
      for (const f of fields) {
        data[f.name] = f.type === 'number' ? Number(form[f.name]) : form[f.name] ?? ''
      }
      await onAdd(data)
      setForm({})
      setIsAdding(false)
    } catch {
      setError('Gagal menyimpan. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border border-[#d9e2e5] rounded-lg bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d9e2e5]">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-[#24323a]">{title}</p>
            {isFulfilled && <Check className="w-3.5 h-3.5 text-[#065F46]" />}
          </div>
          <p className="text-[11px] text-[#64748b] mt-0.5">{description}</p>
        </div>
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="h-7 text-[12px] gap-1.5 text-[#5c9ead] border-[#5c9ead] hover:bg-[#f0f9fb]"
          >
            <Plus className="w-3.5 h-3.5" />
            {addLabel}
          </Button>
        )}
      </div>

      {/* Item list */}
      {items.length > 0 && (
        <ul className="divide-y divide-[#f1f5f9]">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[13px] text-[#24323a]">{item.name}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-[#94a3b8] hover:text-red-500 transition-colors"
                  aria-label={`Hapus ${item.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Inline add form */}
      {isAdding && (
        <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#f1f5f9]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-[11px] font-medium text-[#64748b] mb-1">{f.label}</label>
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  placeholder={f.placeholder ?? f.label}
                  value={form[f.name] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                  className="h-8 text-[12px]"
                  min={f.type === 'number' ? 0 : undefined}
                />
              </div>
            ))}
          </div>
          {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="h-7 text-[12px] bg-[#e39774] hover:bg-[#d4845e]">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setForm({}); setError(null) }} className="h-7 text-[12px]">
              Batal
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !isAdding && (
        <div className="px-4 py-4 text-center text-[12px] text-[#94a3b8]">
          Belum ada {title.toLowerCase()}. Tambahkan minimal {minRequired}.
        </div>
      )}
    </div>
  )
}

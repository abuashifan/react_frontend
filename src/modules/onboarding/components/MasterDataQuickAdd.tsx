import { useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiError'

interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'number'
  placeholder?: string
  /** Default `true`. Set `false` untuk field opsional (mis. Alamat) -- lihat backend Store*Request. */
  required?: boolean
}

export interface QuickAddItem {
  id: number
  name: string
  /** Keterangan singkat di samping nama (mis. kode satuan, jumlah hari). */
  sublabel?: string
  /**
   * Nilai awal form saat item diedit; key-nya sama dengan `FieldDef.name`.
   * Tanpa ini form edit hanya bisa memulihkan `name`, sehingga field lain
   * (alamat, kode, hari) akan terkirim kosong dan menimpa data yang benar.
   */
  values?: Record<string, string | number>
  /**
   * Alasan item tidak bisa dihapus (mis. gudang default ditolak backend lewat
   * CANNOT_DEACTIVATE_DEFAULT_WAREHOUSE). Tombol hapus dimatikan dan alasannya
   * dipakai sebagai tooltip -- lebih baik daripada membiarkan user menekan
   * tombol yang pasti gagal.
   */
  deleteBlockedReason?: string
}

interface MasterDataQuickAddProps {
  title: string
  description: string
  addLabel: string
  fields: FieldDef[]
  items: QuickAddItem[]
  onAdd: (data: Record<string, string | number>) => Promise<QuickAddItem>
  /** Tanpa handler ini tombol edit tidak dirender sama sekali. */
  onEdit?: (id: number, data: Record<string, string | number>) => Promise<void>
  /** Tanpa handler ini tombol hapus tidak dirender sama sekali. */
  onDelete?: (item: QuickAddItem) => Promise<void>
  /**
   * Teks tambahan di dialog konfirmasi hapus -- dipakai untuk menjelaskan
   * bahwa "hapus" di sini berarti nonaktif (backend master data tidak punya
   * hard delete, lihat MasterData/Routes/api.php).
   */
  deleteNote?: string
  minRequired?: number
}

export function MasterDataQuickAdd({
  title,
  description,
  addLabel,
  fields,
  items,
  onAdd,
  onEdit,
  onDelete,
  deleteNote,
  minRequired = 1,
}: MasterDataQuickAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<QuickAddItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isFulfilled = items.length >= minRequired
  const isFormOpen = isAdding || editingId !== null

  const closeForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setForm({})
    setError(null)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({})
    setError(null)
    setIsAdding(true)
  }

  const openEdit = (item: QuickAddItem) => {
    setIsAdding(false)
    setError(null)
    // Fallback ke `name` supaya item lama yang belum mengirim `values` tetap
    // bisa diedit namanya, bukan membuka form kosong.
    const source = item.values ?? { name: item.name }
    const next: Record<string, string> = {}
    for (const f of fields) {
      const raw = source[f.name]
      next[f.name] = raw === undefined || raw === null ? '' : String(raw)
    }
    setForm(next)
    setEditingId(item.id)
  }

  const handleSubmit = async () => {
    const missing = fields.find((f) => f.required !== false && !form[f.name]?.trim())
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
      if (editingId !== null) {
        await onEdit?.(editingId, data)
      } else {
        await onAdd(data)
      }
      closeForm()
    } catch (submitError) {
      // Toast generik "Periksa kembali isian yang ditandai." tidak ada gunanya di
      // form sederhana ini yang tidak menandai field satu-satu -- tampilkan detail
      // per field dari backend kalau ada, supaya penyebabnya kelihatan langsung.
      const fieldErrors = Object.values(getApiValidationErrors(submitError))
      setError(fieldErrors.length > 0 ? fieldErrors.join(' ') : getApiErrorMessage(submitError, 'Gagal menyimpan. Coba lagi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !onDelete) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(pendingDelete)
      setPendingDelete(null)
    } catch (removeError) {
      // Ditampilkan di dalam dialog, bukan hanya toast: dialognya tetap terbuka
      // sampai user menutupnya, jadi pesan gagal harus terlihat di sana juga.
      setDeleteError(getApiErrorMessage(removeError, `Gagal menghapus ${title.toLowerCase()}. Coba lagi.`))
    } finally {
      setIsDeleting(false)
    }
  }

  const renderForm = () => (
    <>
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
        <Button size="sm" variant="ghost" onClick={closeForm} className="h-7 text-[12px]">
          Batal
        </Button>
      </div>
    </>
  )

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
        {!isFormOpen && (
          <Button
            size="sm"
            variant="outline"
            onClick={openAdd}
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
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id} className="px-4 py-3 bg-[#f8fafc]">
                <p className="text-[11px] font-semibold text-[#64748b] mb-2">Edit {title}</p>
                {renderForm()}
              </li>
            ) : (
              <li key={item.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="min-w-0 text-[13px] text-[#24323a] truncate">
                  {item.name}
                  {item.sublabel && <span className="text-[#94a3b8] ml-1.5">{item.sublabel}</span>}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      disabled={isFormOpen}
                      className="p-1.5 rounded text-[#94a3b8] hover:text-[#5c9ead] hover:bg-[#f0f9fb] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#94a3b8] transition-colors"
                      aria-label={`Edit ${item.name}`}
                      title={`Edit ${item.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => { setDeleteError(null); setPendingDelete(item) }}
                      disabled={isFormOpen || !!item.deleteBlockedReason}
                      className="p-1.5 rounded text-[#94a3b8] hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#94a3b8] transition-colors"
                      aria-label={`Hapus ${item.name}`}
                      title={item.deleteBlockedReason ?? `Hapus ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {/* Inline add form */}
      {isAdding && (
        <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#f1f5f9]">{renderForm()}</div>
      )}

      {items.length === 0 && !isAdding && (
        <div className="px-4 py-4 text-center text-[12px] text-[#94a3b8]">
          Belum ada {title.toLowerCase()}. Tambahkan minimal {minRequired}.
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => { setPendingDelete(null); setDeleteError(null) }}
        onConfirm={handleConfirmDelete}
        title={`Hapus ${title.toLowerCase()} ini?`}
        variant="destructive"
        confirmLabel="Hapus"
        loadingLabel="Menghapus..."
        isLoading={isDeleting}
        description={
          <>
            <span className="font-medium text-[#24323a]">{pendingDelete?.name}</span> akan dihapus dari daftar
            {deleteNote ? ` ${deleteNote}` : '.'}
            {deleteError && <span className="block mt-2 text-red-500">{deleteError}</span>}
          </>
        }
      />
    </div>
  )
}

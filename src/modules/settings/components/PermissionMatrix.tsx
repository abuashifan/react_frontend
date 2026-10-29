import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import type { PermissionCatalog } from '../types/access.types'

export interface AccessSelection { full_access: boolean; permissions: string[] }

interface PermissionMatrixProps {
  catalog: PermissionCatalog
  value: AccessSelection
  onChange: (value: AccessSelection) => void
  owner?: boolean
  readOnly?: boolean
}

const labels: Record<string, string> = {
  daftar: 'Lihat', tambah: 'Tambah', ubah: 'Ubah', hapus: 'Hapus / Void',
  persetujuan: 'Setujui / Posting', cetak: 'Cetak', ekspor: 'Ekspor',
}

export function PermissionMatrix({ catalog, value, onChange, owner = false, readOnly = false }: PermissionMatrixProps) {
  const [tab, setTab] = useState(catalog.modules[0]?.key ?? '')
  const selected = new Set(value.permissions)
  const blocked = new Set(catalog.blocked_by_plan_keys)
  const module = catalog.modules.find((item) => item.key === tab)
  const disabled = readOnly || owner || value.full_access

  const update = (keys: string[], checked: boolean) => {
    const next = new Set(value.permissions)
    keys.filter((key) => !blocked.has(key)).forEach((key) => checked ? next.add(key) : next.delete(key))
    onChange({ ...value, permissions: Array.from(next).sort() })
  }
  const isChecked = (key: string) => value.full_access || owner || selected.has(key)
  const selectable = (keys: string[]) => keys.filter((key) => !blocked.has(key))

  return (
    <section aria-label="Matriks hak akses" className="space-y-3">
      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div><p className="text-sm font-semibold">Akses penuh</p><p className="text-xs text-muted-foreground">Semua izin yang tersedia dalam paket, termasuk fitur baru.</p></div>
        <Switch aria-label="Akses penuh" checked={value.full_access || owner} disabled={readOnly || owner} onCheckedChange={(checked) => onChange({ ...value, full_access: checked })} />
      </div>
      {owner && <p className="text-xs text-muted-foreground">Pemilik selalu memiliki akses penuh.</p>}
      <div className="flex gap-1 overflow-x-auto border-b pb-1" role="tablist" aria-label="Modul hak akses">
        {catalog.modules.map((item) => <button key={item.key} type="button" role="tab" aria-selected={item.key === tab} onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded px-3 py-2 text-xs ${item.key === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{item.label}</button>)}
      </div>
      {module && <div role="tabpanel" className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b bg-muted/40"><th scope="col" className="p-2 text-left">Fitur</th>
              {catalog.matrix_columns.map((column) => {
                const columnKeys = selectable(module.features.flatMap((feature) => feature.permissions[column] ? [feature.permissions[column].key] : []))
                return <th key={column} scope="col" className="p-2 text-center text-xs"><div>{labels[column] ?? column}</div>{columnKeys.length > 0 && <Checkbox aria-label={`Pilih semua ${labels[column] ?? column}`} checked={columnKeys.every(isChecked)} disabled={disabled} onCheckedChange={(checked) => update(columnKeys, checked === true)} />}</th>
              })}
            </tr></thead>
            <tbody>{module.features.map((feature) => {
              const rowKeys = selectable(Object.values(feature.permissions).map((permission) => permission.key))
              return <tr key={feature.key} className="border-b last:border-0"><th scope="row" className="p-2 text-left font-normal"><div className="flex items-center gap-2">{rowKeys.length > 0 && <Checkbox aria-label={`Pilih semua ${feature.label}`} checked={rowKeys.every(isChecked)} disabled={disabled} onCheckedChange={(checked) => update(rowKeys, checked === true)} />}{feature.label}</div></th>
                {catalog.matrix_columns.map((column) => {
                  const permission = feature.permissions[column]
                  return <td key={column} className="p-2 text-center">{permission ? <Checkbox aria-label={`${feature.label}: ${labels[column] ?? column}${blocked.has(permission.key) ? ' (terkunci paket)' : ''}`} checked={isChecked(permission.key)} disabled={disabled || blocked.has(permission.key)} onCheckedChange={(checked) => update([permission.key], checked === true)} /> : '–'}{permission && blocked.has(permission.key) && <span className="block text-[10px] text-muted-foreground">Terkunci paket</span>}</td>
                })}
              </tr>
            })}</tbody>
          </table>
        </div>
        {module.special_permissions.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Akses khusus</h3><div className="grid gap-2 sm:grid-cols-2">{module.special_permissions.map((permission) => <label key={permission.key} className="flex items-center gap-2 text-sm"><Checkbox checked={isChecked(permission.key)} disabled={disabled || blocked.has(permission.key)} onCheckedChange={(checked) => update([permission.key], checked === true)} /><span>{permission.label}{blocked.has(permission.key) && ' (terkunci paket)'}</span></label>)}</div></div>}
        {catalog.upgrade_url && blocked.size > 0 && <a href={catalog.upgrade_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Lihat pilihan peningkatan paket</a>}
      </div>}
    </section>
  )
}

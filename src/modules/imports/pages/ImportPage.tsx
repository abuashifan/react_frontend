import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Upload, XCircle } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { TablePagination } from '@/components/shared/table/TablePagination'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { getApiErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { importsApi } from '../services/importsApi'
import { useImportBatch, useImportMutations, useImportProfiles, useImportRows } from '../hooks/useImports'
import type { ActiveBatchExistsMeta, DuplicateFileWarningMeta, ImportProfile } from '../types/imports.types'
import type { ApiError } from '@/types/api.types'

type Step = 'upload' | 'mapping' | 'preview'

const selectClass =
  'h-9 text-[13px] w-full rounded-md border border-[#d9e2e5] bg-white px-3 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  validating: 'Memvalidasi',
  previewed: 'Siap di-commit',
  committing: 'Sedang commit',
  completed: 'Selesai',
  failed: 'Gagal',
}

/**
 * Alur: pilih profil + unggah → petakan kolom → pratinjau & commit.
 * Satu halaman dengan state langkah lokal -- bukan wizard multi-rute, supaya
 * batch yang sedang berjalan (satu batch aktif per perusahaan) selalu
 * terlihat utuh tanpa berpindah URL. Rencana impor data, Fase 1.
 */
export default function ImportPage() {
  const { toast } = useToast()
  const { can } = usePermission()

  const [step, setStep] = useState<Step>('upload')
  const [profileKey, setProfileKey] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeUuid, setActiveUuid] = useState<string | null>(null)
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateFileWarningMeta['duplicate'] | null>(null)
  const [rowsPage, setRowsPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profilesResponse, isLoading: profilesLoading } = useImportProfiles()
  const profiles = profilesResponse?.data ?? []
  const profile = profiles.find((p: ImportProfile) => p.key === profileKey) ?? null

  const { data: batchResponse } = useImportBatch(activeUuid)
  const batch = batchResponse?.data ?? null

  const { data: rowsResponse, isFetching: rowsFetching } = useImportRows(step === 'preview' ? activeUuid : null, rowsPage)

  const { upload, mapping, commit, cancel } = useImportMutations()
  const busy = upload.isPending || mapping.isPending || commit.isPending || cancel.isPending

  const reset = () => {
    setStep('upload')
    setProfileKey('')
    setFile(null)
    setActiveUuid(null)
    setUploadHeaders([])
    setColumnMap({})
    setDuplicateWarning(null)
    setRowsPage(1)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Langkah 1: unggah ────────────────────────────────────────────────

  const doUpload = async (confirmDuplicateFile = false) => {
    if (!profile || !file) return

    try {
      const res = await upload.mutateAsync({ profile: profile.key, file, confirmDuplicateFile })
      setActiveUuid(res.data.batch.uuid)
      setUploadHeaders(res.data.headers)
      setColumnMap(autoMapColumns(profile, res.data.headers))
      setDuplicateWarning(null)
      setStep('mapping')
    } catch (error) {
      const apiError = error as ApiError

      if (apiError.code === 'IMPORT_FILE_DUPLICATE') {
        setDuplicateWarning((apiError.meta as unknown as DuplicateFileWarningMeta)?.duplicate ?? null)
        return
      }

      if (apiError.code === 'IMPORT_ACTIVE_BATCH_EXISTS') {
        const meta = apiError.meta as unknown as ActiveBatchExistsMeta
        toast.error('Masih ada batch impor aktif. Lanjutkan atau batalkan batch itu dulu.')
        if (meta?.batch_uuid) {
          setActiveUuid(meta.batch_uuid)
          setStep(meta.status === 'previewed' ? 'preview' : 'mapping')
        }
        return
      }

      toast.error(getApiErrorMessage(error, 'Gagal mengunggah berkas.'))
    }
  }

  // ── Langkah 2: pemetaan kolom ────────────────────────────────────────

  const submitMapping = async () => {
    if (!activeUuid) return

    try {
      await mapping.mutateAsync({ uuid: activeUuid, columnMap })
      setStep('preview')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan pemetaan kolom.'))
    }
  }

  // ── Langkah 3: pratinjau + commit ────────────────────────────────────

  const doCommit = async () => {
    if (!activeUuid) return

    try {
      const res = await commit.mutateAsync(activeUuid)
      toast.success(`${res.data.committed_rows} baris berhasil di-commit.`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal melakukan commit.'))
    }
  }

  const doCancel = async () => {
    if (!activeUuid) return

    try {
      await cancel.mutateAsync(activeUuid)
      toast.success('Batch impor dibatalkan.')
      reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membatalkan batch.'))
    }
  }

  const rows = rowsResponse?.data ?? []
  const canCommit = (batch?.valid_rows ?? 0) > 0 && batch?.status === 'previewed' && can('imports.commit')
  const isDone = batch?.status === 'completed' || batch?.status === 'failed'

  return (
    <WorkspaceLayout
      title="Impor Data"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Impor Data' }]}
    >
      <div className="max-w-3xl mx-auto p-6 flex flex-col gap-4">
        <Stepper step={step} />

        {step === 'upload' && (
          <section className="bg-white border border-[#d9e2e5] rounded-lg p-5">
            <h2 className="text-[14px] font-semibold text-[#24323a] mb-1">1. Pilih Profil &amp; Unggah Berkas</h2>
            <p className="text-[12px] text-[#64748b] mb-4">
              Unduh templat dulu supaya header kolomnya sudah benar -- pemetaan kolom otomatis terisi kalau templatnya
              dipakai apa adanya. Format .csv atau .xlsx, maksimal 1.000 baris.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Profil</Label>
                <select
                  className={cn(selectClass, 'mt-1')}
                  value={profileKey}
                  onChange={(e) => setProfileKey(e.target.value)}
                  disabled={profilesLoading}
                >
                  <option value="">Pilih profil...</option>
                  {profiles.map((p: ImportProfile) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {profile && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-fit gap-1.5 text-[12px]"
                  onClick={() => void importsApi.downloadTemplate(profile.key)}
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Templat {profile.label}
                </Button>
              )}

              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Berkas</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-[12px] text-[#64748b] file:mr-3 file:rounded-md file:border-0 file:bg-[#5c9ead] file:px-3 file:py-1.5 file:text-[12px] file:text-white hover:file:bg-[#4a8a9b]"
                />
              </div>

              {duplicateWarning && (
                <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3 text-[12px] text-[#92400E]">
                  <p className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Berkas ini sudah pernah diunggah
                  </p>
                  <p className="mt-1">
                    Status batch sebelumnya: {STATUS_LABELS[duplicateWarning.status] ?? duplicateWarning.status}, pada{' '}
                    {duplicateWarning.uploaded_at}. Lanjutkan unggah ini juga?
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 h-7 bg-[#e39774] text-[11px] hover:bg-[#d4845e]"
                    disabled={busy}
                    onClick={() => void doUpload(true)}
                  >
                    Lanjutkan Tetap Unggah
                  </Button>
                </div>
              )}

              <Button
                type="button"
                className="h-9 w-fit gap-1.5 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]"
                disabled={!profile || !file || busy}
                onClick={() => void doUpload(false)}
              >
                <Upload className="w-3.5 h-3.5" /> {upload.isPending ? 'Mengunggah...' : 'Unggah'}
              </Button>
            </div>
          </section>
        )}

        {step === 'mapping' && profile && (
          <section className="bg-white border border-[#d9e2e5] rounded-lg p-5">
            <h2 className="text-[14px] font-semibold text-[#24323a] mb-1">2. Petakan Kolom</h2>
            <p className="text-[12px] text-[#64748b] mb-4">
              Cocokkan setiap field dengan header di berkas Anda. Field bertanda <span className="text-red-500">*</span>{' '}
              wajib dipetakan.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {profile.fields.map((field, index) => {
                const required = profile.required_fields.includes(field)
                return (
                  <div key={field} className="flex flex-col gap-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                      {profile.headers[index] ?? field} {required && <span className="text-red-500">*</span>}
                    </Label>
                    <select
                      className={selectClass}
                      value={columnMap[field] ?? ''}
                      onChange={(e) => setColumnMap((prev) => ({ ...prev, [field]: e.target.value }))}
                    >
                      <option value="">Tidak dipetakan</option>
                      {uploadHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between mt-5">
              <Button type="button" variant="outline" className="h-9 text-[13px]" disabled={busy} onClick={() => void doCancel()}>
                Batalkan Batch
              </Button>
              <Button
                type="button"
                className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]"
                disabled={busy}
                onClick={() => void submitMapping()}
              >
                {mapping.isPending ? 'Memvalidasi...' : 'Validasi & Pratinjau'}
              </Button>
            </div>
          </section>
        )}

        {step === 'preview' && batch && (
          <section className="bg-white border border-[#d9e2e5] rounded-lg p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[14px] font-semibold text-[#24323a]">3. Pratinjau &amp; Commit</h2>
              <Badge className={cn('text-[10px] px-1.5 py-0', statusBadgeClass(batch.status))}>
                {STATUS_LABELS[batch.status] ?? batch.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <SummaryTile label="Total Baris" value={batch.total_rows} />
              <SummaryTile label="Valid" value={batch.valid_rows} tone="success" />
              <SummaryTile label="Gagal" value={batch.failed_rows} tone="danger" />
            </div>

            {isDone && (
              <div
                className={cn(
                  'mb-4 flex items-center gap-2 rounded-md border p-3 text-[12px]',
                  batch.committed_rows > 0
                    ? 'border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]'
                    : 'border-[#FEE2E2] bg-[#FEE2E2] text-[#991B1B]',
                )}
              >
                {batch.committed_rows > 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {batch.committed_rows} dari {batch.valid_rows} baris valid berhasil di-commit.
              </div>
            )}

            <div className="overflow-x-auto rounded-md border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-left text-[#64748b]">
                    <th className="px-3 py-2 font-medium">Baris</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Galat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#f1f5f9]">
                      <td className="px-3 py-1.5 tabular-nums">{row.row_number}</td>
                      <td className="px-3 py-1.5">
                        <Badge className={cn('text-[10px] px-1.5 py-0', rowStatusBadgeClass(row.status))}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-[#991B1B]">
                        {row.errors
                          ? Object.entries(row.errors)
                              .flatMap(([, messages]) => messages)
                              .join('; ')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && !rowsFetching && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-[#94a3b8]">
                        Belum ada baris.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {rowsResponse && (
              <div className="mt-2">
                <TablePagination
                  pagination={{ pageIndex: rowsPage - 1, pageSize: 50 }}
                  totalRows={rowsResponse.meta.total}
                  onChange={(state) => setRowsPage(state.pageIndex + 1)}
                />
              </div>
            )}

            <div className="flex justify-between mt-5">
              <Button type="button" variant="outline" className="h-9 text-[13px]" disabled={busy || isDone} onClick={() => void doCancel()}>
                Batalkan Batch
              </Button>
              {isDone ? (
                <Button type="button" className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]" onClick={reset}>
                  Impor Berkas Lain
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-9 bg-[#e39774] text-[13px] hover:bg-[#d4845e]"
                  disabled={!canCommit || busy}
                  onClick={() => void doCommit()}
                >
                  {commit.isPending ? 'Memproses...' : `Commit ${batch.valid_rows} Baris Valid`}
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </WorkspaceLayout>
  )
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Unggah' },
    { key: 'mapping', label: 'Pemetaan' },
    { key: 'preview', label: 'Pratinjau & Commit' },
  ]
  const activeIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="flex items-center gap-2 text-[12px]">
      {steps.map((s, index) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1',
              index === activeIndex
                ? 'bg-[#5c9ead] text-white font-medium'
                : index < activeIndex
                  ? 'bg-[#D1FAE5] text-[#065F46]'
                  : 'bg-[#F1F5F9] text-[#94a3b8]',
            )}
          >
            {index + 1}. {s.label}
          </span>
          {index < steps.length - 1 && <span className="text-[#cbd5e1]">›</span>}
        </div>
      ))}
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' }) {
  return (
    <div className="rounded-md border border-[#e2e8f0] p-3">
      <p
        className={cn(
          'text-[20px] font-semibold tabular-nums',
          tone === 'success' && 'text-[#065F46]',
          tone === 'danger' && 'text-[#991B1B]',
          !tone && 'text-[#24323a]',
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-[#64748b]">{label}</p>
    </div>
  )
}

function statusBadgeClass(status: string): string {
  if (status === 'completed') return 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
  if (status === 'failed') return 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]'
  return 'bg-[#EFF9FB] text-[#326273] hover:bg-[#EFF9FB]'
}

function rowStatusBadgeClass(status: string): string {
  if (status === 'valid' || status === 'committed') return 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
  if (status === 'invalid' || status === 'failed') return 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]'
  return 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]'
}

/**
 * Kalau header berkas cocok PERSIS (tanpa memandang huruf besar/kecil)
 * dengan header templat, petakan otomatis -- jalur yang dipakai ~90% waktu
 * (rencana impor data, Fase 0 §"Pemetaan kolom"). Kalau tidak cocok, field
 * itu dibiarkan kosong untuk dipetakan manual.
 */
function autoMapColumns(profile: ImportProfile, uploadedHeaders: string[]): Record<string, string> {
  const map: Record<string, string> = {}

  profile.fields.forEach((field, index) => {
    const expectedHeader = profile.headers[index]
    const match = uploadedHeaders.find((h) => h.trim().toLowerCase() === expectedHeader?.trim().toLowerCase())
    if (match) map[field] = match
  })

  return map
}

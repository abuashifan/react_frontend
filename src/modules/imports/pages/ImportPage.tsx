import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileDown, Info, PlayCircle, Trash2, Undo2, Upload, XCircle } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiError'
import { cn, formatCurrency } from '@/lib/utils'
import { importsApi } from '../services/importsApi'
import { useImportBatch, useImportHistory, useImportMutations, useImportProfiles, useImportRows } from '../hooks/useImports'
import { useImportPresetStore } from '../stores/useImportPresetStore'
import type { ActiveBatchExistsMeta, DuplicateFileWarningMeta, ImportBatch, ImportProfile, ImportRow } from '../types/imports.types'
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
  reverted: 'Dibatalkan',
}

/** Profil yang commit-nya punya lawan (backend: interface `RevertsImport`). */
const REVERTIBLE_PROFILES = ['opening_balance', 'fixed_asset_opening']

/**
 * Status yang datanya BELUM masuk ke buku: batchnya boleh dilanjutkan atau
 * dibuang begitu saja. `committing` sengaja tidak termasuk — backend menolak
 * membatalkan batch yang jobnya sedang jalan.
 */
const RESUMABLE_STATUSES = ['draft', 'validating', 'previewed', 'failed']

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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [rowsPage, setRowsPage] = useState(1)
  const [autoMappedNotice, setAutoMappedNotice] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profilesResponse, isLoading: profilesLoading } = useImportProfiles()
  const profiles = profilesResponse?.data ?? []
  const profile = profiles.find((p: ImportProfile) => p.key === profileKey) ?? null

  // Halaman lain (Saldo Awal, Aktiva Tetap, Step 5 wizard) menitipkan profil
  // yang mereka maksud lewat store. Dikonsumsi sekali lalu dikosongkan, supaya
  // user tetap bebas mengganti pilihan di dropdown setelahnya tanpa dipaksa
  // balik ke profil titipan.
  //
  // Dibelah dua dengan sengaja:
  //   1. State MILIK SENDIRI disetel saat render (pola adjust-state-saat-render
  //      yang dipakai di seluruh kode ini).
  //   2. Store BERSAMA dikosongkan di effect. Mengosongkannya saat render
  //      memicu peringatan React "Cannot update a component while rendering a
  //      different component"; menyetel state lokal di dalam effect melanggar
  //      `react-hooks/set-state-in-effect`. Pembelahan ini memenuhi keduanya.
  const requestedProfile = useImportPresetStore((state) => state.requestedProfile)
  const consumeRequestedProfile = useImportPresetStore((state) => state.consumeRequestedProfile)
  const [handledPreset, setHandledPreset] = useState<string | null>(null)

  if (requestedProfile !== null && requestedProfile !== handledPreset && profiles.length > 0) {
    setHandledPreset(requestedProfile)
    if (profiles.some((p: ImportProfile) => p.key === requestedProfile)) {
      setProfileKey(requestedProfile)
      setStep('upload')
    }
  }

  useEffect(() => {
    if (requestedProfile !== null && requestedProfile === handledPreset) {
      consumeRequestedProfile()
    }
  }, [requestedProfile, handledPreset, consumeRequestedProfile])

  const { data: batchResponse } = useImportBatch(activeUuid)
  const batch = batchResponse?.data ?? null

  // Pantau transisi committing → completed/failed (async profile) — toast
  // begitu job antrean selesai, tanpa perlu refresh manual.
  const prevStatusRef = useRef(batch?.status)
  useEffect(() => {
    const prev = prevStatusRef.current
    const current = batch?.status

    if (prev === 'committing' && current === 'completed' && (batch?.committed_rows ?? 0) > 0) {
      toast.success(`${batch?.committed_rows} baris berhasil di-commit.`)
    } else if (prev === 'committing' && (current === 'failed' || current === 'completed')) {
      toast.error(batch?.error_message ?? 'Commit gagal — tidak ada baris yang berhasil di-commit.')
    }

    prevStatusRef.current = current
  }, [batch?.status, batch?.committed_rows, batch?.error_message, toast])

  const { data: rowsResponse, isFetching: rowsFetching } = useImportRows(step === 'preview' ? activeUuid : null, rowsPage)

  const { upload, mapping, commit, cancel, revert } = useImportMutations()
  const busy = upload.isPending || mapping.isPending || commit.isPending || cancel.isPending

  const reset = () => {
    setStep('upload')
    setProfileKey('')
    setFile(null)
    setActiveUuid(null)
    setUploadHeaders([])
    setColumnMap({})
    setDuplicateWarning(null)
    setUploadError(null)
    setRowsPage(1)
    setAutoMappedNotice(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Langkah 1: unggah ────────────────────────────────────────────────

  const doUpload = async (confirmDuplicateFile = false) => {
    if (!profile || !file) return

    try {
      const res = await upload.mutateAsync({ profile: profile.key, file, confirmDuplicateFile })
      const { batch: uploaded, headers, suggested_column_map: suggested, auto_mapped: autoMapped } = res.data

      setActiveUuid(uploaded.uuid)
      setUploadHeaders(headers)
      setColumnMap(suggested)
      setDuplicateWarning(null)

      /*
       * Berkas yang headernya sudah dikenal tidak perlu layar pemetaan sama
       * sekali — jawabannya sudah pasti, dan memintanya lagi cuma menyuruh user
       * mengetik ulang apa yang sudah diketahui sistem. Layar itu kini hanya
       * muncul untuk berkas yang memang belum bisa disimpulkan.
       */
      if (autoMapped) {
        try {
          await mapping.mutateAsync({ uuid: uploaded.uuid, columnMap: suggested })
          setAutoMappedNotice(true)
          setStep('preview')

          return
        } catch {
          // Tebakannya ditolak backend — jatuh ke layar pemetaan, bukan ke
          // penanganan galat unggah di bawah: berkasnya sudah masuk, yang
          // gagal cuma langkah sesudahnya.
          toast.error('Kolom tidak bisa dipetakan otomatis. Periksa pemetaannya.')
          setAutoMappedNotice(false)
          setStep('mapping')

          return
        }
      }

      setAutoMappedNotice(false)
      setStep('mapping')
    } catch (error) {
      const apiError = error as ApiError

      if (apiError.code === 'IMPORT_FILE_DUPLICATE') {
        setDuplicateWarning((apiError.meta as unknown as DuplicateFileWarningMeta)?.duplicate ?? null)
        return
      }

      if (apiError.code === 'IMPORT_ACTIVE_BATCH_EXISTS') {
        const meta = apiError.meta as unknown as ActiveBatchExistsMeta
        toast.error('Masih ada batch impor aktif. Lanjutkan atau buang batch itu dulu.')
        if (meta?.batch_uuid) {
          // Lewat resumeBatch, bukan setActiveUuid langsung: tanpa profil dan
          // header yang ikut terpasang, layar pemetaan tidak merender apa pun.
          await resumeBatch({ uuid: meta.batch_uuid } as ImportBatch)
        }
        return
      }

      // Tampilkan error validasi per-field (mis. "file harus berupa csv/txt/xlsx",
      // "file terlalu besar") di samping input file agar user tahu persis apa yang salah.
      const fieldErrors = getApiValidationErrors(error)
      const fileMsg = fieldErrors.file ?? fieldErrors.profile

      if (fileMsg) {
        setUploadError(fileMsg)
      } else {
        // Jangan kosongkan uploadError begitu saja -- tampilkan ringkasan dari
        // SEMUA field error yang tersedia, atau pesan API, supaya user tetap
        // mendapat petunjuk meskipun error-nya tidak khusus di field "file".
        const allMessages = Object.values(fieldErrors).filter(Boolean)
        const summary =
          allMessages.length > 0
            ? allMessages.join('; ')
            : getApiErrorMessage(error, '')

        setUploadError(summary || null)
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

      // Async — job dikirim ke antrean, status committing, hasil belum final.
      if (res.data.status === 'committing') {
        toast.info('Commit dikirim ke antrean. Status akan diperbarui setelah selesai.')
        return
      }

      // Sync — hasil final langsung tersedia.
      if (res.data.committed_rows > 0) {
        toast.success(`${res.data.committed_rows} baris berhasil di-commit.`)
      } else {
        toast.error(res.data.error_message ?? 'Commit gagal — tidak ada baris yang berhasil di-commit.')
      }
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

  /**
   * Buka lagi batch yang ditinggalkan — Fase 8.
   *
   * UUID batch cuma hidup di state halaman ini, jadi satu reload sebelum commit
   * membuatnya yatim: ia tampil di riwayat tapi tidak punya layar. Lebih buruk
   * lagi kalau statusnya `previewed`, karena batch aktif memblokir unggahan
   * berikutnya — menu impor terkunci tanpa jalan keluar.
   *
   * `headers` dan pemetaan diambil ulang dari backend (`show()`), bukan dari
   * baris riwayat: riwayat tidak membawa header berkas.
   */
  const resumeBatch = async (item: ImportBatch) => {
    try {
      const { data: detail } = await importsApi.show(item.uuid)

      setProfileKey(detail.profile)
      setActiveUuid(detail.uuid)
      setUploadHeaders(detail.headers)
      setColumnMap(detail.column_map ?? detail.suggested_column_map)
      setFile(null)
      setUploadError(null)
      setDuplicateWarning(null)
      setAutoMappedNotice(false)
      setRowsPage(1)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // `draft` berarti pemetaan belum pernah disimpan — satu-satunya status
      // yang masih butuh layar pemetaan. Sisanya sudah punya baris tervalidasi.
      setStep(detail.status === 'draft' ? 'mapping' : 'preview')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuka batch impor.'))
    }
  }

  const doDiscard = async (uuid: string) => {
    try {
      await cancel.mutateAsync(uuid)
      toast.success('Batch impor dibuang.')
      if (uuid === activeUuid) reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuang batch.'))
    }
  }

  const doRevert = async (uuid: string, reason: string) => {
    try {
      await revert.mutateAsync({ uuid, reason })
      toast.success('Impor dibatalkan — datanya sudah ditarik kembali.')
      if (uuid === activeUuid) reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membatalkan impor.'))
    }
  }

  const doDownloadErrorLog = async () => {
    if (!activeUuid) return
    try {
      await importsApi.downloadErrorLog(activeUuid)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengunduh log error.'))
    }
  }

  const rows = rowsResponse?.data ?? []

  // Kolom pratinjau = kolom berkasnya sendiri, bukan ringkasan hasil validasi.
  // Tanpa isinya, layar ini cuma daftar nomor baris: tidak ada cara melihat
  // APA yang salah pada baris yang ditandai, apalagi membandingkannya dengan
  // berkas asli. Header diambil dari berkas; kalau berkasnya sudah tidak
  // terbaca, dari kunci baris mentah yang tersimpan di basis data.
  const fileHeaders =
    batch?.headers && batch.headers.length > 0 ? batch.headers : Object.keys(rows[0]?.raw ?? {})

  // Profil batch, bukan `profile` dari dropdown: setelah commit selesai user
  // bisa mengganti pilihan dropdown sementara pratinjau lama masih terbuka.
  const batchProfile = profiles.find((p: ImportProfile) => p.key === batch?.profile) ?? null

  // Field uang diterjemahkan jadi header berkas lewat `column_map` (field →
  // header), supaya sel tahu ia kolom uang atau bukan tanpa menebak dari isinya.
  const moneyHeaders = new Set(
    (batchProfile?.money_fields ?? [])
      .map((field) => (batch?.column_map ?? {})[field])
      .filter((header): header is string => typeof header === 'string' && header !== ''),
  )

  const previewColumns: ColumnDef<ImportRow>[] = [
    {
      id: '_row_number',
      header: 'Baris',
      cell: ({ original }) => <span className="tabular-nums text-[#94a3b8]">{original.row_number}</span>,
      meta: { className: 'w-14' },
    },
    ...fileHeaders.map((header): ColumnDef<ImportRow> => {
      const isMoney = moneyHeaders.has(header)

      return {
        id: `col:${header}`,
        header,
        // Nilai uang diformat sebagai mata uang, sisanya ditampilkan apa adanya.
        // Memformat setiap sel yang kebetulan angka justru merusak data: kode
        // akun '1100' bukan seribu seratus rupiah, dan '01/07/2024' bukan angka.
        cell: ({ original }) => {
          const value = original.raw?.[header] ?? ''

          return isMoney && value.trim() !== '' ? formatCurrency(value) : value
        },
        meta: { className: isMoney ? 'text-right tabular-nums whitespace-nowrap' : 'whitespace-nowrap' },
      }
    }),
    {
      id: '_status',
      header: 'Status',
      cell: ({ original }) => (
        <Badge className={cn('text-[10px] px-1.5 py-0', rowStatusBadgeClass(original.status))}>
          {original.status}
        </Badge>
      ),
    },
    {
      id: '_notes',
      header: 'Keterangan',
      // Galat dan peringatan berbagi satu kolom: keduanya jarang terisi
      // sekaligus, dan dua kolom yang hampir selalu kosong mendesak data
      // berkasnya keluar layar. Peringatan tidak menggagalkan baris — barisnya
      // tetap ter-commit — jadi warnanya amber, bukan merah.
      cell: ({ original }) => {
        const errors = joinMessages(original.errors)
        const warnings = joinMessages(original.warnings)

        if (errors === '' && warnings === '') return <span className="text-[#cbd5e1]">—</span>

        return (
          <div className="min-w-[200px]">
            {errors !== '' && <p className="text-[#991B1B]">{errors}</p>}
            {warnings !== '' && <p className="text-[#92400E]">{warnings}</p>}
          </div>
        )
      },
    },
  ]

  const canCommit = (batch?.valid_rows ?? 0) > 0 && batch?.status === 'previewed' && can('imports.commit')
  const isDone = batch?.status === 'completed' || batch?.status === 'failed'
  const isCommitting = batch?.status === 'committing'

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
              dipakai apa adanya. Templatnya berkas Excel (.xlsx), tinggal diisi lalu diunggah balik; berkas .csv juga
              tetap diterima. Maksimal 1.000 baris.
            </p>
            <p className="text-[12px] text-[#64748b] mb-4">
              Isi sheet <strong>Data</strong> saja. Kolom yang harus cocok dengan master data sistem (kategori aset,
              kode akun, departemen, proyek) sudah berisi dropdown -- pilih dari daftarnya, jangan diketik. Daftar
              lengkapnya ada di sheet <strong>Referensi</strong> di berkas yang sama.
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
                  <Download className="w-3.5 h-3.5" /> Unduh Templat {profile.label} (.xlsx)
                </Button>
              )}

              {/*
                Sejak Fase 8 tidak ada urutan wajib antara dua profil ini, dan
                itu justru yang perlu dikatakan — pesan sebelumnya menyuruh
                sebaliknya, jadi user yang pernah membacanya akan menahan diri
                tanpa alasan.
              */}
              {profileKey === 'opening_balance' && (
                <div className="flex gap-2 rounded-md border border-[#bfdbfe] bg-[#eff6ff] p-3 text-[12px] text-[#1e40af]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    Berkas ini mengisi <strong>saldo akun</strong> — termasuk akun aset tetap. Selisihnya
                    otomatis jatuh ke akun perantara, jadi berkasnya tidak perlu seimbang dan boleh dicicil.
                    Impor aset tetap terpisah dan urutannya bebas.
                  </p>
                </div>
              )}

              {profileKey === 'fixed_asset_opening' && (
                <div className="flex gap-2 rounded-md border border-[#bfdbfe] bg-[#eff6ff] p-3 text-[12px] text-[#1e40af]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    Berkas ini mendaftarkan <strong>kartu aset</strong> saja dan tidak membuat jurnal apa pun —
                    nilainya masuk buku besar lewat berkas saldo awal. Boleh sebagian: daftarkan yang sudah
                    pasti, sisanya menyusul.
                  </p>
                </div>
              )}

              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Berkas</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUploadError(null) }}
                  className="mt-1 block w-full text-[12px] text-[#64748b] file:mr-3 file:rounded-md file:border-0 file:bg-[#5c9ead] file:px-3 file:py-1.5 file:text-[12px] file:text-white hover:file:bg-[#4a8a9b]"
                />
                {uploadError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-500">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {uploadError}
                  </p>
                )}
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
              Kolom yang headernya dikenali sudah terisi sendiri — layar ini cuma muncul karena ada yang
              belum. Lengkapi sisanya; field bertanda <span className="text-red-500">*</span> wajib dipetakan.
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

            {autoMappedNotice && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#bfdbfe] bg-[#eff6ff] p-3">
                <p className="text-[12px] text-[#1e40af]">
                  <Info className="mr-1 inline h-3.5 w-3.5" />
                  Kolom berkas dikenali otomatis, jadi langkah pemetaan dilewati.
                </p>
                {/* Tebakan tetap bisa salah untuk berkas yang kolomnya mirip —
                    jalan keluarnya harus ada, dan harus terlihat. */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => setStep('mapping')}
                >
                  Ubah Pemetaan
                </Button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 my-4 text-center">
              <SummaryTile label="Total Baris" value={batch.total_rows} />
              <SummaryTile label="Valid" value={batch.valid_rows} tone="success" />
              <SummaryTile label="Gagal" value={batch.failed_rows} tone="danger" />
              <SummaryTile label="Peringatan" value={batch.warning_rows} tone="warning" />
            </div>

            {batch.warning_rows > 0 && (
              <div className="mb-4 rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3">
                <p className="text-[12px] text-[#92400E]">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  {batch.warning_rows} baris punya peringatan. Baris ini <strong>tetap valid dan tetap
                  di-commit</strong> — periksa kolom Keterangan di bawah, lalu perbaiki berkasnya dan unggah
                  ulang kalau ada yang memang salah.
                </p>
              </div>
            )}

            {batch.failed_rows > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-md border border-[#FEE2E2] bg-[#FEF2F2] p-3">
                <p className="text-[12px] text-[#991B1B]">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  {batch.failed_rows} baris gagal divalidasi. Unduh log error untuk melihat detail dan memperbaiki data.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-[11px] border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2]"
                  onClick={() => void doDownloadErrorLog()}
                >
                  <FileDown className="w-3.5 h-3.5" /> Unduh Log Error
                </Button>
              </div>
            )}

            {isCommitting && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-[#EFF9FB] bg-[#EFF9FB] p-3 text-[12px] text-[#326273]">
                <span className="inline-block w-3.5 h-3.5 border-2 border-[#326273] border-t-transparent rounded-full animate-spin" />
                Commit sedang diproses di latar belakang. Status akan diperbarui otomatis...
              </div>
            )}

            {isDone && (
              <div
                className={cn(
                  'mb-4 flex flex-col gap-2 rounded-md border p-3 text-[12px]',
                  batch.committed_rows > 0
                    ? 'border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]'
                    : 'border-[#FEE2E2] bg-[#FEF2F2] text-[#991B1B]',
                )}
              >
                <div className="flex items-center gap-2">
                  {batch.committed_rows > 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {batch.committed_rows} dari {batch.valid_rows} baris valid berhasil di-commit.
                </div>
                {batch.committed_rows === 0 && batch.error_message && (
                  <p className="whitespace-pre-wrap">{batch.error_message}</p>
                )}
              </div>
            )}

            <DataTable
              data={rows}
              columns={previewColumns}
              totalRows={rowsResponse?.meta.total ?? 0}
              isFetching={rowsFetching}
              pagination={{ pageIndex: rowsPage - 1, pageSize: 50 }}
              onPaginationChange={(state) => setRowsPage(state.pageIndex + 1)}
              emptyTitle="Belum ada baris"
              emptyDescription="Baris berkas muncul di sini setelah pemetaan kolom divalidasi."
            />

            <div className="flex justify-between mt-5">
              <Button type="button" variant="outline" className="h-9 text-[13px]" disabled={busy || isDone || isCommitting} onClick={() => void doCancel()}>
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

        {isDone && batch && batch.committed_rows > 0 && <NextStepPanel profile={batch.profile} />}

        <ImportHistory
          onRevert={(uuid, reason) => doRevert(uuid, reason)}
          onResume={(item) => void resumeBatch(item)}
          onDiscard={(uuid) => void doDiscard(uuid)}
          reverting={revert.isPending}
          discarding={cancel.isPending}
          canRevert={can('imports.revert')}
          canCancel={can('imports.cancel')}
          activeUuid={activeUuid}
        />
      </div>
    </WorkspaceLayout>
  )
}

/**
 * Apa yang harus dikerjakan user setelah commit selesai.
 *
 * Keluhan yang memicu Fase 8, harfiah: *"Aku sudah import aset tetap, langkah
 * selanjutnya tidak jelas harus bagaimana."* Layar ini dulu berhenti di
 * "Impor Berkas Lain" dan tidak pernah menyebut ke mana hasilnya pergi.
 */
function NextStepPanel({ profile }: { profile: string }) {
  const openTab = useOpenPrimaryTab()

  if (!REVERTIBLE_PROFILES.includes(profile)) return null

  const openBoard = () =>
    openTab({
      id: 'opening-balance',
      menuKey: 'opening-balance',
      label: 'Saldo Awal',
      module: 'accounting',
      path: '/opening-balance',
    })

  return (
    <section className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-5">
      <h2 className="text-[14px] font-semibold text-[#1e40af]">Langkah selanjutnya</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-[#1e40af]">
        {profile === 'opening_balance' ? (
          <>
            <li>Berkas ini sudah jadi satu jurnal pembuka. Selisihnya ada di akun perantara.</li>
            <li>Masih ada saldo akun lain? Impor berkas berikutnya — boleh dicicil.</li>
            <li>Kalau semuanya sudah masuk, tutup perantaranya ke ekuitas di papan Saldo Awal.</li>
          </>
        ) : (
          <>
            <li>Kartu aset sudah terdaftar dan aktif, beserta jadwal penyusutannya.</li>
            <li>Nilainya belum ada di buku besar — itu masuk lewat berkas saldo awal.</li>
            <li>Papan Saldo Awal menunjukkan apakah saldo akunnya sudah sama dengan kartu aset.</li>
          </>
        )}
      </ul>
      <Button type="button" className="mt-3 h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]" onClick={openBoard}>
        Buka Papan Saldo Awal
      </Button>
    </section>
  )
}

/**
 * Riwayat impor + pembatalannya.
 *
 * Sampai Fase 7 tidak ada rute daftar sama sekali: UUID batch cuma hidup di
 * state halaman ini, jadi batch yang sudah selesai tidak punya layar tempat ia
 * bisa dibuka lagi — apalagi dibatalkan.
 */
function ImportHistory({
  onRevert,
  onResume,
  onDiscard,
  reverting,
  discarding,
  canRevert,
  canCancel,
  activeUuid,
}: {
  onRevert: (uuid: string, reason: string) => void
  onResume: (item: ImportBatch) => void
  onDiscard: (uuid: string) => void
  reverting: boolean
  discarding: boolean
  canRevert: boolean
  canCancel: boolean
  activeUuid: string | null
}) {
  const [page, setPage] = useState(1)
  const { data } = useImportHistory(page)
  const [target, setTarget] = useState<ImportBatch | null>(null)
  const [discardTarget, setDiscardTarget] = useState<ImportBatch | null>(null)

  const batches = data?.data ?? []
  if (batches.length === 0) return null

  const historyColumns: ColumnDef<ImportBatch>[] = [
    {
      id: 'original_filename',
      header: 'Berkas',
      cell: ({ original }) => <span className="text-[#334155]">{original.original_filename}</span>,
    },
    {
      id: 'profile',
      header: 'Profil',
      cell: ({ original }) => <span className="text-[#64748b]">{original.profile}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ original }) => (
        <Badge className={cn('text-[10px] px-1.5 py-0', statusBadgeClass(original.status))}>
          {STATUS_LABELS[original.status] ?? original.status}
        </Badge>
      ),
    },
    {
      id: 'committed_rows',
      header: 'Ter-commit',
      cell: ({ original }) => original.committed_rows,
      meta: { className: 'text-right tabular-nums', headerClassName: 'text-right' },
    },
    {
      id: '_actions',
      header: 'Aksi',
      meta: { className: 'text-right', headerClassName: 'text-right' },
      cell: ({ original }) => (
        <div className="flex justify-end gap-1.5">
          {/* Batch yang belum di-commit: datanya belum masuk buku, jadi ia hanya
              perlu diteruskan atau dibuang. Tanpa dua tombol ini, satu reload
              sebelum commit meninggalkan batch yang tidak bisa disentuh dari
              mana pun. */}
          {RESUMABLE_STATUSES.includes(original.status) && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[11px]"
                onClick={() => onResume(original)}
              >
                <PlayCircle className="h-3 w-3" />
                {original.uuid === activeUuid ? 'Buka Lagi' : 'Lanjutkan'}
              </Button>
              {canCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 border-[#fecaca] text-[11px] text-[#b91c1c] hover:bg-[#fef2f2]"
                  disabled={discarding}
                  onClick={() => setDiscardTarget(original)}
                >
                  <Trash2 className="h-3 w-3" /> Buang
                </Button>
              )}
            </>
          )}

          {canRevert && original.status === 'completed' && REVERTIBLE_PROFILES.includes(original.profile) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px]"
              onClick={() => setTarget(original)}
            >
              <Undo2 className="h-3 w-3" /> Batalkan Impor
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <section className="bg-white border border-[#d9e2e5] rounded-lg p-5">
      <h2 className="text-[14px] font-semibold text-[#24323a]">Riwayat Impor</h2>

      <div className="mt-3">
        <DataTable
          data={batches}
          columns={historyColumns}
          totalRows={data?.meta.total ?? 0}
          pagination={{ pageIndex: page - 1, pageSize: 25 }}
          onPaginationChange={(state) => setPage(state.pageIndex + 1)}
          emptyTitle="Belum ada impor"
        />
      </div>

      {/* Dibuang, bukan di-void: tidak ada dokumen yang perlu ditarik kembali,
          jadi alasannya pun tidak perlu diminta. */}
      <ConfirmDialog
        isOpen={discardTarget !== null}
        onClose={() => setDiscardTarget(null)}
        onConfirm={() => {
          if (discardTarget) onDiscard(discardTarget.uuid)
          setDiscardTarget(null)
        }}
        title="Buang Batch Impor"
        description={`Berkas ${discardTarget?.original_filename ?? ''} dan barisnya dihapus. Belum ada data yang masuk ke buku, jadi tidak ada yang perlu ditarik kembali.`}
        confirmLabel="Buang"
        isLoading={discarding}
        variant="destructive"
        loadingLabel="Membuang..."
      />

      <VoidConfirmDialog
        isOpen={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={(reason) => {
          if (target) onRevert(target.uuid, reason)
          setTarget(null)
        }}
        documentNumber={target?.original_filename ?? ''}
        isLoading={reverting}
        title="Batalkan Impor"
        description={`Seluruh data yang masuk dari ${target?.original_filename ?? ''} akan ditarik kembali.`}
        warning="Jurnal pembuka di-void; kartu aset dihapus. Riwayat impornya tetap tersimpan."
        confirmLabel="Batalkan Impor"
        loadingLabel="Membatalkan..."
      />
    </section>
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

/**
 * Gabung galat/peringatan satu baris jadi satu kalimat. Bentuk datanya sama
 * (field → daftar pesan), yang beda cuma warnanya di tabel.
 */
function joinMessages(messages: Record<string, string[]> | null): string {
  if (!messages) return ''

  return Object.values(messages).flat().join('; ')
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' | 'warning' }) {
  return (
    <div className="rounded-md border border-[#e2e8f0] p-3">
      <p
        className={cn(
          'text-[20px] font-semibold tabular-nums',
          tone === 'success' && 'text-[#065F46]',
          tone === 'danger' && 'text-[#991B1B]',
          tone === 'warning' && 'text-[#92400E]',
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


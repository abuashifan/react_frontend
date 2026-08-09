import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import type { ApiError } from '@/types/api.types'

type ValidationErrorMap = Record<string, string>

/**
 * Pesan Indonesia untuk `code` error backend yang sering dilihat user.
 *
 * Backend mengirim `message` dalam bahasa Inggris (mis. "Product code is already
 * in use."). Peta ini dipakai lebih dulu supaya user melihat penyebab yang jelas
 * dan berbahasa Indonesia, bukan sekadar fallback generik "Gagal menyimpan".
 * Kode yang belum terdaftar otomatis jatuh ke `message` dari backend.
 */
const API_ERROR_MESSAGES_ID: Record<string, string> = {
  DUPLICATE_ACCOUNT_CODE: 'Kode akun sudah digunakan. Gunakan kode lain.',
  DUPLICATE_CONTACT_CODE: 'Kode kontak sudah digunakan. Gunakan kode lain.',
  DUPLICATE_DEPARTMENT_CODE: 'Kode departemen sudah digunakan. Gunakan kode lain.',
  DUPLICATE_PAYMENT_TERM_CODE: 'Kode syarat bayar sudah digunakan. Gunakan kode lain.',
  DUPLICATE_PRODUCT_CODE: 'Kode produk sudah digunakan. Gunakan kode lain.',
  DUPLICATE_PROJECT_CODE: 'Kode proyek sudah digunakan. Gunakan kode lain.',
  DUPLICATE_UNIT_CODE: 'Kode satuan sudah digunakan. Gunakan kode lain.',
  DUPLICATE_WAREHOUSE_CODE: 'Kode gudang sudah digunakan. Gunakan kode lain.',
  DOCUMENT_NUMBER_DUPLICATE: 'Nomor dokumen sudah digunakan.',
  ACCOUNT_HAS_ACTIVE_CHILDREN: 'Akun tidak bisa dinonaktifkan karena masih punya sub-akun aktif.',
  PRODUCT_HAS_STOCK: 'Produk tidak bisa dinonaktifkan karena stoknya belum nol. Habiskan atau sesuaikan stok lebih dulu.',
  ACCOUNT_INACTIVE: 'Akun yang dipilih tidak aktif.',
  ACCOUNT_MAPPING_MISSING: 'Pemetaan akun belum diatur. Lengkapi di Pengaturan > Pemetaan Akun.',
  ACCOUNT_NOT_FOUND: 'Akun tidak ditemukan.',
  ACCOUNT_TYPE_NOT_ALLOWED: 'Tipe akun tidak diizinkan untuk transaksi ini.',
  INVALID_PARENT_ACCOUNT: 'Akun induk tidak valid.',
  INVALID_PARENT_CATEGORY: 'Kategori induk tidak valid.',
  PARENT_ACCOUNT_NOT_FOUND: 'Akun induk tidak ditemukan.',
  PARENT_CATEGORY_NOT_FOUND: 'Kategori induk tidak ditemukan.',
  INVALID_CASH_BANK_ACCOUNT_TYPE: 'Akun kas/bank hanya boleh bertipe Aset.',
  CANNOT_DEACTIVATE_DEFAULT_WAREHOUSE: 'Gudang default tidak bisa dinonaktifkan.',
  ACCOUNTING_PERIOD_CLOSED: 'Periode akuntansi sudah ditutup.',
  FISCAL_YEAR_CLOSED: 'Tahun fiskal sudah ditutup.',
  BACKDATED_TRANSACTION_NOT_ALLOWED: 'Transaksi mundur tidak diizinkan.',
  FUTURE_TRANSACTION_NOT_ALLOWED: 'Transaksi bertanggal masa depan tidak diizinkan.',
  OPENING_BALANCE_UNBALANCED: 'Saldo awal belum seimbang antara debit dan kredit.',
  EDIT_REASON_REQUIRED: 'Alasan perubahan wajib diisi.',
  PERMISSION_DENIED: 'Anda tidak punya izin untuk aksi ini.',
  FORBIDDEN: 'Anda tidak punya izin untuk aksi ini.',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (!Array.isArray(value)) return null

  const first = value.find((item): item is string => typeof item === 'string' && item.trim() !== '')
  return first ?? null
}

function responseDataFrom(error: unknown): Record<string, unknown> | null {
  if (!isRecord(error)) return null
  const response = error.response
  if (!isRecord(response)) return null
  return isRecord(response.data) ? response.data : null
}

function apiErrorFrom(error: unknown): Partial<ApiError> | null {
  const responseData = responseDataFrom(error)
  if (responseData) return responseData as Partial<ApiError>

  if (isRecord(error) && typeof error.message === 'string') {
    return error as Partial<ApiError>
  }

  return null
}

/** Pesan Indonesia untuk `code` error backend, jika kodenya dikenal. */
function localizedMessageFor(error: unknown): string | null {
  const apiError = apiErrorFrom(error)
  const code = apiError?.code
  if (typeof code !== 'string') return null
  return API_ERROR_MESSAGES_ID[code] ?? null
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  const localized = localizedMessageFor(error)
  if (localized) return localized

  const apiError = apiErrorFrom(error)

  // Pesan validasi backend berbahasa Inggris ("Please review the highlighted
  // fields."). Detail per field sudah tampil di bawah input lewat
  // `applyApiValidationErrors`, jadi toast cukup mengarahkan ke sana.
  if (apiError?.code === 'VALIDATION_ERROR') {
    return 'Periksa kembali isian yang ditandai.'
  }

  if (typeof apiError?.message === 'string' && apiError.message.trim() !== '') {
    return apiError.message
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return fallback
}

/** Error per baris item: `{ 0: { quantity: 'pesan' }, 2: { unit_price: 'pesan' } }`. */
export type LineItemErrorMap = Record<number, Record<string, string>>

/**
 * Ambil error baris item dari respons validasi backend.
 *
 * Laravel memvalidasi `lines.*.quantity`, sehingga error kembali dengan key
 * `lines.0.quantity`. Tanpa dipetakan ke indeks baris, pesan itu tidak pernah
 * sampai ke tabel item — user cuma dapat toast tanpa tahu baris mana yang salah.
 */
export function getApiLineErrors(error: unknown, arrayKey = 'lines'): LineItemErrorMap {
  const prefix = `${arrayKey}.`
  const result: LineItemErrorMap = {}

  Object.entries(getApiValidationErrors(error)).forEach(([field, message]) => {
    if (!field.startsWith(prefix)) return

    const [indexPart, ...fieldParts] = field.slice(prefix.length).split('.')
    const rowIndex = Number(indexPart)
    if (!Number.isInteger(rowIndex) || rowIndex < 0) return

    // `lines.0` tanpa nama field (mis. aturan pada baris itu sendiri) disimpan
    // dengan kunci arrayKey supaya tetap tampil sebagai pesan baris.
    const fieldName = fieldParts.join('.') || arrayKey

    // Laravel menyebut path lengkap di pesannya ("The lines.0.account_id field is
    // required."). Nomor barisnya sudah terlihat dari baris yang ditandai, jadi
    // buang path itu agar catatannya ringkas.
    const cleaned = message.replaceAll(`${prefix}${rowIndex}.`, '')

    result[rowIndex] = { ...(result[rowIndex] ?? {}), [fieldName]: cleaned }
  })

  return result
}

/**
 * Alasan gagal dari aksi massal (`Promise.allSettled`) — mis. bulk void.
 *
 * Tanpa ini toast hanya menyebut jumlah ("Gagal void 3 invoice.") tanpa sebab,
 * padahal penyebabnya biasanya sama untuk semua baris (periode tertutup, tidak
 * punya izin, dokumen sudah dipakai). Kembalikan '' bila tidak ada yang gagal.
 */
export function getBulkFailureDetail(results: PromiseSettledResult<unknown>[]): string {
  const firstRejected = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  )
  if (!firstRejected) return ''

  return getApiErrorMessage(firstRejected.reason, '')
}

export function getApiValidationErrors(error: unknown): ValidationErrorMap {
  const apiError = apiErrorFrom(error)
  if (!isRecord(apiError?.errors)) return {}

  return Object.fromEntries(
    Object.entries(apiError.errors)
      .map(([field, messages]) => [field, firstMessage(messages)])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

export function isApiNotFound(error: unknown): boolean {
  const status = isRecord(error) && typeof error.status === 'number'
    ? error.status
    : isRecord(error) && isRecord(error.response) && typeof error.response.status === 'number'
      ? error.response.status
      : undefined

  return status === 404
}

export function applyApiValidationErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldMap: Partial<Record<string, FieldPath<TFieldValues>>> = {},
): boolean {
  const errors = getApiValidationErrors(error)
  const entries = Object.entries(errors)

  // Kalau error hanya menyoal satu field dan kodenya dikenal (mis.
  // DUPLICATE_PRODUCT_CODE), tampilkan pesan Indonesia di field itu supaya
  // konsisten dengan toast — bukan pesan mentah berbahasa Inggris dari backend.
  const localized = entries.length === 1 ? localizedMessageFor(error) : null
  let applied = false

  entries.forEach(([backendField, message]) => {
    const field = fieldMap[backendField] ?? (backendField as FieldPath<TFieldValues>)
    setError(field, { type: 'server', message: localized ?? message })
    applied = true
  })

  return applied
}

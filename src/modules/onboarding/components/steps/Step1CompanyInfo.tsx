import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/shared/form/FormSection'
import { useAuthStore } from '@/stores/useAuthStore'
import { companyInfoSchema, type CompanyInfoValues } from '../../schemas/companyInfoSchema'
import { setupApi } from '../../services/onboardingApi'
import { companySettingsApi } from '@/modules/settings/services/companySettingsApi'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useTransactionEditMode } from '@/modules/settings/hooks/useTransactionEditMode'
import { EDIT_MODE_OPTIONS } from '@/modules/settings/constants/transactionEditMode'

const FISCAL_MONTH_OPTIONS = [
  { value: '1', label: 'Januari' },
  { value: '4', label: 'April' },
  { value: '7', label: 'Juli' },
  { value: '10', label: 'Oktober' },
]

interface Props {
  defaultValues?: Partial<CompanyInfoValues>
  onComplete: (values: CompanyInfoValues) => void
}

export function Step1CompanyInfo({ defaultValues, onComplete }: Props) {
  const { toast } = useToast()

  /*
   * Nama perusahaan dibaca dari perusahaan aktif, bukan diminta ulang — lihat
   * alasannya di companyInfoSchema. Daftar `companies` di store sudah terisi
   * sejak login/pembuatan perusahaan, jadi tidak perlu request tambahan.
   */
  const companyName = useAuthStore(
    (s) => s.companies.find((company) => company.id === s.activeCompanyId)?.name ?? null,
  )

  const form = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      npwp: '',
      address: '',
      fiscal_year_start: '1',
      currency: 'IDR',
      transaction_edit_mode: 'lock',
      ...defaultValues,
    },
  })

  // Mode yang sudah tersimpan (mis. wizard dibuka ulang) jadi nilai awal,
  // supaya kembali ke langkah ini tidak diam-diam mengembalikannya ke lock.
  const { mode: savedEditMode } = useTransactionEditMode()
  useEffect(() => {
    if (!form.formState.dirtyFields.transaction_edit_mode) form.setValue('transaction_edit_mode', savedEditMode)
  }, [savedEditMode, form])
  const editMode = form.watch('transaction_edit_mode')

  const onSubmit = async (values: CompanyInfoValues) => {
    try {
      // Mata uang dasar disimpan via company accounting settings (endpoint nyata).
      // Catatan: backend belum mengekspos update profil (NPWP/alamat) &
      // fiscal_year_start lewat setup wizard; field tersebut hanya dipakai untuk
      // ringkasan wizard.
      await companySettingsApi.updateAccounting({ base_currency: values.currency, transaction_edit_mode: values.transaction_edit_mode })
      // Tandai progres step di backend (best-effort). `opening_date` dititipkan di sini
      // karena tidak ada step lain di wizard yang mengirimnya sama sekali -- tanpa ini
      // validasi `accounting_settings` (OPENING_DATE_REQUIRED) akan selalu gagal saat
      // finalize walau semua step lain valid. Default ke hari ini; saldo awal per akun
      // tetap diinput lewat modul Saldo Awal terpisah dengan tanggal batch-nya sendiri.
      try {
        await setupApi.validateStep('company_profile', {
          opening_date: new Date().toISOString().slice(0, 10),
        })
      } catch { /* progres non-blocking */ }
      onComplete(values)
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan informasi perusahaan. Coba lagi.'))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-md border border-[#d9e2e5] bg-[#f8fbfc] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Nama Perusahaan
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-[#24323a]">
            {companyName ?? 'Perusahaan aktif'}
          </p>
          <p className="mt-1 text-[11px] text-[#94a3b8]">
            Sudah diisi saat perusahaan dibuat — tidak perlu diketik ulang di sini.
          </p>
        </div>

        <FormSection title="Informasi Dasar" columns={2}>
          <FormField
            control={form.control}
            name="npwp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NPWP</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000.0-000.000" className="h-9 text-[13px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Input placeholder="Jl. Contoh No. 1, Jakarta" className="h-9 text-[13px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fiscal_year_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bulan Mulai Tahun Fiskal <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder="Pilih bulan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FISCAL_MONTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mata Uang</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IDR" className="text-[13px]">IDR — Rupiah Indonesia</SelectItem>
                    <SelectItem value="USD" className="text-[13px]">USD — US Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Edit Transaksi" columns={2}>
          <FormField
            control={form.control}
            name="transaction_edit_mode"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Mode Edit Transaksi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EDIT_MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-[#94a3b8]">
                  {EDIT_MODE_OPTIONS.find((opt) => opt.value === editMode)?.hint} Bisa diubah nanti di Pengaturan → Transaksi.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-[#e39774] hover:bg-[#d4845e] px-6"
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Lanjutkan →'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

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
import { useCompanySettings } from '@/modules/settings/hooks/useCompanySettings'

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

  // NPWP & alamat yang sudah tersimpan jadi nilai awal (wizard dibuka ulang).
  const { data: settings } = useCompanySettings()
  const savedProfile = settings?.data?.profile
  useEffect(() => {
    if (!savedProfile) return
    if (!form.formState.dirtyFields.npwp && savedProfile.tax_number) form.setValue('npwp', savedProfile.tax_number)
    if (!form.formState.dirtyFields.address && savedProfile.address) form.setValue('address', savedProfile.address)
  }, [savedProfile, form])

  const onSubmit = async (values: CompanyInfoValues) => {
    try {
      // NPWP & alamat disimpan ke profil perusahaan; mata uang & mode edit ke
      // pengaturan akuntansi. Tahun fiskal selalu tahun kalender (lihat
      // FiscalYearService), jadi tidak ada pilihan bulan yang dikirim.
      await companySettingsApi.updateProfile({ tax_number: values.npwp || null, address: values.address || null })
      await companySettingsApi.updateAccounting({ base_currency: values.currency, transaction_edit_mode: values.transaction_edit_mode })
      // Tandai progres step di backend (best-effort). Tanggal saldo awal TIDAK
      // dikirim dari sini: dulu dititipkan sebagai "hari ini", padahal bawaan yang
      // benar adalah awal tahun fiskal (backend memakainya bila belum diisi), dan
      // setiap kembali ke langkah ini tanggal pilihan user di langkah Saldo Awal
      // ikut tertimpa. Langkah Saldo Awal yang menyimpannya.
      try {
        await setupApi.validateStep('company_profile', {})
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

          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-medium text-[#24323a]">Tahun Fiskal</p>
            <div className="flex h-9 items-center rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#475569]">
              Januari – Desember (tahun kalender)
            </div>
            <p className="text-[11px] text-[#94a3b8]">Periode tutup buku mengikuti tahun kalender.</p>
          </div>

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

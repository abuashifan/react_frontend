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
import { companyInfoSchema, type CompanyInfoValues } from '../../schemas/companyInfoSchema'
import { onboardingApi } from '../../services/onboardingApi'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/hooks/useToast'

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
  const { activeCompanyId } = useAuthStore()
  const { toast } = useToast()

  const form = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: '',
      npwp: '',
      address: '',
      fiscal_year_start: '1',
      currency: 'IDR',
      ...defaultValues,
    },
  })

  const onSubmit = async (values: CompanyInfoValues) => {
    if (!activeCompanyId) return
    try {
      await onboardingApi.updateCompanyInfo(activeCompanyId, values)
      onComplete(values)
    } catch {
      toast.error('Gagal menyimpan informasi perusahaan. Coba lagi.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Informasi Dasar" columns={2}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Perusahaan <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="PT Seaside Escape" className="h-9 text-[13px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

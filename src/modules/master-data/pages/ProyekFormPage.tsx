import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRecordTab } from '@/hooks/useRecordTab'
import { usePermission } from '@/hooks/usePermission'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormField } from '@/components/shared/form/FormField'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { proyekApi } from '../services/proyekApi'
import { useProyek } from '../hooks/useSimpleLists'
import { proyekSchema, type ProyekFormValues } from '../schemas/proyekSchema'
import type { ProyekStatus } from '../types/proyek.types'
import { ProjectBudgetTab } from './ProjectBudgetTab'

const STATUS_OPTIONS: { value: ProyekStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'on_hold', label: 'Ditunda' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

/**
 * `/master-data/projects/create` dan `/master-data/projects/:id` merender komponen
 * yang sama dan React Router tidak me-remount saat berpindah di antaranya — hanya
 * param yang berubah. Tanpa `key`, state form dari record sebelumnya bocor ke tab
 * form lain. Pola yang sama dipakai `KontakFormPage`.
 */
export default function ProyekFormPage() {
  const { id } = useParams()

  return <ProyekFormPageContent key={id ?? 'create'} />
}

function ProyekFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const { openRecordTab, closeRecordTab, replaceRecordTab } = useRecordTab()

  const { data, isLoading } = useProyek(id ? Number(id) : undefined)
  const proyek = data?.data

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProyekFormValues>({
    resolver: zodResolver(proyekSchema),
    defaultValues: { code: '', name: '', description: '', status: 'active' },
  })

  // Status dulu disimpan di useState terpisah dari React Hook Form. Itu sumber
  // kebenaran ganda yang luput saat reset(), jadi sekarang ikut RHF lewat
  // Controller — satu reset() mengisi seluruh form.
  useEffect(() => {
    if (!proyek) return
    reset({
      code: proyek.code,
      name: proyek.name,
      description: proyek.description ?? '',
      status: proyek.status,
      start_date: proyek.start_date ?? '',
      end_date: proyek.end_date ?? '',
    })
  }, [proyek, reset])

  const onSubmit = async (values: ProyekFormValues) => {
    // Field tanggal kosong dikirim sebagai undefined, bukan '' — backend
    // memvalidasi `date_format:Y-m-d` dan string kosong akan ditolak.
    const payload = {
      ...values,
      description: values.description || undefined,
      start_date: values.start_date || undefined,
      end_date: values.end_date || undefined,
    }

    try {
      if (isCreate) {
        const res = await proyekApi.create(payload)
        toast.success('Proyek berhasil dibuat.')
        replaceRecordTab('/master-data/projects/create', {
          label: res.data.code,
          path: `/master-data/projects/${res.data.id}`,
        })
      } else {
        await proyekApi.update(Number(id), payload)
        toast.success('Proyek berhasil diperbarui.')
      }
    } catch (error) {
      // Backend melempar DUPLICATE_PROJECT_CODE dengan errors.code — pemetaan ini
      // menaruhnya di field yang benar, bukan hanya di toast.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan proyek.'))
    }
  }

  const currentPath = isCreate ? '/master-data/projects/create' : `/master-data/projects/${id}`

  return (
    <FormLayout
      title={isCreate ? 'Buat Proyek' : (proyek?.name ?? 'Proyek')}
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'Proyek', path: '/master-data/projects' },
        { label: isCreate ? 'Buat' : 'Edit' },
      ]}
      headerActions={
        <FormSaveActions
          onCancel={() => closeRecordTab(currentPath, '/master-data/projects')}
          onSave={() => void handleSubmit(onSubmit)()}
          isSaving={isSubmitting}
        />
      }
    >
      <Tabs defaultValue="detail" className="space-y-3">
        <TabsList className="h-9">
          <TabsTrigger value="detail" className="text-[12px]">Detail Proyek</TabsTrigger>
          {/* Tab anggaran hanya untuk yang boleh melihat anggaran. Tanpa izin,
              tabnya tidak muncul sama sekali — bukan muncul lalu kosong. */}
          {!isCreate && can('budgets.view') && (
            <TabsTrigger value="budget" className="text-[12px]">Anggaran</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="detail" className="space-y-2.5">
          <section className="rounded-lg border border-[#d9e2e5] bg-white px-3 py-2.5 lg:px-4">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <FormField label="Kode Proyek" htmlFor="project-code" required error={errors.code?.message} className="w-[180px]">
                <Input
                  id="project-code"
                  {...register('code')}
                  // Kode dipakai sebagai rujukan di transaksi yang sudah berjalan;
                  // mengubahnya diizinkan backend tapi tidak ditawarkan di sini.
                  disabled={!isCreate}
                  placeholder="PRJ-001"
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.code))}
                />
              </FormField>

              <FormField label="Nama Proyek" htmlFor="project-name" required error={errors.name?.message} className="w-[280px]">
                <Input
                  id="project-name"
                  {...register('name')}
                  placeholder="Nama proyek..."
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.name))}
                />
              </FormField>

              <FormField label="Status" error={errors.status?.message} className="w-[160px]">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Tanggal Mulai" error={errors.start_date?.message} className="w-[160px]">
                <Input
                  {...register('start_date')}
                  type="date"
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.start_date))}
                />
              </FormField>

              <FormField label="Tanggal Selesai" error={errors.end_date?.message} className="w-[160px]">
                <Input
                  {...register('end_date')}
                  type="date"
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.end_date))}
                />
              </FormField>

              <FormField label="Deskripsi" error={errors.description?.message} className="w-full">
                <Textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Deskripsi proyek..."
                  className="text-[12px]"
                />
              </FormField>
            </div>

            {isLoading && !isCreate && (
              <p className="mt-2 text-[12px] text-[#64748b]">Memuat data proyek...</p>
            )}
          </section>
        </TabsContent>

        {!isCreate && can('budgets.view') && (
          <TabsContent value="budget" className="space-y-2.5">
            <ProjectBudgetTab
              projectId={Number(id)}
              projectName={proyek?.name ?? ''}
              onOpenBudget={openRecordTab}
            />
          </TabsContent>
        )}
      </Tabs>
    </FormLayout>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormField } from '@/components/shared/form/FormField'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass, formatCurrency } from '@/lib/utils'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { proyekApi } from '../services/proyekApi'
import { proyekSchema, type ProyekFormValues } from '../schemas/proyekSchema'
import type { ProyekStatus } from '../types/proyek.types'

interface BudgetLine {
  account_id: number | null
  account?: { id: number; code: string; name: string } | null
  type: 'revenue' | 'expense'
  /** Periode bulanan opsional, format YYYY-MM. */
  period: string
  amount: number
  notes: string
}

const DEFAULT_BUDGET_LINE: BudgetLine = {
  account_id: null,
  account: null,
  type: 'expense',
  period: '',
  amount: 0,
  notes: '',
}

const STATUS_OPTIONS: { value: ProyekStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

export default function ProyekFormPage() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const navigate = useNavigate()

  const [formStatus, setFormStatus] = useState<ProyekStatus>('active')
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([DEFAULT_BUDGET_LINE])
  const [activeTab, setActiveTab] = useState('detail')

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ProyekFormValues>({
    resolver: zodResolver(proyekSchema),
    defaultValues: { status: 'active' as ProyekStatus },
  })

  const totalRevenue = budgetLines
    .filter((l) => l.type === 'revenue')
    .reduce((s, l) => s + (l.amount || 0), 0)
  const totalExpense = budgetLines
    .filter((l) => l.type === 'expense')
    .reduce((s, l) => s + (l.amount || 0), 0)
  const surplus = totalRevenue - totalExpense

  const onSubmit = async (values: ProyekFormValues) => {
    const payload = { ...values, status: formStatus }
    try {
      if (isCreate) {
        const res = await proyekApi.create(payload)
        toast.success('Proyek berhasil dibuat.')
        // Navigasi ke halaman proyek yang baru dibuat
        navigate(`/master-data/projects/${res.data.id}`, { replace: true })
      } else {
        await proyekApi.update(Number(id), payload)
        toast.success('Proyek berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan proyek.'))
    }
  }

  const budgetColumns: LineItemColumn<BudgetLine>[] = [
    {
      id: 'type', header: 'Jenis', width: 110,
      render: ({ item, isReadOnly, onUpdate }) => (
        <select
          value={item.type}
          onChange={(e) => onUpdate('type', e.target.value as 'revenue' | 'expense')}
          disabled={isReadOnly}
          className="h-8 w-full rounded-md border border-[#d9e2e5] bg-white px-2 text-[12px]"
        >
          <option value="revenue">Pendapatan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      ),
    },
    {
      id: 'account', header: 'Akun', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect
          value={item.account_id}
          onChange={(v, opt) => {
            onUpdate('account_id', v)
            onUpdate('account', opt ? { id: opt.value, code: opt.sublabel ?? '', name: opt.label } : null)
          }}
          onSearch={coaApi.search}
          placeholder="Pilih akun..."
          disabled={isReadOnly}
          size="sm"
          selectedOptions={item.account ? [{ value: item.account.id, label: item.account.name, sublabel: item.account.code }] : []}
        />
      ),
    },
    {
      id: 'period', header: 'Periode', width: 110,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input
          type="month"
          value={item.period}
          onChange={(e) => onUpdate('period', e.target.value)}
          disabled={isReadOnly}
          placeholder="YYYY-MM"
          className="h-8 text-[12px]"
        />
      ),
    },
    {
      id: 'amount', header: 'Jumlah', width: 150, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput
          value={item.amount}
          onChange={(v) => onUpdate('amount', v)}
          disabled={isReadOnly}
          decimals={2}
          ariaLabel="Jumlah anggaran"
        />
      ),
    },
    {
      id: 'notes', header: 'Catatan', width: 160,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input
          value={item.notes}
          onChange={(e) => onUpdate('notes', e.target.value)}
          disabled={isReadOnly}
          placeholder="Catatan..."
          className="h-8 text-[12px]"
        />
      ),
    },
  ]

  return (
    <FormLayout
      title={isCreate ? 'Buat Proyek' : 'Proyek'}
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'Proyek', path: '/master-data/projects' },
        { label: isCreate ? 'Buat' : 'Edit' },
      ]}
      headerActions={
        <FormSaveActions
          onCancel={() => navigate('/master-data/projects')}
          onSave={() => void handleSubmit(onSubmit)()}
          isSaving={isSubmitting}
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="h-9">
          <TabsTrigger value="detail" className="text-[12px]">Detail Proyek</TabsTrigger>
          <TabsTrigger value="budget" className="text-[12px]">Anggaran</TabsTrigger>
        </TabsList>

        <TabsContent value="detail" className="space-y-2.5">
          <section className="rounded-lg border border-[#d9e2e5] bg-white px-3 py-2.5 lg:px-4">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <FormField label="Nama Proyek" htmlFor="project-name" required error={errors.name?.message} className="w-[280px]">
                <Input
                  id="project-name"
                  {...register('name')}
                  placeholder="Nama proyek..."
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.name))}
                />
              </FormField>

              <FormField label="Status" error={errors.status?.message} className="w-[160px]">
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProyekStatus)}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
          </section>
        </TabsContent>

        <TabsContent value="budget" className="space-y-2.5">
          <section className="rounded-lg border border-[#d9e2e5] bg-white p-3 lg:p-4">
            <p className="mb-3 text-[12px] text-[#64748b]">
              Anggaran proyek terdiri dari <strong>pendapatan</strong> (revenue) dan <strong>pengeluaran</strong> (expense).
              Setiap baris dikaitkan dengan akun COA dan periode opsional.
            </p>

            <LineItemsTable
              errors={{}}
              items={budgetLines}
              columns={budgetColumns}
              onAdd={() => setBudgetLines((prev) => [...prev, { ...DEFAULT_BUDGET_LINE }])}
              onRemove={(i) => setBudgetLines((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) =>
                setBudgetLines((prev) =>
                  prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
                )
              }
              isReadOnly={false}
              addLabel="Tambah Baris Anggaran"
              emptyLabel="Belum ada baris anggaran"
            />

            {/* Ringkasan anggaran proyek */}
            <div className="mt-3 grid gap-2.5 md:grid-cols-3">
              <div className="rounded-lg border border-[#d9e2e5] bg-[#f0fdf4] px-3 py-2 text-[12px]">
                <span className="text-[#64748b]">Total Pendapatan</span>
                <p className="font-semibold tabular-nums text-[#15803d]">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-lg border border-[#d9e2e5] bg-[#fef2f2] px-3 py-2 text-[12px]">
                <span className="text-[#64748b]">Total Pengeluaran</span>
                <p className="font-semibold tabular-nums text-[#991B1B]">{formatCurrency(totalExpense)}</p>
              </div>
              <div className={cn(
                'rounded-lg border px-3 py-2 text-[12px]',
                surplus >= 0
                  ? 'border-[#A7F3D0] bg-[#D1FAE5]'
                  : 'border-[#FEE2E2] bg-[#FEF2F2]',
              )}>
                <span className={surplus >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}>
                  {surplus >= 0 ? 'Surplus' : 'Defisit'}
                </span>
                <p className={cn('font-semibold tabular-nums', surplus >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]')}>
                  {formatCurrency(Math.abs(surplus))}
                </p>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </FormLayout>
  )
}

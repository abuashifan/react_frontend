import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/shared/form/FieldError'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  /** Keterangan kecil di bawah kontrol (mis. format yang diharapkan). */
  hint?: string
  className?: string
  children: React.ReactNode
}

/**
 * Satu field form: label seragam + kontrol + slot error.
 *
 * Pola `div.flex.flex-col.gap-1` + `<Label>` + `<FieldError>` sebelumnya
 * disalin di puluhan form, sehingga tinggi label dan jarak antar field ikut
 * bervariasi per halaman. Dikumpulkan di sini supaya kepadatan form bisa
 * diatur di satu tempat — penting untuk viewport tablet yang pendek.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase leading-4 tracking-wide text-[#64748b]"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] leading-4 text-[#94a3b8]">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

import { cn } from '@/lib/utils'

interface FormSectionProps {
  title?: string
  columns?: 1 | 2
  children: React.ReactNode
  className?: string
}

/** Section wrapper with optional 1 or 2-column grid for form fields */
export function FormSection({ title, columns = 2, children, className }: FormSectionProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-[#d9e2e5] bg-white p-3.5 md:p-4 lg:p-5',
        className,
      )}
    >
      {title && (
        <h3 className="mb-3.5 border-b border-[#d9e2e5] pb-3 text-[13px] font-semibold text-[#24323a]">
          {title}
        </h3>
      )}
      <div
        className={cn(
          'gap-3.5 lg:gap-4',
          columns === 2 ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col',
        )}
      >
        {children}
      </div>
    </section>
  )
}

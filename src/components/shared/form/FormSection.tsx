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
    <div className={cn('mb-6', className)}>
      {title && (
        <h3 className="text-[13px] font-semibold text-[#24323a] mb-3 pb-2 border-b border-[#d9e2e5]">
          {title}
        </h3>
      )}
      <div
        className={cn(
          'gap-4 lg:gap-5',
          columns === 2 ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col',
        )}
      >
        {children}
      </div>
    </div>
  )
}

import { useToast as useShadcnToast } from '@/hooks/use-toast'

interface ErrorToastOptions {
  /** Tautan aksi di bawah pesan, mis. WhatsApp "Minta Upgrade" (FEATURE_NOT_IN_PLAN). */
  actionUrl?: string | null
  actionLabel?: string
}

export function useToast() {
  const { toast } = useShadcnToast()

  return {
    toast: {
      success: (message: string) =>
        toast({
          description: message,
          duration: 3000,
          className: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
        }),
      error: (message: string, options?: ErrorToastOptions) =>
        toast({
          description: options?.actionUrl ? (
            <div className="flex flex-col gap-1.5">
              <span>{message}</span>
              <a
                href={options.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-[12px] font-semibold underline underline-offset-2"
              >
                {options.actionLabel ?? 'Minta Upgrade via WhatsApp'}
              </a>
            </div>
          ) : (
            message
          ),
          duration: options?.actionUrl ? 8000 : 5000,
          variant: 'destructive',
        }),
      warning: (message: string) =>
        toast({
          description: message,
          duration: 4000,
          className: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
        }),
      info: (message: string) =>
        toast({
          description: message,
          duration: 3000,
          className: 'bg-[#EFF9FB] text-[#326273] border-[#5c9ead]',
        }),
    },
  }
}

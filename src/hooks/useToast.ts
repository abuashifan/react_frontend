import { useToast as useShadcnToast } from '@/hooks/use-toast'

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
      error: (message: string) =>
        toast({
          description: message,
          duration: 5000,
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

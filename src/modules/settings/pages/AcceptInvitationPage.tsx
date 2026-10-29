import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/useAuthStore'
import { getApiErrorMessage } from '@/lib/apiError'
import { accessInvitationsApi } from '../services/accessApi'

export function AcceptInvitationPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const accept = useMutation({ mutationFn: () => accessInvitationsApi.accept(token), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['companies'] }) } })
  return <main className="flex min-h-dvh items-center justify-center bg-muted p-4"><section className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-sm"><h1 className="text-xl font-semibold">Undangan perusahaan</h1><p className="text-sm text-muted-foreground">Masuk sebagai {user?.email}. Undangan harus ditujukan ke email akun ini.</p>{accept.isError && <p role="alert" className="text-sm text-destructive">{getApiErrorMessage(accept.error, 'Undangan tidak dapat diterima.')}</p>}{accept.isSuccess ? <><p>Undangan diterima. Pilih perusahaan untuk melanjutkan.</p><Button onClick={() => navigate('/select-company', { replace: true })}>Pilih perusahaan</Button></> : <Button disabled={accept.isPending || !token} onClick={() => accept.mutate()}>{accept.isPending ? 'Memproses...' : 'Terima undangan'}</Button>}</section></main>
}

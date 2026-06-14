import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, BarChart3, ShoppingCart, FileText, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { useToast } from '@/hooks/useToast'
import { authApi } from '../services/authApi'
import { companyApi } from '../services/companyApi'
import { loginSchema, type LoginFormInput, type LoginFormValues } from '../schemas/loginSchema'
import { APP_NAME } from '@/lib/constants'
import loginIllustration from '@/assets/illustrations/login-illustration.svg'
import type { ApiError } from '@/types/api.types'
import type { Company } from '@/types/auth.types'

const FEATURES = [
  { icon: ShoppingCart, text: 'Kelola penjualan dan pembelian dalam satu platform' },
  { icon: BarChart3, text: 'Akuntansi terintegrasi secara otomatis' },
  { icon: FileText, text: 'Laporan keuangan real-time kapan saja' },
  { icon: Building2, text: 'Dukung multi-perusahaan dalam satu akun' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth, setActiveCompany, setCompanies, setPermissions } = useAuthStore()
  const { setActiveCompany: setCompanyStore } = useCompanyStore()
  const { toast } = useToast()

  const isSessionExpired = location.state?.reason === 'session_expired'

  const form = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember_me: false },
  })

  function focusPasswordField() {
    window.setTimeout(() => form.setFocus('password'), 0)
  }

  function handleLoginError(error: ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      toast.error('Tidak dapat terhubung ke server.')
      return
    }

    if (error.status === 404) {
      toast.error('Endpoint login tidak ditemukan. Periksa konfigurasi API.')
      return
    }

    if (error.status === 403 || error.code === 'FORBIDDEN') {
      toast.error('Akun Anda telah dinonaktifkan. Hubungi administrator.')
      return
    }

    if (error.status === 422 && error.errors) {
      const emailError = error.errors.email?.[0]
      const passwordError = error.errors.password?.[0]

      if (emailError) {
        form.setError('email', { type: 'server', message: emailError })
      }
      if (passwordError) {
        form.setError('password', { type: 'server', message: passwordError })
      }

      if (passwordError) {
        focusPasswordField()
      }

      if (!emailError && !passwordError) {
        toast.error(error.message || 'Data login tidak valid.')
      }
      return
    }

    form.setError('password', {
      type: 'server',
      message: 'Email atau password tidak sesuai.',
    })
    focusPasswordField()
    toast.error('Login gagal. Periksa kembali email dan password Anda.')
  }

  async function activateCompany(company: Company) {
    const selectResponse = await companyApi.select(company.id)
    const activeCompany = selectResponse.data.active_company

    setActiveCompany(activeCompany.id)
    setCompanyStore(activeCompany)

    const permissionsResponse = await authApi.permissions()
    setPermissions(permissionsResponse.data.permissions)

    navigate('/dashboard', { replace: true })
  }

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    try {
      const response = await authApi.login({
        email: values.email,
        password: values.password,
        remember_me: values.remember_me,
      })
      const { token, user } = response.data

      setAuth(token, user, [], [], values.remember_me)

      const companiesResponse = await companyApi.list()
      const companies = companiesResponse.data
      setCompanies(companies)

      if (companies.length === 0) {
        toast.error('Akun Anda belum memiliki akses perusahaan.')
        return
      }

      if (companies.length === 1) {
        await activateCompany(companies[0])
      } else {
        navigate('/select-company', { replace: true })
      }
    } catch (err: unknown) {
      handleLoginError(err as ApiError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left — Branding */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-10 bg-[#326273]">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-semibold text-lg">{APP_NAME}</span>
          </div>

          <img
            src={loginIllustration}
            alt=""
            aria-hidden="true"
            className="w-full max-w-[280px] max-h-[200px] object-contain mx-auto mb-8 opacity-90"
          />

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-white/90" />
                </div>
                <span className="text-white/85 text-[13px] leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-[11px]">
          © {new Date().getFullYear()} Seaside Escape ERP. All rights reserved.
        </p>
      </div>

      {/* Right — Form Panel */}
      <div className="w-full md:w-1/2 bg-[#EFEFED] flex flex-col relative">
        {/* Mobile header */}
        <div className="flex items-center gap-2 p-5 md:hidden">
          <div className="w-7 h-7 rounded-md bg-[#326273] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-[#24323a] font-semibold">{APP_NAME}</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          {/* Form Card */}
          <div className="w-full max-w-[400px] bg-white rounded-xl py-9 px-10 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)]">
            <h2 className="text-[22px] font-semibold text-[#24323a] mb-1.5">Selamat datang kembali</h2>
            <p className="text-sm text-[#64748b] mb-7">Masuk ke akun Anda untuk melanjutkan.</p>

            {isSessionExpired && (
              <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                Sesi Anda telah berakhir karena tidak aktif. Silakan login kembali.
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-[13px] font-medium text-[#24323a]">Email</Label>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nama@perusahaan.com"
                          autoComplete="email"
                          className="h-9 text-[13px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-[13px] font-medium text-[#24323a]">Password</Label>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="h-9 text-[13px] pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-[#64748b] hover:text-[#24323a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead] focus-visible:ring-offset-2"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remember_me"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="remember_me"
                          />
                        </FormControl>
                        <Label htmlFor="remember_me" className="text-[13px] text-[#64748b] cursor-pointer font-normal">
                          Ingat saya
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 bg-[#e39774] hover:bg-[#d4845e] text-white font-medium text-[13px] mt-2"
                >
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </Button>
              </form>
            </Form>

            <p className="text-[10px] text-[#d9e2e5] mt-6 text-center">
              Lupa password? Hubungi administrator sistem Anda.
            </p>
          </div>
        </div>

        {/* Version */}
        <span className="absolute bottom-4 right-6 text-[10px] text-[#94a3b8]">v1.0.0</span>
      </div>
    </div>
  )
}

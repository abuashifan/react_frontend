import { z } from 'zod'

const email = z.string().min(1, 'Email wajib diisi').email('Format email tidak valid')
const password = z.string().min(8, 'Kata sandi minimal 8 karakter')
const passwordConfirmation = z.string().min(1, 'Ulangi kata sandi')

const samePassword = {
  message: 'Kata sandi tidak sama',
  path: ['password_confirmation'],
}

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password, password_confirmation: passwordConfirmation })
  .refine((v) => v.password === v.password_confirmation, samePassword)

export const invitationSignupSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(255),
    password,
    password_confirmation: passwordConfirmation,
  })
  .refine((v) => v.password === v.password_confirmation, samePassword)

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type InvitationSignupValues = z.infer<typeof invitationSignupSchema>

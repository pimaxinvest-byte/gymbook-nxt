'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'
import { registerAction } from '@/features/auth/actions'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [role, setRole] = useState<'TRAINER' | 'CLIENT'>('TRAINER')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'TRAINER' },
  })

  function selectRole(r: 'TRAINER' | 'CLIENT') {
    setRole(r)
    setValue('role', r)
  }

  async function onSubmit(data: RegisterInput) {
    setServerError(null)
    const result = await registerAction(data)
    if (result.error) {
      setServerError(result.error)
      return
    }
    // Auto-login after register
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result.needsOnboarding) {
      router.push('/client/onboarding')
    } else {
      router.push('/trainer')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dot-grid relative overflow-hidden py-8">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          style={{
            width: 700, height: 400,
            background: 'radial-gradient(ellipse, rgba(59,130,246,.05) 0%, transparent 70%)',
          }}
        />
      </div>

      <div
        className="relative w-full max-w-md mx-4"
        style={{
          background: 'rgb(18,18,18)',
          border: '1px solid rgb(39,39,42)',
          borderRadius: '1rem',
          boxShadow: '0 0 0 1px rgba(59,130,246,.06), 0 8px 48px rgba(0,0,0,.6)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', top: -1, left: '50%',
            transform: 'translateX(-50%)',
            width: 96, height: 2,
            background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
            borderRadius: 1,
          }}
        />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <span
              style={{
                display: 'inline-block', width: 0, height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: '12px solid #EAB308',
                filter: 'drop-shadow(0 0 6px rgba(234,179,8,.6))',
              }}
            />
            <span className="text-lg font-bold text-text tracking-tight">
              Gym<span className="text-primary">Book</span>
            </span>
            <span className="text-[10px] font-mono text-text-muted border border-border px-1.5 py-0.5 rounded">NXT</span>
          </div>

          <h1 className="text-xl font-bold text-text mb-1">Crear cuenta</h1>
          <p className="text-sm text-text-muted mb-6">Elige tu tipo de perfil y empieza</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg" style={{ background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)' }}>
            {(['TRAINER', 'CLIENT'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => selectRole(r)}
                className="py-2 px-3 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer"
                style={
                  role === r
                    ? { background: '#3B82F6', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,.3)' }
                    : { color: 'rgb(161,161,170)' }
                }
              >
                {r === 'TRAINER' ? '⚡ Trainer' : '◈ Cliente'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden role field */}
            <input type="hidden" {...register('role')} />

            <div className="input-group">
              <label className="input-label">Nombre completo</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Tu nombre"
                className={`input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <p className="input-hint" style={{ color: 'rgb(239,68,68)' }}>{errors.name.message}</p>}
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="input-hint" style={{ color: 'rgb(239,68,68)' }}>{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                />
                {errors.password && <p className="input-hint" style={{ color: 'rgb(239,68,68)' }}>{errors.password.message}</p>}
              </div>
              <div className="input-group">
                <label className="input-label">Confirmar</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                {errors.confirmPassword && <p className="input-hint" style={{ color: 'rgb(239,68,68)' }}>{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Trainer code (clients only) */}
            {role === 'CLIENT' && (
              <div className="input-group">
                <label className="input-label">
                  Código de trainer{' '}
                  <span className="text-text-muted normal-case font-normal">(opcional)</span>
                </label>
                <input
                  {...register('trainerCode')}
                  type="text"
                  placeholder="email-prefix de tu trainer"
                  className="input"
                />
                <p className="input-hint">Déjalo vacío para unirte al primer trainer disponible</p>
              </div>
            )}

            {serverError && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs"
                style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: 'rgb(248,113,113)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                {serverError}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full btn-lg"
                style={{ boxShadow: '0 0 0 1px rgba(59,130,246,.3), 0 4px 16px rgba(59,130,246,.2)' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creando cuenta…
                  </span>
                ) : `Crear cuenta ${role === 'TRAINER' ? 'de Trainer' : 'de Cliente'}`}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-text-muted mt-5">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary hover:text-blue-300 font-medium transition-colors">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

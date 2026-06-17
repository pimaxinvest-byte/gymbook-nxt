'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (res?.error) {
      setServerError('Email o contraseña incorrectos')
      return
    }
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const role = session?.user?.role
    router.push(role === 'TRAINER' ? '/trainer' : '/client')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dot-grid relative overflow-hidden">

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          style={{
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(59,130,246,.07) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Top arc */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 900, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #3B82F6 30%, #EAB308 50%, #3B82F6 70%, transparent 100%)',
          opacity: 0.25,
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm mx-4"
        style={{
          background: 'rgb(18,18,18)',
          border: '1px solid rgb(39,39,42)',
          borderRadius: '1rem',
          boxShadow: '0 0 0 1px rgba(59,130,246,.06), 0 8px 48px rgba(0,0,0,.6)',
        }}
      >
        {/* Card arc */}
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                style={{
                  display: 'inline-block',
                  width: 0, height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: '12px solid #EAB308',
                  filter: 'drop-shadow(0 0 6px rgba(234,179,8,.6))',
                }}
              />
              <span className="text-xl font-bold text-text tracking-tight">
                Gym<span className="text-primary">Book</span>
              </span>
              <span className="text-[10px] font-mono text-text-muted border border-border px-1.5 py-0.5 rounded">
                NXT
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <div className="w-1 h-1 rounded-full bg-accent opacity-60" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-text-muted text-sm">Accede a tu plataforma de entrenamiento</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="trainer@gymbook.dev"
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="input-hint" style={{ color: 'rgb(239,68,68)' }}>{errors.email.message}</p>}
            </div>

            <div className="input-group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label" style={{ marginBottom: 0 }}>Contraseña</label>
                <a href="#" className="text-[11px] text-primary/70 hover:text-primary transition-colors cursor-pointer">
                  ¿La olvidaste?
                </a>
              </div>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input ${errors.password ? 'input-error' : ''}`}
              />
              {errors.password && <p className="input-hint" style={{ color: 'rgb(239,68,68)' }}>{errors.password.message}</p>}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs"
                style={{
                  background: 'rgba(239,68,68,.08)',
                  border: '1px solid rgba(239,68,68,.2)',
                  color: 'rgb(248,113,113)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                {serverError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full btn-lg"
                style={{ boxShadow: '0 0 0 1px rgba(59,130,246,.3), 0 4px 16px rgba(59,130,246,.2)' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Accediendo…
                  </span>
                ) : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="divider-accent my-6">
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">ó</span>
          </div>

          <p className="text-center text-sm text-text-muted">
            ¿Sin cuenta?{' '}
            <a href="/register" className="text-primary hover:text-blue-300 font-medium transition-colors">
              Crear cuenta
            </a>
          </p>
        </div>

        <div className="px-8 pb-5 pt-0">
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-text-muted opacity-35">
            <span className="w-1 h-1 rounded-full bg-success opacity-80" />
            sys·secure·tls
          </div>
        </div>
      </div>
    </div>
  )
}

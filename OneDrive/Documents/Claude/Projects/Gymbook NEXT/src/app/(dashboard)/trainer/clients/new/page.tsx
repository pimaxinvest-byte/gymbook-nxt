'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('El email es obligatorio'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/trainer/invite-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Error al añadir cliente')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12 space-y-6 animate-fade-in text-center">
        <div className="text-4xl mb-2">✓</div>
        <h2 className="text-lg font-semibold text-text">Cliente añadido</h2>
        <p className="text-text-muted text-sm">
          El cliente con email <span className="text-text font-mono">{email}</span> ha sido vinculado a tu cuenta.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn-secondary" onClick={() => { setSuccess(false); setEmail('') }}>
            Añadir otro
          </button>
          <button className="btn-primary" onClick={() => router.push('/trainer/clients')}>
            Ver clientes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="breadcrumb">
          <span
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/trainer/clients')}
          >
            clientes
          </span>
          <span className="breadcrumb-sep">/</span>
          <span>nuevo cliente</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Añadir cliente</h1>
        <p className="text-text-muted text-sm mt-1">
          Introduce el email del cliente para vincularlo a tu cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-sm space-y-5">
        <div className="input-group">
          <label className="input-label">Email del cliente *</label>
          <input
            type="email"
            className="input"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <p className="input-hint">
            El cliente debe haberse registrado primero en GymBook NXT
          </p>
        </div>

        {error && <p className="alert-error text-xs">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 cursor-pointer"
            style={{ boxShadow: '0 4px 14px rgba(59,130,246,.2)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Añadiendo…
              </span>
            ) : 'Añadir cliente'}
          </button>
        </div>
      </form>

      {/* Info card */}
      <div className="card-sm border-dashed">
        <p className="text-[11px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-medium">¿El cliente no existe todavía?</span>{' '}
          Comparte el enlace de registro de GymBook NXT con tu cliente.
          Una vez que se haya registrado, podrás vincularlo aquí.
        </p>
      </div>
    </div>
  )
}

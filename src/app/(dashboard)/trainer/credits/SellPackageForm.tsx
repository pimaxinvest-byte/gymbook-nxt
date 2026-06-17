'use client'

import { useState, useTransition } from 'react'
import { sellPackageToClient } from '@/features/credits/actions'

type Package = { id: string; name: string; totalCredits: number; price: number; creditType: string }
type Client  = { id: string; name: string }

export default function SellPackageForm({
  clients,
  packages,
  onDone,
}: {
  clients: Client[]
  packages: Package[]
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const clientId  = fd.get('clientId')  as string
    const packageId = fd.get('packageId') as string
    if (!clientId || !packageId) { setError('Selecciona cliente y paquete'); return }

    startTransition(async () => {
      try {
        await sellPackageToClient(clientId, packageId)
        onDone()
      } catch (err: any) {
        setError(err.message ?? 'Error desconocido')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="input-group">
        <label className="input-label">Cliente</label>
        <select name="clientId" className="input" required>
          <option value="">Seleccionar cliente…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Paquete</label>
        <select name="packageId" className="input" required>
          <option value="">Seleccionar paquete…</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.totalCredits} créditos · {p.price}€
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? 'Vendiendo…' : 'Confirmar venta'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { assignCredits } from '@/features/users/actions'

const PACKAGES = [
  { id: 'pkg_1x1',   label: '1 Sesión',    credits: 1,  price: '€25' },
  { id: 'pkg_5x5',   label: '5 Sesiones',  credits: 5,  price: '€110' },
  { id: 'pkg_10x10', label: '10 Sesiones', credits: 10, price: '€200' },
  { id: 'pkg_20x20', label: '20 Sesiones', credits: 20, price: '€360' },
]

export function CreditAssignForm({ clientId, currentCredits }: { clientId: string; currentCredits: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleAssign() {
    if (!selected) return
    const pkg = PACKAGES.find((p) => p.id === selected)
    if (!pkg) return
    setLoading(true)
    setSuccess(false)
    await assignCredits(clientId, selected, pkg.credits)
    setLoading(false)
    setSuccess(true)
    setSelected(null)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="card-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Asignar créditos</h2>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(34,197,94,.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,.2)' }}
        >
          {currentCredits} actuales
        </span>
      </div>

      <div className="space-y-2">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setSelected(pkg.id)}
            className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-150 cursor-pointer"
            style={
              selected === pkg.id
                ? { background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.35)' }
                : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)' }
            }
          >
            <div>
              <p className={`text-sm font-medium ${selected === pkg.id ? 'text-primary' : 'text-text'}`}>
                {pkg.label}
              </p>
              <p className="text-[10px] font-mono text-text-muted">{pkg.credits} créditos</p>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: selected === pkg.id ? '#93C5FD' : '#A1A1AA' }}
            >
              {pkg.price}
            </span>
          </button>
        ))}
      </div>

      {success && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
          style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', color: '#4ade80' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Créditos asignados correctamente
        </div>
      )}

      <button
        type="button"
        disabled={!selected || loading}
        onClick={handleAssign}
        className="btn-primary w-full cursor-pointer disabled:opacity-40"
        style={{ boxShadow: selected ? '0 4px 14px rgba(59,130,246,.2)' : 'none' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Asignando…
          </span>
        ) : 'Asignar paquete'}
      </button>
    </div>
  )
}

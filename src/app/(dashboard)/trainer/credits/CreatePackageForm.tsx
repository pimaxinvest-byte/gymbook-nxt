'use client'

import { useState, useTransition } from 'react'
import { createCreditPackage } from '@/features/credits/actions'

export default function CreatePackageForm({ onDone }: { onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createCreditPackage({
          name:         fd.get('name') as string,
          totalCredits: Number(fd.get('totalCredits')),
          price:        Number(fd.get('price')),
          creditType:   fd.get('creditType') as 'PT' | 'SGT',
          validDays:    Number(fd.get('validDays')),
        })
        onDone()
      } catch (err: any) {
        setError(err.message ?? 'Error desconocido')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="input-group">
        <label className="input-label">Nombre del paquete</label>
        <input name="name" className="input" placeholder="Ej. Bono 10 PT" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="input-group">
          <label className="input-label">Nº de créditos</label>
          <input name="totalCredits" type="number" min="1" className="input" defaultValue={10} required />
        </div>
        <div className="input-group">
          <label className="input-label">Precio (€)</label>
          <input name="price" type="number" min="0" step="0.01" className="input" defaultValue={150} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="input-group">
          <label className="input-label">Tipo</label>
          <select name="creditType" className="input">
            <option value="PT">Entrenamiento personal (PT)</option>
            <option value="SGT">Semi-grupal (SGT)</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Validez (días)</label>
          <input name="validDays" type="number" min="1" className="input" defaultValue={365} required />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? 'Creando…' : 'Crear paquete'}
        </button>
      </div>
    </form>
  )
}

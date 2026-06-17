'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTrainingProgram } from '@/features/training/actions'

type Client = {
  id: string
  user: { name: string | null; id: string }
}

export default function NewTrainingForm({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    name:          '',
    description:   '',
    durationWeeks: 4,
    clientId:      clients[0]?.id ?? '',
  })

  function set(key: string, val: any) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())    { setError('El nombre es obligatorio'); return }
    if (!form.clientId.trim()) { setError('Selecciona un cliente'); return }
    setLoading(true)
    setError(null)
    try {
      await createTrainingProgram({
        name:          form.name,
        description:   form.description || undefined,
        durationWeeks: form.durationWeeks,
        clientId:      form.clientId,
      })
      router.push('/trainer/training')
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el programa')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="breadcrumb">
          <span
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/trainer/training')}
          >
            training
          </span>
          <span className="breadcrumb-sep">/</span>
          <span>nuevo programa</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Nuevo programa de entrenamiento</h1>
      </div>

      <form onSubmit={handleSubmit} className="card-sm space-y-5">

        {/* Client selector */}
        <div className="input-group">
          <label className="input-label">Cliente *</label>
          {clients.length === 0 ? (
            <div className="alert-warning text-xs">
              No tienes clientes todavía.{' '}
              <span
                className="underline cursor-pointer"
                onClick={() => router.push('/trainer/clients')}
              >
                Añade uno primero
              </span>
            </div>
          ) : (
            <select
              className="input"
              value={form.clientId}
              onChange={(e) => set('clientId', e.target.value)}
            >
              <option value="">— Selecciona cliente —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user.name ?? 'Sin nombre'}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Name */}
        <div className="input-group">
          <label className="input-label">Nombre del programa *</label>
          <input
            className="input"
            placeholder="Ej: Fuerza Avanzada 12 semanas"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label">Descripción</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Describe los objetivos y metodología del programa…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {/* Duration */}
        <div className="input-group">
          <label className="input-label">Duración (semanas)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={52}
              value={form.durationWeeks}
              onChange={(e) => set('durationWeeks', +e.target.value)}
              className="flex-1 h-1.5 rounded-full cursor-pointer"
              style={{ accentColor: '#3B82F6' }}
            />
            <span className="text-primary font-mono text-sm w-12 text-right">
              {form.durationWeeks}sem
            </span>
          </div>
        </div>

        {/* Error */}
        {error && <p className="alert-error text-xs">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || clients.length === 0}
            className="btn-primary flex-1 cursor-pointer"
            style={{ boxShadow: '0 4px 14px rgba(59,130,246,.2)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creando…
              </span>
            ) : 'Crear programa'}
          </button>
        </div>
      </form>
    </div>
  )
}

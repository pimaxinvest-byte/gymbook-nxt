'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNutritionPlan } from '@/features/nutrition/actions'

type Client = { id: string; user: { name: string | null; id: string } }

const MACROS = [
  { key: 'calories', label: 'Calorías (kcal)', min: 1000, max: 5000, step: 50,  unit: 'kcal', color: '#EAB308' },
  { key: 'protein',  label: 'Proteína (g)',     min: 50,   max: 400,  step: 5,   unit: 'g',    color: '#3B82F6' },
  { key: 'carbs',    label: 'Carbohidratos (g)', min: 50,  max: 600,  step: 5,   unit: 'g',    color: '#22C55E' },
  { key: 'fat',      label: 'Grasas (g)',        min: 20,  max: 200,  step: 5,   unit: 'g',    color: '#F59E0B' },
]

export default function NewNutritionForm({ clients }: { clients: Client[] }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    name:         '',
    description:  '',
    calories:     2000,
    protein:      150,
    carbs:        200,
    fat:          70,
    clientId:     clients[0]?.id ?? '',
  })

  function set(key: string, val: any) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())     { setError('El nombre es obligatorio'); return }
    if (!form.clientId.trim()) { setError('Selecciona un cliente');    return }
    setLoading(true)
    setError(null)
    try {
      await createNutritionPlan({
        name:           form.name,
        clientId:       form.clientId,
        caloriesTarget: form.calories,
        proteinGTarget: form.protein,
        carbsGTarget:   form.carbs,
        fatGTarget:     form.fat,
      })
      router.push('/trainer/nutrition')
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el plan')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <div className="breadcrumb">
          <span
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/trainer/nutrition')}
          >
            nutrition
          </span>
          <span className="breadcrumb-sep">/</span>
          <span>nuevo plan</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Nuevo plan nutricional</h1>
      </div>

      <form onSubmit={handleSubmit} className="card-sm space-y-5">

        {/* Client */}
        <div className="input-group">
          <label className="input-label">Cliente *</label>
          {clients.length === 0 ? (
            <div className="alert-warning text-xs">
              No tienes clientes todavía.{' '}
              <span className="underline cursor-pointer" onClick={() => router.push('/trainer/clients')}>
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
                <option key={c.id} value={c.id}>{c.user.name ?? 'Sin nombre'}</option>
              ))}
            </select>
          )}
        </div>

        {/* Name */}
        <div className="input-group">
          <label className="input-label">Nombre del plan *</label>
          <input
            className="input"
            placeholder="Ej: Plan definición verano"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label">Descripción</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Notas sobre el plan, restricciones, etc…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {/* Macros */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            Objetivos diarios
          </p>
          {MACROS.map(({ key, label, min, max, step, unit, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-text-muted">{label}</label>
                <span className="font-mono text-sm" style={{ color }}>
                  {(form as any)[key]}{unit}
                </span>
              </div>
              <input
                type="range" min={min} max={max} step={step}
                value={(form as any)[key]}
                onChange={(e) => set(key, +e.target.value)}
                className="w-full h-1.5 rounded-full cursor-pointer"
                style={{ accentColor: color }}
              />
            </div>
          ))}
        </div>

        {/* Error */}
        {error && <p className="alert-error text-xs">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 cursor-pointer">
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
            ) : 'Crear plan'}
          </button>
        </div>
      </form>
    </div>
  )
}

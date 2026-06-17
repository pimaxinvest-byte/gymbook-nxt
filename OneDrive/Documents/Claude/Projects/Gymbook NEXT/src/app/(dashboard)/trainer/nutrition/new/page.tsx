'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNutritionPlan } from '@/features/nutrition/actions'

export default function NewNutritionPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    isActive: true,
    clientId: '',
  })

  function set(key: string, val: any) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      await createNutritionPlan({
        name: form.name,
        description: form.description || undefined,
        calories: form.calories,
        protein: form.protein,
        carbs: form.carbs,
        fat: form.fat,
        isActive: form.isActive,
        clientId: form.clientId || undefined,
      })
      router.push('/trainer/nutrition')
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el plan')
      setLoading(false)
    }
  }

  const MACROS = [
    { key: 'calories', label: 'Calorías (kcal)', min: 1000, max: 5000, step: 50, unit: 'kcal', color: '#EAB308' },
    { key: 'protein', label: 'Proteína (g)', min: 50, max: 400, step: 5, unit: 'g', color: '#3B82F6' },
    { key: 'carbs', label: 'Carbohidratos (g)', min: 50, max: 600, step: 5, unit: 'g', color: '#22C55E' },
    { key: 'fat', label: 'Grasas (g)', min: 20, max: 200, step: 5, unit: 'g', color: '#F59E0B' },
  ]

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
          <span
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/trainer/nutrition')}
          >
            nutrition
          </span>
          {' / nuevo'}
        </div>
        <h1 className="text-2xl font-bold text-text">Nuevo plan nutricional</h1>
      </div>

      <form onSubmit={handleSubmit} className="card-sm space-y-5">
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
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Objetivos diarios</p>
          {MACROS.map(({ key, label, min, max, step, unit, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-text-muted">{label}</label>
                <span className="font-mono text-sm" style={{ color }}>
                  {(form as any)[key]}{unit}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={(form as any)[key]}
                onChange={(e) => set(key, +e.target.value)}
                className="w-full h-1.5 rounded-full cursor-pointer"
                style={{ accentColor: color }}
              />
            </div>
          ))}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text">Activar plan</p>
            <p className="text-xs text-text-muted">El cliente podrá ver este plan</p>
          </div>
          <button
            type="button"
            onClick={() => set('isActive', !form.isActive)}
            className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
            style={{ background: form.isActive ? '#3B82F6' : 'rgb(39,39,42)' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: form.isActive ? '1.25rem' : '0.125rem' }}
            />
          </button>
        </div>

        {error && (
          <p className="text-danger text-xs px-3 py-2 rounded-md"
             style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 cursor-pointer">
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
                Creando…
              </span>
            ) : 'Crear plan'}
          </button>
        </div>
      </form>
    </div>
  )
}

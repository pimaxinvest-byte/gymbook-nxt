'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTrainingProgram } from '@/features/training/actions'

const GOALS = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS', 'SPORT_SPECIFIC']
const GOALS_LABEL: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  ENDURANCE: 'Resistencia', FLEXIBILITY: 'Flexibilidad',
  GENERAL_FITNESS: 'Fitness general', SPORT_SPECIFIC: 'Deporte específico',
}

export default function NewTrainingProgramPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    goal: 'GENERAL_FITNESS',
    durationWeeks: 4,
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
      await createTrainingProgram({
        name: form.name,
        description: form.description || undefined,
        goal: form.goal as any,
        durationWeeks: form.durationWeeks,
        isActive: form.isActive,
        clientId: form.clientId || undefined,
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
      <div>
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
          <span
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/trainer/training')}
          >
            training
          </span>
          {' / nuevo'}
        </div>
        <h1 className="text-2xl font-bold text-text">Nuevo programa de entrenamiento</h1>
      </div>

      <form onSubmit={handleSubmit} className="card-sm space-y-5">
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

        {/* Goal */}
        <div className="input-group">
          <label className="input-label">Objetivo</label>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set('goal', g)}
                className="px-3 py-2 rounded-md text-xs font-medium text-left transition-all cursor-pointer"
                style={
                  form.goal === g
                    ? { background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.4)', color: '#93C5FD' }
                    : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)', color: '#A1A1AA' }
                }
              >
                {GOALS_LABEL[g]}
              </button>
            ))}
          </div>
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
            <span className="text-primary font-mono text-sm w-12 text-right">{form.durationWeeks}sem</span>
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text">Activar inmediatamente</p>
            <p className="text-xs text-text-muted">El cliente podrá ver este programa</p>
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
                Creando…
              </span>
            ) : 'Crear programa'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { addWorkout } from '@/features/training/actions'
import { useRouter } from 'next/navigation'

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY',    label: 'Lunes' },
  { value: 'TUESDAY',   label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY',  label: 'Jueves' },
  { value: 'FRIDAY',    label: 'Viernes' },
  { value: 'SATURDAY',  label: 'Sábado' },
  { value: 'SUNDAY',    label: 'Domingo' },
]

interface Props {
  programId: string
  onClose: () => void
}

export default function AddWorkoutForm({ programId, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | ''>('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await addWorkout({
          programId,
          name: name.trim(),
          dayOfWeek: dayOfWeek || undefined,
          notes: notes.trim() || undefined,
        })
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al añadir la sesión')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text">Nueva sesión</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors cursor-pointer text-lg leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="input-group">
            <label className="input-label" htmlFor="workout-name">
              Nombre de la sesión <span className="text-red-400">*</span>
            </label>
            <input
              id="workout-name"
              type="text"
              className="input"
              placeholder="Ej. Día de piernas, Push A…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Día de la semana */}
          <div className="input-group">
            <label className="input-label" htmlFor="workout-day">
              Día de la semana
            </label>
            <select
              id="workout-day"
              className="input"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek | '')}
            >
              <option value="">— Sin asignar —</option>
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div className="input-group">
            <label className="input-label" htmlFor="workout-notes">
              Notas
            </label>
            <textarea
              id="workout-notes"
              className="input"
              rows={3}
              placeholder="Instrucciones generales, objetivo de la sesión…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-sm flex-1 cursor-pointer"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary btn-sm flex-1 cursor-pointer"
              disabled={isPending || !name.trim()}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Añadir sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

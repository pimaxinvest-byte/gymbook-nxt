'use client'

import { useState, useTransition } from 'react'
import { addExercise } from '@/features/training/actions'
import { useRouter } from 'next/navigation'

interface Props {
  workoutId: string
  orderIndex: number
  onClose: () => void
}

export default function AddExerciseForm({ workoutId, orderIndex, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [muscleGroups, setMuscleGroups] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [restSeconds, setRestSeconds] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !sets || !reps.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        const parsedMuscleGroups = muscleGroups
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

        await addExercise({
          workoutId,
          name: name.trim(),
          muscleGroups: parsedMuscleGroups.length > 0 ? parsedMuscleGroups : undefined,
          sets: Number(sets),
          reps: reps.trim(),
          weightKg: weightKg ? Number(weightKg) : undefined,
          restSeconds: restSeconds ? Number(restSeconds) : undefined,
          notes: notes.trim() || undefined,
          orderIndex,
        })
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al añadir el ejercicio')
      }
    })
  }

  return (
    <div
      className="mt-3 rounded-lg p-4 space-y-3"
      style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}
    >
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Nuevo ejercicio</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nombre */}
        <div className="input-group">
          <label className="input-label" htmlFor={`ex-name-${workoutId}`}>
            Ejercicio <span className="text-red-400">*</span>
          </label>
          <input
            id={`ex-name-${workoutId}`}
            type="text"
            className="input"
            placeholder="Ej. Press banca, Sentadilla…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Grupos musculares */}
        <div className="input-group">
          <label className="input-label" htmlFor={`ex-muscles-${workoutId}`}>
            Grupos musculares
          </label>
          <input
            id={`ex-muscles-${workoutId}`}
            type="text"
            className="input"
            placeholder="Pecho, Tríceps, Hombros…"
            value={muscleGroups}
            onChange={(e) => setMuscleGroups(e.target.value)}
          />
        </div>

        {/* Series, Repeticiones, Peso */}
        <div className="grid grid-cols-3 gap-2">
          <div className="input-group">
            <label className="input-label" htmlFor={`ex-sets-${workoutId}`}>
              Series <span className="text-red-400">*</span>
            </label>
            <input
              id={`ex-sets-${workoutId}`}
              type="number"
              min={1}
              className="input"
              placeholder="3"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor={`ex-reps-${workoutId}`}>
              Reps <span className="text-red-400">*</span>
            </label>
            <input
              id={`ex-reps-${workoutId}`}
              type="text"
              className="input"
              placeholder="8-12"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor={`ex-weight-${workoutId}`}>
              Peso (kg)
            </label>
            <input
              id={`ex-weight-${workoutId}`}
              type="number"
              min={0}
              step={0.5}
              className="input"
              placeholder="60"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
        </div>

        {/* Descanso y Notas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="input-group">
            <label className="input-label" htmlFor={`ex-rest-${workoutId}`}>
              Descanso (s)
            </label>
            <input
              id={`ex-rest-${workoutId}`}
              type="number"
              min={0}
              className="input"
              placeholder="90"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor={`ex-notes-${workoutId}`}>
              Notas
            </label>
            <input
              id={`ex-notes-${workoutId}`}
              type="text"
              className="input"
              placeholder="Indicaciones…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-sm cursor-pointer"
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary btn-sm cursor-pointer"
            disabled={isPending || !name.trim() || !sets || !reps.trim()}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando…
              </span>
            ) : (
              '+ Añadir ejercicio'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

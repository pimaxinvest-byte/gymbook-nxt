'use client'
// ─── GymBook NXT · Log Progress Form ─────────────────────────────────────────
// Client component: modal form to register a new biometric measurement.
// Calls the existing saveProgressLog server action and refreshes the page.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveProgressLog } from '@/features/progress/actions'

interface Props {
  clientId: string
}

export default function LogProgressForm({ clientId }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [date,       setDate]       = useState(() => new Date().toISOString().slice(0, 10))
  const [weightKg,   setWeightKg]   = useState('')
  const [waistCm,    setWaistCm]    = useState('')
  const [fatBioImp,  setFatBioImp]  = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [energyLevel,setEnergyLevel]= useState('')
  const [notes,      setNotes]      = useState('')

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10))
    setWeightKg('')
    setWaistCm('')
    setFatBioImp('')
    setSleepHours('')
    setEnergyLevel('')
    setNotes('')
    setError(null)
    setSuccess(false)
  }

  function handleClose() {
    setOpen(false)
    resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload: Parameters<typeof saveProgressLog>[1] = {
      date: new Date(date + 'T12:00:00'),
      ...(weightKg    ? { weightKg:    parseFloat(weightKg) }    : {}),
      ...(waistCm     ? { waistCm:     parseFloat(waistCm) }     : {}),
      ...(fatBioImp   ? { bodyFatBioImp: parseFloat(fatBioImp) } : {}),
      ...(sleepHours  ? { sleepHours:  parseFloat(sleepHours) }  : {}),
      ...(energyLevel ? { energyLevel: parseInt(energyLevel) }   : {}),
      ...(notes       ? { notes }                                 : {}),
    }

    startTransition(async () => {
      try {
        await saveProgressLog(clientId, payload)
        setSuccess(true)
        setTimeout(() => {
          handleClose()
          router.refresh()
        }, 800)
      } catch (err: any) {
        setError(err?.message ?? 'Error al guardar')
      }
    })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-sm px-4 py-2"
      >
        + Registrar medición
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-5"
            style={{ background: '#111', border: '1px solid #1A1A1A' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="section-eyebrow">progress·log</div>
                <h2 className="text-base font-bold text-text">Nueva medición</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-text-muted hover:text-text transition-colors text-xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="input w-full"
                />
              </div>

              {/* Row: Peso + % Grasa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    placeholder="75.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                    % Grasa (bioimpedancia)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="60"
                    placeholder="18.0"
                    value={fatBioImp}
                    onChange={(e) => setFatBioImp(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Row: Cintura + Sueño */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                    Cintura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="200"
                    placeholder="82"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                    Horas de sueño
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="2"
                    max="16"
                    placeholder="7.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Energy level */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                  Nivel de energía (1–10)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="10"
                  placeholder="7"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Cómo te encuentras hoy..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input w-full resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-[11px] font-mono text-red-400 px-3 py-2 rounded"
                  style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
                  {error}
                </p>
              )}

              {/* Success */}
              {success && (
                <p className="text-[11px] font-mono text-green-400 px-3 py-2 rounded"
                  style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)' }}>
                  ✓ Medición guardada
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-mono text-text-muted transition-colors"
                  style={{ background: '#1A1A1A', border: '1px solid #27272A' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || success}
                  className="flex-1 btn-primary text-sm px-4 py-2"
                >
                  {isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

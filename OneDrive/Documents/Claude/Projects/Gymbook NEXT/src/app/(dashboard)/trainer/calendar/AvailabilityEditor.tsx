'use client'

import { useState } from 'react'
import { setAvailability } from '@/features/availability/actions'
import { useRouter } from 'next/navigation'

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00']

type Slot = { dayOfWeek: number; startTime: string; endTime: string }

export function AvailabilityEditor({ initialSlots }: { initialSlots: Slot[] }) {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // New slot form
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('13:00')

  function addSlot() {
    if (newStart >= newEnd) return
    const exists = slots.some(s => s.dayOfWeek === newDay && s.startTime === newStart)
    if (exists) return
    setSlots(prev => [...prev, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }])
  }

  function removeSlot(idx: number) {
    setSlots(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await setAvailability(slots)
    router.refresh()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const DAY_LABEL: Record<number, string> = Object.fromEntries(DAYS.map(d => [d.value, d.label]))

  return (
    <div className="card-sm space-y-4">
      <h2 className="text-sm font-semibold text-text">Editar disponibilidad</h2>

      {/* Add slot */}
      <div className="grid grid-cols-4 gap-2 items-end">
        <div className="input-group col-span-1">
          <label className="input-label">Día</label>
          <select
            value={newDay}
            onChange={(e) => setNewDay(+e.target.value)}
            className="input"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Desde</label>
          <select value={newStart} onChange={(e) => setNewStart(e.target.value)} className="input">
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Hasta</label>
          <select value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="input">
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="btn-secondary cursor-pointer h-[42px]"
        >
          + Añadir
        </button>
      </div>

      {/* Current slots */}
      {slots.length > 0 && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {slots
            .slice()
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
            .map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-md"
                style={{ background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-primary w-20">
                    {DAY_LABEL[slot.dayOfWeek]}
                  </span>
                  <span className="text-xs font-mono text-text">
                    {slot.startTime} — {slot.endTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(slots.indexOf(slot))}
                  className="text-text-muted hover:text-danger transition-colors cursor-pointer text-sm px-2"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}

      {slots.length === 0 && (
        <p className="text-xs text-text-muted text-center py-3">Sin horarios configurados</p>
      )}

      {saved && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
          style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', color: '#4ade80' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Disponibilidad guardada correctamente
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full cursor-pointer"
        style={{ boxShadow: '0 4px 14px rgba(59,130,246,.2)' }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Guardando…
          </span>
        ) : 'Guardar disponibilidad'}
      </button>
    </div>
  )
}

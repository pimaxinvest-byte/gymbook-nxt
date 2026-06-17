'use client'
// ─── GymBook NXT · Calendar Week Client Component ────────────────────────────
// Partes interactivas del calendario: abrir slots, clonar semana, cerrar slots

import { useState, useTransition } from 'react'
import { openSlots, cloneWeek } from '@/features/calendar/actions'
import { addWeeks, format } from 'date-fns'

type Props = {
  weekStart: string
  trainerId: string
}

export default function CalendarWeekClient({ weekStart, trainerId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activePanel, setActivePanel] = useState<'open' | 'clone' | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // ── Open slots form state ──────────────────────────────────────────────────
  const [openForm, setOpenForm] = useState({
    date: format(new Date(weekStart), 'yyyy-MM-dd'),
    hours: [] as number[],
  })
  const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20]

  function toggleHour(h: number) {
    setOpenForm(f => ({
      ...f,
      hours: f.hours.includes(h) ? f.hours.filter(x => x !== h) : [...f.hours, h],
    }))
  }

  function handleOpenSlots() {
    if (!openForm.hours.length) { setMsg({ type: 'err', text: 'Selecciona al menos una hora' }); return }
    const dates = openForm.hours.map(h => ({ date: new Date(openForm.date + 'T00:00:00'), startHour: h }))
    startTransition(async () => {
      try {
        const r = await openSlots(dates)
        setMsg({ type: 'ok', text: `✓ ${r.created} franja${r.created !== 1 ? 's' : ''} abierta${r.created !== 1 ? 's' : ''}` })
        setOpenForm(f => ({ ...f, hours: [] }))
        setTimeout(() => setMsg(null), 3000)
      } catch (e: any) { setMsg({ type: 'err', text: e.message }) }
    })
  }

  // ── Clone week form ────────────────────────────────────────────────────────
  const [cloneWeeks, setCloneWeeks] = useState(1)
  function handleClone() {
    startTransition(async () => {
      try {
        const r = await cloneWeek(new Date(weekStart), cloneWeeks)
        setMsg({ type: 'ok', text: `✓ Clonado ${r.created} franjas en ${r.weeks} semana${r.weeks !== 1 ? 's' : ''}` })
        setActivePanel(null)
        setTimeout(() => setMsg(null), 4000)
      } catch (e: any) { setMsg({ type: 'err', text: e.message }) }
    })
  }

  return (
    <div className="w-full space-y-3">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActivePanel(p => p === 'open' ? null : 'open')}
          className="px-3 py-1.5 text-xs font-mono rounded-md transition-all"
          style={{
            background: activePanel === 'open' ? '#3B82F6' : '#1A1A1A',
            color: activePanel === 'open' ? '#FFF' : '#A1A1AA',
            border: `1px solid ${activePanel === 'open' ? '#3B82F6' : '#27272A'}`,
          }}>
          + Abrir franjas
        </button>
        <button
          onClick={() => setActivePanel(p => p === 'clone' ? null : 'clone')}
          className="px-3 py-1.5 text-xs font-mono rounded-md transition-all"
          style={{
            background: activePanel === 'clone' ? '#EAB308' : '#1A1A1A',
            color: activePanel === 'clone' ? '#000' : '#A1A1AA',
            border: `1px solid ${activePanel === 'clone' ? '#EAB308' : '#27272A'}`,
          }}>
          ⊙ Clonar semana
        </button>
      </div>

      {/* Feedback message */}
      {msg && (
        <div className="px-3 py-2 rounded-md text-xs font-mono"
          style={{
            background: msg.type === 'ok' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
            border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
            color: msg.type === 'ok' ? '#22C55E' : '#EF4444',
          }}>
          {msg.text}
        </div>
      )}

      {/* Open slots panel */}
      {activePanel === 'open' && (
        <div className="p-4 rounded-xl space-y-3"
          style={{ background: '#121212', border: '1px solid #1A1A1A' }}>
          <p className="text-xs font-mono text-text-muted">Selecciona fecha y horas para abrir disponibilidad</p>

          <input
            type="date"
            value={openForm.date}
            onChange={e => setOpenForm(f => ({ ...f, date: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs font-mono rounded-md"
            style={{ background: '#1A1A1A', border: '1px solid #27272A', color: '#F1F1F1' }}
          />

          <div className="flex flex-wrap gap-1.5">
            {HOURS.map(h => (
              <button key={h}
                onClick={() => toggleHour(h)}
                className="px-2.5 py-1 text-[11px] font-mono rounded transition-all"
                style={{
                  background: openForm.hours.includes(h) ? '#3B82F6' : '#1A1A1A',
                  color: openForm.hours.includes(h) ? '#FFF' : '#71717A',
                  border: `1px solid ${openForm.hours.includes(h) ? '#3B82F6' : '#27272A'}`,
                }}>
                {h}h
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenSlots}
            disabled={isPending || !openForm.hours.length}
            className="w-full py-2 text-xs font-mono font-semibold rounded-lg transition-all disabled:opacity-40"
            style={{ background: '#3B82F6', color: '#FFF' }}>
            {isPending ? 'Abriendo…' : 'Abrir selección'}
          </button>
        </div>
      )}

      {/* Clone week panel */}
      {activePanel === 'clone' && (
        <div className="p-4 rounded-xl space-y-3"
          style={{ background: '#121212', border: '1px solid #1A1A1A' }}>
          <p className="text-xs font-mono text-text-muted">
            Clona las franjas abiertas de esta semana hacia las próximas semanas (máx 12)
          </p>

          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-text-muted whitespace-nowrap">Semanas a clonar:</label>
            <input
              type="number" min={1} max={12}
              value={cloneWeeks}
              onChange={e => setCloneWeeks(Math.min(12, Math.max(1, +e.target.value)))}
              className="w-20 px-2 py-1 text-xs font-mono rounded-md text-center"
              style={{ background: '#1A1A1A', border: '1px solid #27272A', color: '#F1F1F1' }}
            />
            <span className="text-xs font-mono text-text-muted">
              → hasta {format(addWeeks(new Date(weekStart), cloneWeeks), 'dd/MM/yyyy')}
            </span>
          </div>

          <button
            onClick={handleClone}
            disabled={isPending}
            className="w-full py-2 text-xs font-mono font-semibold rounded-lg transition-all disabled:opacity-40"
            style={{ background: '#EAB308', color: '#000' }}>
            {isPending ? 'Clonando…' : `Clonar ${cloneWeeks} semana${cloneWeeks !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}

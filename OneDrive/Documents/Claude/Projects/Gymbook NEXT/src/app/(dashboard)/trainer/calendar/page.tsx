import { getMyAvailability, getUpcomingSessions } from '@/features/availability/actions'
import { AvailabilityEditor } from './AvailabilityEditor'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default async function CalendarPage() {
  const [availability, sessions] = await Promise.all([
    getMyAvailability().catch(() => []),
    getUpcomingSessions().catch(() => []),
  ])

  // Group availability by day
  const byDay: Record<number, any[]> = {}
  for (const slot of availability) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = []
    byDay[slot.dayOfWeek].push(slot)
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <div>
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">trainer·panel</div>
        <h1 className="text-2xl font-bold text-text tracking-tight">Calendario de Disponibilidad</h1>
        <p className="text-text-muted text-sm mt-1">Gestiona tus horarios disponibles para los clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: weekly grid */}
        <div className="lg:col-span-2 space-y-4">

          {/* Weekly availability visual */}
          <div className="card-sm">
            <h2 className="text-sm font-semibold text-text mb-4">Vista semanal</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const slots = byDay[day] ?? []
                const hasSlots = slots.length > 0
                return (
                  <div key={day} className="flex flex-col gap-1.5">
                    <div className="text-center text-[10px] font-mono text-text-muted uppercase">
                      {DAY_SHORT[day]}
                    </div>
                    <div
                      className="min-h-16 rounded-md p-1 flex flex-col gap-1 transition-colors"
                      style={
                        hasSlots
                          ? { background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)' }
                          : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)' }
                      }
                    >
                      {hasSlots ? (
                        slots.map((s: any) => (
                          <div
                            key={s.id}
                            className="text-center text-[9px] font-mono py-0.5 px-1 rounded"
                            style={{ background: 'rgba(59,130,246,.15)', color: '#93C5FD' }}
                          >
                            {s.startTime}–{s.endTime}
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-[10px] text-text-muted">libre</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Availability editor */}
          <AvailabilityEditor initialSlots={availability} />
        </div>

        {/* Right: upcoming sessions */}
        <div className="space-y-4">
          <div className="card-sm">
            <h2 className="text-sm font-semibold text-text mb-4">
              Próximas sesiones
              {sessions.length > 0 && (
                <span className="badge-primary text-[10px] ml-2">{sessions.length}</span>
              )}
            </h2>

            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-muted text-xs">Sin sesiones programadas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s: any) => {
                  const date = new Date(s.scheduledAt)
                  const isToday = new Date().toDateString() === date.toDateString()
                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg"
                      style={
                        isToday
                          ? { background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)' }
                          : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)' }
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-text">
                            {s.client?.user?.name ?? s.trainer?.name ?? '—'}
                          </p>
                          <p className="text-[10px] font-mono text-text-muted mt-0.5">
                            {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' · '}
                            {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={
                            isToday
                              ? { background: 'rgba(59,130,246,.2)', color: '#93C5FD' }
                              : { background: 'rgb(30,30,30)', color: '#71717A' }
                          }
                        >
                          {isToday ? 'hoy' : DAY_SHORT[date.getDay()]}
                        </span>
                      </div>
                      {s.notes && (
                        <p className="text-[11px] text-text-muted mt-1.5 italic">{s.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card-sm">
            <h2 className="text-sm font-semibold text-text mb-3">Estadísticas</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Días disponibles</span>
                <span className="text-text font-medium">{Object.keys(byDay).length} / 7</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Slots configurados</span>
                <span className="text-text font-medium">{availability.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Sesiones próximas</span>
                <span className="text-text font-medium">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

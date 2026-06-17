import { getProgramById } from '@/features/training/actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const DAY_LABEL: Record<string, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = await getProgramById(id).catch(() => null)
  if (!program) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/trainer/training" className="hover:text-text transition-colors cursor-pointer">Programas</Link>
        <span>/</span>
        <span className="text-text">{program.name}</span>
      </div>

      {/* Header */}
      <div className="card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgb(18,18,18), rgba(59,130,246,.04))' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #3B82F6, transparent)' }} />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">{program.name}</h1>
            <p className="text-text-muted text-sm mt-0.5">
              Cliente: <span className="text-text">{program.client?.user?.name ?? '—'}</span>
              {' · '}{program.durationWeeks} semanas
            </p>
            {program.description && <p className="text-text-secondary text-sm mt-2">{program.description}</p>}
          </div>
          <span className={`badge-${program.status === 'ACTIVE' ? 'success' : 'warning'}`}>
            {program.status === 'ACTIVE' ? 'activo' : program.status?.toLowerCase() ?? 'inactivo'}
          </span>
        </div>
      </div>

      {/* Workouts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">Sesiones semanales</h2>
          <button
            className="btn-secondary btn-sm cursor-pointer opacity-50"
            disabled
            title="Próximamente"
          >
            + Añadir sesión
          </button>
        </div>

        {program.workouts.length === 0 ? (
          <div className="text-center py-10" style={{ background: 'rgb(18,18,18)', borderRadius: '0.75rem', border: '1px dashed rgb(63,63,70)' }}>
            <p className="text-text-muted text-sm">Sin sesiones todavía</p>
          </div>
        ) : (
          <div className="space-y-4">
            {program.workouts.map((w: any) => (
              <div key={w.id} className="card-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(59,130,246,.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}
                    >
                      {DAY_LABEL[w.dayOfWeek]?.slice(0, 3) ?? '—'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{w.name}</p>
                      <p className="text-[10px] font-mono text-text-muted">{DAY_LABEL[w.dayOfWeek] ?? w.dayOfWeek ?? '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">{w.exercises.length} ejercicios</span>
                </div>

                {w.exercises.length > 0 && (
                  <div className="space-y-1">
                    {w.exercises.map((ex: any) => (
                      <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: 'rgb(26,26,26)' }}>
                        <span className="text-sm text-text">{ex.exercise?.name ?? '—'}</span>
                        <span className="text-xs font-mono text-text-muted">
                          {ex.sets}×{ex.reps}
                          {ex.weightKg ? ` · ${ex.weightKg}kg` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

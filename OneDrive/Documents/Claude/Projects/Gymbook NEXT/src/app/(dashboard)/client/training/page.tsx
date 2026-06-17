import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default async function ClientTrainingPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''

  const program = await prisma.trainingProgram.findFirst({
    where: { clientId: userId, isActive: true },
    include: {
      workouts: {
        orderBy: { dayOfWeek: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  }).catch(() => null)

  const today = new Date().getDay()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">client·training</div>
        <h1 className="text-2xl font-bold text-text">Mi Programa de Entrenamiento</h1>
      </div>

      {!program ? (
        <div
          className="card-sm text-center py-16"
          style={{ border: '1px dashed rgba(59,130,246,.2)' }}
        >
          <div className="text-4xl mb-3 opacity-30">◈</div>
          <p className="text-text-muted text-sm">Tu trainer aún no ha creado un programa para ti</p>
          <p className="text-text-muted text-xs mt-1">Se mostrará aquí cuando esté listo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Program header */}
          <div className="card-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-text">{program.name}</h2>
                {program.description && (
                  <p className="text-sm text-text-muted mt-1">{program.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-success text-[10px]">activo</span>
                {program.durationWeeks && (
                  <span className="badge-primary text-[10px]">{program.durationWeeks} sem</span>
                )}
              </div>
            </div>
          </div>

          {/* Workouts */}
          {program.workouts.length === 0 ? (
            <div className="card-sm text-center py-8">
              <p className="text-text-muted text-sm">Sin entrenamientos configurados todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {program.workouts.map((workout: any) => {
                const isToday = workout.dayOfWeek === today
                return (
                  <div
                    key={workout.id}
                    className="card-sm"
                    style={isToday
                      ? { border: '1px solid rgba(59,130,246,.3)', background: 'rgba(59,130,246,.04)' }
                      : {}}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={isToday
                            ? { background: 'rgba(59,130,246,.2)', color: '#93C5FD' }
                            : { background: 'rgb(26,26,26)', color: '#A1A1AA' }}
                        >
                          {DAY_NAMES[workout.dayOfWeek]}
                        </span>
                        <h3 className="text-sm font-semibold text-text">{workout.name}</h3>
                      </div>
                      {isToday && (
                        <span className="text-[9px] font-mono text-primary">HOY</span>
                      )}
                    </div>

                    {workout.exercises.length === 0 ? (
                      <p className="text-xs text-text-muted">Sin ejercicios</p>
                    ) : (
                      <div className="space-y-1.5">
                        {workout.exercises.map((ex: any, i: number) => (
                          <div
                            key={ex.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-md"
                            style={{ background: 'rgb(26,26,26)' }}
                          >
                            <span className="text-[10px] font-mono text-text-muted w-4">{i + 1}</span>
                            <div className="flex-1">
                              <p className="text-sm text-text">{ex.name}</p>
                              {ex.muscleGroup && (
                                <p className="text-[10px] text-text-muted">{ex.muscleGroup}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              {ex.sets && ex.reps && (
                                <span className="text-primary">{ex.sets}×{ex.reps}</span>
                              )}
                              {ex.weight && (
                                <span className="text-accent">{ex.weight}kg</span>
                              )}
                              {ex.restSeconds && (
                                <span className="text-text-muted">{ex.restSeconds}s</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {workout.notes && (
                      <p className="text-[11px] text-text-muted mt-3 italic border-t border-border pt-2">
                        {workout.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Map DayOfWeek enum → display name
const DAY_LABEL: Record<string, string> = {
  MONDAY:    'Lunes',
  TUESDAY:   'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY:  'Jueves',
  FRIDAY:    'Viernes',
  SATURDAY:  'Sábado',
  SUNDAY:    'Domingo',
}

// Map JS getDay() (0=Sun…6=Sat) → DayOfWeek enum string
const JS_DAY_TO_ENUM: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
}

export default async function ClientTrainingPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''

  // Client.id ≠ User.id — look up the Client record first
  const clientRecord = await prisma.client.findFirst({
    where: { userId },
    select: { id: true },
  }).catch(() => null)

  const program = clientRecord
    ? await prisma.trainingProgram.findFirst({
        where: { clientId: clientRecord.id, status: 'ACTIVE' },
        include: {
          workouts: {
            orderBy: { dayOfWeek: 'asc' },
            include: {
              exercises: {
                orderBy: { orderIndex: 'asc' },
                include: { exercise: true },
              },
            },
          },
        },
      }).catch(() => null)
    : null

  const todayEnum = JS_DAY_TO_ENUM[new Date().getDay()]

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
                const isToday = workout.dayOfWeek === todayEnum
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
                          {DAY_LABEL[workout.dayOfWeek] ?? workout.dayOfWeek}
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
                        {workout.exercises.map((we: any, i: number) => (
                          <div
                            key={we.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-md"
                            style={{ background: 'rgb(26,26,26)' }}
                          >
                            <span className="text-[10px] font-mono text-text-muted w-4">{i + 1}</span>
                            <div className="flex-1">
                              <p className="text-sm text-text">{we.exercise?.name ?? '—'}</p>
                              {we.exercise?.muscleGroup && (
                                <p className="text-[10px] text-text-muted">{we.exercise.muscleGroup}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              {we.sets && we.reps && (
                                <span className="text-primary">{we.sets}×{we.reps}</span>
                              )}
                              {we.weightKg && (
                                <span className="text-accent">{we.weightKg}kg</span>
                              )}
                              {we.restSeconds && (
                                <span className="text-text-muted">{we.restSeconds}s</span>
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

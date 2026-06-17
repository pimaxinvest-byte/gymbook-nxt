import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getClientData(userId: string) {
  const [clientProfile, upcomingSessions, trainingProgram, nutritionPlan, recentProgress] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { userId },
      include: { trainer: { select: { name: true, email: true } } },
    }),
    prisma.session.findMany({
      where: { clientId: userId, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
    }),
    prisma.trainingProgram.findFirst({
      where: { clientId: userId, isActive: true },
      include: { workouts: { orderBy: { dayOfWeek: 'asc' }, take: 7 } },
    }),
    prisma.nutritionPlan.findFirst({
      where: { clientId: userId, isActive: true },
    }),
    prisma.progressLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 3,
    }),
  ])

  const credits = await prisma.userCredit.findFirst({ where: { userId } })
  return { clientProfile, upcomingSessions, trainingProgram, nutritionPlan, recentProgress, credits }
}

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const GOAL_LABEL: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  ENDURANCE: 'Resistencia', FLEXIBILITY: 'Flexibilidad',
  GENERAL_FITNESS: 'Fitness general', SPORT_SPECIFIC: 'Deporte específico',
}

export default async function ClientDashboardPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''
  const name = session?.user?.name ?? 'Cliente'

  const { clientProfile, upcomingSessions, trainingProgram, nutritionPlan, recentProgress, credits } =
    await getClientData(userId).catch(() => ({
      clientProfile: null, upcomingSessions: [], trainingProgram: null,
      nutritionPlan: null, recentProgress: [], credits: null,
    }))

  const creditBalance = credits?.balance ?? 0

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">client·panel</div>
        <h1 className="text-2xl font-bold text-text tracking-tight">
          Hola, <span className="text-primary">{name.split(' ')[0]}</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Créditos', value: creditBalance.toString(),
            delta: creditBalance > 0 ? 'disponibles' : 'sin créditos',
            accent: creditBalance > 0 ? '#22C55E' : '#EF4444', icon: '◆',
          },
          {
            label: 'Sesiones próximas', value: upcomingSessions.length.toString(),
            delta: 'programadas', accent: '#3B82F6', icon: '◫',
          },
          {
            label: 'Objetivo',
            value: clientProfile?.goal ? GOAL_LABEL[clientProfile.goal].split(' ')[0] : '—',
            delta: clientProfile?.goal ? GOAL_LABEL[clientProfile.goal] : 'Sin definir',
            accent: '#EAB308', icon: '◉',
          },
        ].map((s) => (
          <div key={s.label} className="stat-card relative overflow-hidden">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${s.accent}, transparent)` }} />
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <span className="text-text-muted text-base">{s.icon}</span>
            </div>
            <p className="stat-value">{s.value}</p>
            <p className="stat-delta-up">{s.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: sessions + training */}
        <div className="lg:col-span-2 space-y-4">

          <div className="card-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Próximas sesiones</h2>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">Sin sesiones programadas</p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map((s: any) => {
                  const date = new Date(s.scheduledAt)
                  const isToday = new Date().toDateString() === date.toDateString()
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-md"
                      style={isToday
                        ? { background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)' }
                        : { background: 'rgb(26,26,26)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: isToday ? '#3B82F6' : '#3F3F46' }} />
                        <div>
                          <p className="text-sm text-text">Sesión con trainer</p>
                          <p className="text-[10px] font-mono text-text-muted">
                            {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' · '}{date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {isToday && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(59,130,246,.2)', color: '#93C5FD' }}>HOY</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Training */}
          <div className="card-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Mi programa</h2>
              <Link href="/client/training" className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer">
                Ver completo →
              </Link>
            </div>
            {!trainingProgram ? (
              <p className="text-xs text-text-muted py-4 text-center">Tu trainer aún no ha asignado un programa</p>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-medium text-text">{trainingProgram.name}</p>
                  <span className="badge-success text-[10px]">activo</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[0,1,2,3,4,5,6].map((day) => {
                    const workout = trainingProgram.workouts?.find((w: any) => w.dayOfWeek === day)
                    const today = new Date().getDay()
                    return (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-mono text-text-muted uppercase">{DAY_SHORT[day]}</span>
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center text-[9px] font-mono"
                          style={
                            today === day && workout
                              ? { background: 'rgba(59,130,246,.2)', border: '1px solid rgba(59,130,246,.4)', color: '#93C5FD' }
                              : workout
                              ? { background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', color: '#3B82F6' }
                              : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)', color: '#3F3F46' }
                          }
                        >
                          {workout ? '◈' : '·'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: nutrition + progress + trainer */}
        <div className="space-y-4">

          <div className="card-sm space-y-3">
            <h2 className="text-sm font-semibold text-text">Mi nutrición</h2>
            {!nutritionPlan ? (
              <p className="text-xs text-text-muted py-4 text-center">Sin plan nutricional asignado</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-text">{nutritionPlan.name}</p>
                {[
                  { label: 'Kcal', val: nutritionPlan.calories ?? 0, color: '#EAB308' },
                  { label: 'Proteína', val: (nutritionPlan.protein ?? 0) + 'g', color: '#3B82F6' },
                  { label: 'Carbohidratos', val: (nutritionPlan.carbs ?? 0) + 'g', color: '#22C55E' },
                  { label: 'Grasas', val: (nutritionPlan.fat ?? 0) + 'g', color: '#F59E0B' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-mono font-medium" style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-sm space-y-3">
            <h2 className="text-sm font-semibold text-text">Mi progreso</h2>
            {recentProgress.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">Sin registros todavía</p>
            ) : (
              <div className="space-y-2">
                {recentProgress.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-text-muted font-mono">
                      {new Date(p.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    {p.weight && <span className="font-medium text-text">{p.weight} kg</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {clientProfile?.trainer && (
            <div className="card-sm">
              <h2 className="text-sm font-semibold text-text mb-3">Mi trainer</h2>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(234,179,8,.15)', color: '#FDE68A' }}
                >
                  {(clientProfile.trainer.name ?? 'T')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-text">{clientProfile.trainer.name}</p>
                  <p className="text-[11px] text-text-muted">{clientProfile.trainer.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

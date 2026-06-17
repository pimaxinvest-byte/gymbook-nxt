import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getDashboardData(trainerId: string) {
  const [clientCount, upcomingSessions, recentClients] = await Promise.all([
    prisma.clientProfile.count({ where: { trainerId } }),
    prisma.session.findMany({
      where: { trainerId, scheduledAt: { gte: new Date() } },
      include: { client: { include: { user: { select: { name: true } } } } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.clientProfile.findMany({
      where: { trainerId },
      include: { user: { select: { name: true, createdAt: true } }, UserCredit: { select: { balance: true } } },
      orderBy: { user: { createdAt: 'desc' } },
      take: 5,
    }),
  ])

  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  const sessionsThisWeek = await prisma.session.count({
    where: { trainerId, scheduledAt: { gte: thisWeekStart } },
  })

  return { clientCount, upcomingSessions, recentClients, sessionsThisWeek }
}

export default async function TrainerDashboardPage() {
  const session = await auth()
  const trainerId = session?.user?.id ?? ''

  const { clientCount, upcomingSessions, recentClients, sessionsThisWeek } =
    await getDashboardData(trainerId).catch(() => ({
      clientCount: 0,
      upcomingSessions: [],
      recentClients: [],
      sessionsThisWeek: 0,
    }))

  const name = session?.user?.name ?? 'Trainer'

  const STATS = [
    { label: 'Clientes Activos', value: clientCount.toString(), delta: 'total', up: true, accent: '#3B82F6', icon: '◈' },
    { label: 'Sesiones Esta Semana', value: sessionsThisWeek.toString(), delta: `${upcomingSessions.length} próximas`, up: true, accent: '#EAB308', icon: '◫' },
    { label: 'Créditos Vendidos', value: '—', delta: 'próximamente', up: true, accent: '#22C55E', icon: '◆' },
    { label: 'Clientes sin plan', value: '—', delta: 'próximamente', up: false, accent: '#A1A1AA', icon: '◉' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">trainer·panel</span>
        </div>
        <h1 className="text-2xl font-bold text-text tracking-tight">
          Hola, <span className="text-primary">{name.split(' ')[0]}</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card relative overflow-hidden">
            {/* Accent line */}
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${s.accent}, transparent)`,
              }}
            />
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <span className="text-text-muted text-base">{s.icon}</span>
            </div>
            <div>
              <p className="stat-value">{s.value}</p>
              <p className={s.up ? 'stat-delta-up' : 'stat-delta-down'}>{s.delta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Upcoming sessions */}
        <div className="lg:col-span-3 card-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Próximas sesiones</h2>
            <Link href="/trainer/calendar" className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer">
              Ver calendario →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">Sin sesiones programadas</p>
              <Link href="/trainer/calendar" className="text-xs text-primary mt-2 inline-block cursor-pointer">
                Configurar disponibilidad →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map((s: any) => {
                const date = new Date(s.scheduledAt)
                const isToday = new Date().toDateString() === date.toDateString()
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md"
                    style={
                      isToday
                        ? { background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)' }
                        : { background: 'rgb(26,26,26)' }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: isToday ? '#3B82F6' : '#3F3F46' }}
                      />
                      <div>
                        <p className="text-sm text-text">{s.client?.user?.name ?? '—'}</p>
                        <p className="text-[10px] font-mono text-text-muted">
                          {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}{date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {isToday && (
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(59,130,246,.2)', color: '#93C5FD' }}
                      >
                        HOY
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div className="lg:col-span-2 card-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Clientes recientes</h2>
            <Link href="/trainer/clients" className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer">
              Ver todos →
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">Sin clientes todavía</p>
              <Link href="/trainer/clients" className="text-xs text-primary mt-2 inline-block cursor-pointer">
                Añadir cliente →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentClients.map((c: any) => {
                const nm = c.user.name ?? '—'
                const initials = nm.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const credits = c.UserCredit?.[0]?.balance ?? 0
                return (
                  <Link
                    key={c.userId}
                    href={`/trainer/clients/${c.userId}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-2 transition-colors cursor-pointer group"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,.15)', color: '#93C5FD' }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate group-hover:text-primary transition-colors">{nm}</p>
                    </div>
                    <span
                      className="text-[10px] font-mono flex-shrink-0"
                      style={credits > 0 ? { color: '#4ade80' } : { color: '#71717A' }}
                    >
                      {credits}cr
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Nuevo cliente', href: '/trainer/clients', icon: '◈' },
            { label: 'Nuevo programa', href: '/trainer/training/new', icon: '◫' },
            { label: 'Plan nutricional', href: '/trainer/nutrition/new', icon: '◆' },
            { label: 'Mi disponibilidad', href: '/trainer/calendar', icon: '◉' },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="card-hover flex items-center gap-3 p-4 cursor-pointer"
            >
              <span className="text-xl text-primary">{a.icon}</span>
              <span className="text-sm text-text">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

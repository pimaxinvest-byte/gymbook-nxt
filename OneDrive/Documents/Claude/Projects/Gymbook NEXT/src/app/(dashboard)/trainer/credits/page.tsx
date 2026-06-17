import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function TrainerCreditsPage() {
  const session = await auth()
  const trainerId = session?.user?.id ?? ''

  const clients = await prisma.client.findMany({
    where: { trainerId, isActive: true },
    include: {
      user: { select: { name: true } },
      userCredits: {
        where: { status: 'ACTIVE' },
        select: { remainingCredits: true },
      },
    },
    orderBy: { user: { name: 'asc' } },
  })

  const totalCredits = clients.reduce(
    (sum, c) => sum + c.userCredits.reduce((s, uc) => s + uc.remainingCredits, 0),
    0
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="breadcrumb">trainer / créditos</div>
        <h1 className="text-2xl font-bold text-text">Gestión de Créditos</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="stat-label">Total Clientes</p>
          <p className="stat-value">{clients.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Créditos Activos</p>
          <p className="stat-value text-accent">{totalCredits}</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◆</div>
          <p className="text-text font-medium text-sm mb-1">Sin clientes todavía</p>
          <p className="text-text-muted text-xs mb-4">
            Los créditos de tus clientes aparecerán aquí
          </p>
          <Link href="/trainer/clients" className="btn-primary btn-sm">
            Ver Clientes
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            Saldo por cliente
          </p>
          {clients.map((client) => {
            const balance = client.userCredits.reduce((s, uc) => s + uc.remainingCredits, 0)
            return (
              <Link
                key={client.id}
                href={`/trainer/clients/${client.id}`}
                className="card-hover flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-md bg-accent/15 border border-accent/25
                                flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-accent">
                    {(client.user.name ?? 'U').charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{client.user.name ?? '—'}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-base font-bold font-mono ${balance > 0 ? 'text-accent' : 'text-text-muted'}`}>
                    {balance}
                  </span>
                  <span className="text-[10px] text-text-muted">créditos</span>
                </div>

                <span className="text-text-muted text-xs opacity-40">›</span>
              </Link>
            )
          })}
        </div>
      )}

      <div className="card-sm border-dashed text-center py-6">
        <p className="text-xs text-text-muted">
          La venta y gestión avanzada de paquetes de créditos llegará pronto
        </p>
      </div>
    </div>
  )
}

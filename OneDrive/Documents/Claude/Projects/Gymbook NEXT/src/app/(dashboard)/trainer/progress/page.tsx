import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function TrainerProgressPage() {
  const session = await auth()
  const trainerId = session?.user?.id ?? ''

  // Aggregate latest progress logs across all clients
  const clients = await prisma.client.findMany({
    where: { trainerId },
    include: {
      user: { select: { name: true } },
      progressLogs: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { user: { name: 'asc' } },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="breadcrumb">trainer / progreso</div>
        <h1 className="text-2xl font-bold text-text">Progreso de Clientes</h1>
        <p className="text-text-muted text-sm mt-1">
          Seguimiento del progreso de todos tus clientes
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◧</div>
          <p className="text-text font-medium text-sm mb-1">Sin clientes todavía</p>
          <p className="text-text-muted text-xs mb-4">
            Añade clientes para ver su progreso aquí
          </p>
          <Link href="/trainer/clients" className="btn-primary btn-sm">
            Ver Clientes
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => {
            const latest = client.progressLogs[0]
            return (
              <Link
                key={client.id}
                href={`/trainer/clients/${client.id}?tab=progress`}
                className="card-hover flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25
                                flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(client.user.name ?? 'U').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{client.user.name ?? '—'}</p>
                  <p className="text-xs text-text-muted">
                    {latest
                      ? `Última medición: ${new Date(latest.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                      : 'Sin registros'}
                  </p>
                </div>

                {/* Weight */}
                {latest?.weightKg && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-text font-mono">
                      {latest.weightKg}<span className="text-xs text-text-muted ml-0.5">kg</span>
                    </p>
                  </div>
                )}

                <span className="text-text-muted text-xs opacity-40">›</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

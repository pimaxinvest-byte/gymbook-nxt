import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function TrainerMessagesPage() {
  const session = await auth()
  const trainerId = session?.user?.id ?? ''

  // Fetch clients for the "New message" list
  const clients = await prisma.client.findMany({
    where: { trainerId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="breadcrumb">trainer / mensajes</div>
        <h1 className="text-2xl font-bold text-text">Mensajes</h1>
        <p className="text-text-muted text-sm mt-1">
          Comunicación directa con tus clientes
        </p>
      </div>

      {/* Coming soon card */}
      <div className="card border-dashed flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center
                        bg-primary/8 border border-primary/15 text-primary text-xl">
          ◫
        </div>
        <div>
          <p className="text-text font-semibold text-sm">Sistema de mensajería</p>
          <p className="text-text-muted text-xs mt-1 max-w-xs">
            La mensajería en tiempo real entre trainer y cliente llegará en la próxima actualización
          </p>
        </div>
        <span className="badge-primary text-[10px]">Próximamente</span>
      </div>

      {/* Client list — contact shortcuts */}
      {clients.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            Tus clientes
          </p>
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className="card-hover flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-surface-3 border border-border
                              flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-text-secondary">
                  {(client.user.name ?? 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{client.user.name ?? '—'}</p>
                <p className="text-[10px] text-text-muted truncate">{client.user.email}</p>
              </div>
              <span className="text-text-muted text-xs opacity-40">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

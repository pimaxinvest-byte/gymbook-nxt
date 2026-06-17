import { getMyClients } from '@/features/users/actions'
import Link from 'next/link'

export default async function ClientsPage() {
  const clients = await getMyClients().catch(() => [])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
            trainer·panel
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Mis Clientes</h1>
          <p className="text-text-muted text-sm mt-1">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} activo{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/trainer/clients/new"
          className="btn-primary cursor-pointer"
          style={{ boxShadow: '0 4px 14px rgba(59,130,246,.2)' }}
        >
          + Añadir cliente
        </Link>
      </div>

      {/* Client grid */}
      {clients.length === 0 ? (
        <EmptyClients />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientCard({ client }: { client: any }) {
  const credits = client.userCredits?.[0]?.remainingCredits ?? 0
  const name = client.user.name ?? 'Sin nombre'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/trainer/clients/${client.id}`}
      className="card-hover group flex flex-col gap-4 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(59,130,246,.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
              {name}
            </p>
            <p className="text-xs text-text-muted">{client.user.email}</p>
          </div>
        </div>
        {/* Credits badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono"
          style={
            credits > 0
              ? { background: 'rgba(34,197,94,.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,.2)' }
              : { background: 'rgba(239,68,68,.08)', color: '#f87171', border: '1px solid rgba(239,68,68,.2)' }
          }
        >
          {credits} cr
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span
          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
          style={{ background: 'rgb(30,30,30)', border: '1px solid rgb(39,39,42)' }}
        >
          {((client.user as any)?.clientProfile?.fitnessGoal ?? 'GENERAL_FITNESS').replace('_', ' ')}
        </span>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
          style={{ background: 'rgb(30,30,30)', border: '1px solid rgb(39,39,42)' }}
        >
          {(client.user as any)?.clientProfile?.fitnessLevel ?? 'BEGINNER'}
        </span>
      </div>

      {/* Credit bar */}
      {credits > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-text-muted mb-1">
            <span>Créditos</span>
            <span className="font-mono">{credits} disponibles</span>
          </div>
          <div className="w-full h-1 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((credits / 20) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #3B82F6, #EAB308)',
              }}
            />
          </div>
        </div>
      )}
    </Link>
  )
}

function EmptyClients() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-xl"
      style={{ background: 'rgb(18,18,18)', border: '1px dashed rgb(63,63,70)' }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-2xl"
        style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.15)' }}
      >
        ◈
      </div>
      <p className="text-text font-semibold mb-1">Sin clientes todavía</p>
      <p className="text-text-muted text-sm mb-6">
        Añade tu primer cliente para empezar a gestionar sus programas.
      </p>
      <Link href="/trainer/clients/new" className="btn-primary cursor-pointer">
        + Añadir primer cliente
      </Link>
    </div>
  )
}

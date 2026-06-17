import { getClientById } from '@/features/users/actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CreditAssignForm } from './CreditAssignForm'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id).catch(() => null)
  if (!client) notFound()

  const name = client.user.name ?? 'Sin nombre'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const credits = client.UserCredit?.[0]?.balance ?? 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/trainer/clients" className="hover:text-text transition-colors cursor-pointer">
          Clientes
        </Link>
        <span>/</span>
        <span className="text-text">{name}</span>
      </div>

      {/* Header */}
      <div
        className="card relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgb(18,18,18), rgba(59,130,246,.04))' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #3B82F6, transparent)' }} />
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: 'rgba(59,130,246,.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text">{name}</h1>
            <p className="text-text-muted text-sm">{client.user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge-primary text-[10px]">{(client.goal ?? 'GENERAL_FITNESS').replace('_', ' ')}</span>
              <span className="badge-muted text-[10px]">{client.fitnessLevel ?? 'BEGINNER'}</span>
              {client.onboardingCompleted ? (
                <span className="badge-success text-[10px]">onboarding ✓</span>
              ) : (
                <span className="badge-danger text-[10px]">onboarding pendiente</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-text">{credits}</p>
            <p className="text-xs text-text-muted">créditos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col: body stats + progress */}
        <div className="lg:col-span-2 space-y-4">

          {/* Body stats */}
          <div className="card-sm">
            <h2 className="text-sm font-semibold text-text mb-4">Métricas corporales</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Peso actual', value: client.currentWeight ? `${client.currentWeight} kg` : '—' },
                { label: 'Altura', value: client.height ? `${client.height} cm` : '—' },
                { label: 'Peso inicial', value: client.initialWeight ? `${client.initialWeight} kg` : '—' },
              ].map((m) => (
                <div key={m.label}>
                  <p className="stat-label">{m.label}</p>
                  <p className="stat-value text-lg">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress logs */}
          <div className="card-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text">Historial de progreso</h2>
              <Link href={`/trainer/clients/${params.id}/progress`} className="text-xs text-primary hover:text-primary-dark cursor-pointer">
                Ver todo →
              </Link>
            </div>
            {client.progressLogs.length === 0 ? (
              <p className="text-xs text-text-muted">Sin registros de progreso todavía</p>
            ) : (
              <div className="space-y-2">
                {client.progressLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-xs text-text-muted">
                      {new Date(log.loggedAt).toLocaleDateString('es-ES')}
                    </span>
                    <div className="flex gap-4 text-xs">
                      {log.weight && <span className="text-text">{log.weight} kg</span>}
                      {log.bodyFat && <span className="text-text-secondary">{log.bodyFat}% grasa</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Training programs */}
          <div className="card-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text">Programas de entrenamiento</h2>
              <Link href={`/trainer/training/new?clientId=${params.id}`} className="btn-ghost btn-sm cursor-pointer">
                + Nuevo
              </Link>
            </div>
            {client.trainingPrograms.length === 0 ? (
              <p className="text-xs text-text-muted">Sin programas asignados todavía</p>
            ) : (
              <div className="space-y-2">
                {client.trainingPrograms.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/trainer/training/${p.id}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-text">{p.name}</span>
                    <span className={`badge-${p.isActive ? 'success' : 'muted'} text-[10px]`}>
                      {p.isActive ? 'activo' : 'inactivo'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col: credits */}
        <div className="space-y-4">
          <CreditAssignForm clientId={params.id} currentCredits={credits} />

          {/* Nutrition plan */}
          <div className="card-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text">Plan nutricional</h2>
              <Link href={`/trainer/nutrition/new?clientId=${params.id}`} className="btn-ghost btn-sm cursor-pointer">
                + Crear
              </Link>
            </div>
            {client.nutritionPlans.length === 0 ? (
              <p className="text-xs text-text-muted">Sin plan nutricional</p>
            ) : (
              <Link
                href={`/trainer/nutrition/${client.nutritionPlans[0].id}`}
                className="flex items-center justify-between py-2 rounded-md hover:bg-surface-2 px-2 transition-colors cursor-pointer"
              >
                <span className="text-sm text-text">{client.nutritionPlans[0].name}</span>
                <span className="badge-success text-[10px]">activo</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

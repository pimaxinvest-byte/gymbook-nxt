// ─── GymBook NXT · Client Profile ────────────────────────────────────────────
// 5-tab layout: Resumen · Biometría · Progreso · Fotos · CRM
// Voltaic Nocturne design system

import { getClientById }   from '@/features/users/actions'
import { getLatestMetrics, getProgressHistory } from '@/features/progress/actions'
import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import { CreditAssignForm }   from './CreditAssignForm'
import ClientProfileTabs      from './ClientProfileTabs'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const client   = await getClientById(id).catch(() => null)
  if (!client) notFound()

  // Fetch progress in parallel
  const [metrics, history] = await Promise.all([
    getLatestMetrics(id).catch(() => null),
    getProgressHistory(id, 12).catch(() => []),
  ])

  const name     = client.user.name ?? 'Sin nombre'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const profile  = (client as any).user?.clientProfile

  // Total active credits across types
  const ptCredits  = (client as any).userCredits
    ?.filter((uc: any) => uc.creditType === 'PT')
    .reduce((s: number, uc: any) => s + (uc.remainingCredits ?? 0), 0) ?? 0
  const sgtCredits = (client as any).userCredits
    ?.filter((uc: any) => uc.creditType === 'SGT')
    .reduce((s: number, uc: any) => s + (uc.remainingCredits ?? 0), 0) ?? 0

  // Age
  const age = profile?.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  // Latest body composition
  const bodyFat  = metrics?.current?.bodyFatPct
  const leanMass = metrics?.current?.leanMassKg

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#52525B' }}>
        <Link href="/trainer/clients" className="hover:text-[#F1F1F1] transition-colors">
          clientes
        </Link>
        <span>/</span>
        <span style={{ color: '#A1A1AA' }}>{name}</span>
      </div>

      {/* ── Hero header ── */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{
          background: 'linear-gradient(135deg, #0D0D0D 0%, rgba(59,130,246,.04) 100%)',
          border: '1px solid #1A1A1A',
        }}>
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #3B82F6, rgba(234,179,8,.6), transparent)',
        }} />

        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: 'rgba(59,130,246,.12)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: '#F1F1F1' }}>{name}</h1>
            <p className="text-sm font-mono mt-0.5" style={{ color: '#71717A' }}>{client.user.email}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {profile?.fitnessGoal && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(59,130,246,.12)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}>
                  {profile.fitnessGoal.replace(/_/g, ' ')}
                </span>
              )}
              {profile?.fitnessLevel && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ background: '#1A1A1A', color: '#71717A', border: '1px solid #27272A' }}>
                  {profile.fitnessLevel}
                </span>
              )}
              {age && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ background: '#1A1A1A', color: '#71717A', border: '1px solid #27272A' }}>
                  {age} años
                </span>
              )}
              {profile?.onboardingCompleted ? (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(34,197,94,.12)', color: '#4ADE80', border: '1px solid rgba(34,197,94,.2)' }}>
                  onboarding ✓
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(239,68,68,.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,.2)' }}>
                  onboarding pendiente
                </span>
              )}
            </div>
          </div>

          {/* Right: quick stats */}
          <div className="flex gap-3 flex-shrink-0">
            {/* PT credits */}
            <div className="px-4 py-3 rounded-xl text-center"
              style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.12)' }}>
              <div className="text-2xl font-bold font-mono" style={{ color: '#3B82F6' }}>{ptCredits}</div>
              <div className="text-[9px] font-mono mt-0.5" style={{ color: '#52525B' }}>PT</div>
            </div>
            {/* SGT credits */}
            {sgtCredits > 0 && (
              <div className="px-4 py-3 rounded-xl text-center"
                style={{ background: 'rgba(234,179,8,.06)', border: '1px solid rgba(234,179,8,.12)' }}>
                <div className="text-2xl font-bold font-mono" style={{ color: '#EAB308' }}>{sgtCredits}</div>
                <div className="text-[9px] font-mono mt-0.5" style={{ color: '#52525B' }}>SGT</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick biometric pills */}
        {(metrics?.current?.weightKg || bodyFat || leanMass || metrics?.current?.ffmi) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4"
            style={{ borderTop: '1px solid #1A1A1A' }}>
            {metrics?.current?.weightKg && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: '#111', border: '1px solid #1A1A1A' }}>
                <span style={{ color: '#52525B' }}>peso</span>
                <span style={{ color: '#3B82F6' }}>{metrics.current.weightKg} kg</span>
              </div>
            )}
            {bodyFat !== null && bodyFat !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: '#111', border: '1px solid #1A1A1A' }}>
                <span style={{ color: '#52525B' }}>grasa</span>
                <span style={{ color: '#EAB308' }}>{bodyFat}%</span>
              </div>
            )}
            {leanMass && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: '#111', border: '1px solid #1A1A1A' }}>
                <span style={{ color: '#52525B' }}>magra</span>
                <span style={{ color: '#22C55E' }}>{leanMass} kg</span>
              </div>
            )}
            {metrics?.current?.ffmi && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: '#111', border: '1px solid #1A1A1A' }}>
                <span style={{ color: '#52525B' }}>FFMI</span>
                <span style={{ color: '#A855F7' }}>{metrics.current.ffmi}</span>
              </div>
            )}
            {profile?.heightCm && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: '#111', border: '1px solid #1A1A1A' }}>
                <span style={{ color: '#52525B' }}>altura</span>
                <span style={{ color: '#F1F1F1' }}>{profile.heightCm} cm</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left: tabs (3/4 width) */}
        <div className="lg:col-span-3">
          <ClientProfileTabs
            client={client}
            metrics={metrics}
            history={history}
          />
        </div>

        {/* Right: sidebar (1/4 width) */}
        <div className="space-y-4">
          {/* Credit assign form */}
          <CreditAssignForm clientId={id} currentCredits={ptCredits} />

          {/* Quick actions */}
          <div className="p-4 rounded-xl space-y-2"
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#52525B' }}>
              Acciones rápidas
            </div>
            <a href={`/trainer/training/new?clientId=${id}`}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-mono transition-colors hover:bg-[#1A1A1A]"
              style={{ color: '#A1A1AA', border: '1px solid #1A1A1A' }}>
              <span style={{ color: '#3B82F6' }}>+</span> Nuevo programa
            </a>
            <a href={`/trainer/nutrition/new?clientId=${id}`}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-mono transition-colors hover:bg-[#1A1A1A]"
              style={{ color: '#A1A1AA', border: '1px solid #1A1A1A' }}>
              <span style={{ color: '#22C55E' }}>+</span> Plan nutricional
            </a>
            <a href="/trainer/calendar"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-mono transition-colors hover:bg-[#1A1A1A]"
              style={{ color: '#A1A1AA', border: '1px solid #1A1A1A' }}>
              <span style={{ color: '#EAB308' }}>◎</span> Reservar sesión
            </a>
          </div>

          {/* Member since */}
          <div className="px-4 py-3 rounded-xl text-center"
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#52525B' }}>
              Cliente desde
            </div>
            <div className="text-xs font-mono" style={{ color: '#71717A' }}>
              {new Date(client.joinedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

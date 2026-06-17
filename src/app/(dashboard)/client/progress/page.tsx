// ─── GymBook NXT · Client Progress Page ──────────────────────────────────────
// Server component — fetches progress logs and renders sparklines + history table.
// Voltaic Nocturne design system.

import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import LogProgressForm from './LogProgressForm'

// ─── SparkLine (vanilla SVG, no canvas, mirrors ClientProfileTabs.tsx) ────────

interface SparkLineProps {
  data:   (number | null)[]
  color?: string
  label:  string
  unit?:  string
}

function SparkLine({ data, color = '#3B82F6', label, unit = '' }: SparkLineProps) {
  const valid = data.filter((v): v is number => v !== null && v !== undefined)
  if (valid.length < 2) return null

  const min   = Math.min(...valid)
  const max   = Math.max(...valid)
  const range = max - min || 1
  const W     = 200
  const H     = 48
  const step  = W / (data.length - 1)

  const pointList = data
    .map((v, i) => {
      if (v === null || v === undefined) return null
      const x = i * step
      const y = H - ((v - min) / range) * (H - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .filter(Boolean) as string[]

  const points = pointList.join(' ')
  const last   = valid[valid.length - 1]
  const first  = valid[0]
  const change = +(last - first).toFixed(1)
  const gradId = `grad-${label.replace(/\s/g, '-')}`

  return (
    <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#52525B' }}>
            {label}
          </div>
          <div className="text-lg font-mono font-bold mt-0.5" style={{ color }}>
            {last}{unit}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono" style={{ color: '#52525B' }}>
            {valid.length} registros
          </div>
          <div
            className="text-xs font-mono mt-0.5"
            style={{ color: change < 0 ? '#22C55E' : change > 0 ? '#EF4444' : '#52525B' }}
          >
            {change > 0 ? '+' : ''}{change}{unit}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,${H} ${points} ${(data.length - 1) * step},${H}`}
          fill={`url(#${gradId})`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((v, i) => {
          if (v === null || v === undefined) return null
          const x = i * step
          const y = H - ((v - min) / range) * (H - 8) - 4
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2" fill={color} />
        })}
      </svg>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientProgressPage() {
  const session = await auth()

  const clientRecord = await prisma.client.findFirst({
    where: { userId: session!.user.id },
    select: { id: true },
  }).catch(() => null)

  const logs = clientRecord
    ? await prisma.progressLog.findMany({
        where:   { clientId: clientRecord.id },
        orderBy: { date: 'desc' },
        take:    20,
      }).catch(() => [])
    : []

  // Chronological order for sparklines
  const sorted = [...logs].reverse()

  const weightData   = sorted.map(l => l.weightKg ?? null)
  const fatData      = sorted.map(l => l.bodyFatNavy ?? l.bodyFatSkinfold ?? l.bodyFatBioImp ?? null)
  const leanData     = sorted.map(l => l.leanMassKg ?? null)
  const waistData    = sorted.map(l => l.waistCm ?? null)
  const recovData    = sorted.map(l =>
    l.recoveryScore !== null && l.recoveryScore !== undefined
      ? +l.recoveryScore.toFixed(0)
      : null
  )

  const hasSparkData = sorted.length >= 2

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="section-eyebrow">client·progress</div>
          <h1 className="text-2xl font-bold text-text">Mi Progreso</h1>
        </div>
        {clientRecord && (
          <LogProgressForm clientId={clientRecord.id} />
        )}
      </div>

      {logs.length === 0 ? (
        /* ── Empty state ── */
        <div
          className="card-sm text-center py-16"
          style={{ border: '1px dashed rgba(59,130,246,.2)' }}
        >
          <div className="text-4xl mb-3 opacity-30">◎</div>
          <p className="text-text-muted text-sm">Sin mediciones registradas todavía</p>
          <p className="text-text-muted text-xs mt-1">
            Pulsa «Registrar medición» para añadir tu primera entrada
          </p>
        </div>
      ) : (
        <>
          {/* ── Sparklines ── */}
          {hasSparkData && (
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-widest mb-3"
                style={{ color: '#52525B' }}
              >
                Evolución — últimas {logs.length} mediciones
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SparkLine data={weightData} color="#3B82F6" label="Peso"       unit=" kg" />
                <SparkLine data={fatData}    color="#EAB308" label="% Graso"     unit="%" />
                <SparkLine data={leanData}   color="#22C55E" label="Masa Magra"  unit=" kg" />
                <SparkLine data={waistData}  color="#F59E0B" label="Cintura"     unit=" cm" />
                {recovData.some(v => v !== null) && (
                  <SparkLine data={recovData} color="#A855F7" label="Recovery" unit="/100" />
                )}
              </div>
            </div>
          )}

          {/* ── History table ── */}
          <div>
            <div
              className="text-[9px] font-mono uppercase tracking-widest mb-3"
              style={{ color: '#52525B' }}
            >
              Historial
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A1A1A' }}>
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs font-mono"
                  style={{ borderCollapse: 'collapse' }}
                >
                  <thead>
                    <tr style={{ background: '#111', borderBottom: '1px solid #1A1A1A' }}>
                      {['Fecha', 'Peso', '% Graso', 'Masa Magra', 'FFMI', 'Cintura', 'Recovery'].map(h => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 text-[9px] uppercase tracking-widest"
                          style={{ color: '#52525B' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => {
                      const fatPct = log.bodyFatNavy ?? log.bodyFatSkinfold ?? log.bodyFatBioImp ?? null
                      return (
                        <tr
                          key={log.id}
                          style={{ borderBottom: i < logs.length - 1 ? '1px solid #111' : 'none' }}
                          className="hover:bg-[#0F0F0F] transition-colors"
                        >
                          <td className="px-3 py-2" style={{ color: '#A1A1AA' }}>
                            {new Date(log.date).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', year: '2-digit',
                            })}
                          </td>
                          <td className="px-3 py-2" style={{ color: log.weightKg ? '#F1F1F1' : '#3A3A3A' }}>
                            {log.weightKg ? `${log.weightKg} kg` : '—'}
                          </td>
                          <td className="px-3 py-2" style={{ color: fatPct ? '#EAB308' : '#3A3A3A' }}>
                            {fatPct ? `${fatPct}%` : '—'}
                          </td>
                          <td className="px-3 py-2" style={{ color: log.leanMassKg ? '#22C55E' : '#3A3A3A' }}>
                            {log.leanMassKg ? `${log.leanMassKg} kg` : '—'}
                          </td>
                          <td className="px-3 py-2" style={{ color: log.ffmi ? '#A855F7' : '#3A3A3A' }}>
                            {log.ffmi ? `${log.ffmi}` : '—'}
                          </td>
                          <td className="px-3 py-2" style={{ color: log.waistCm ? '#F59E0B' : '#3A3A3A' }}>
                            {log.waistCm ? `${log.waistCm} cm` : '—'}
                          </td>
                          <td className="px-3 py-2" style={{ color: log.recoveryScore ? '#A855F7' : '#3A3A3A' }}>
                            {log.recoveryScore ? `${log.recoveryScore.toFixed(0)}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

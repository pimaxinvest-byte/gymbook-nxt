'use client'
// ─── GymBook NXT · Client Profile Tabs ──────────────────────────────────────
// 5 tabs: Resumen · Biometría · Progreso · Fotos · CRM
// Voltaic Nocturne design system

import React, { useState } from 'react'

// ── Tab types ──────────────────────────────────────────────────────────────────
type Tab = 'resumen' | 'biometria' | 'progreso' | 'fotos' | 'crm'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'resumen',   label: 'Resumen',   icon: '◈' },
  { id: 'biometria', label: 'Biometría', icon: '◉' },
  { id: 'progreso',  label: 'Progreso',  icon: '◎' },
  { id: 'fotos',     label: 'Fotos',     icon: '□' },
  { id: 'crm',       label: 'CRM',       icon: '◇' },
]

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  client:       any
  metrics:      any
  history:      any[]
  defaultTab?:  Tab
}

export default function ClientProfileTabs({ client, metrics, history, defaultTab = 'resumen' }: Props) {
  const [active, setActive] = useState<Tab>(defaultTab)

  return (
    <div className="space-y-4">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl"
        style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all"
            style={{
              background: active === t.id ? '#1A1A1A' : 'transparent',
              color:      active === t.id ? '#F1F1F1' : '#52525B',
              border:     active === t.id ? '1px solid #27272A' : '1px solid transparent',
            }}>
            <span style={{ color: active === t.id ? '#3B82F6' : '#52525B' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {active === 'resumen'   && <TabResumen   client={client} metrics={metrics} />}
      {active === 'biometria' && <TabBiometria client={client} history={history} />}
      {active === 'progreso'  && <TabProgreso  history={history} />}
      {active === 'fotos'     && <TabFotos     client={client} />}
      {active === 'crm'       && <TabCRM       client={client} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: RESUMEN
// ─────────────────────────────────────────────────────────────────────────────

function TabResumen({ client, metrics }: { client: any; metrics: any }) {
  const profile = client?.user?.clientProfile
  const current = metrics?.current
  const delta   = metrics?.delta

  function DeltaChip({ val, unit = '', invert = false }: { val: number | null; unit?: string; invert?: boolean }) {
    if (val === null || val === undefined) return <span style={{ color: '#52525B' }}>—</span>
    const good = invert ? val < 0 : val > 0
    const color = val === 0 ? '#52525B' : good ? '#22C55E' : '#EF4444'
    return (
      <span className="text-[10px] font-mono ml-1.5 px-1.5 py-0.5 rounded"
        style={{ background: `${color}18`, color }}>
        {val > 0 ? '+' : ''}{val}{unit}
      </span>
    )
  }

  const bigStats = [
    {
      label: 'Peso',
      value: current?.weightKg ? `${current.weightKg} kg` : '—',
      delta: delta?.weightKg ?? null,
      unit: ' kg',
      invert: true,
      color: '#3B82F6',
    },
    {
      label: '% Graso',
      value: current?.bodyFatPct !== null && current?.bodyFatPct !== undefined ? `${current.bodyFatPct}%` : '—',
      delta: delta?.bodyFatPct ?? null,
      unit: '%',
      invert: true,
      color: '#EAB308',
    },
    {
      label: 'Masa Magra',
      value: current?.leanMassKg ? `${current.leanMassKg} kg` : '—',
      delta: delta?.leanMassKg ?? null,
      unit: ' kg',
      invert: false,
      color: '#22C55E',
    },
    {
      label: 'FFMI',
      value: current?.ffmi ? `${current.ffmi}` : '—',
      delta: null,
      unit: '',
      invert: false,
      color: '#A855F7',
    },
  ]

  // FFMI interpretation
  const ffmi = current?.ffmi
  let ffmiLabel = ''
  let ffmiColor = '#52525B'
  if (ffmi) {
    if (ffmi < 17)      { ffmiLabel = 'Por debajo del promedio'; ffmiColor = '#3B82F6' }
    else if (ffmi < 20) { ffmiLabel = 'Promedio';                ffmiColor = '#71717A' }
    else if (ffmi < 22) { ffmiLabel = 'Por encima del promedio'; ffmiColor = '#22C55E' }
    else if (ffmi < 24) { ffmiLabel = 'Excelente';               ffmiColor = '#EAB308' }
    else if (ffmi < 26) { ffmiLabel = 'Superior';                ffmiColor = '#F59E0B' }
    else                { ffmiLabel = 'Límite natural';           ffmiColor = '#EF4444' }
  }

  // Recovery bar
  const recovery = current?.recoveryScore
  const recoveryColor = !recovery ? '#27272A' :
    recovery >= 70 ? '#22C55E' :
    recovery >= 40 ? '#EAB308' : '#EF4444'

  return (
    <div className="space-y-4">
      {/* Big 4 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {bigStats.map(s => (
          <div key={s.label}
            className="p-4 rounded-xl"
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2"
              style={{ color: '#52525B' }}>
              {s.label}
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </div>
            <DeltaChip val={s.delta} unit={s.unit} invert={s.invert} />
          </div>
        ))}
      </div>

      {/* FFMI gauge */}
      {ffmi && (
        <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#52525B' }}>
              FFMI — Fat-Free Mass Index
            </div>
            <div className="text-xs font-mono font-semibold" style={{ color: ffmiColor }}>
              {ffmi} — {ffmiLabel}
            </div>
          </div>
          {/* FFMI bar: scale 14–28 */}
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
            <div className="absolute top-0 left-0 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, ((ffmi - 14) / 14) * 100))}%`,
                background: `linear-gradient(90deg, #3B82F6, ${ffmiColor})`,
              }} />
          </div>
          <div className="flex justify-between text-[8px] font-mono mt-1" style={{ color: '#3A3A3A' }}>
            <span>14</span><span>17</span><span>20</span><span>22</span><span>24</span><span>26</span><span>28</span>
          </div>
        </div>
      )}

      {/* Recovery score */}
      {recovery !== null && recovery !== undefined && (
        <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#52525B' }}>
              Recovery Score
            </div>
            <div className="text-sm font-mono font-bold" style={{ color: recoveryColor }}>
              {recovery.toFixed(0)} / 100
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${recovery}%`, background: recoveryColor }} />
          </div>
        </div>
      )}

      {/* Programs + Nutrition row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Training */}
        <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#52525B' }}>
            Programas activos
          </div>
          {(client.trainingPrograms ?? []).length === 0 ? (
            <p className="text-xs" style={{ color: '#52525B' }}>Sin programas</p>
          ) : (
            <div className="space-y-1.5">
              {(client.trainingPrograms ?? []).slice(0, 3).map((p: any) => (
                <a key={p.id} href={`/trainer/training/${p.id}`}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1A1A1A] transition-colors">
                  <span className="text-xs font-mono" style={{ color: '#D4D4D8' }}>{p.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                    style={{
                      background: p.status === 'ACTIVE' ? 'rgba(34,197,94,.12)' : 'rgba(113,113,122,.12)',
                      color:      p.status === 'ACTIVE' ? '#22C55E' : '#71717A',
                    }}>
                    {p.status === 'ACTIVE' ? 'activo' : p.status.toLowerCase()}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#52525B' }}>
            Plan nutricional
          </div>
          {(client.nutritionPlans ?? []).length === 0 ? (
            <p className="text-xs" style={{ color: '#52525B' }}>Sin plan nutricional</p>
          ) : (
            <div className="space-y-1.5">
              {(client.nutritionPlans ?? []).slice(0, 2).map((p: any) => (
                <a key={p.id} href={`/trainer/nutrition/${p.id}`}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1A1A1A] transition-colors">
                  <span className="text-xs font-mono" style={{ color: '#D4D4D8' }}>{p.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(34,197,94,.12)', color: '#22C55E' }}>activo</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest log date */}
      {current?.date && (
        <p className="text-[10px] font-mono text-right" style={{ color: '#3A3A3A' }}>
          Última medición: {new Date(current.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: BIOMETRÍA (latest log display + key measurements)
// ─────────────────────────────────────────────────────────────────────────────

function TabBiometria({ client, history }: { client: any; history: any[] }) {
  const latest = history[0]
  const prev   = history[1]

  function delta(curr: number | null | undefined, prev: number | null | undefined) {
    if (!curr || !prev) return null
    return +(curr - prev).toFixed(1)
  }

  function Cell({ label, value, unit = '', d }: { label: string; value?: number | null; unit?: string; d?: number | null }) {
    const dColor = d === null || d === undefined ? '#52525B' :
      d < 0 ? '#22C55E' : d > 0 ? '#EF4444' : '#52525B'
    return (
      <div className="p-3 rounded-lg" style={{ background: '#111', border: '1px solid #1A1A1A' }}>
        <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#52525B' }}>
          {label}
        </div>
        <div className="text-base font-mono font-bold" style={{ color: value ? '#F1F1F1' : '#3A3A3A' }}>
          {value ? `${value}${unit}` : '—'}
        </div>
        {d !== null && d !== undefined && (
          <div className="text-[9px] font-mono mt-0.5" style={{ color: dColor }}>
            {d > 0 ? '+' : ''}{d}{unit}
          </div>
        )}
      </div>
    )
  }

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="text-3xl" style={{ color: '#27272A' }}>◉</div>
        <p className="text-sm font-mono" style={{ color: '#52525B' }}>Sin registros biométricos todavía</p>
        <p className="text-xs" style={{ color: '#3A3A3A' }}>
          Las medidas se registran desde la sección de progreso del cliente
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono" style={{ color: '#71717A' }}>
          Última medición: {new Date(latest.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        {prev && (
          <div className="text-[10px] font-mono" style={{ color: '#52525B' }}>
            vs. {new Date(prev.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </div>
        )}
      </div>

      {/* Composition */}
      <div>
        <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#3B82F6', opacity: 0.8 }}>
          Composición corporal
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Cell label="Peso" value={latest.weightKg} unit=" kg" d={delta(latest.weightKg, prev?.weightKg)} />
          <Cell label="% Graso" value={latest.bodyFatNavy ?? latest.bodyFatSkinfold ?? latest.bodyFatBioImp} unit="%" d={delta(latest.bodyFatNavy ?? latest.bodyFatSkinfold, prev?.bodyFatNavy ?? prev?.bodyFatSkinfold)} />
          <Cell label="Masa Magra" value={latest.leanMassKg} unit=" kg" d={delta(latest.leanMassKg, prev?.leanMassKg)} />
          <Cell label="Masa Grasa" value={latest.fatKg} unit=" kg" d={delta(latest.fatKg, prev?.fatKg)} />
          <Cell label="FFMI" value={latest.ffmi} d={delta(latest.ffmi, prev?.ffmi)} />
          <Cell label="CSA Brazo" value={latest.csaArm} unit=" cm²" d={delta(latest.csaArm, prev?.csaArm)} />
        </div>
      </div>

      {/* Perímetros */}
      {(latest.waistCm || latest.hipCm || latest.armRelaxedCm || latest.chestCm || latest.thighRelaxedCm) && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#EAB308', opacity: 0.8 }}>
            Perímetros
          </div>
          <div className="grid grid-cols-3 gap-2">
            {latest.neckCm && <Cell label="Cuello" value={latest.neckCm} unit=" cm" d={delta(latest.neckCm, prev?.neckCm)} />}
            {latest.armRelaxedCm && <Cell label="Brazo relajado" value={latest.armRelaxedCm} unit=" cm" d={delta(latest.armRelaxedCm, prev?.armRelaxedCm)} />}
            {latest.chestCm && <Cell label="Pecho" value={latest.chestCm} unit=" cm" d={delta(latest.chestCm, prev?.chestCm)} />}
            {latest.waistCm && <Cell label="Cintura" value={latest.waistCm} unit=" cm" d={delta(latest.waistCm, prev?.waistCm)} />}
            {latest.abdomenCm && <Cell label="Abdomen" value={latest.abdomenCm} unit=" cm" d={delta(latest.abdomenCm, prev?.abdomenCm)} />}
            {latest.hipCm && <Cell label="Cadera" value={latest.hipCm} unit=" cm" d={delta(latest.hipCm, prev?.hipCm)} />}
            {latest.thighRelaxedCm && <Cell label="Muslo" value={latest.thighRelaxedCm} unit=" cm" d={delta(latest.thighRelaxedCm, prev?.thighRelaxedCm)} />}
            {latest.calfCm && <Cell label="Pantorrilla" value={latest.calfCm} unit=" cm" d={delta(latest.calfCm, prev?.calfCm)} />}
          </div>
        </div>
      )}

      {/* Pliegues */}
      {(latest.tricepFoldMm || latest.abdominalFoldMm) && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#A855F7', opacity: 0.8 }}>
            Pliegues cutáneos
          </div>
          <div className="grid grid-cols-3 gap-2">
            {latest.tricepFoldMm && <Cell label="Tricipital" value={latest.tricepFoldMm} unit=" mm" d={delta(latest.tricepFoldMm, prev?.tricepFoldMm)} />}
            {latest.subscapularFoldMm && <Cell label="Subescapular" value={latest.subscapularFoldMm} unit=" mm" d={delta(latest.subscapularFoldMm, prev?.subscapularFoldMm)} />}
            {latest.abdominalFoldMm && <Cell label="Abdominal" value={latest.abdominalFoldMm} unit=" mm" d={delta(latest.abdominalFoldMm, prev?.abdominalFoldMm)} />}
            {latest.suprailiacFoldMm && <Cell label="Suprailiaco" value={latest.suprailiacFoldMm} unit=" mm" d={delta(latest.suprailiacFoldMm, prev?.suprailiacFoldMm)} />}
            {latest.thighFoldMm && <Cell label="Muslo" value={latest.thighFoldMm} unit=" mm" d={delta(latest.thighFoldMm, prev?.thighFoldMm)} />}
          </div>
        </div>
      )}

      {/* Wellness */}
      {(latest.recoveryScore || latest.sleepHours || latest.energyLevel) && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#22C55E', opacity: 0.8 }}>
            Bienestar
          </div>
          <div className="grid grid-cols-3 gap-2">
            {latest.recoveryScore !== null && <Cell label="Recovery" value={latest.recoveryScore ? +latest.recoveryScore.toFixed(0) : null} unit="/100" d={delta(latest.recoveryScore, prev?.recoveryScore)} />}
            {latest.sleepHours && <Cell label="Horas sueño" value={latest.sleepHours} unit="h" d={delta(latest.sleepHours, prev?.sleepHours)} />}
            {latest.energyLevel && <Cell label="Energía" value={latest.energyLevel} unit="/10" d={delta(latest.energyLevel, prev?.energyLevel)} />}
            {latest.fatigueLevel && <Cell label="Fatiga" value={latest.fatigueLevel} unit="/10" d={delta(latest.fatigueLevel, prev?.fatigueLevel)} />}
            {latest.moodScore && <Cell label="Humor" value={latest.moodScore} unit="/10" d={delta(latest.moodScore, prev?.moodScore)} />}
            {latest.stressLevel && <Cell label="Estrés" value={latest.stressLevel} unit="/10" d={delta(latest.stressLevel, prev?.stressLevel)} />}
          </div>
        </div>
      )}

      {/* Notes */}
      {(latest.notes || latest.structuralNotes || latest.injuriesNotes) && (
        <div className="p-4 rounded-xl space-y-2" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
          {latest.notes && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#52525B' }}>Notas</div>
              <p className="text-xs font-mono" style={{ color: '#A1A1AA' }}>{latest.notes}</p>
            </div>
          )}
          {latest.structuralNotes && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#52525B' }}>Notas estructurales</div>
              <p className="text-xs font-mono" style={{ color: '#A1A1AA' }}>{latest.structuralNotes}</p>
            </div>
          )}
          {latest.injuriesNotes && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#EF4444', opacity: 0.8 }}>Lesiones</div>
              <p className="text-xs font-mono" style={{ color: '#FCA5A5' }}>{latest.injuriesNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PROGRESO (mini sparkline charts without canvas)
// ─────────────────────────────────────────────────────────────────────────────

function TabProgreso({ history }: { history: any[] }) {
  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="text-3xl" style={{ color: '#27272A' }}>◎</div>
        <p className="text-sm font-mono" style={{ color: '#52525B' }}>Mínimo 2 registros para ver evolución</p>
      </div>
    )
  }

  // Reverse to chronological order for charts
  const sorted = [...history].reverse()

  function SparkLine({ data, color = '#3B82F6', label, unit = '' }: {
    data: (number | null)[]
    color?: string
    label: string
    unit?: string
  }) {
    const valid = data.filter((v): v is number => v !== null && v !== undefined)
    if (valid.length < 2) return null

    const min = Math.min(...valid)
    const max = Math.max(...valid)
    const range = max - min || 1
    const W = 200
    const H = 48
    const step = W / (data.length - 1)

    const points = data
      .map((v, i) => {
        if (v === null || v === undefined) return null
        const x = i * step
        const y = H - ((v - min) / range) * (H - 8) - 4
        return `${x},${y}`
      })
      .filter(Boolean)
      .join(' ')

    const last = valid[valid.length - 1]
    const first = valid[0]
    const change = +(last - first).toFixed(1)

    return (
      <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#52525B' }}>{label}</div>
            <div className="text-lg font-mono font-bold mt-0.5" style={{ color }}>
              {last}{unit}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono" style={{ color: '#52525B' }}>{valid.length} registros</div>
            <div className="text-xs font-mono mt-0.5"
              style={{ color: change < 0 ? '#22C55E' : change > 0 ? '#EF4444' : '#52525B' }}>
              {change > 0 ? '+' : ''}{change}{unit}
            </div>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <polygon
            points={`0,${H} ${points} ${(data.length - 1) * step},${H}`}
            fill={`url(#grad-${label.replace(/\s/g, '')})`}
          />
          {/* Line */}
          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots at data points */}
          {data.map((v, i) => {
            if (v === null || v === undefined) return null
            const x = i * step
            const y = H - ((v - min) / range) * (H - 8) - 4
            return <circle key={i} cx={x} cy={y} r="2" fill={color} />
          })}
        </svg>
      </div>
    )
  }

  const weightData = sorted.map(l => l.weightKg ?? null)
  const fatData    = sorted.map(l => l.bodyFatNavy ?? l.bodyFatSkinfold ?? l.bodyFatBioImp ?? null)
  const leanData   = sorted.map(l => l.leanMassKg ?? null)
  const ffmiData   = sorted.map(l => l.ffmi ?? null)
  const waistData  = sorted.map(l => l.waistCm ?? null)
  const armData    = sorted.map(l => l.armRelaxedCm ?? null)
  const recovData  = sorted.map(l => l.recoveryScore ? +l.recoveryScore.toFixed(0) : null)

  return (
    <div className="space-y-3">
      <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#52525B' }}>
        Evolución — últimas {history.length} mediciones
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SparkLine data={weightData} color="#3B82F6"  label="Peso"         unit=" kg" />
        <SparkLine data={fatData}    color="#EAB308"  label="% Graso"       unit="%" />
        <SparkLine data={leanData}   color="#22C55E"  label="Masa Magra"    unit=" kg" />
        <SparkLine data={ffmiData}   color="#A855F7"  label="FFMI"          />
        <SparkLine data={waistData}  color="#F59E0B"  label="Cintura"       unit=" cm" />
        <SparkLine data={armData}    color="#06B6D4"  label="Brazo"         unit=" cm" />
        {recovData.some(v => v !== null) && (
          <SparkLine data={recovData} color="#22C55E" label="Recovery Score" unit="/100" />
        )}
      </div>

      {/* History table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A1A1A' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#111', borderBottom: '1px solid #1A1A1A' }}>
                {['Fecha', 'Peso', '% Graso', 'Magra', 'FFMI', 'Recovery'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] uppercase tracking-widest"
                    style={{ color: '#52525B' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((log, i) => (
                <tr key={log.id}
                  style={{ borderBottom: i < history.length - 1 ? '1px solid #111' : 'none' }}
                  className="hover:bg-[#0F0F0F] transition-colors">
                  <td className="px-3 py-2" style={{ color: '#A1A1AA' }}>
                    {new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-2" style={{ color: log.weightKg ? '#F1F1F1' : '#3A3A3A' }}>
                    {log.weightKg ? `${log.weightKg}` : '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#EAB308' }}>
                    {(log.bodyFatNavy ?? log.bodyFatSkinfold ?? log.bodyFatBioImp)
                      ? `${log.bodyFatNavy ?? log.bodyFatSkinfold ?? log.bodyFatBioImp}%` : '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#22C55E' }}>
                    {log.leanMassKg ? `${log.leanMassKg}` : '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#A855F7' }}>
                    {log.ffmi ? `${log.ffmi}` : '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#22C55E' }}>
                    {log.recoveryScore ? `${log.recoveryScore.toFixed(0)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: FOTOS
// ─────────────────────────────────────────────────────────────────────────────

function TabFotos({ client }: { client: any }) {
  const photos: any[] = client.photos ?? []

  const PERSPECTIVES = ['FRONT', 'BACK', 'LEFT', 'RIGHT'] as const
  const perspLabel: Record<string, string> = {
    FRONT: 'Frontal', BACK: 'Posterior', LEFT: 'Lateral Izq.', RIGHT: 'Lateral Der.',
  }

  // Group by date
  const byDate: Record<string, any[]> = {}
  photos.forEach(p => {
    const d = new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(p)
  })

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="text-3xl" style={{ color: '#27272A' }}>□</div>
        <p className="text-sm font-mono" style={{ color: '#52525B' }}>Sin fotos de progreso todavía</p>
        <p className="text-xs" style={{ color: '#3A3A3A' }}>
          Las fotos se suben con 4 perspectivas: frontal, posterior y laterales
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([date, dayPhotos]) => (
        <div key={date}>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#52525B' }}>
            {date}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PERSPECTIVES.map(persp => {
              const photo = dayPhotos.find(p => p.perspective === persp)
              return (
                <div key={persp} className="aspect-[3/4] rounded-lg overflow-hidden"
                  style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
                  {photo ? (
                    <img
                      src={photo.url}
                      alt={perspLabel[persp]}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <div className="text-lg" style={{ color: '#27272A' }}>□</div>
                      <div className="text-[8px] font-mono" style={{ color: '#3A3A3A' }}>{perspLabel[persp]}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-center mt-2 gap-3">
            {PERSPECTIVES.map(persp => (
              <span key={persp} className="text-[8px] font-mono" style={{ color: '#52525B' }}>
                {perspLabel[persp]}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CRM (datos completos del perfil)
// ─────────────────────────────────────────────────────────────────────────────

function TabCRM({ client }: { client: any }) {
  const profile = client?.user?.clientProfile
  const user    = client?.user

  function Row({ label, value, color }: { label: string; value?: string | null; color?: string }) {
    if (!value) return null
    return (
      <div className="flex items-start justify-between py-2.5 border-b"
        style={{ borderColor: '#111' }}>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#52525B' }}>{label}</span>
        <span className="text-xs font-mono text-right max-w-[60%]" style={{ color: color ?? '#D4D4D8' }}>{value}</span>
      </div>
    )
  }

  function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
    return (
      <div className="p-4 rounded-xl" style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}>
        <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color }}>
          {title}
        </div>
        {children}
      </div>
    )
  }

  const age = profile?.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const morphoLabel: Record<string, string> = {
    ECTOMORPH: 'Ectomorfo', ENDOMORPH: 'Endomorfo', MESOMORPH: 'Mesomorfo',
  }

  return (
    <div className="space-y-3">
      {/* Contact */}
      <Section title="Contacto" color="#3B82F6">
        <Row label="Email"       value={user?.email} />
        <Row label="Teléfono"    value={profile?.phone} />
        <Row label="Ocupación"   value={profile?.occupation} />
      </Section>

      {/* Physical */}
      <Section title="Datos físicos" color="#EAB308">
        <Row label="Edad"         value={age ? `${age} años` : null} />
        <Row label="Sexo"         value={profile?.sex === 'MALE' ? 'Masculino' : profile?.sex === 'FEMALE' ? 'Femenino' : null} />
        <Row label="Altura"       value={profile?.heightCm ? `${profile.heightCm} cm` : null} />
        <Row label="Peso inicial" value={profile?.weightKg ? `${profile.weightKg} kg` : null} />
        <Row label="Peso objetivo" value={profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : null} />
        <Row label="Morfología"   value={profile?.morphology ? morphoLabel[profile.morphology] ?? profile.morphology : null} />
        <Row label="Nivel actividad" value={profile?.activityLevel?.replace('_', ' ')} />
      </Section>

      {/* Goals */}
      <Section title="Objetivos y nivel" color="#22C55E">
        <Row label="Objetivo"     value={profile?.fitnessGoal?.replace(/_/g, ' ')} />
        <Row label="Nivel"        value={profile?.fitnessLevel} />
        <Row label="Hora entreno" value={profile?.trainingHour ? `${profile.trainingHour}h` : null} />
        <Row label="Equipo"       value={profile?.equipmentLimits} />
      </Section>

      {/* Strength 1RM */}
      {(profile?.maxBenchKg || profile?.maxSquatKg || profile?.maxDeadliftKg) && (
        <Section title="Fuerza máxima (1RM)" color="#A855F7">
          <Row label="Press banca"   value={profile?.maxBenchKg    ? `${profile.maxBenchKg} kg`    : null} />
          <Row label="Sentadilla"    value={profile?.maxSquatKg     ? `${profile.maxSquatKg} kg`     : null} />
          <Row label="Peso muerto"   value={profile?.maxDeadliftKg  ? `${profile.maxDeadliftKg} kg`  : null} />
          <Row label="Fuerza agarre" value={profile?.gripStrengthKg ? `${profile.gripStrengthKg} kg` : null} />
        </Section>
      )}

      {/* Health */}
      <Section title="Salud" color="#EF4444">
        {profile?.pathologies && (
          <div className="mb-3">
            <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#52525B' }}>Patologías</div>
            <p className="text-xs font-mono" style={{ color: '#FCA5A5' }}>{profile.pathologies}</p>
          </div>
        )}
        {profile?.medications && (
          <div className="mb-3">
            <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#52525B' }}>Medicación</div>
            <p className="text-xs font-mono" style={{ color: '#D4D4D8' }}>{profile.medications}</p>
          </div>
        )}
        {profile?.injuries && profile.injuries.length > 0 && (
          <div className="mb-3">
            <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#52525B' }}>Lesiones</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.injuries.map((inj: string) => (
                <span key={inj} className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(239,68,68,.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,.2)' }}>
                  {inj}
                </span>
              ))}
            </div>
          </div>
        )}
        <Row label="Tipo sanguíneo" value={profile?.bloodType} />
        <Row label="Notas médicas"  value={profile?.medicalNotes} />
      </Section>

      {/* Nutrition prefs */}
      {(profile?.dietaryRestrictions?.length || profile?.allergies?.length || profile?.foodDislikes) && (
        <Section title="Nutrición" color="#F59E0B">
          {profile?.dietaryRestrictions?.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#52525B' }}>Restricciones</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.dietaryRestrictions.map((r: string) => (
                  <span key={r} className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(245,158,11,.12)', color: '#FCD34D' }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile?.allergies?.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#52525B' }}>Alergias</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.allergies.map((a: string) => (
                  <span key={a} className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(239,68,68,.12)', color: '#FCA5A5' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Row label="No le gusta" value={profile?.foodDislikes} />
          <Row label="Preferencias" value={profile?.foodPreferences} />
          <Row label="Budget suplem." value={profile?.supplementBudget ? `${profile.supplementBudget}€` : null} />
        </Section>
      )}

      {/* Sleep & habits */}
      {(profile?.sleepHours || profile?.menstrualCycle !== undefined) && (
        <Section title="Hábitos" color="#06B6D4">
          <Row label="Horas sueño" value={profile?.sleepHours ? `${profile.sleepHours}h` : null} />
          {profile?.menstrualCycle !== undefined && (
            <Row label="Ciclo menstrual" value={profile.menstrualCycle ? 'Sí' : 'No'} />
          )}
        </Section>
      )}

      {/* Trainer notes */}
      {client.notes && (
        <Section title="Notas del entrenador" color="#71717A">
          <p className="text-xs font-mono" style={{ color: '#A1A1AA' }}>{client.notes}</p>
        </Section>
      )}
    </div>
  )
}

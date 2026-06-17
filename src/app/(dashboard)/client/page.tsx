// ─── GymBook NXT · Client Dashboard ─────────────────────────────────────────
// Voltaic Nocturne · Server-rendered SVG charts · Zero client-side JS for charts
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import Link        from 'next/link'
import {
  calcIMC, imcCategory,
  calcBodyFatNavy, calcBodyFatSkinfold,
  calcBodyComposition,
  calcBMR_Mifflin, calcTDEE,
  bodyFatCategory, ffmiCategory, recoveryCategory,
  ageFromBirthDate,
} from '@/lib/biometrics'

// ─── DATA ────────────────────────────────────────────────────────────────────
async function getClientData(userId: string) {
  const clientRecord = await prisma.client.findUnique({
    where: { userId },
    include: { trainer: { select: { name: true, email: true } } },
  })
  if (!clientRecord) return null

  const clientId = clientRecord.id

  const [profile, upcomingSessions, progressLogs, credits, trainingProgram] = await Promise.all([
    prisma.clientProfile.findUnique({ where: { userId } }),
    prisma.session.findMany({
      where: { clientId, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
      take: 4,
    }),
    prisma.progressLog.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: 12,
    }),
    prisma.userCredit.findFirst({
      where: { clientId, status: 'ACTIVE', remainingCredits: { gt: 0 } },
    }),
    prisma.trainingProgram.findFirst({
      where: { clientId, status: 'ACTIVE' },
    }),
  ])

  return { clientRecord, profile, upcomingSessions, progressLogs, credits, trainingProgram }
}

// ─── SVG HELPERS ─────────────────────────────────────────────────────────────
// Donut ring: returns strokeDasharray / strokeDashoffset for a circle
function ringArc(pct: number, r: number) {
  const c = 2 * Math.PI * r
  return { array: `${(pct / 100) * c} ${c}`, offset: `${c * 0.25}` }
}

// Polyline points from values
function sparklinePoints(vals: number[], w: number, h: number): string {
  if (vals.length < 2) return ''
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function BodyFatRing({ fatPct, sex }: { fatPct: number; sex: 'MALE' | 'FEMALE' }) {
  const cat     = bodyFatCategory(fatPct, sex)
  const leanPct = 100 - fatPct
  const R       = 52
  const fat     = ringArc(fatPct,  R)
  const lean    = ringArc(leanPct, R)

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* track */}
        <circle cx="70" cy="70" r={R} fill="none" stroke="#1A1A1A" strokeWidth="16" />
        {/* lean arc — blue */}
        <circle cx="70" cy="70" r={R} fill="none" stroke="#3B82F6" strokeWidth="16"
          strokeLinecap="butt" strokeOpacity="0.4"
          strokeDasharray={lean.array}
          strokeDashoffset={`-${(fatPct / 100) * 2 * Math.PI * R - Number(fat.offset)}`}
          transform="rotate(-90 70 70)" />
        {/* fat arc — category color */}
        <circle cx="70" cy="70" r={R} fill="none" stroke={cat.color} strokeWidth="16"
          strokeLinecap="butt"
          strokeDasharray={fat.array}
          strokeDashoffset={fat.offset}
          transform="rotate(-90 70 70)" />
        {/* center text */}
        <text x="70" y="64" textAnchor="middle" fontSize="22" fontWeight="700"
          fontFamily="monospace" fill="#F1F1F1">{fatPct.toFixed(1)}%</text>
        <text x="70" y="80" textAnchor="middle" fontSize="9" fill="#A1A1AA"
          fontFamily="monospace">GRASA CORP.</text>
        <text x="70" y="93" textAnchor="middle" fontSize="10" fontWeight="600"
          fill={cat.color} fontFamily="sans-serif">{cat.label.toUpperCase()}</text>
      </svg>

      {/* legend */}
      <div className="flex gap-4 text-[10px] font-mono">
        <span style={{ color: cat.color }}>■ Grasa {fatPct.toFixed(1)}%</span>
        <span style={{ color: '#3B82F6', opacity: 0.7 }}>■ Magra {(100 - fatPct).toFixed(1)}%</span>
      </div>
    </div>
  )
}

function FFMIBar({ ffmi, sex }: { ffmi: number; sex: 'MALE' | 'FEMALE' }) {
  const cat    = ffmiCategory(ffmi, sex)
  const min    = sex === 'MALE' ? 15 : 12
  const max    = sex === 'MALE' ? 27 : 24
  const pctPos = Math.min(100, Math.max(0, ((ffmi - min) / (max - min)) * 100))

  const zones = [
    { color: '#52525B', label: 'Bajo', w: 20 },
    { color: '#22C55E', label: 'Prom', w: 20 },
    { color: '#3B82F6', label: 'Sobre', w: 20 },
    { color: '#EAB308', label: 'Excel', w: 20 },
    { color: '#F59E0B', label: 'Élite', w: 10 },
    { color: '#EF4444', label: 'Sup', w: 10 },
  ]

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* value */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold" style={{ color: cat.color }}>{ffmi.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-text-muted">FFMI</span>
        <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded"
          style={{ background: cat.color + '22', color: cat.color }}>{cat.label}</span>
      </div>

      {/* zone bar */}
      <div className="relative">
        <div className="flex h-3 rounded overflow-hidden gap-px">
          {zones.map((z) => (
            <div key={z.label} style={{ width: `${z.w}%`, background: z.color, opacity: 0.7 }} />
          ))}
        </div>
        {/* pointer */}
        <div
          className="absolute -top-1 w-0.5 h-5 rounded-full"
          style={{ left: `${pctPos}%`, background: cat.color, boxShadow: `0 0 6px ${cat.color}` }}
        />
        <div
          className="absolute top-4 text-[9px] font-mono -translate-x-1/2"
          style={{ left: `${pctPos}%`, color: cat.color }}
        >{ffmi.toFixed(1)}</div>
      </div>

      {/* scale labels */}
      <div className="flex justify-between text-[9px] font-mono text-text-muted mt-1">
        <span>{min}</span><span>{(min+max)/2}</span><span>{max}</span>
      </div>
    </div>
  )
}

function WeightSparkline({ weights }: { weights: { date: Date; kg: number }[] }) {
  if (weights.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-text-muted">
        Sin registros de peso
      </div>
    )
  }

  const latest  = weights[0]
  const prev    = weights[1]
  const delta   = prev ? latest.kg - prev.kg : 0
  const allKg   = [...weights].reverse().map((w) => w.kg)
  const pts     = sparklinePoints(allKg, 160, 44)

  // gradient fill path
  const fillPath = pts.length > 0
    ? `M0,44 L${pts.split(' ').map(p => p).join(' L')} L160,44 Z`
    : ''

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold text-text">{latest.kg.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-text-muted">kg</span>
        {prev && (
          <span className={`ml-auto text-[11px] font-mono font-semibold ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-amber-400' : 'text-text-muted'}`}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
          </span>
        )}
      </div>
      <svg width="160" height="48" viewBox="0 0 160 48">
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {fillPath && <path d={fillPath} fill="url(#wGrad)" />}
        {pts && <polyline points={pts} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
        {/* last dot */}
        {pts && (() => {
          const last = pts.split(' ').pop()?.split(',')
          if (!last) return null
          return <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r="3" fill="#3B82F6" />
        })()}
      </svg>
      <div className="flex justify-between text-[9px] font-mono text-text-muted">
        <span>{allKg.length > 1 ? new Date(weights[weights.length-1].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}</span>
        <span>{new Date(latest.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}

function RecoveryArc({ score }: { score: number }) {
  const cat  = recoveryCategory(score)
  const R    = 40
  const circ = Math.PI * R  // semicircle
  const arc  = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="60" viewBox="0 0 100 60">
        {/* track (semicircle) */}
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="#1A1A1A" strokeWidth="10" strokeLinecap="round" />
        {/* arc */}
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={cat.color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`} />
        {/* score */}
        <text x="50" y="52" textAnchor="middle" fontSize="16" fontWeight="700"
          fontFamily="monospace" fill="#F1F1F1">{score.toFixed(0)}</text>
      </svg>
      <span className="text-[10px] font-mono" style={{ color: cat.color }}>{cat.label.toUpperCase()}</span>
    </div>
  )
}

function BodyCompBars({ logs }: { logs: { date: Date; leanKg: number; fatKg: number }[] }) {
  if (logs.length === 0) return (
    <div className="flex items-center justify-center h-20 text-xs text-text-muted">Sin datos de composición</div>
  )
  const maxKg = Math.max(...logs.map(l => l.leanKg + l.fatKg))

  return (
    <div className="flex items-end gap-2 h-24 mt-2">
      {[...logs].reverse().map((l, i) => {
        const totalH = 88
        const leanH  = (l.leanKg / maxKg) * totalH
        const fatH   = (l.fatKg  / maxKg) * totalH
        const isLast = i === logs.length - 1
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            {/* fat bar on top */}
            <div style={{ height: fatH, background: '#EAB308', opacity: isLast ? 1 : 0.5, width: '100%', borderRadius: '2px 2px 0 0' }} />
            {/* lean bar */}
            <div style={{ height: leanH, background: '#3B82F6', opacity: isLast ? 1 : 0.5, width: '100%' }} />
            <span className="text-[8px] font-mono text-text-muted mt-0.5 truncate w-full text-center">
              {new Date(l.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace(' ', ' ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const GOAL_LABEL: Record<string, string> = {
  LOSE_WEIGHT: 'Pérdida de peso', GAIN_MUSCLE: 'Ganancia muscular',
  IMPROVE_ENDURANCE: 'Resistencia', GENERAL_FITNESS: 'Fitness general',
  ATHLETIC_PERFORMANCE: 'Rendimiento', MAINTAIN: 'Mantener',
}
const DAY_ENUM  = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default async function ClientDashboardPage() {
  const session = await auth()
  const userId  = session?.user?.id ?? ''
  const nameRaw = session?.user?.name ?? 'Cliente'

  const data = await getClientData(userId).catch(() => null)
  const {
    clientRecord, profile, upcomingSessions = [],
    progressLogs = [], credits, trainingProgram,
  } = data ?? {}

  // ── Biometrics computation ────────────────────────────────────────────────
  const latest = progressLogs[0] as any | null
  const prev   = progressLogs[1] as any | null
  const sex    = (profile?.sex as 'MALE' | 'FEMALE') ?? 'MALE'
  const heightCm  = profile?.heightCm ?? 175
  const weightKg  = latest?.weightKg ?? null
  const dob       = profile?.dateOfBirth ? new Date(profile.dateOfBirth) : null
  const age       = dob ? ageFromBirthDate(dob) : 30

  // IMC
  const imc        = weightKg ? calcIMC(weightKg, heightCm) : null
  const imcCat     = imc ? imcCategory(imc) : null

  // Body fat
  let bodyFatPct: number | null = null
  if (latest) {
    // Prefer Navy if perimeters available
    const navy = calcBodyFatNavy(
      sex, heightCm,
      latest.neckCm ?? 0, latest.abdomenCm ?? latest.waistCm ?? 0,
      latest.hipCm ?? undefined
    )
    if (navy && navy > 0) {
      bodyFatPct = navy
    } else if (latest.bodyFatSkinfold) {
      bodyFatPct = latest.bodyFatSkinfold
    } else if (latest.bodyFatBioImp) {
      bodyFatPct = latest.bodyFatBioImp
    }
  }

  // Composition
  const comp = bodyFatPct && weightKg
    ? calcBodyComposition(weightKg, bodyFatPct, heightCm)
    : null

  const fatCat   = bodyFatPct ? bodyFatCategory(bodyFatPct, sex) : null
  const ffmiCat  = comp ? { ffmi: comp.ffmi } : null

  // Weight history for sparkline
  const weightHistory = (progressLogs as any[])
    .filter(p => p.weightKg)
    .map(p => ({ date: new Date(p.date), kg: p.weightKg as number }))

  // Composition history for bars
  const compHistory = (progressLogs as any[])
    .filter(p => p.weightKg && (p.bodyFatSkinfold || p.bodyFatBioImp))
    .map(p => {
      const fat = p.bodyFatSkinfold ?? p.bodyFatBioImp ?? 0
      const c   = calcBodyComposition(p.weightKg, fat, heightCm)
      return { date: new Date(p.date), leanKg: c.leanMassKg, fatKg: c.fatKg }
    })
    .slice(0, 8)
    .reverse()

  // Recovery score
  const recoveryScore = latest?.recoveryScore ?? null

  // BMR + TDEE
  const activityLevel = (profile?.activityLevel as any) ?? 'MODERATE'
  const bmr   = weightKg ? calcBMR_Mifflin(sex, weightKg, heightCm, age) : null
  const tdee  = bmr ? calcTDEE(bmr, activityLevel) : null

  // Perimeter deltas
  const perimeterFields: { key: string; label: string; unit: string }[] = [
    { key: 'neckCm',        label: 'Cuello',   unit: 'cm' },
    { key: 'armFlexedCm',   label: 'Brazo',    unit: 'cm' },
    { key: 'chestCm',       label: 'Pecho',    unit: 'cm' },
    { key: 'waistCm',       label: 'Cintura',  unit: 'cm' },
    { key: 'abdomenCm',     label: 'Abdomen',  unit: 'cm' },
    { key: 'hipCm',         label: 'Cadera',   unit: 'cm' },
    { key: 'thighRelaxedCm',label: 'Muslo',    unit: 'cm' },
  ]

  const creditBalance = credits?.remainingCredits ?? 0
  const firstName     = nameRaw.split(' ')[0]

  return (
    <div style={{ color: '#F1F1F1', fontFamily: 'Inter, system-ui, sans-serif' }}
      className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">dashboard · cliente</div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, <span style={{ color: '#3B82F6' }}>{firstName}</span>
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {profile?.fitnessGoal && (
          <div className="text-right">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Objetivo</div>
            <div className="text-sm font-semibold" style={{ color: '#EAB308' }}>
              {GOAL_LABEL[profile.fitnessGoal] ?? profile.fitnessGoal}
            </div>
          </div>
        )}
      </div>

      {/* ── HERO ROW: Big 3 cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Card 1: Body Fat Ring */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Composición</span>
            {fatCat && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: fatCat.color + '22', color: fatCat.color }}>
                {fatCat.description}
              </span>
            )}
          </div>
          {bodyFatPct ? (
            <div className="flex justify-center">
              <BodyFatRing fatPct={bodyFatPct} sex={sex} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1A1A1A" strokeWidth="14" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#27272A" strokeWidth="14"
                  strokeDasharray="60 179" strokeDashoffset="95" transform="rotate(-90 50 50)" />
                <text x="50" y="54" textAnchor="middle" fontSize="11" fill="#71717A" fontFamily="monospace">Sin datos</text>
              </svg>
              <p className="text-[10px] text-text-muted text-center">Registra medidas para ver tu composición</p>
            </div>
          )}
          {comp && (
            <div className="flex justify-between text-[10px] font-mono mt-2 pt-2"
              style={{ borderTop: '1px solid #1A1A1A' }}>
              <span style={{ color: '#3B82F6' }}>Magra <b>{comp.leanMassKg.toFixed(1)}kg</b></span>
              <span style={{ color: '#EAB308' }}>Grasa <b>{comp.fatKg.toFixed(1)}kg</b></span>
            </div>
          )}
        </div>

        {/* Card 2: FFMI Gauge */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Índice de Masa Magra</span>
          </div>
          {comp ? (
            <FFMIBar ffmi={comp.ffmi} sex={sex} />
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-text-muted">—</span>
                <span className="text-[10px] font-mono text-text-muted">FFMI</span>
              </div>
              <div className="h-3 rounded" style={{ background: '#1A1A1A' }} />
              <p className="text-[10px] text-text-muted">Requiere peso + % graso</p>
            </div>
          )}

          {/* BMR / TDEE mini strip */}
          {bmr && tdee && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3" style={{ borderTop: '1px solid #1A1A1A' }}>
              {[{ label: 'BMR', val: bmr, color: '#3B82F6' }, { label: 'TDEE', val: tdee, color: '#EAB308' }].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-[9px] font-mono text-text-muted uppercase">{m.label}</p>
                  <p className="text-base font-mono font-bold" style={{ color: m.color }}>{m.val.toLocaleString()}</p>
                  <p className="text-[8px] font-mono text-text-muted">kcal/día</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Weight Sparkline */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Evolución Peso</span>
            {weightHistory.length > 0 && (
              <span className="text-[9px] font-mono text-text-muted">{weightHistory.length} registros</span>
            )}
          </div>
          <WeightSparkline weights={weightHistory} />

          {/* IMC pill */}
          {imc && imcCat && (
            <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid #1A1A1A' }}>
              <span className="text-[9px] font-mono text-text-muted">IMC</span>
              <span className="text-sm font-mono font-bold" style={{ color: imcCat.color }}>{imc}</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: imcCat.color + '22', color: imcCat.color }}>{imcCat.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Lean Mass */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 10, padding: '14px 16px' }}>
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Masa Magra</p>
          <p className="text-xl font-mono font-bold" style={{ color: '#3B82F6' }}>
            {comp ? `${comp.leanMassKg.toFixed(1)} kg` : '—'}
          </p>
          {comp && prev?.weightKg && (() => {
            const prevComp = calcBodyComposition(prev.weightKg, bodyFatPct!, heightCm)
            const d = comp.leanMassKg - prevComp.leanMassKg
            return (
              <p className={`text-[10px] font-mono mt-0.5 ${d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {d >= 0 ? '+' : ''}{d.toFixed(1)} kg vs anterior
              </p>
            )
          })()}
        </div>

        {/* Fat Mass */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 10, padding: '14px 16px' }}>
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Masa Grasa</p>
          <p className="text-xl font-mono font-bold" style={{ color: '#EAB308' }}>
            {comp ? `${comp.fatKg.toFixed(1)} kg` : '—'}
          </p>
          {comp && prev?.weightKg && (() => {
            const prevComp = calcBodyComposition(prev.weightKg, bodyFatPct!, heightCm)
            const d = comp.fatKg - prevComp.fatKg
            return (
              <p className={`text-[10px] font-mono mt-0.5 ${d <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                {d >= 0 ? '+' : ''}{d.toFixed(1)} kg vs anterior
              </p>
            )
          })()}
        </div>

        {/* Credits */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 10, padding: '14px 16px' }}>
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Créditos</p>
          <p className="text-xl font-mono font-bold" style={{ color: creditBalance > 0 ? '#22C55E' : '#EF4444' }}>
            {creditBalance}
          </p>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            {creditBalance > 0 ? 'disponibles' : 'sin créditos'}
          </p>
        </div>

        {/* Recovery */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 10, padding: '14px 16px' }}
          className="flex flex-col items-center">
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1 self-start">Recuperación</p>
          {recoveryScore ? (
            <RecoveryArc score={recoveryScore} />
          ) : (
            <div className="flex items-center justify-center h-12 text-[10px] text-text-muted">Sin datos</div>
          )}
        </div>
      </div>

      {/* ── SECOND ROW: Evolution + Perimeters + Sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Body Comp Evolution bars */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px' }}
          className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Evolución Composición Corporal</span>
            <div className="flex gap-3 text-[9px] font-mono">
              <span style={{ color: '#3B82F6' }}>■ Magra</span>
              <span style={{ color: '#EAB308' }}>■ Grasa</span>
            </div>
          </div>
          <BodyCompBars logs={compHistory} />
        </div>

        {/* Perimeter deltas */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px' }}>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Perímetros</span>
          {latest ? (
            <div className="space-y-2 mt-3">
              {perimeterFields.map(({ key, label, unit }) => {
                const cur  = (latest as any)[key] as number | null
                const old  = progressLogs.length > 1 ? ((progressLogs[progressLogs.length - 1] as any)[key] as number | null) : null
                if (!cur) return null
                const delta = old && old !== cur ? cur - old : null
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-text font-medium">{cur}{unit}</span>
                      {delta !== null && (
                        <span className={`text-[9px] font-mono ${delta < 0 ? 'text-green-400' : 'text-amber-400'}`}>
                          {delta > 0 ? '▲' : '▼'}{Math.abs(delta).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              {perimeterFields.every(f => !(latest as any)[f.key]) && (
                <p className="text-[10px] text-text-muted text-center py-4">Sin medidas registradas</p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted text-center py-8">Sin registros</p>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: Sessions + Trainer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Upcoming sessions */}
        <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px' }}
          className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Próximas Sesiones</span>
            <Link href="/client/training"
              className="text-[10px] font-mono hover:text-primary transition-colors"
              style={{ color: '#3B82F6' }}>ver entrenamiento →</Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="text-2xl text-text-muted">◫</div>
              <p className="text-xs text-text-muted">Sin sesiones programadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(upcomingSessions as any[]).map((s) => {
                const date    = new Date(s.scheduledAt)
                const isToday = new Date().toDateString() === date.toDateString()
                const dayIdx  = date.getDay()
                return (
                  <div key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={isToday
                      ? { background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)' }
                      : { background: '#1A1A1A', border: '1px solid #27272A' }}>
                    {/* day badge */}
                    <div className="flex flex-col items-center justify-center w-9 h-9 rounded-md flex-shrink-0"
                      style={{ background: isToday ? 'rgba(59,130,246,.2)' : '#27272A' }}>
                      <span className="text-[8px] font-mono text-text-muted uppercase">{DAY_SHORT[dayIdx]}</span>
                      <span className="text-base font-mono font-bold" style={{ color: isToday ? '#3B82F6' : '#F1F1F1', lineHeight: 1 }}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-text">Sesión de entrenamiento</p>
                      <p className="text-[10px] font-mono text-text-muted">
                        {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h
                        {' · '}{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    {isToday && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: 'rgba(59,130,246,.2)', color: '#93C5FD' }}>HOY</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Trainer card + training program mini */}
        <div className="space-y-3">
          {clientRecord && (
            <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px' }}>
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Mi Trainer</span>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: 'rgba(234,179,8,.15)', color: '#FDE68A' }}>
                  {((clientRecord as any).trainer?.name ?? 'T')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{(clientRecord as any).trainer?.name ?? '—'}</p>
                  <p className="text-[10px] text-text-muted truncate">{(clientRecord as any).trainer?.email ?? ''}</p>
                </div>
              </div>
            </div>
          )}

          {trainingProgram && (
            <div style={{ background: '#121212', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Programa</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(34,197,94,.15)', color: '#86EFAC' }}>activo</span>
              </div>
              <p className="text-xs font-medium text-text mb-2">{(trainingProgram as any).name}</p>
              <div className="grid grid-cols-7 gap-0.5">
                {[0,1,2,3,4,5,6].map((d) => {
                  const today = new Date().getDay()
                  const isToday = d === today
                  return (
                    <div key={d} className="flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-mono text-text-muted">{DAY_SHORT[d]}</span>
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[8px]"
                        style={isToday
                          ? { background: 'rgba(59,130,246,.3)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.5)' }
                          : { background: '#1A1A1A', color: '#3F3F46' }}>
                        {isToday ? '◈' : '·'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

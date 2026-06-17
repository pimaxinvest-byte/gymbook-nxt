// ─── GymBook NXT · Client Nutrition Page ─────────────────────────────────────
// Server component — shows active nutrition plan with macro targets and weekly
// meal grid. Voltaic Nocturne design system.

import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Labels ──────────────────────────────────────────────────────────────────

const DAY_ORDER = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
] as const

const DAY_LABEL: Record<string, string> = {
  MONDAY:    'Lun',
  TUESDAY:   'Mar',
  WEDNESDAY: 'Mié',
  THURSDAY:  'Jue',
  FRIDAY:    'Vie',
  SATURDAY:  'Sáb',
  SUNDAY:    'Dom',
}

const MEAL_ORDER = [
  'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT',
] as const

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST:    'Desayuno',
  LUNCH:        'Comida',
  DINNER:       'Cena',
  SNACK:        'Snack',
  PRE_WORKOUT:  'Pre-E',
  POST_WORKOUT: 'Post-E',
}

// ─── Macro stat card ─────────────────────────────────────────────────────────

function MacroCard({
  label, value, unit, color,
}: {
  label: string
  value: number | null | undefined
  unit: string
  color: string
}) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}
    >
      <div
        className="text-[9px] font-mono uppercase tracking-widest mb-2"
        style={{ color: '#52525B' }}
      >
        {label}
      </div>
      <div className="text-xl font-mono font-bold" style={{ color }}>
        {value ?? '—'}
      </div>
      {value !== null && value !== undefined && (
        <div className="text-[9px] font-mono mt-0.5" style={{ color: '#52525B' }}>
          {unit}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientNutritionPage() {
  const session = await auth()

  const clientRecord = await prisma.client.findFirst({
    where: { userId: session!.user.id },
    select: { id: true },
  }).catch(() => null)

  const plan = clientRecord
    ? await prisma.nutritionPlan.findFirst({
        where:   { clientId: clientRecord.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: {
          weeklyPlans: {
            orderBy: { weekNumber: 'desc' },
            take: 1,
            include: {
              mealEntries: {
                include: { recipe: { select: { id: true, name: true } } },
              },
            },
          },
        },
      }).catch(() => null)
    : null

  // Last week of the plan (most recent)
  const latestWeek = plan?.weeklyPlans?.[0] ?? null

  // Build a lookup: { [dayOfWeek]: { [mealType]: name } }
  type Cell = string | null
  const grid: Record<string, Record<string, Cell>> = {}

  if (latestWeek) {
    for (const entry of latestWeek.mealEntries) {
      if (!grid[entry.dayOfWeek]) grid[entry.dayOfWeek] = {}
      grid[entry.dayOfWeek][entry.mealType] =
        entry.recipe?.name ?? entry.customMealName ?? null
    }
  }

  // Which meal rows are actually used (have at least one entry across all days)
  const usedMeals = MEAL_ORDER.filter(meal =>
    DAY_ORDER.some(day => grid[day]?.[meal])
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <div className="section-eyebrow">client·nutrition</div>
        <h1 className="text-2xl font-bold text-text">Mi Plan Nutricional</h1>
      </div>

      {!plan ? (
        /* ── Empty state ── */
        <div
          className="card-sm text-center py-16"
          style={{ border: '1px dashed rgba(59,130,246,.2)' }}
        >
          <div className="text-4xl mb-3 opacity-30">◎</div>
          <p className="text-text-muted text-sm">Tu trainer aún no ha creado un plan nutricional</p>
          <p className="text-text-muted text-xs mt-1">
            Se mostrará aquí cuando esté listo
          </p>
        </div>
      ) : (
        <>
          {/* ── Plan name + status ── */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A' }}
          >
            <div>
              <p className="text-sm font-semibold text-text">{plan.name}</p>
              {plan.description && (
                <p className="text-[11px] text-text-muted mt-0.5">{plan.description}</p>
              )}
            </div>
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded"
              style={{ background: 'rgba(34,197,94,.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,.2)' }}
            >
              activo
            </span>
          </div>

          {/* ── Macro targets ── */}
          <div>
            <div
              className="text-[9px] font-mono uppercase tracking-widest mb-3"
              style={{ color: '#52525B' }}
            >
              Objetivos diarios
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MacroCard label="Calorías" value={plan.caloriesTarget} unit="kcal/día" color="#EAB308" />
              <MacroCard label="Proteína" value={plan.proteinGTarget !== null && plan.proteinGTarget !== undefined ? Math.round(plan.proteinGTarget as number) : null} unit="g/día" color="#3B82F6" />
              <MacroCard label="Carbohidratos" value={plan.carbsGTarget !== null && plan.carbsGTarget !== undefined ? Math.round(plan.carbsGTarget as number) : null} unit="g/día" color="#22C55E" />
              <MacroCard label="Grasas" value={plan.fatGTarget !== null && plan.fatGTarget !== undefined ? Math.round(plan.fatGTarget as number) : null} unit="g/día" color="#F59E0B" />
            </div>
          </div>

          {/* ── Weekly meal grid ── */}
          {!latestWeek ? (
            <div
              className="card-sm text-center py-10"
              style={{ border: '1px dashed rgba(59,130,246,.15)' }}
            >
              <p className="text-text-muted text-sm">Sin semanas configuradas todavía</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-[9px] font-mono uppercase tracking-widest"
                  style={{ color: '#52525B' }}
                >
                  Semana {latestWeek.weekNumber}
                  {latestWeek.name ? ` — ${latestWeek.name}` : ''}
                </div>
              </div>

              {usedMeals.length === 0 ? (
                <div className="card-sm text-center py-8">
                  <p className="text-text-muted text-sm">Sin comidas asignadas en esta semana</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A1A1A' }}>
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-xs font-mono"
                      style={{ borderCollapse: 'collapse', minWidth: 560 }}
                    >
                      <thead>
                        <tr style={{ background: '#111', borderBottom: '1px solid #1A1A1A' }}>
                          {/* Meal type column */}
                          <th
                            className="text-left px-3 py-2 text-[9px] uppercase tracking-widest"
                            style={{ color: '#52525B', minWidth: 80 }}
                          >
                            Comida
                          </th>
                          {/* Day columns */}
                          {DAY_ORDER.map(day => (
                            <th
                              key={day}
                              className="text-center px-2 py-2 text-[9px] uppercase tracking-widest"
                              style={{ color: '#52525B', minWidth: 72 }}
                            >
                              {DAY_LABEL[day]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usedMeals.map((meal, mIdx) => (
                          <tr
                            key={meal}
                            style={{ borderBottom: mIdx < usedMeals.length - 1 ? '1px solid #111' : 'none' }}
                          >
                            {/* Meal label */}
                            <td
                              className="px-3 py-2 text-[10px] font-mono font-semibold"
                              style={{ color: '#71717A', background: '#0D0D0D' }}
                            >
                              {MEAL_LABEL[meal]}
                            </td>
                            {/* Day cells */}
                            {DAY_ORDER.map(day => {
                              const cell = grid[day]?.[meal] ?? null
                              return (
                                <td
                                  key={day}
                                  className="px-2 py-2 text-center text-[10px] hover:bg-[#0F0F0F] transition-colors"
                                  style={{ color: cell ? '#D4D4D8' : '#27272A' }}
                                >
                                  {cell ?? '—'}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Date range ── */}
          {(plan.startDate || plan.endDate) && (
            <p
              className="text-[10px] font-mono text-right"
              style={{ color: '#3A3A3A' }}
            >
              {plan.startDate
                ? `Inicio: ${new Date(plan.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
                : ''}
              {plan.startDate && plan.endDate ? ' · ' : ''}
              {plan.endDate
                ? `Fin: ${new Date(plan.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
                : ''}
            </p>
          )}
        </>
      )}
    </div>
  )
}

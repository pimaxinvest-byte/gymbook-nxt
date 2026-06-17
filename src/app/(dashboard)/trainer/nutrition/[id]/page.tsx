import { getNutritionPlanById } from '@/features/nutrition/actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GenerateWeeklyPlanBtn } from './GenerateWeeklyPlanBtn'

const DAY_NAMES = ['—', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MEAL_ORDER = { BREAKFAST: 0, SNACK: 1, LUNCH: 2, DINNER: 3 }
const MEAL_LABELS: Record<string, string> = { BREAKFAST: 'Desayuno', LUNCH: 'Almuerzo', DINNER: 'Cena', SNACK: 'Snack' }

export default async function NutritionPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plan = await getNutritionPlanById(id).catch(() => null)
  if (!plan) notFound()

  const weekly = plan.weeklyPlans && plan.weeklyPlans.length > 0 ? plan.weeklyPlans[0] : null
  const meals = weekly?.mealEntries ?? []
  const byDay: Record<number, any[]> = {}
  for (const m of meals) {
    const d = m.dayOfWeek as any
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(m)
  }
  // Sort meals within each day
  for (const day of Object.keys(byDay)) {
    byDay[+day].sort((a: any, b: any) => (MEAL_ORDER[a.mealType as keyof typeof MEAL_ORDER] ?? 9) - (MEAL_ORDER[b.mealType as keyof typeof MEAL_ORDER] ?? 9))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/trainer/nutrition" className="hover:text-text transition-colors cursor-pointer">Nutrición</Link>
        <span>/</span>
        <span className="text-text">{plan.name}</span>
      </div>

      {/* Header */}
      <div className="card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgb(18,18,18), rgba(234,179,8,.04))' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #EAB308, transparent)' }} />
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-text">{plan.name}</h1>
            <p className="text-text-muted text-sm mt-0.5">Cliente: <span className="text-text">{plan.client?.user?.name ?? '—'}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { label: 'Kcal', value: plan.caloriesTarget, color: '#3B82F6' },
                { label: 'Prot', value: `${plan.proteinGTarget}g`, color: '#22C55E' },
                { label: 'Carbs', value: `${plan.carbsGTarget}g`, color: '#EAB308' },
                { label: 'Grasa', value: `${plan.fatGTarget}g`, color: '#F59E0B' },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] font-mono text-text-muted">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly plan */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">
            Plan Semanal
            {weekly && (
              <span className="badge-accent text-[10px] ml-2">generado</span>
            )}
          </h2>
          <GenerateWeeklyPlanBtn planId={plan.id} hasExisting={!!weekly} />
        </div>

        {!weekly ? (
          <div
            className="flex flex-col items-center py-16 rounded-xl"
            style={{ background: 'rgb(18,18,18)', border: '1px dashed rgba(234,179,8,.3)' }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-2xl" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.2)' }}>◆</div>
            <p className="text-text font-semibold mb-1">Sin plan semanal</p>
            <p className="text-text-muted text-sm mb-4">Genera un plan completo con comidas y recetas automáticamente.</p>
            <GenerateWeeklyPlanBtn planId={plan.id} hasExisting={false} primary />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className="rounded-lg overflow-hidden"
                style={{ background: 'rgb(18,18,18)', border: '1px solid rgb(39,39,42)' }}
              >
                <div
                  className="px-2 py-1.5 text-center text-[10px] font-semibold font-mono uppercase"
                  style={{ background: 'rgb(26,26,26)', borderBottom: '1px solid rgb(39,39,42)', color: '#A1A1AA' }}
                >
                  {DAY_NAMES[day]}
                </div>
                <div className="p-1.5 space-y-1">
                  {(byDay[day] ?? []).map((meal: any) => (
                    <div
                      key={meal.id}
                      className="p-2 rounded text-center"
                      style={{ background: 'rgb(26,26,26)' }}
                    >
                      <p className="text-[9px] font-mono uppercase text-text-muted mb-0.5">
                        {MEAL_LABELS[meal.mealType] ?? meal.mealType}
                      </p>
                      <p className="text-[11px] text-text leading-tight">{meal.recipe?.name || meal.customMealName || 'Comida'}</p>
                      <p className="text-[9px] font-mono text-primary/70 mt-0.5">{meal.recipe?.calories ?? 0} kcal</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

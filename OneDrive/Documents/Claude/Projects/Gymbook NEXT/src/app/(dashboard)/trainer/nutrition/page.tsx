import { getMyNutritionPlans } from '@/features/nutrition/actions'
import Link from 'next/link'

export default async function NutritionPage() {
  const plans = await getMyNutritionPlans().catch(() => [])

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">trainer·panel</div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Planes Nutricionales</h1>
          <p className="text-text-muted text-sm mt-1">{plans.length} plan{plans.length !== 1 ? 'es' : ''} creado{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/trainer/nutrition/new" className="btn-primary cursor-pointer" style={{ boxShadow: '0 4px 14px rgba(59,130,246,.2)' }}>
          + Nuevo plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div
          className="flex flex-col items-center py-20 rounded-xl"
          style={{ background: 'rgb(18,18,18)', border: '1px dashed rgb(63,63,70)' }}
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-2xl" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.15)' }}>◆</div>
          <p className="text-text font-semibold mb-1">Sin planes nutricionales</p>
          <p className="text-text-muted text-sm mb-6">Crea el primer plan nutricional para un cliente.</p>
          <Link href="/trainer/nutrition/new" className="btn-primary cursor-pointer">+ Crear plan</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p: any) => (
            <Link
              key={p.id}
              href={`/trainer/nutrition/${p.id}`}
              className="card-hover group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{p.client?.user?.name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge-${p.isActive ? 'success' : 'muted'} text-[10px]`}>{p.isActive ? 'activo' : 'inactivo'}</span>
                  {p.weeklyPlan ? (
                    <span className="badge-accent text-[10px]">plan semanal ✓</span>
                  ) : (
                    <span className="badge-muted text-[10px]">sin plan semanal</span>
                  )}
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Kcal', value: p.targetCalories, color: '#3B82F6' },
                  { label: 'Prot', value: `${p.proteinG}g`, color: '#22C55E' },
                  { label: 'Carbs', value: `${p.carbsG}g`, color: '#EAB308' },
                  { label: 'Grasa', value: `${p.fatG}g`, color: '#F59E0B' },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] font-mono text-text-muted">{m.label}</p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

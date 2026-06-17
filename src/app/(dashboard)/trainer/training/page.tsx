import { getMyPrograms } from '@/features/training/actions'
import Link from 'next/link'

const DAY_LABEL: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
  THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom',
}

export default async function TrainingPage() {
  const programs = await getMyPrograms().catch(() => [])

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">trainer·panel</div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Programas de Entrenamiento</h1>
          <p className="text-text-muted text-sm mt-1">{programs.length} programa{programs.length !== 1 ? 's' : ''} creado{programs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/trainer/training/new" className="btn-primary cursor-pointer" style={{ boxShadow: '0 4px 14px rgba(59,130,246,.2)' }}>
          + Nuevo programa
        </Link>
      </div>

      {programs.length === 0 ? (
        <div
          className="flex flex-col items-center py-20 rounded-xl"
          style={{ background: 'rgb(18,18,18)', border: '1px dashed rgb(63,63,70)' }}
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-2xl" style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.15)' }}>◫</div>
          <p className="text-text font-semibold mb-1">Sin programas todavía</p>
          <p className="text-text-muted text-sm mb-6">Crea el primer programa de entrenamiento para un cliente.</p>
          <Link href="/trainer/training/new" className="btn-primary cursor-pointer">+ Crear programa</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p: any) => (
            <Link
              key={p.id}
              href={`/trainer/training/${p.id}`}
              className="card-hover group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{p.client?.user?.name ?? 'Sin cliente'}</p>
                </div>
                <span className={`badge-${p.status === 'ACTIVE' ? 'success' : 'muted'} text-[10px]`}>
                  {p.status === 'ACTIVE' ? 'activo' : p.status?.toLowerCase() ?? 'inactivo'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="font-mono">{p.durationWeeks}w</span>
                <span>·</span>
                <span>{p.workouts?.length ?? 0} sesiones</span>
                {p.workouts?.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{p.workouts.map((w: any) => DAY_LABEL[w.dayOfWeek] ?? w.dayOfWeek).join(', ')}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

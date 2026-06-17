'use client'

import { useState } from 'react'
import { generateWeeklyPlan } from '@/features/nutrition/actions'
import { useRouter } from 'next/navigation'

export function GenerateWeeklyPlanBtn({
  planId, hasExisting, primary = false,
}: {
  planId: string
  hasExisting: boolean
  primary?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    await generateWeeklyPlan(planId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={primary ? 'btn-primary cursor-pointer' : 'btn-accent btn-sm cursor-pointer'}
      style={primary ? { boxShadow: '0 4px 16px rgba(59,130,246,.2)' } : {}}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
          Generando…
        </span>
      ) : hasExisting ? 'Regenerar plan' : '⚡ Generar plan semanal'}
    </button>
  )
}

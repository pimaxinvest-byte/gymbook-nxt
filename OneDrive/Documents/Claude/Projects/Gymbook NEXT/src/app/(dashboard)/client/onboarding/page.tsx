'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveOnboarding } from '@/features/users/actions'

const GOALS = [
  { value: 'WEIGHT_LOSS', label: 'Perder peso', icon: '⚡' },
  { value: 'MUSCLE_GAIN', label: 'Ganar músculo', icon: '◆' },
  { value: 'ENDURANCE', label: 'Resistencia', icon: '◈' },
  { value: 'FLEXIBILITY', label: 'Flexibilidad', icon: '◉' },
  { value: 'GENERAL_FITNESS', label: 'Fitness general', icon: '◫' },
  { value: 'SPORT_SPECIFIC', label: 'Deporte específico', icon: '▲' },
]

const LEVELS = [
  { value: 'BEGINNER', label: 'Principiante', desc: 'Menos de 6 meses de experiencia' },
  { value: 'INTERMEDIATE', label: 'Intermedio', desc: '6 meses — 2 años de entrenamiento' },
  { value: 'ADVANCED', label: 'Avanzado', desc: 'Más de 2 años, técnica sólida' },
]

const DIETS = [
  { value: 'NONE', label: 'Sin restricciones' },
  { value: 'VEGETARIAN', label: 'Vegetariano' },
  { value: 'VEGAN', label: 'Vegano' },
  { value: 'GLUTEN_FREE', label: 'Sin gluten' },
  { value: 'LACTOSE_FREE', label: 'Sin lactosa' },
  { value: 'KETO', label: 'Keto' },
]

type StepData = {
  goal: string
  level: string
  weight: string
  height: string
  age: string
  diet: string
  injuries: string
}

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<StepData>({
    goal: '', level: '', weight: '', height: '', age: '', diet: 'NONE', injuries: '',
  })

  function set(key: keyof StepData, value: string) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function canNext() {
    if (step === 1) return !!data.goal
    if (step === 2) return !!data.level
    if (step === 3) return !!data.weight && !!data.height && !!data.age
    return true
  }

  async function finish() {
    setSaving(true)
    await saveOnboarding(data)
    router.push('/client')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-10">

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Configuración inicial
          </span>
          <span className="text-[10px] font-mono text-primary">{step} / {TOTAL_STEPS}</span>
        </div>
        <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: 'linear-gradient(90deg, #3B82F6, #EAB308)',
            }}
          />
        </div>
      </div>

      <div
        className="w-full max-w-lg"
        style={{
          background: 'rgb(18,18,18)',
          border: '1px solid rgb(39,39,42)',
          borderRadius: '1rem',
          boxShadow: '0 8px 48px rgba(0,0,0,.5)',
          overflow: 'hidden',
        }}
      >
        {/* Arc */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #3B82F6 40%, #EAB308 60%, transparent)' }} />

        <div className="p-8">

          {/* ── STEP 1: Goal ─────────────────── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text mb-1">¿Cuál es tu objetivo?</h2>
              <p className="text-sm text-text-muted mb-6">Esto nos ayuda a personalizar tu plan de entrenamiento.</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => set('goal', g.value)}
                    className="flex items-center gap-3 p-4 rounded-lg text-left transition-all duration-150 cursor-pointer"
                    style={
                      data.goal === g.value
                        ? { background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.4)', color: '#93C5FD' }
                        : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)', color: 'rgb(161,161,170)' }
                    }
                  >
                    <span className="text-lg">{g.icon}</span>
                    <span className="text-sm font-medium">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Level ────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text mb-1">¿Cuál es tu nivel?</h2>
              <p className="text-sm text-text-muted mb-6">Sé honesto — esto ayuda a calibrar la intensidad correcta.</p>
              <div className="space-y-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => set('level', l.value)}
                    className="w-full flex items-center justify-between p-4 rounded-lg text-left transition-all duration-150 cursor-pointer"
                    style={
                      data.level === l.value
                        ? { background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.4)' }
                        : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)' }
                    }
                  >
                    <div>
                      <p className={`text-sm font-medium ${data.level === l.value ? 'text-primary' : 'text-text'}`}>{l.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{l.desc}</p>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
                      style={
                        data.level === l.value
                          ? { borderColor: '#3B82F6', background: '#3B82F6' }
                          : { borderColor: 'rgb(63,63,70)' }
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Medidas ──────────────── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text mb-1">Tus datos físicos</h2>
              <p className="text-sm text-text-muted mb-6">Los usamos para personalizar tu nutrición y seguimiento.</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { key: 'weight' as const, label: 'Peso', placeholder: '75', unit: 'kg' },
                  { key: 'height' as const, label: 'Altura', placeholder: '175', unit: 'cm' },
                  { key: 'age' as const, label: 'Edad', placeholder: '28', unit: 'años' },
                ].map(({ key, label, placeholder, unit }) => (
                  <div key={key} className="input-group">
                    <label className="input-label">{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={data[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="input pr-8"
                        min="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-mono">
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="input-group">
                <label className="input-label">Lesiones o limitaciones</label>
                <textarea
                  value={data.injuries}
                  onChange={(e) => set('injuries', e.target.value)}
                  placeholder="Rodilla derecha, lumbar... (opcional)"
                  rows={2}
                  className="input resize-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 4: Diet ─────────────────── */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text mb-1">Preferencias alimentarias</h2>
              <p className="text-sm text-text-muted mb-6">Para que tu plan nutricional sea 100% compatible.</p>
              <div className="grid grid-cols-2 gap-3">
                {DIETS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => set('diet', d.value)}
                    className="p-3 rounded-lg text-sm font-medium text-left transition-all duration-150 cursor-pointer"
                    style={
                      data.diet === d.value
                        ? { background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.4)', color: '#93C5FD' }
                        : { background: 'rgb(26,26,26)', border: '1px solid rgb(39,39,42)', color: 'rgb(161,161,170)' }
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex-1 cursor-pointer"
              >
                Atrás
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep(s => s + 1)}
                className="btn-primary flex-1 cursor-pointer disabled:opacity-40"
                style={{ boxShadow: canNext() ? '0 4px 16px rgba(59,130,246,.2)' : 'none' }}
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={finish}
                className="btn-primary flex-1 cursor-pointer"
                style={{ boxShadow: '0 4px 16px rgba(59,130,246,.25)' }}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Guardando…
                  </span>
                ) : '¡Empezar! →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

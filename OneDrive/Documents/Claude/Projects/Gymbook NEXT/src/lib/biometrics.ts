// ─── GymBook NXT · Biometrics Engine ────────────────────────────────────────
// Todas las fórmulas extraídas del Excel "Plantilla autocontrol 6.2 VIP"
// + metabolismo basal (Harris-Benedict & Mifflin-St Jeor) + TDEE

export type Sex           = 'MALE' | 'FEMALE'
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'
export type FitnessGoal   = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'IMPROVE_ENDURANCE' | 'GENERAL_FITNESS' | 'ATHLETIC_PERFORMANCE' | 'MAINTAIN'

// ─── IMC ────────────────────────────────────────────────────────────────────
// Fórmula Excel: =PESO/((ALTURA*ALTURA)*0.0001)  (altura en cm)
export function calcIMC(weightKg: number, heightCm: number): number {
  return +( weightKg / ((heightCm * heightCm) * 0.0001) ).toFixed(1)
}
export function imcCategory(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: 'Bajo peso',    color: '#3B82F6' }
  if (imc < 25)   return { label: 'Normal',        color: '#22C55E' }
  if (imc < 30)   return { label: 'Sobrepeso',     color: '#EAB308' }
  if (imc < 35)   return { label: 'Obesidad I',    color: '#F59E0B' }
  if (imc < 40)   return { label: 'Obesidad II',   color: '#EF4444' }
  return              { label: 'Obesidad III',  color: '#DC2626' }
}

// ─── % GRASO — Fórmula Navy (perimetros) ────────────────────────────────────
// Hombre: 495/(1.0324 - 0.19077*log10(abdomen-cuello) + 0.15456*log10(altura)) - 450
// Mujer:  495/(1.29579 - 0.35004*log10(abdomen+cadera-cuello) + 0.221*log10(altura)) - 450
export function calcBodyFatNavy(
  sex: Sex,
  heightCm: number,
  neckCm: number,
  abdomenCm: number,
  hipCm?: number,
): number | null {
  if (!neckCm || !abdomenCm || abdomenCm <= neckCm) return null
  if (sex === 'MALE') {
    const density = 1.0324 - 0.19077 * Math.log10(abdomenCm - neckCm) + 0.15456 * Math.log10(heightCm)
    return +Math.max(0, (495 / density) - 450).toFixed(1)
  } else {
    if (!hipCm) return null
    const density = 1.29579 - 0.35004 * Math.log10(abdomenCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)
    return +Math.max(0, (495 / density) - 450).toFixed(1)
  }
}

// ─── % GRASO — Estimación por pliegues (Jackson-Pollock simplificado del Excel)
// Suma 5 pliegues: tricipital + subescapular + abdominal + supraespinal + muslo frontal
// Hombre: suma / (1.5 + log10(suma*2))
// Mujer:  suma / (1.2 + log10(suma))
export function calcBodyFatSkinfold(
  sex: Sex,
  folds: { tricep?: number; subscapular?: number; abdominal?: number; suprailiac?: number; thigh?: number }
): { sumFolds: number; bodyFatPct: number } | null {
  const vals = [folds.tricep, folds.subscapular, folds.abdominal, folds.suprailiac, folds.thigh]
  if (vals.some(v => v === undefined || v === null)) return null
  const sum = vals.reduce((a, b) => a! + b!, 0)!
  if (sum <= 0) return null
  const pct = sex === 'MALE'
    ? sum / (1.5 + Math.log10(sum * 2))
    : sum / (1.2 + Math.log10(sum))
  return { sumFolds: +sum.toFixed(1), bodyFatPct: +Math.max(2, pct).toFixed(1) }
}

// ─── COMPOSICIÓN CORPORAL ────────────────────────────────────────────────────
export function calcBodyComposition(weightKg: number, bodyFatPct: number, heightCm: number) {
  const fatKg      = +(weightKg * bodyFatPct / 100).toFixed(2)
  const leanMassKg = +(weightKg - fatKg).toFixed(2)
  const h          = heightCm / 100
  // FFMI = Lean Mass (kg) / altura² (m²)
  const ffmi       = +(leanMassKg / (h * h)).toFixed(1)
  return { fatKg, leanMassKg, ffmi }
}

// ─── CSA BRAZO — Área de sección transversal (Cross-Sectional Area) ──────────
// Estima la sección muscular del brazo (cm²)
// Hombre: ((brazo_relajado - π * tricipital/10)² / 4π) - 19
// Mujer:  ((brazo_relajado - π * tricipital/10)² / 4π) - 15.5
export function calcCSAArm(sex: Sex, armRelaxedCm: number, tricepMm: number): number {
  const tricepCm = tricepMm / 10
  const correction = sex === 'MALE' ? 19 : 15.5
  return +( ((armRelaxedCm - Math.PI * tricepCm) ** 2 / (4 * Math.PI)) - correction ).toFixed(1)
}

// ─── CSA MUSLO ───────────────────────────────────────────────────────────────
// (4.68 * muslo_relajado) - (2.09 * pliegue_muslo) - 80.99
export function calcCSAThigh(thighRelaxedCm: number, thighFoldMm: number): number {
  return +( 4.68 * thighRelaxedCm - 2.09 * thighFoldMm - 80.99 ).toFixed(1)
}

// ─── ÍNDICE DE MASA MAGRA (lean mass index) ──────────────────────────────────
// = masa_magra / (altura² / 100) * 100  → equivale a FFMI sin ajuste de grasa
export function calcLeanMassIndex(leanMassKg: number, heightCm: number): number {
  return +( leanMassKg / ((heightCm * heightCm) / 100) * 100 ).toFixed(1)
}

// ─── BMR — METABOLISMO BASAL ─────────────────────────────────────────────────

// Harris-Benedict (revisado Roza & Shizgal, 1984)
// Hombre: 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad)
// Mujer:  447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad)
export function calcBMR_HarrisBenedict(
  sex: Sex, weightKg: number, heightCm: number, age: number
): number {
  return sex === 'MALE'
    ? +( 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age ).toFixed(0)
    : +( 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age ).toFixed(0)
}

// Mifflin-St Jeor (1990) — más preciso en poblaciones modernas
// Hombre: (10 * peso) + (6.25 * altura) - (5 * edad) + 5
// Mujer:  (10 * peso) + (6.25 * altura) - (5 * edad) - 161
export function calcBMR_Mifflin(
  sex: Sex, weightKg: number, heightCm: number, age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return +( sex === 'MALE' ? base + 5 : base - 161 ).toFixed(0)
}

// ─── TDEE — Gasto calórico total (BMR × factor actividad) ────────────────────
export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string }> = {
  SEDENTARY:   { factor: 1.2,   label: 'Sedentario (sin ejercicio)' },
  LIGHT:       { factor: 1.375, label: 'Ligero (1-3 días/semana)' },
  MODERATE:    { factor: 1.55,  label: 'Moderado (3-5 días/semana)' },
  ACTIVE:      { factor: 1.725, label: 'Activo (6-7 días/semana)' },
  VERY_ACTIVE: { factor: 1.9,   label: 'Muy activo (doble sesión)' },
}
export function calcTDEE(bmr: number, level: ActivityLevel): number {
  return +( bmr * ACTIVITY_FACTORS[level].factor ).toFixed(0)
}

// ─── MACROS SUGERIDOS ────────────────────────────────────────────────────────
export function calcMacroTargets(
  tdee: number, goal: FitnessGoal
): { calories: number; proteinG: number; carbsG: number; fatG: number } {
  let cals = tdee
  let p = 0.30, c = 0.40, f = 0.30

  switch (goal) {
    case 'LOSE_WEIGHT':          cals = tdee - 400; p = 0.35; c = 0.35; f = 0.30; break
    case 'GAIN_MUSCLE':          cals = tdee + 300; p = 0.30; c = 0.45; f = 0.25; break
    case 'IMPROVE_ENDURANCE':    cals = tdee + 100; p = 0.20; c = 0.55; f = 0.25; break
    case 'ATHLETIC_PERFORMANCE': cals = tdee + 200; p = 0.25; c = 0.50; f = 0.25; break
    case 'MAINTAIN':             break
    case 'GENERAL_FITNESS':      break
  }

  return {
    calories:  +cals.toFixed(0),
    proteinG:  +((cals * p) / 4).toFixed(0),
    carbsG:    +((cals * c) / 4).toFixed(0),
    fatG:      +((cals * f) / 9).toFixed(0),
  }
}

// ─── RECOVERY SCORE (cuestionario fatiga, fórmula del Excel) ─────────────────
// Puntuación: (11-fatiga) + recuperación + (11-agujetas) + 30 si mejora + 15 si duerme >8h
//             + calidad sueño + energía + (libido/2)
export function calcRecoveryScore(a: {
  fatigueLevel:   number   // 1-10
  recoveryLevel:  number   // 1-10
  sorenessLevel:  number   // 1-10
  isImproving:    boolean
  sleepOver8h:    boolean
  sleepQuality:   number   // 1-10
  energyLevel:    number   // 1-10
  libido:         number   // 1-10
}): number {
  const raw = (11 - a.fatigueLevel)
    + a.recoveryLevel
    + (11 - a.sorenessLevel)
    + (a.isImproving ? 30 : 0)
    + (a.sleepOver8h ? 15 : 0)
    + a.sleepQuality
    + a.energyLevel
    + (a.libido / 2)
  // Normalizar a 0-100 (max teórico ≈ 100)
  return +Math.min(100, Math.max(0, raw)).toFixed(1)
}

// ─── CATEGORÍAS VISUALES ─────────────────────────────────────────────────────

export function bodyFatCategory(pct: number, sex: Sex): { label: string; color: string; description: string } {
  if (sex === 'MALE') {
    if (pct < 6)  return { label: 'Esencial',  color: '#93C5FD', description: 'Mínimo vital' }
    if (pct < 13) return { label: 'Atlético',  color: '#22C55E', description: 'Deportista competición' }
    if (pct < 18) return { label: 'Fitness',   color: '#3B82F6', description: 'Buena condición' }
    if (pct < 25) return { label: 'Promedio',  color: '#EAB308', description: 'Rango normal' }
    return             { label: 'Alto',        color: '#EF4444', description: 'Riesgo metabólico' }
  } else {
    if (pct < 14) return { label: 'Esencial',  color: '#93C5FD', description: 'Mínimo vital' }
    if (pct < 21) return { label: 'Atlético',  color: '#22C55E', description: 'Deportista competición' }
    if (pct < 25) return { label: 'Fitness',   color: '#3B82F6', description: 'Buena condición' }
    if (pct < 32) return { label: 'Promedio',  color: '#EAB308', description: 'Rango normal' }
    return             { label: 'Alto',        color: '#EF4444', description: 'Riesgo metabólico' }
  }
}

export function ffmiCategory(ffmi: number, sex: Sex): { label: string; color: string; pct: number } {
  if (sex === 'MALE') {
    if (ffmi < 17) return { label: 'Bajo promedio',  color: '#52525B', pct: 15 }
    if (ffmi < 19) return { label: 'Promedio',       color: '#22C55E', pct: 33 }
    if (ffmi < 21) return { label: 'Por encima',     color: '#3B82F6', pct: 50 }
    if (ffmi < 23) return { label: 'Excelente',      color: '#EAB308', pct: 67 }
    if (ffmi < 25) return { label: 'Élite natural',  color: '#F59E0B', pct: 84 }
    return             { label: 'Superior',          color: '#EF4444', pct: 100 }
  } else {
    if (ffmi < 14) return { label: 'Bajo promedio',  color: '#52525B', pct: 15 }
    if (ffmi < 16) return { label: 'Promedio',       color: '#22C55E', pct: 33 }
    if (ffmi < 18) return { label: 'Por encima',     color: '#3B82F6', pct: 50 }
    if (ffmi < 20) return { label: 'Excelente',      color: '#EAB308', pct: 67 }
    if (ffmi < 22) return { label: 'Élite natural',  color: '#F59E0B', pct: 84 }
    return             { label: 'Superior',          color: '#EF4444', pct: 100 }
  }
}

export function recoveryCategory(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Óptimo',  color: '#22C55E' }
  if (score >= 60) return { label: 'Bueno',   color: '#3B82F6' }
  if (score >= 40) return { label: 'Regular', color: '#EAB308' }
  return               { label: 'Bajo',    color: '#EF4444' }
}

// ─── UTIL ────────────────────────────────────────────────────────────────────
export function ageFromBirthDate(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

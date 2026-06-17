'use server'
// ─── GymBook NXT · Progress Actions ─────────────────────────────────────────
// saveProgressLog, getProgressHistory, getLatestMetrics

import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  calcBodyFatNavy, calcBodyFatSkinfold, calcBodyComposition,
  calcCSAArm, calcCSAThigh, calcRecoveryScore,
  ageFromBirthDate, type Sex,
} from '@/lib/biometrics'

// ─── Save / upsert a progress log ─────────────────────────────────────────────
export async function saveProgressLog(clientId: string, data: {
  date: Date
  weightKg?: number
  wednesdayWeightKg?: number
  neckCm?: number
  armRelaxedCm?: number
  armFlexedCm?: number
  chestCm?: number
  waistCm?: number
  abdomenCm?: number
  hipCm?: number
  thighRelaxedCm?: number
  thighFlexedCm?: number
  calfCm?: number
  tricepFoldMm?: number
  subscapularFoldMm?: number
  abdominalFoldMm?: number
  suprailiacFoldMm?: number
  thighFoldMm?: number
  bodyFatBioImp?: number
  bloodPressure?: string
  restingHR?: number
  fatigueLevel?: number
  recoveryLevel?: number
  sorenessScore?: number
  isImproving?: boolean
  sleepHours?: number
  sleepQuality?: number
  energyLevel?: number
  libido?: number
  moodScore?: number
  stressLevel?: number
  hrv?: number
  dietFollowUp?: number
  trainingFollowUp?: number
  notes?: string
  structuralNotes?: string
  injuriesNotes?: string
  nextGoal?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  // Verify permission: trainer OR the client themselves
  const isTrainer = session.user.role === 'TRAINER'
  if (!isTrainer) {
    const clientRecord = await prisma.client.findUnique({ where: { userId: session.user.id } })
    if (!clientRecord || clientRecord.id !== clientId) throw new Error('Sin permiso')
  }

  // Fetch client profile for auto-calculations
  const clientRecord = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: { include: { clientProfile: true } } },
  })
  const profile = clientRecord?.user?.clientProfile
  const sex = (profile?.sex as Sex | null) ?? 'MALE'
  const heightCm = profile?.heightCm ?? 170

  // ── Auto-compute biometric fields ────────────────────────────────────────
  const computed: Record<string, number | null> = {}

  // Navy body fat
  if (data.neckCm && data.abdomenCm) {
    computed.bodyFatNavy = calcBodyFatNavy(sex, heightCm, data.neckCm, data.abdomenCm, data.hipCm)
  }

  // Skinfold body fat
  if (data.tricepFoldMm && data.subscapularFoldMm && data.abdominalFoldMm && data.suprailiacFoldMm && data.thighFoldMm) {
    const skinfold = calcBodyFatSkinfold(sex, {
      tricep: data.tricepFoldMm,
      subscapular: data.subscapularFoldMm,
      abdominal: data.abdominalFoldMm,
      suprailiac: data.suprailiacFoldMm,
      thigh: data.thighFoldMm,
    })
    if (skinfold) {
      computed.bodyFatSkinfold = skinfold.bodyFatPct
    }
  }

  // Best available body fat for composition
  const fatPct = computed.bodyFatNavy ?? computed.bodyFatSkinfold ?? data.bodyFatBioImp ?? null
  if (fatPct && data.weightKg) {
    const comp = calcBodyComposition(data.weightKg, fatPct, heightCm)
    computed.fatKg = comp.fatKg
    computed.leanMassKg = comp.leanMassKg
    computed.ffmi = comp.ffmi
  }

  // CSA Arm
  if (data.armRelaxedCm && data.tricepFoldMm) {
    computed.csaArm = calcCSAArm(sex, data.armRelaxedCm, data.tricepFoldMm)
  }

  // CSA Thigh
  if (data.thighRelaxedCm && data.thighFoldMm) {
    computed.csaThigh = calcCSAThigh(data.thighRelaxedCm, data.thighFoldMm)
  }

  // Recovery score
  if (
    data.fatigueLevel && data.recoveryLevel && data.sorenessScore != null &&
    data.sleepHours != null && data.sleepQuality && data.energyLevel && data.libido
  ) {
    computed.recoveryScore = calcRecoveryScore({
      fatigueLevel:  data.fatigueLevel,
      recoveryLevel: data.recoveryLevel,
      sorenessLevel: data.sorenessScore,
      isImproving:   data.isImproving ?? false,
      sleepOver8h:   (data.sleepHours ?? 0) >= 8,
      sleepQuality:  data.sleepQuality,
      energyLevel:   data.energyLevel,
      libido:        data.libido,
    })
  }

  // Upsert (unique on clientId + date)
  const logDate = new Date(data.date); logDate.setHours(0,0,0,0)

  const log = await prisma.progressLog.upsert({
    where: { clientId_date: { clientId, date: logDate } },
    update: {
      ...data,
      date: logDate,
      ...computed,
    },
    create: {
      clientId,
      ...data,
      date: logDate,
      ...computed,
    },
  })

  revalidatePath(`/trainer/clients/${clientId}`)
  revalidatePath('/client')
  return { success: true, logId: log.id }
}

// ─── Get progress history ──────────────────────────────────────────────────────
export async function getProgressHistory(clientId: string, limit = 12) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  return prisma.progressLog.findMany({
    where: { clientId },
    orderBy: { date: 'desc' },
    take: limit,
    select: {
      id: true,
      date: true,
      weightKg: true,
      wednesdayWeightKg: true,
      bodyFatNavy: true,
      bodyFatSkinfold: true,
      bodyFatBioImp: true,
      bodyFatPct: true,
      fatKg: true,
      leanMassKg: true,
      ffmi: true,
      csaArm: true,
      csaThigh: true,
      neckCm: true,
      armRelaxedCm: true,
      armFlexedCm: true,
      chestCm: true,
      waistCm: true,
      abdomenCm: true,
      hipCm: true,
      thighRelaxedCm: true,
      thighFlexedCm: true,
      calfCm: true,
      recoveryScore: true,
      moodScore: true,
      energyLevel: true,
      fatigueLevel: true,
      sleepHours: true,
      sleepQuality: true,
      sorenessScore: true,
      stressLevel: true,
      libido: true,
      dietFollowUp: true,
      trainingFollowUp: true,
      notes: true,
    },
  })
}

// ─── Get latest metrics (for dashboard cards) ─────────────────────────────────
export async function getLatestMetrics(clientId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const log = await prisma.progressLog.findFirst({
    where: { clientId },
    orderBy: { date: 'desc' },
  })
  if (!log) return null

  const prev = await prisma.progressLog.findFirst({
    where: { clientId, date: { lt: log.date } },
    orderBy: { date: 'desc' },
  })

  const bestFat = log.bodyFatNavy ?? log.bodyFatSkinfold ?? log.bodyFatBioImp ?? null
  const prevFat = prev
    ? (prev.bodyFatNavy ?? prev.bodyFatSkinfold ?? prev.bodyFatBioImp ?? null)
    : null

  return {
    current: {
      date:     log.date,
      weightKg: log.weightKg,
      bodyFatPct: bestFat,
      leanMassKg: log.leanMassKg,
      ffmi:       log.ffmi,
      csaArm:     log.csaArm,
      recoveryScore: log.recoveryScore,
    },
    delta: prev && log.weightKg && prev.weightKg ? {
      weightKg:   +(log.weightKg - prev.weightKg).toFixed(1),
      bodyFatPct: bestFat && prevFat ? +(bestFat - prevFat).toFixed(1) : null,
      leanMassKg: log.leanMassKg && prev.leanMassKg
        ? +(log.leanMassKg - prev.leanMassKg).toFixed(2)
        : null,
    } : null,
  }
}

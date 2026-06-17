'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Onboarding ───────────────────────────────
export async function saveOnboarding(data: {
  goal: string
  level: string
  weight: string
  height: string
  age: string
  diet: string
  injuries: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  await prisma.clientProfile.update({
    where: { userId: session.user.id },
    data: {
      goal: data.goal as any,
      fitnessLevel: data.level as any,
      dietaryPreference: data.diet as any,
      injuriesNotes: data.injuries || null,
      initialWeight: data.weight ? parseFloat(data.weight) : null,
      currentWeight: data.weight ? parseFloat(data.weight) : null,
      height: data.height ? parseFloat(data.height) : null,
      onboardingCompleted: true,
    },
  })

  // Create initial ProgressLog if weight provided
  if (data.weight) {
    await prisma.progressLog.create({
      data: {
        userId: session.user.id,
        weight: parseFloat(data.weight),
        bodyFat: null,
        muscleMass: null,
        notes: 'Medición inicial — onboarding',
      },
    })
  }

  revalidatePath('/client')
}

// ─── Trainer: Get clients ─────────────────────
export async function getMyClients() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.clientProfile.findMany({
    where: { trainerId: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      UserCredit: { select: { balance: true } },
    },
    orderBy: { user: { createdAt: 'desc' } },
  })
}

// ─── Trainer: Get single client ───────────────
export async function getClientById(clientId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.clientProfile.findFirst({
    where: { userId: clientId, trainerId: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      UserCredit: { include: { creditPackage: true } },
      trainingPrograms: { orderBy: { createdAt: 'desc' }, take: 3 },
      nutritionPlans: { orderBy: { createdAt: 'desc' }, take: 1 },
      progressLogs: { orderBy: { loggedAt: 'desc' }, take: 5 },
    },
  })
}

// ─── Assign credits ───────────────────────────
export async function assignCredits(clientId: string, packageId: string, balance: number) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const existing = await prisma.userCredit.findFirst({ where: { userId: clientId } })

  if (existing) {
    await prisma.userCredit.update({
      where: { id: existing.id },
      data: {
        creditPackageId: packageId,
        balance: existing.balance + balance,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })
  } else {
    await prisma.userCredit.create({
      data: {
        userId: clientId,
        creditPackageId: packageId,
        balance,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })
  }

  revalidatePath('/trainer/clients')
  revalidatePath(`/trainer/clients/${clientId}`)
}

// ─── Deduct credit (after session) ────────────
export async function deductCredit(clientId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const credit = await prisma.userCredit.findFirst({ where: { userId: clientId } })
  if (!credit || credit.balance <= 0) throw new Error('Sin créditos disponibles')

  await prisma.userCredit.update({
    where: { id: credit.id },
    data: { balance: credit.balance - 1 },
  })

  revalidatePath(`/trainer/clients/${clientId}`)
}

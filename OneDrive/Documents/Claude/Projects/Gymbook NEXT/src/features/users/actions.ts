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
      fitnessGoal: data.goal as any,
      fitnessLevel: data.level as any,
      dietaryRestrictions: data.diet ? [data.diet] : [],
      medicalNotes: data.injuries || null,
      weightKg: data.weight ? parseFloat(data.weight) : null,
      heightCm: data.height ? parseFloat(data.height) : null,
      onboardingCompleted: true,
    },
  })

  // Create initial ProgressLog if weight provided
  if (data.weight) {
    // Find client record
    const clientRecord = await prisma.client.findUnique({
      where: { userId: session.user.id },
    })
    if (clientRecord) {
      await prisma.progressLog.create({
        data: {
          clientId: clientRecord.id,
          date: new Date(),
          weightKg: parseFloat(data.weight),
          notes: 'Medición inicial — onboarding',
        },
      })
    }
  }

  revalidatePath('/client')
}

// ─── Trainer: Get clients ─────────────────────
export async function getMyClients() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  // Clients are linked via Client junction table
  return prisma.client.findMany({
    where: { trainerId: session.user.id, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          clientProfile: { select: { fitnessGoal: true, fitnessLevel: true } },
        },
      },
      userCredits: {
        where: { status: 'ACTIVE' },
        select: { remainingCredits: true },
        take: 1,
      },
    },
    orderBy: { joinedAt: 'desc' },
  })
}

// ─── Trainer: Get single client ───────────────
export async function getClientById(clientId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.client.findFirst({
    where: { id: clientId, trainerId: session.user.id },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, createdAt: true,
          clientProfile: true,
        },
      },
      userCredits: { include: { package: true }, where: { status: 'ACTIVE' } },
      trainingPrograms: { orderBy: { createdAt: 'desc' }, take: 5 },
      nutritionPlans:   { orderBy: { createdAt: 'desc' }, take: 2 },
      progressLogs:     { orderBy: { date: 'desc' }, take: 5 },
      photos:           { orderBy: { date: 'desc' }, take: 32 },
    },
  })
}

// ─── Assign credits ───────────────────────────
export async function assignCredits(clientId: string, packageId: string, totalCredits: number) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  // clientId here is Client.id
  await prisma.userCredit.create({
    data: {
      clientId,
      packageId,
      totalCredits,
      usedCredits: 0,
      remainingCredits: totalCredits,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  })

  revalidatePath('/trainer/clients')
  revalidatePath(`/trainer/clients/${clientId}`)
}

// ─── Deduct credit (after session) ────────────
export async function deductCredit(clientId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const credit = await prisma.userCredit.findFirst({
    where: { clientId, status: 'ACTIVE', remainingCredits: { gt: 0 } },
  })
  if (!credit) throw new Error('Sin créditos disponibles')

  await prisma.userCredit.update({
    where: { id: credit.id },
    data: {
      usedCredits: credit.usedCredits + 1,
      remainingCredits: credit.remainingCredits - 1,
      status: credit.remainingCredits - 1 <= 0 ? 'USED' : 'ACTIVE',
      updatedAt: new Date(),
    },
  })

  revalidatePath(`/trainer/clients/${clientId}`)
}

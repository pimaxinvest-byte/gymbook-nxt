'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Set weekly availability ──────────────────
export async function setAvailability(slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  // Delete current slots and replace
  await prisma.availability.deleteMany({ where: { trainerId: session.user.id } })
  if (slots.length > 0) {
    await prisma.availability.createMany({
      data: slots.map((s) => ({
        trainerId: session.user.id as string,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isRecurring: true,
        updatedAt: new Date(),
      })),
    })
  }

  revalidatePath('/trainer/calendar')
}

// ─── Get trainer availability ──────────────────
export async function getMyAvailability() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.availability.findMany({
    where: { trainerId: session.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
}

// ─── Get trainer availability for client ──────
export async function getTrainerAvailability(trainerId: string) {
  return prisma.availability.findMany({
    where: { trainerId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
}

// ─── Get upcoming sessions ─────────────────────
export async function getUpcomingSessions() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  if (session.user.role === 'TRAINER') {
    return prisma.session.findMany({
      where: { trainerId: session.user.id, scheduledAt: { gte: new Date() } },
      include: {
        trainer: { select: { name: true } },
        client: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    })
  } else {
    // CLIENT: find their Client record first
    const clientRecord = await prisma.client.findUnique({
      where: { userId: session.user.id },
    })
    if (!clientRecord) return []

    return prisma.session.findMany({
      where: { clientId: clientRecord.id, scheduledAt: { gte: new Date() } },
      include: {
        trainer: { select: { name: true } },
        client: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    })
  }
}

// ─── Book session ─────────────────────────────
export async function bookSession(data: {
  clientId: string   // Client.id
  trainerId: string  // User.id
  scheduledAt: Date
  type?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const credit = await prisma.userCredit.findFirst({
    where: { clientId: data.clientId, status: 'ACTIVE', remainingCredits: { gt: 0 } },
  })
  if (!credit) throw new Error('Sin créditos disponibles')

  const [newSession] = await prisma.$transaction([
    prisma.session.create({
      data: {
        trainerId: data.trainerId,
        clientId: data.clientId,
        scheduledAt: data.scheduledAt,
        type: data.type ?? 'PERSONAL',
        status: 'SCHEDULED',
        notes: data.notes,
        creditUsed: true,
        updatedAt: new Date(),
      },
    }),
    prisma.userCredit.update({
      where: { id: credit.id },
      data: {
        usedCredits: credit.usedCredits + 1,
        remainingCredits: credit.remainingCredits - 1,
        status: credit.remainingCredits - 1 <= 0 ? 'USED' : 'ACTIVE',
        updatedAt: new Date(),
      },
    }),
  ])

  revalidatePath('/trainer/calendar')
  revalidatePath('/client')
  return newSession
}

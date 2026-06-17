'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Set weekly availability ──────────────────
// slots: [{dayOfWeek: 1, startTime: "09:00", endTime: "13:00"}, ...]
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

// ─── Get upcoming sessions (booked slots) ─────
export async function getUpcomingSessions() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const where =
    session.user.role === 'TRAINER'
      ? { trainerId: session.user.id }
      : { clientId: session.user.id }

  return prisma.session.findMany({
    where: { ...where, scheduledAt: { gte: new Date() } },
    include: {
      trainer: { select: { name: true } },
      client: { include: { user: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
  })
}

// ─── Book session ─────────────────────────────
export async function bookSession(data: {
  clientId: string
  trainerId: string
  scheduledAt: Date
  type: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  // Deduct credit
  const credit = await prisma.userCredit.findFirst({ where: { userId: data.clientId } })
  if (!credit || credit.balance <= 0) throw new Error('Sin créditos disponibles')

  const [newSession] = await prisma.$transaction([
    prisma.session.create({
      data: {
        trainerId: data.trainerId,
        clientId: data.clientId,
        scheduledAt: data.scheduledAt,
        type: data.type as any,
        status: 'SCHEDULED',
        notes: data.notes,
      },
    }),
    prisma.userCredit.update({
      where: { id: credit.id },
      data: { balance: credit.balance - 1 },
    }),
  ])

  revalidatePath('/trainer/calendar')
  revalidatePath('/client')
  return newSession
}

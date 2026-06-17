'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Create program ────────────────────────────
export async function createTrainingProgram(data: {
  clientId: string
  name: string
  description?: string
  durationWeeks: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const program = await prisma.trainingProgram.create({
    data: {
      trainerId: session.user.id,
      clientId: data.clientId,
      name: data.name,
      description: data.description ?? '',
      durationWeeks: data.durationWeeks,
      isActive: true,
    },
  })

  revalidatePath('/trainer/training')
  revalidatePath(`/trainer/clients/${data.clientId}`)
  return program
}

// ─── Get trainer programs ──────────────────────
export async function getMyPrograms(clientId?: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.trainingProgram.findMany({
    where: {
      trainerId: session.user.id,
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: { include: { user: { select: { name: true } } } },
      workouts: { include: { _count: { select: { exercises: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Get single program ────────────────────────
export async function getProgramById(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  return prisma.trainingProgram.findUnique({
    where: { id },
    include: {
      client: { include: { user: { select: { name: true, id: true } } } },
      workouts: {
        include: {
          exercises: { orderBy: { order: 'asc' } },
        },
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  })
}

// ─── Add workout to program ────────────────────
export async function addWorkout(data: {
  programId: string
  name: string
  dayOfWeek: number
  type: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const workout = await prisma.workout.create({
    data: {
      programId: data.programId,
      name: data.name,
      dayOfWeek: data.dayOfWeek,
      type: data.type as any,
    },
  })

  revalidatePath(`/trainer/training/${data.programId}`)
  return workout
}

// ─── Add exercise to workout ───────────────────
export async function addExercise(data: {
  workoutId: string
  name: string
  sets: number
  reps: string
  weight?: number
  notes?: string
  order: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const exercise = await prisma.exercise.create({
    data: {
      workoutId: data.workoutId,
      name: data.name,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      notes: data.notes,
      order: data.order,
    },
  })

  return exercise
}

// ─── Log session (client) ─────────────────────
export async function logExercise(data: {
  exerciseId: string
  workoutId: string
  setsCompleted: number
  repsCompleted: string
  weightUsed?: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  return prisma.exerciseLog.create({
    data: {
      userId: session.user.id,
      exerciseId: data.exerciseId,
      workoutId: data.workoutId,
      setsCompleted: data.setsCompleted,
      repsCompleted: data.repsCompleted,
      weightUsed: data.weightUsed,
      notes: data.notes,
    },
  })
}

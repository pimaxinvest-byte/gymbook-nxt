'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Create program ────────────────────────────
export async function createTrainingProgram(data: {
  clientId: string   // Client.id (junction table id)
  name: string
  description?: string
  durationWeeks: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const program = await prisma.trainingProgram.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      description: data.description ?? '',
      durationWeeks: data.durationWeeks,
      status: 'ACTIVE',
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

  // TrainingProgram belongs to Client which belongs to trainer
  return prisma.trainingProgram.findMany({
    where: {
      client: { trainerId: session.user.id },
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
          exercises: {
            include: { exercise: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })
}

// ─── Add workout to program ────────────────────
// DayOfWeek enum: MONDAY | TUESDAY | WEDNESDAY | THURSDAY | FRIDAY | SATURDAY | SUNDAY
export async function addWorkout(data: {
  programId: string
  name: string
  dayOfWeek?: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const workout = await prisma.workout.create({
    data: {
      programId: data.programId,
      name: data.name,
      dayOfWeek: data.dayOfWeek ?? null,
      notes: data.notes,
    },
  })

  revalidatePath(`/trainer/training/${data.programId}`)
  return workout
}

// ─── Add exercise to workout (via WorkoutExercise junction) ──
export async function addExercise(data: {
  workoutId: string
  name: string           // will upsert Exercise by name
  muscleGroups?: string[]
  sets: number
  reps: string
  weightKg?: number
  notes?: string
  orderIndex?: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  // Find or create the Exercise catalog entry
  let exercise = await prisma.exercise.findFirst({ where: { name: data.name } })
  if (!exercise) {
    exercise = await prisma.exercise.create({
      data: {
        name: data.name,
        muscleGroups: data.muscleGroups ?? [],
        equipment: [],
      },
    })
  }

  // Create the WorkoutExercise link
  const workoutExercise = await prisma.workoutExercise.create({
    data: {
      workoutId: data.workoutId,
      exerciseId: exercise.id,
      sets: data.sets,
      reps: data.reps,
      weightKg: data.weightKg,
      notes: data.notes,
      orderIndex: data.orderIndex ?? 0,
    },
  })

  return workoutExercise
}

// ─── Log a set during a workout session (client) ─────────────
export async function logExercise(data: {
  workoutId: string
  workoutExerciseId: string
  setNumber: number
  repsCompleted?: number
  weightKgUsed?: number
  rpe?: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  // Find or create WorkoutSession for today
  let workoutSession = await prisma.workoutSession.findFirst({
    where: {
      workoutId: data.workoutId,
      completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  })

  if (!workoutSession) {
    workoutSession = await prisma.workoutSession.create({
      data: { workoutId: data.workoutId },
    })
  }

  return prisma.exerciseLog.create({
    data: {
      sessionId: workoutSession.id,
      workoutExerciseId: data.workoutExerciseId,
      setNumber: data.setNumber,
      repsCompleted: data.repsCompleted,
      weightKgUsed: data.weightKgUsed,
      rpe: data.rpe,
      notes: data.notes,
    },
  })
}

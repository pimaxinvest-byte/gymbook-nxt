'use server'
// ─── GymBook NXT · Calendar Actions ─────────────────────────────────────────
// Reglas:
// - Todos los trainers ven todos los eventos
// - Solo trainers pueden abrir/cerrar franjas
// - No solapamiento de slots entre trainers para el mismo horario
// - Cliente necesita créditos para reservar; trainer puede ir a negativo
// - Los festivos se marcan pero no bloquean automáticamente

import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addDays, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function requireTrainer() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') {
    throw new Error('Acción solo disponible para trainers')
  }
  return session.user.id
}

// ─── QUERIES PÚBLICAS (todos los roles) ──────────────────────────────────────

/** Semana completa: slots de TODOS los trainers + sesiones reservadas */
export async function getWeekCalendar(weekStart: Date) {
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = addDays(start, 6)
  end.setHours(23, 59, 59, 999)

  const [slots, sessions, holidays, trainers] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        trainer: { select: { id: true, name: true, trainerProfile: { select: { calendarColor: true } } } },
        bookings: {
          include: {
            client: { include: { user: { select: { name: true } } } },
            activityType: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startHour: 'asc' }],
    }),
    prisma.session.findMany({
      where: { scheduledAt: { gte: start, lte: end } },
      include: {
        trainer: { select: { id: true, name: true, trainerProfile: { select: { calendarColor: true } } } },
        client: { include: { user: { select: { name: true } } } },
        activityType: true,
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.publicHoliday.findMany({
      where: {
        date: { gte: start, lte: end },
        scope: { in: ['NATIONAL', 'ANDALUCIA', 'TORREMOLINOS'] },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'TRAINER', isActive: true },
      select: { id: true, name: true, trainerProfile: { select: { calendarColor: true } } },
    }),
  ])

  return { slots, sessions, holidays, trainers }
}

/** Obtener disponibilidad abierta para un trainer específico (para reserva de cliente) */
export async function getOpenSlots(trainerId: string, weekStart: Date) {
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = addDays(start, 6)

  return prisma.availabilitySlot.findMany({
    where: {
      trainerId,
      date: { gte: start, lte: end },
      isOpen: true,
      bookings: { none: {} }, // sin reservas aún
    },
    orderBy: [{ date: 'asc' }, { startHour: 'asc' }],
  })
}

// ─── TRAINER: GESTIÓN DE FRANJAS ─────────────────────────────────────────────

/** Abrir una o varias franjas horarias */
export async function openSlots(
  dates: { date: Date; startHour: number }[]
) {
  const trainerId = await requireTrainer()

  // Verificar que no existan slots de OTRO trainer en las mismas fechas/horas
  const conflicts = await prisma.availabilitySlot.findMany({
    where: {
      trainerId: { not: trainerId },
      OR: dates.map(({ date, startHour }) => {
        const d = new Date(date); d.setHours(0,0,0,0)
        return { date: d, startHour }
      }),
    },
  })

  if (conflicts.length > 0) {
    const conflictInfo = conflicts.map(c =>
      `${new Date(c.date).toLocaleDateString('es-ES')} ${c.startHour}:00h`
    ).join(', ')
    throw new Error(`Conflicto con otro trainer en: ${conflictInfo}`)
  }

  // Upsert todos los slots
  const results = await Promise.all(
    dates.map(({ date, startHour }) => {
      const d = new Date(date); d.setHours(0,0,0,0)
      return prisma.availabilitySlot.upsert({
        where: { trainerId_date_startHour: { trainerId, date: d, startHour } },
        update: { isOpen: true },
        create: { trainerId, date: d, startHour, isOpen: true },
      })
    })
  )

  revalidatePath('/trainer/calendar')
  return { success: true, created: results.length }
}

/** Cerrar (bloquear) una franja */
export async function closeSlot(slotId: string) {
  const trainerId = await requireTrainer()

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } })
  if (!slot || slot.trainerId !== trainerId) throw new Error('Franja no encontrada o sin permiso')

  // Si tiene reserva activa, no se puede cerrar
  const activeBooking = await prisma.session.findFirst({
    where: { slotId, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
  })
  if (activeBooking) throw new Error('No se puede cerrar: hay una reserva activa')

  await prisma.availabilitySlot.update({
    where: { id: slotId },
    data: { isOpen: false },
  })

  revalidatePath('/trainer/calendar')
  return { success: true }
}

/** Clonar la semana actual N semanas hacia adelante (máx 12) */
export async function cloneWeek(sourceWeekStart: Date, weeksAhead: number) {
  const trainerId = await requireTrainer()
  if (weeksAhead < 1 || weeksAhead > 12) throw new Error('Máximo 12 semanas')

  const start = new Date(sourceWeekStart); start.setHours(0,0,0,0)
  const end = addDays(start, 6)

  // Obtener slots de la semana origen
  const sourceSlots = await prisma.availabilitySlot.findMany({
    where: { trainerId, date: { gte: start, lte: end }, isOpen: true },
  })

  if (sourceSlots.length === 0) throw new Error('No hay franjas abiertas en la semana seleccionada')

  let created = 0
  const cloneWeekNumber = Math.floor((start.getTime() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))

  for (let w = 1; w <= weeksAhead; w++) {
    for (const slot of sourceSlots) {
      const newDate = addWeeks(new Date(slot.date), w)
      newDate.setHours(0,0,0,0)

      // Verificar conflictos
      const conflict = await prisma.availabilitySlot.findFirst({
        where: {
          trainerId: { not: trainerId },
          date: newDate,
          startHour: slot.startHour,
        },
      })
      if (conflict) continue // saltar esta franja conflictiva

      await prisma.availabilitySlot.upsert({
        where: { trainerId_date_startHour: { trainerId, date: newDate, startHour: slot.startHour } },
        update: { isOpen: true, clonedFromWeek: cloneWeekNumber },
        create: { trainerId, date: newDate, startHour: slot.startHour, isOpen: true, clonedFromWeek: cloneWeekNumber },
      })
      created++
    }
  }

  revalidatePath('/trainer/calendar')
  return { success: true, created, weeks: weeksAhead }
}

// ─── RESERVAS ─────────────────────────────────────────────────────────────────

/** Reservar una sesión (trainer o cliente) */
export async function bookSession(input: {
  slotId?:         string
  trainerId:       string
  clientId:        string
  scheduledAt:     Date
  activityTypeId?: string
  notes?:          string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const isTrainer = session.user.role === 'TRAINER'

  // Obtener tipo de actividad
  const activityType = input.activityTypeId
    ? await prisma.activityType.findUnique({ where: { id: input.activityTypeId } })
    : await prisma.activityType.findUnique({ where: { code: 'PT' } })

  const creditType = activityType?.creditType ?? 'PT'
  const creditCost = activityType?.creditCost ?? 1

  // Verificar créditos del cliente (solo si no es trainer)
  if (!isTrainer) {
    const credit = await prisma.userCredit.findFirst({
      where: {
        clientId: input.clientId,
        creditType,
        status: 'ACTIVE',
        remainingCredits: { gte: creditCost },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    if (!credit) throw new Error(`Sin créditos ${creditType} suficientes`)
  }

  // Verificar que el slot está abierto
  if (input.slotId) {
    const slot = await prisma.availabilitySlot.findUnique({ where: { id: input.slotId } })
    if (!slot || !slot.isOpen) throw new Error('La franja horaria no está disponible')

    // Verificar que no haya otra sesión en el mismo slot
    const existingBooking = await prisma.session.findFirst({
      where: { slotId: input.slotId, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
    })
    // Para PT (max 2): verificar count
    const maxParticipants = activityType?.maxParticipants ?? 1
    const bookingsCount = await prisma.session.count({
      where: { slotId: input.slotId, status: { not: 'CANCELLED' } },
    })
    if (bookingsCount >= maxParticipants) throw new Error('Franja completa')
  }

  // Crear la sesión
  const newSession = await prisma.session.create({
    data: {
      trainerId:      input.trainerId,
      clientId:       input.clientId,
      slotId:         input.slotId,
      activityTypeId: activityType?.id,
      scheduledAt:    input.scheduledAt,
      type:           activityType?.code ?? 'PT',
      creditType,
      status:         'SCHEDULED',
      notes:          input.notes,
    },
  })

  // Descontar crédito (siempre, trainers también — pero pueden ir negativo)
  const creditRecord = await prisma.userCredit.findFirst({
    where: {
      clientId: input.clientId,
      creditType,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { expiresAt: 'asc' }, // usar el más próximo a vencer primero
  })

  if (creditRecord) {
    await prisma.userCredit.update({
      where: { id: creditRecord.id },
      data: {
        usedCredits:      { increment: creditCost },
        remainingCredits: { decrement: creditCost },
        status:           creditRecord.remainingCredits - creditCost <= 0 ? 'USED' : 'ACTIVE',
      },
    })
    await prisma.creditUsageLog.create({
      data: { userCreditId: creditRecord.id, sessionId: newSession.id, notes: `Reserva ${activityType?.code ?? 'PT'}` },
    })
  } else if (isTrainer) {
    // Trainer reservando: crear un registro de crédito negativo para tracking
    // (se puede manejar como deuda, no bloqueante)
    // TODO: implementar sistema de deuda de créditos
  }

  revalidatePath('/trainer/calendar')
  revalidatePath('/client')
  return { success: true, sessionId: newSession.id }
}

/** Mover una sesión a otra fecha/hora (solo trainers) */
export async function moveSession(sessionId: string, newScheduledAt: Date, newSlotId?: string) {
  const trainerId = await requireTrainer()

  const existingSession = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!existingSession) throw new Error('Sesión no encontrada')

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      scheduledAt: newScheduledAt,
      slotId:      newSlotId ?? existingSession.slotId,
    },
  })

  revalidatePath('/trainer/calendar')
  return { success: true }
}

/** Cancelar una sesión */
export async function cancelSession(sessionId: string, reason?: string) {
  const authSession = await auth()
  if (!authSession?.user?.id) throw new Error('No autenticado')

  const sess = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { activityType: true },
  })
  if (!sess) throw new Error('Sesión no encontrada')

  // Devolver crédito si no fue completada
  if (sess.creditType) {
    const creditRecord = await prisma.userCredit.findFirst({
      where: { clientId: sess.clientId, creditType: sess.creditType, status: { in: ['ACTIVE', 'USED'] } },
      orderBy: { purchasedAt: 'desc' },
    })
    if (creditRecord) {
      await prisma.userCredit.update({
        where: { id: creditRecord.id },
        data: {
          usedCredits:      { decrement: 1 },
          remainingCredits: { increment: 1 },
          status: 'ACTIVE',
        },
      })
    }
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'CANCELLED', notes: reason ? `Cancelado: ${reason}` : sess.notes },
  })

  revalidatePath('/trainer/calendar')
  revalidatePath('/client')
  return { success: true }
}

/** Completar una sesión */
export async function completeSession(sessionId: string) {
  await requireTrainer()
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', creditUsed: true },
  })
  revalidatePath('/trainer/calendar')
  return { success: true }
}

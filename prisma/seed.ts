import { PrismaClient, Role, FitnessGoal, FitnessLevel, Gender, CreditPackageType, ProgramStatus, DayOfWeek, MealType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Festivos España / Andalucía / Torremolinos ───────────────────────────────
// Regla: festivo en domingo → se traslada al lunes
function nextMonday(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + 1)
  return r
}
function observed(d: Date): { date: Date; observed: boolean } {
  return d.getDay() === 0 ? { date: nextMonday(d), observed: true } : { date: d, observed: false }
}

function buildHolidays(year: number) {
  const h = [
    // NACIONALES
    { d: new Date(`${year}-01-01`), name: 'Año Nuevo',                 scope: 'NATIONAL' },
    { d: new Date(`${year}-01-06`), name: 'Epifanía del Señor',        scope: 'NATIONAL' },
    { d: new Date(`${year}-05-01`), name: 'Fiesta del Trabajo',        scope: 'NATIONAL' },
    { d: new Date(`${year}-10-12`), name: 'Fiesta Nacional de España', scope: 'NATIONAL' },
    { d: new Date(`${year}-11-01`), name: 'Todos los Santos',          scope: 'NATIONAL' },
    { d: new Date(`${year}-12-06`), name: 'Día de la Constitución',    scope: 'NATIONAL' },
    { d: new Date(`${year}-12-08`), name: 'Inmaculada Concepción',     scope: 'NATIONAL' },
    { d: new Date(`${year}-12-25`), name: 'Navidad',                   scope: 'NATIONAL' },
    // Semana Santa (aproximado — varía por año; se deben ajustar manualmente)
    // ANDALUCÍA
    { d: new Date(`${year}-02-28`), name: 'Día de Andalucía',          scope: 'ANDALUCIA' },
    // TORREMOLINOS (locales)
    { d: new Date(`${year}-07-16`), name: 'Virgen del Carmen',         scope: 'TORREMOLINOS' },
    { d: new Date(`${year}-09-29`), name: 'San Miguel Arcángel',       scope: 'TORREMOLINOS' },
  ]

  return h.map(({ d, name, scope }) => {
    const { date, observed: obs } = observed(d)
    return { date, name, scope, year, observed: obs }
  })
}

async function main() {
  console.log('🌱 Seeding GymBook NXT v2...')

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'gymbook-demo' },
    update: {},
    create: {
      name: 'GymBook Demo',
      slug: 'gymbook-demo',
      primaryColor: '#3B82F6',
      accentColor: '#EAB308',
    },
  })

  // ── Activity Types (PT + SGT defaults) ────────────────────────────────────
  await prisma.activityType.upsert({
    where: { code: 'PT' },
    update: {},
    create: {
      name: 'Entrenamiento Personal',
      code: 'PT',
      maxParticipants: 2,
      creditCost: 1,
      creditType: 'PT',
      color: '#3B82F6',
      isActive: true,
    },
  })
  await prisma.activityType.upsert({
    where: { code: 'SGT' },
    update: {},
    create: {
      name: 'SGT Pequeño Grupo',
      code: 'SGT',
      maxParticipants: 5,
      creditCost: 1,
      creditType: 'SGT',
      color: '#EAB308',
      isActive: true,
    },
  })
  console.log('   ✅ ActivityTypes: PT + SGT')

  // ── Public Holidays 2025 + 2026 ───────────────────────────────────────────
  for (const year of [2025, 2026]) {
    const holidays = buildHolidays(year)
    for (const h of holidays) {
      await prisma.publicHoliday.upsert({
        where: { date_scope: { date: h.date, scope: h.scope } },
        update: { name: h.name, year: h.year, observed: h.observed },
        create: h,
      })
    }
  }
  console.log('   ✅ Festivos 2025-2026 (Nacional + Andalucía + Torremolinos)')

  // ── Trainer (Initial Owner) ───────────────────────────────────────────────
  const trainerPassword = await hash('trainer123', 12)
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@gymbook.dev' },
    update: {},
    create: {
      email: 'trainer@gymbook.dev',
      name: 'Carlos Trainer',
      passwordHash: trainerPassword,
      role: Role.TRAINER,
      isInitialOwner: true,
      organizationId: org.id,
      trainerProfile: {
        create: {
          bio: 'Entrenador personal certificado con 8 años de experiencia.',
          specialties: ['strength', 'hypertrophy', 'nutrition', 'fat-loss'],
          certifications: ['NSCA-CPT', 'Precision Nutrition L1'],
          yearsExp: 8,
          calendarColor: '#3B82F6',
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '08:00', endTime: '20:00', isActive: true },
              { dayOfWeek: 2, startTime: '08:00', endTime: '20:00', isActive: true },
              { dayOfWeek: 3, startTime: '08:00', endTime: '20:00', isActive: true },
              { dayOfWeek: 4, startTime: '08:00', endTime: '20:00', isActive: true },
              { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', isActive: true },
              { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isActive: false },
            ],
          },
        },
      },
    },
  })

  // ── Second Trainer (demo) ─────────────────────────────────────────────────
  const trainer2Password = await hash('trainer123', 12)
  const trainer2 = await prisma.user.upsert({
    where: { email: 'trainer2@gymbook.dev' },
    update: {},
    create: {
      email: 'trainer2@gymbook.dev',
      name: 'Lucía Coach',
      passwordHash: trainer2Password,
      role: Role.TRAINER,
      organizationId: org.id,
      trainerProfile: {
        create: {
          specialties: ['yoga', 'pilates', 'mobility'],
          certifications: ['ACE-CPT'],
          yearsExp: 5,
          calendarColor: '#A855F7',  // púrpura para distinguir en calendario
          availability: {
            create: [
              { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
              { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
            ],
          },
        },
      },
    },
  })

  // ── Client User ───────────────────────────────────────────────────────────
  const clientPassword = await hash('client123', 12)
  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@gymbook.dev' },
    update: {},
    create: {
      email: 'cliente@gymbook.dev',
      name: 'Ana Cliente',
      passwordHash: clientPassword,
      role: Role.CLIENT,
      organizationId: org.id,
      clientProfile: {
        create: {
          dateOfBirth: new Date('1992-05-15'),
          gender: Gender.FEMALE,
          sex: 'FEMALE',
          heightCm: 165,
          weightKg: 68,
          activityLevel: 'MODERATE',
          fitnessGoal: FitnessGoal.LOSE_WEIGHT,
          fitnessLevel: FitnessLevel.INTERMEDIATE,
          targetWeightKg: 60,
          phone: '+34 612 345 678',
          occupation: 'Diseñadora gráfica',
          morphology: 'ENDOMORPH',
          sleepHours: 7.5,
          dietaryRestrictions: ['gluten-free'],
          maxBenchKg: 30,
          maxSquatKg: 50,
          maxDeadliftKg: 60,
          onboardingCompleted: true,
        },
      },
    },
  })

  // ── Client Record ─────────────────────────────────────────────────────────
  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      trainerId: trainer.id,
      userId: clientUser.id,
      notes: 'Cliente constante. Meta: perder grasa manteniendo músculo.',
    },
  })

  // ── Credit Packages ───────────────────────────────────────────────────────
  const packPT = await prisma.creditPackage.upsert({
    where: { id: 'pack-pt-10' },
    update: {},
    create: {
      id: 'pack-pt-10',
      name: 'Pack 10 Sesiones PT',
      type: CreditPackageType.TEN,
      creditType: 'PT',
      totalCredits: 10,
      price: 350,
      currency: 'EUR',
      validDays: 90,
    },
  })
  const packSGT = await prisma.creditPackage.upsert({
    where: { id: 'pack-sgt-10' },
    update: {},
    create: {
      id: 'pack-sgt-10',
      name: 'Pack 10 Sesiones SGT',
      type: CreditPackageType.TEN,
      creditType: 'SGT',
      totalCredits: 10,
      price: 180,
      currency: 'EUR',
      validDays: 90,
    },
  })

  await prisma.userCredit.create({
    data: {
      clientId: client.id,
      packageId: packPT.id,
      creditType: 'PT',
      totalCredits: 10,
      usedCredits: 3,
      remainingCredits: 7,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  })

  // ── Exercises ─────────────────────────────────────────────────────────────
  const exercises = await Promise.all([
    prisma.exercise.upsert({ where: { id: 'ex-squat' }, update: {}, create: { id: 'ex-squat', name: 'Squat', muscleGroups: ['quads','glutes','hamstrings'], equipment: ['barbell','rack'] } }),
    prisma.exercise.upsert({ where: { id: 'ex-bench' }, update: {}, create: { id: 'ex-bench', name: 'Bench Press', muscleGroups: ['chest','triceps','front-delts'], equipment: ['barbell','bench'] } }),
    prisma.exercise.upsert({ where: { id: 'ex-rdl'   }, update: {}, create: { id: 'ex-rdl',   name: 'Romanian Deadlift', muscleGroups: ['hamstrings','glutes','lower-back'], equipment: ['barbell'] } }),
    prisma.exercise.upsert({ where: { id: 'ex-row'   }, update: {}, create: { id: 'ex-row',   name: 'Barbell Row', muscleGroups: ['lats','rhomboids','biceps'], equipment: ['barbell'] } }),
    prisma.exercise.upsert({ where: { id: 'ex-ohp'   }, update: {}, create: { id: 'ex-ohp',   name: 'Overhead Press', muscleGroups: ['shoulders','triceps'], equipment: ['barbell'] } }),
  ])

  // ── Training Program ──────────────────────────────────────────────────────
  await prisma.trainingProgram.create({
    data: {
      clientId: client.id,
      name: 'Fuerza 3 días — Semana 1',
      description: 'Upper/lower para pérdida de grasa con preservación muscular.',
      status: ProgramStatus.ACTIVE,
      startDate: new Date(),
      durationWeeks: 8,
      workouts: {
        create: [
          {
            name: 'Día A — Lower Body',
            dayOfWeek: DayOfWeek.MONDAY,
            weekNumber: 1,
            orderIndex: 0,
            exercises: { create: [
              { exerciseId: exercises[0].id, orderIndex: 0, sets: 4, reps: '6-8', weightKg: 60, restSeconds: 120, rpe: 8 },
              { exerciseId: exercises[2].id, orderIndex: 1, sets: 3, reps: '10-12', weightKg: 45, restSeconds: 90 },
            ]},
          },
          {
            name: 'Día B — Upper Body',
            dayOfWeek: DayOfWeek.WEDNESDAY,
            weekNumber: 1,
            orderIndex: 1,
            exercises: { create: [
              { exerciseId: exercises[1].id, orderIndex: 0, sets: 4, reps: '6-8', weightKg: 50, restSeconds: 120, rpe: 8 },
              { exerciseId: exercises[3].id, orderIndex: 1, sets: 3, reps: '8-10', weightKg: 40, restSeconds: 90 },
              { exerciseId: exercises[4].id, orderIndex: 2, sets: 3, reps: '8-10', weightKg: 30, restSeconds: 90 },
            ]},
          },
        ],
      },
    },
  })

  // ── Recipe + Nutrition Plan ───────────────────────────────────────────────
  const recipe = await prisma.recipe.create({
    data: {
      name: 'Bowl Pollo + Arroz',
      description: 'Alto en proteínas, post-entrenamiento ideal.',
      prepTimeMins: 10, cookTimeMins: 20, servings: 1,
      calories: 520, proteinG: 42, carbsG: 55, fatG: 12,
      tags: ['high-protein', 'post-workout', 'gluten-free'],
      ingredients: [
        { name: 'Pechuga de pollo', amount: 180, unit: 'g' },
        { name: 'Arroz integral', amount: 80, unit: 'g (seco)' },
        { name: 'Brócoli', amount: 100, unit: 'g' },
      ],
      instructions: '1. Cocer el arroz. 2. Cocinar pollo a la plancha. 3. Saltear brócoli. 4. Montar el bowl.',
    },
  })
  await prisma.nutritionPlan.create({
    data: {
      clientId: client.id,
      name: 'Déficit Calórico — 8 Semanas',
      caloriesTarget: 1800, proteinGTarget: 140, carbsGTarget: 180, fatGTarget: 60,
      status: ProgramStatus.ACTIVE,
      startDate: new Date(),
      weeklyPlans: {
        create: {
          weekNumber: 1,
          name: 'Semana 1 — Adaptación',
          mealEntries: { create: [
            { dayOfWeek: DayOfWeek.MONDAY,    mealType: MealType.LUNCH, recipeId: recipe.id },
            { dayOfWeek: DayOfWeek.WEDNESDAY, mealType: MealType.LUNCH, recipeId: recipe.id },
            { dayOfWeek: DayOfWeek.FRIDAY,    mealType: MealType.POST_WORKOUT, recipeId: recipe.id },
          ]},
        },
      },
    },
  })

  // ── Progress Logs (varios para demostrar gráficas) ────────────────────────
  const progressDates = [-90, -60, -30, -14, -7, 0].map(d => {
    const dt = new Date(); dt.setDate(dt.getDate() + d); dt.setHours(0,0,0,0); return dt
  })
  const baseWeight = 73
  const weightTrend = [73, 71.5, 70, 69.2, 68.5, 68]
  const fatTrend    = [34, 33, 31.5, 30.2, 29.1, 28.5]

  for (let i = 0; i < progressDates.length; i++) {
    const date = progressDates[i]
    try {
      await prisma.progressLog.upsert({
        where: { clientId_date: { clientId: client.id, date } },
        update: {},
        create: {
          clientId: client.id,
          date,
          weightKg:          weightTrend[i],
          wednesdayWeightKg: weightTrend[i] - 0.2,
          bodyFatSkinfold:   fatTrend[i],
          // Perímetros
          neckCm:            34.5,
          armRelaxedCm:      29 + (i * 0.1),
          armFlexedCm:       31 + (i * 0.1),
          chestCm:           92 - (i * 0.2),
          waistCm:           82 - (i * 0.5),
          abdomenCm:         85 - (i * 0.5),
          hipCm:             97 - (i * 0.3),
          thighRelaxedCm:    54 - (i * 0.2),
          // Bienestar
          sleepHours:        7.5,
          sleepQuality:      7,
          energyLevel:       8,
          fatigueLevel:      3,
          moodScore:         8,
          recoveryScore:     72 + i * 2,
          // Adherencia
          dietFollowUp:      85,
          trainingFollowUp:  90,
          notes: i === 0 ? 'Inicio del programa. Energía alta.' : undefined,
        },
      })
    } catch {
      // skip duplicates
    }
  }

  // ── Availability Slots demo (semana actual) ───────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0)
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1) // lunes actual

  for (let day = 0; day < 5; day++) {
    const slotDate = new Date(monday)
    slotDate.setDate(monday.getDate() + day)
    for (const hour of [9, 10, 11, 17, 18, 19]) {
      try {
        await prisma.availabilitySlot.upsert({
          where: { trainerId_date_startHour: { trainerId: trainer.id, date: slotDate, startHour: hour } },
          update: {},
          create: { trainerId: trainer.id, date: slotDate, startHour: hour, isOpen: true },
        })
      } catch { /* skip */ }
    }
  }

  console.log('\n✅ Seed v2 completado!')
  console.log('   Trainer:  trainer@gymbook.dev / trainer123')
  console.log('   Trainer2: trainer2@gymbook.dev / trainer123')
  console.log('   Cliente:  cliente@gymbook.dev / client123')
  console.log('   ActivityTypes: PT + SGT')
  console.log('   Festivos: 2025 + 2026 (Nacional + Andalucía + Torremolinos)')
  console.log('   Progress logs: 6 registros de evolución con biometría')
  console.log('   Availability slots: semana actual (L-V, 9-11h + 17-19h)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

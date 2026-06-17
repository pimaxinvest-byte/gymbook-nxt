import { PrismaClient, Role, FitnessGoal, FitnessLevel, Gender, CreditPackageType, ProgramStatus, DayOfWeek, MealType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding GymBook NXT...')

  // ── Organization ──────────────────────────────────────────
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

  // ── Trainer (Initial Owner) ────────────────────────────────
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
          bio: 'Entrenador personal certificado con 8 años de experiencia en fuerza y nutrición deportiva.',
          specialties: ['strength', 'hypertrophy', 'nutrition', 'fat-loss'],
          certifications: ['NSCA-CPT', 'Precision Nutrition L1'],
          yearsExp: 8,
          availability: {
            create: [
              { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '20:00' },
              { dayOfWeek: DayOfWeek.TUESDAY, startTime: '08:00', endTime: '20:00' },
              { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '08:00', endTime: '20:00' },
              { dayOfWeek: DayOfWeek.THURSDAY, startTime: '08:00', endTime: '20:00' },
              { dayOfWeek: DayOfWeek.FRIDAY, startTime: '08:00', endTime: '18:00' },
              { dayOfWeek: DayOfWeek.SATURDAY, startTime: '09:00', endTime: '14:00', isAvailable: false },
            ],
          },
        },
      },
    },
  })

  // ── Client User ───────────────────────────────────────────
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
          heightCm: 165,
          weightKg: 68,
          fitnessGoal: FitnessGoal.LOSE_WEIGHT,
          fitnessLevel: FitnessLevel.INTERMEDIATE,
          targetWeightKg: 60,
          dietaryRestrictions: ['gluten-free'],
          onboardingCompleted: true,
        },
      },
    },
  })

  // ── Client Record (trainer-client relationship) ───────────
  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      trainerId: trainer.id,
      userId: clientUser.id,
      notes: 'Cliente muy constante. Meta principal: perder grasa manteniendo músculo.',
    },
  })

  // ── Credit Packages ───────────────────────────────────────
  const pack10 = await prisma.creditPackage.upsert({
    where: { id: 'pack-10-demo' },
    update: {},
    create: {
      id: 'pack-10-demo',
      name: 'Pack 10 Sesiones',
      type: CreditPackageType.TEN,
      totalCredits: 10,
      price: 350,
      currency: 'EUR',
      validDays: 90,
    },
  })

  await prisma.userCredit.create({
    data: {
      clientId: client.id,
      packageId: pack10.id,
      totalCredits: 10,
      usedCredits: 3,
      remainingCredits: 7,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  })

  // ── Exercises ─────────────────────────────────────────────
  const exercises = await Promise.all([
    prisma.exercise.upsert({
      where: { id: 'ex-squat' },
      update: {},
      create: { id: 'ex-squat', name: 'Squat', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: ['barbell', 'rack'] },
    }),
    prisma.exercise.upsert({
      where: { id: 'ex-bench' },
      update: {},
      create: { id: 'ex-bench', name: 'Bench Press', muscleGroups: ['chest', 'triceps', 'front-delts'], equipment: ['barbell', 'bench'] },
    }),
    prisma.exercise.upsert({
      where: { id: 'ex-rdl' },
      update: {},
      create: { id: 'ex-rdl', name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes', 'lower-back'], equipment: ['barbell'] },
    }),
    prisma.exercise.upsert({
      where: { id: 'ex-row' },
      update: {},
      create: { id: 'ex-row', name: 'Barbell Row', muscleGroups: ['lats', 'rhomboids', 'biceps'], equipment: ['barbell'] },
    }),
    prisma.exercise.upsert({
      where: { id: 'ex-ohp' },
      update: {},
      create: { id: 'ex-ohp', name: 'Overhead Press', muscleGroups: ['shoulders', 'triceps'], equipment: ['barbell'] },
    }),
  ])

  // ── Training Program ──────────────────────────────────────
  const program = await prisma.trainingProgram.create({
    data: {
      clientId: client.id,
      name: 'Programa Fuerza 3 días — Semana 1',
      description: 'Programa de fuerza upper/lower para pérdida de grasa con preservación muscular.',
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
            exercises: {
              create: [
                { exerciseId: exercises[0].id, orderIndex: 0, sets: 4, reps: '6-8', weightKg: 60, restSeconds: 120, rpe: 8 },
                { exerciseId: exercises[2].id, orderIndex: 1, sets: 3, reps: '10-12', weightKg: 45, restSeconds: 90 },
              ],
            },
          },
          {
            name: 'Día B — Upper Body',
            dayOfWeek: DayOfWeek.WEDNESDAY,
            weekNumber: 1,
            orderIndex: 1,
            exercises: {
              create: [
                { exerciseId: exercises[1].id, orderIndex: 0, sets: 4, reps: '6-8', weightKg: 50, restSeconds: 120, rpe: 8 },
                { exerciseId: exercises[3].id, orderIndex: 1, sets: 3, reps: '8-10', weightKg: 40, restSeconds: 90 },
                { exerciseId: exercises[4].id, orderIndex: 2, sets: 3, reps: '8-10', weightKg: 30, restSeconds: 90 },
              ],
            },
          },
        ],
      },
    },
  })

  // ── Recipe ────────────────────────────────────────────────
  const recipe = await prisma.recipe.create({
    data: {
      name: 'Bowl de Arroz con Pollo y Verduras',
      description: 'Alto en proteínas, bajo en grasa. Ideal post-entrenamiento.',
      prepTimeMins: 10,
      cookTimeMins: 20,
      servings: 1,
      calories: 520,
      proteinG: 42,
      carbsG: 55,
      fatG: 12,
      tags: ['high-protein', 'post-workout', 'gluten-free'],
      ingredients: [
        { name: 'Pechuga de pollo', amount: 180, unit: 'g' },
        { name: 'Arroz integral', amount: 80, unit: 'g (seco)' },
        { name: 'Brócoli', amount: 100, unit: 'g' },
        { name: 'Aceite de oliva', amount: 10, unit: 'ml' },
        { name: 'Sal y especias', amount: 1, unit: 'al gusto' },
      ],
      instructions: '1. Cocer el arroz. 2. Cocinar el pollo a la plancha con especias. 3. Saltear el brócoli. 4. Montar el bowl.',
    },
  })

  // ── Nutrition Plan ────────────────────────────────────────
  const nutritionPlan = await prisma.nutritionPlan.create({
    data: {
      clientId: client.id,
      name: 'Plan Déficit Calórico — 8 Semanas',
      caloriesTarget: 1800,
      proteinGTarget: 140,
      carbsGTarget: 180,
      fatGTarget: 60,
      status: ProgramStatus.ACTIVE,
      startDate: new Date(),
      weeklyPlans: {
        create: {
          weekNumber: 1,
          name: 'Semana 1 — Adaptación',
          mealEntries: {
            create: [
              { dayOfWeek: DayOfWeek.MONDAY, mealType: MealType.LUNCH, recipeId: recipe.id },
              { dayOfWeek: DayOfWeek.WEDNESDAY, mealType: MealType.LUNCH, recipeId: recipe.id },
              { dayOfWeek: DayOfWeek.FRIDAY, mealType: MealType.POST_WORKOUT, recipeId: recipe.id },
            ],
          },
        },
      },
    },
  })

  // ── Progress Log ──────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.progressLog.upsert({
    where: { clientId_date: { clientId: client.id, date: today } },
    update: {},
    create: {
      clientId: client.id,
      date: today,
      weightKg: 68,
      bodyFatPct: 28.5,
      waistCm: 82,
      hipsCm: 97,
      squatKg: 60,
      benchPressKg: 50,
      notes: 'Inicio del programa. Energía alta.',
    },
  })

  console.log('✅ Seed completado!')
  console.log(`   Trainer: trainer@gymbook.dev / trainer123`)
  console.log(`   Cliente: cliente@gymbook.dev / client123`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

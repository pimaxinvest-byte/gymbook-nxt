'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Create nutrition plan ─────────────────────
export async function createNutritionPlan(data: {
  clientId: string   // Client.id (junction table id)
  name: string
  caloriesTarget: number
  proteinGTarget: number
  carbsGTarget: number
  fatGTarget: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const plan = await prisma.nutritionPlan.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      caloriesTarget: data.caloriesTarget,
      proteinGTarget: data.proteinGTarget,
      carbsGTarget: data.carbsGTarget,
      fatGTarget: data.fatGTarget,
      status: 'ACTIVE',
    },
  })

  revalidatePath('/trainer/nutrition')
  revalidatePath(`/trainer/clients/${data.clientId}`)
  return plan
}

// ─── Get trainer plans ─────────────────────────
export async function getMyNutritionPlans(clientId?: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.nutritionPlan.findMany({
    where: {
      client: { trainerId: session.user.id },
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: { include: { user: { select: { name: true } } } },
      weeklyPlans: { include: { mealEntries: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Get plan by id ────────────────────────────
export async function getNutritionPlanById(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  return prisma.nutritionPlan.findUnique({
    where: { id },
    include: {
      client: { include: { user: { select: { name: true, id: true } } } },
      weeklyPlans: {
        include: {
          mealEntries: {
            include: { recipe: true },
            orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
          },
        },
        orderBy: { weekNumber: 'desc' },
        take: 1,
      },
    },
  })
}

// ─── Generate weekly plan ──────────────────────
export async function generateWeeklyPlan(planId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const plan = await prisma.nutritionPlan.findUnique({
    where: { id: planId },
  })
  if (!plan) throw new Error('Plan no encontrado')

  // Get existing week count to number next plan
  const weekCount = await prisma.weeklyMealPlan.count({
    where: { nutritionPlanId: planId },
  })

  // Get available recipes
  const recipes = await prisma.recipe.findMany({ take: 50 })

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const
  const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const

  const getRecipe = (arr: any[], day: number) => arr.length > 0 ? arr[day % arr.length] : null

  const weeklyPlan = await prisma.weeklyMealPlan.create({
    data: {
      nutritionPlanId: planId,
      weekNumber: weekCount + 1,
      name: `Semana ${weekCount + 1}`,
      mealEntries: {
        create: DAYS.flatMap((dayOfWeek, dayIndex) =>
          MEAL_TYPES.map((mealType) => {
            const recipe = getRecipe(recipes, dayIndex)
            return {
              dayOfWeek,
              mealType,
              recipeId: recipe?.id ?? null,
              customMealName: recipe ? null : defaultMealName(mealType, dayIndex),
            }
          })
        ),
      },
    },
  })

  revalidatePath(`/trainer/nutrition/${planId}`)
  return weeklyPlan
}

function defaultMealName(type: string, day: number): string {
  const names: Record<string, string[]> = {
    BREAKFAST: ['Avena con frutas', 'Tostadas con aguacate', 'Batido proteico', 'Tortilla de claras', 'Granola con yogur', 'Porridge', 'Huevos revueltos'],
    LUNCH: ['Pollo con arroz', 'Salmón con quinoa', 'Lentejas con verduras', 'Pechuga a la plancha', 'Ensalada mediterránea', 'Pasta integral con atún', 'Carne magra con boniato'],
    DINNER: ['Ensalada completa', 'Pescado al vapor', 'Revuelto de verduras', 'Crema de calabaza', 'Pavo con espinacas', 'Dorada al horno', 'Tofu salteado'],
    SNACK: ['Frutos secos', 'Yogur griego', 'Fruta de temporada', 'Batido de proteína', 'Hummus con crudités', 'Manzana con mantequilla de cacahuete', 'Queso fresco con nueces'],
  }
  return names[type]?.[day % 7] ?? type
}

// ─── Log daily intake ─────────────────────────
export async function logDailyIntake(data: {
  planId: string
  date: Date
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  return prisma.dailyIntake.upsert({
    where: { nutritionPlanId_date: { nutritionPlanId: data.planId, date: data.date } },
    update: {
      totalCalories: data.totalCalories,
      totalProteinG: data.totalProteinG,
      totalCarbsG: data.totalCarbsG,
      totalFatG: data.totalFatG,
      notes: data.notes,
    },
    create: {
      nutritionPlanId: data.planId,
      date: data.date,
      totalCalories: data.totalCalories,
      totalProteinG: data.totalProteinG,
      totalCarbsG: data.totalCarbsG,
      totalFatG: data.totalFatG,
      notes: data.notes,
    },
  })
}

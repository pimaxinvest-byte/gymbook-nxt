'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── Create nutrition plan ─────────────────────
export async function createNutritionPlan(data: {
  clientId: string
  name: string
  targetCalories: number
  proteinG: number
  carbsG: number
  fatG: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const plan = await prisma.nutritionPlan.create({
    data: {
      trainerId: session.user.id,
      clientId: data.clientId,
      name: data.name,
      targetCalories: data.targetCalories,
      proteinG: data.proteinG,
      carbsG: data.carbsG,
      fatG: data.fatG,
      isActive: true,
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
      trainerId: session.user.id,
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: { include: { user: { select: { name: true } } } },
      weeklyPlan: { include: { meals: true } },
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
      weeklyPlan: {
        include: {
          meals: {
            include: { recipe: true },
            orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
          },
        },
      },
    },
  })
}

// ─── Generate weekly plan ──────────────────────
// Feature clave: genera un plan semanal con comidas y recetas automáticamente
export async function generateWeeklyPlan(planId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const plan = await prisma.nutritionPlan.findUnique({
    where: { id: planId },
    include: {
      client: {
        include: {
          user: true,
        },
      },
    },
  })
  if (!plan) throw new Error('Plan no encontrado')

  // Get available recipes for this org
  const recipes = await prisma.recipe.findMany({
    where: { organizationId: plan.client.user.organizationId ?? '' },
    take: 50,
  })

  // Simple round-robin recipe assignment per meal type per day
  const DAYS = [1, 2, 3, 4, 5, 6, 7]
  const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const

  // Delete existing weekly plan if any
  if (plan.weeklyPlanId) {
    await prisma.weeklyPlan.delete({ where: { id: plan.weeklyPlanId } })
  }

  const breakfastRecipes = recipes.filter(r => r.mealType === 'BREAKFAST' || r.mealType === null)
  const lunchRecipes = recipes.filter(r => r.mealType === 'LUNCH' || r.mealType === null)
  const dinnerRecipes = recipes.filter(r => r.mealType === 'DINNER' || r.mealType === null)
  const snackRecipes = recipes.filter(r => r.mealType === 'SNACK' || r.mealType === null)

  const getRecipe = (arr: any[], day: number) => arr.length > 0 ? arr[day % arr.length] : null

  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      nutritionPlanId: planId,
      meals: {
        create: DAYS.flatMap((day) =>
          MEAL_TYPES.map((mealType) => {
            const recipeMap = { BREAKFAST: breakfastRecipes, LUNCH: lunchRecipes, DINNER: dinnerRecipes, SNACK: snackRecipes }
            const recipe = getRecipe(recipeMap[mealType], day)
            return {
              dayOfWeek: day,
              mealType,
              recipeId: recipe?.id ?? null,
              name: recipe?.name ?? defaultMealName(mealType, day),
              calories: Math.round(plan.targetCalories / 4),
              proteinG: Math.round(plan.proteinG / 4),
              carbsG: Math.round(plan.carbsG / 4),
              fatG: Math.round(plan.fatG / 4),
            }
          })
        ),
      },
    },
  })

  // Link weekly plan to nutrition plan
  await prisma.nutritionPlan.update({
    where: { id: planId },
    data: { weeklyPlanId: weeklyPlan.id },
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
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  return prisma.dailyIntake.upsert({
    where: { userId_date: { userId: session.user.id, date: data.date } },
    update: { calories: data.calories, proteinG: data.proteinG, carbsG: data.carbsG, fatG: data.fatG, notes: data.notes },
    create: {
      userId: session.user.id,
      nutritionPlanId: data.planId,
      date: data.date,
      calories: data.calories,
      proteinG: data.proteinG,
      carbsG: data.carbsG,
      fatG: data.fatG,
      notes: data.notes,
    },
  })
}

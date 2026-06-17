import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import NewNutritionForm from './NewNutritionForm'

export default async function NewNutritionPlanPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') return null

  const clients = await prisma.client.findMany({
    where: { trainerId: session.user.id, isActive: true },
    include: { user: { select: { name: true, id: true } } },
    orderBy: { user: { name: 'asc' } },
  })

  return <NewNutritionForm clients={clients} />
}

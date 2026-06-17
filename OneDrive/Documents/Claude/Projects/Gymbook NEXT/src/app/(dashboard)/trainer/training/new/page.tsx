import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import NewTrainingForm from './NewTrainingForm'

export default async function NewTrainingProgramPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') {
    return null
  }

  const clients = await prisma.client.findMany({
    where: { trainerId: session.user.id },
    include: { user: { select: { name: true, id: true } } },
    orderBy: { user: { name: 'asc' } },
  })

  return <NewTrainingForm clients={clients} />
}

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ClientMessagingClient from './ClientMessagingClient'

export default async function ClientMessagesPage() {
  const session = await auth()
  const userId  = session!.user.id

  // Find the Client record for this user and get their trainer
  const clientRecord = await prisma.client.findUnique({
    where: { userId },
    include: {
      trainer: { select: { id: true, name: true, email: true } },
    },
  })

  const trainers = clientRecord
    ? [
        {
          userId: clientRecord.trainer.id,
          name:   clientRecord.trainer.name ?? 'Trainer',
          email:  clientRecord.trainer.email,
        },
      ]
    : []

  return (
    <ClientMessagingClient
      trainers={trainers}
      currentUserId={userId}
    />
  )
}

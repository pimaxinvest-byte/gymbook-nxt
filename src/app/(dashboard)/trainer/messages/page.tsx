import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import MessagingClient from './MessagingClient'

export default async function TrainerMessagesPage() {
  const session = await auth()
  const trainerId = session?.user?.id
  if (!trainerId) return null

  const clients = await prisma.client.findMany({
    where: { trainerId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  }).catch(() => [])

  const clientItems = clients.map((c) => ({
    clientRecordId: c.id,
    userId:         c.user.id,
    name:           c.user.name ?? '—',
    email:          c.user.email,
  }))

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <div className="section-eyebrow">trainer·mensajes</div>
        <h1 className="text-2xl font-bold text-text">Mensajes</h1>
      </div>
      <MessagingClient clients={clientItems} currentUserId={trainerId} />
    </div>
  )
}

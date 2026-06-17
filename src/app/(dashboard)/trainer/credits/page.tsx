import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getCreditStats, getMyPackages } from '@/features/credits/actions'
import CreditsClient from './CreditsClient'

export default async function TrainerCreditsPage() {
  const session = await auth()
  const trainerId = session?.user?.id ?? ''

  const [clients, packages, stats] = await Promise.all([
    prisma.client.findMany({
      where: { trainerId, isActive: true },
      include: {
        user: { select: { name: true } },
        userCredits: {
          where: { status: 'ACTIVE' },
          select: { remainingCredits: true },
        },
      },
      orderBy: { user: { name: 'asc' } },
    }).catch(() => []),
    getMyPackages().catch(() => []),
    getCreditStats(trainerId).catch(() => ({ totalSold: 0, totalActive: 0, totalUsed: 0 })),
  ])

  const clientItems = clients.map((c) => ({
    id:      c.id,
    name:    c.user.name ?? '—',
    balance: c.userCredits.reduce((sum, uc) => sum + uc.remainingCredits, 0),
  }))

  return (
    <CreditsClient
      clients={clientItems}
      packages={packages}
      stats={stats}
    />
  )
}

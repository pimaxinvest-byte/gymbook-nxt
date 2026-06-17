'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function createCreditPackage(data: {
  name: string
  totalCredits: number
  price: number
  creditType: 'PT' | 'SGT'
  validDays: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const typeMap: Record<number, 'SINGLE' | 'FIVE' | 'TEN' | 'TWENTY' | 'CUSTOM'> = {
    1: 'SINGLE', 5: 'FIVE', 10: 'TEN', 20: 'TWENTY',
  }
  const type = typeMap[data.totalCredits] ?? 'CUSTOM'

  const pkg = await prisma.creditPackage.create({
    data: {
      name: data.name,
      type,
      totalCredits: data.totalCredits,
      price: data.price,
      creditType: data.creditType,
      validDays: data.validDays,
      isActive: true,
    },
  })

  revalidatePath('/trainer/credits')
  return pkg
}

export async function getMyPackages() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  return prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { totalCredits: 'asc' },
  })
}

export async function getCreditStats(trainerId: string) {
  const [sold, active, used] = await Promise.all([
    prisma.userCredit.aggregate({
      where: { client: { trainerId } },
      _sum: { totalCredits: true },
    }),
    prisma.userCredit.aggregate({
      where: { client: { trainerId }, status: 'ACTIVE' },
      _sum: { remainingCredits: true },
    }),
    prisma.userCredit.aggregate({
      where: { client: { trainerId } },
      _sum: { usedCredits: true },
    }),
  ])

  return {
    totalSold:    sold._sum.totalCredits   ?? 0,
    totalActive:  active._sum.remainingCredits ?? 0,
    totalUsed:    used._sum.usedCredits    ?? 0,
  }
}

export async function sellPackageToClient(clientId: string, packageId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') throw new Error('No autorizado')

  const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } })
  if (!pkg) throw new Error('Paquete no encontrado')

  await prisma.userCredit.create({
    data: {
      clientId,
      packageId,
      totalCredits:     pkg.totalCredits,
      usedCredits:      0,
      remainingCredits: pkg.totalCredits,
      status:           'ACTIVE',
      expiresAt:        new Date(Date.now() + (pkg.validDays ?? 365) * 24 * 60 * 60 * 1000),
    },
  })

  revalidatePath('/trainer/credits')
  revalidatePath(`/trainer/clients/${clientId}`)
}

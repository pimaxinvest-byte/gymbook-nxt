import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  // Find the user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { clientRecord: true },
  })

  if (!targetUser) {
    return NextResponse.json(
      { error: 'No se encontró ningún usuario con ese email. El cliente debe registrarse primero.' },
      { status: 404 }
    )
  }

  if (targetUser.role !== 'CLIENT') {
    return NextResponse.json(
      { error: 'Ese usuario no tiene rol de cliente.' },
      { status: 400 }
    )
  }

  // Check if already linked to this trainer
  if (targetUser.clientRecord?.trainerId === session.user.id) {
    return NextResponse.json(
      { error: 'Este cliente ya está vinculado a tu cuenta.' },
      { status: 409 }
    )
  }

  // Create or update Client record
  const client = await prisma.client.upsert({
    where: { userId: targetUser.id },
    create: {
      userId:    targetUser.id,
      trainerId: session.user.id,
      isActive:  true,
      joinedAt:  new Date(),
    },
    update: {
      trainerId: session.user.id,
      isActive:  true,
    },
  })

  return NextResponse.json({ ok: true, clientId: client.id })
}

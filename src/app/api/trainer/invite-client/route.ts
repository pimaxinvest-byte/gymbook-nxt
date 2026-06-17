import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      clientRecord: true,
      clientProfile: { select: { phone: true } },
    },
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

  if (targetUser.clientRecord?.trainerId === session.user.id) {
    return NextResponse.json(
      { error: 'Este cliente ya está vinculado a tu cuenta.' },
      { status: 409 }
    )
  }

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

  // Notify client via WhatsApp if they have a phone number
  const phone = targetUser.clientProfile?.phone
  if (phone) {
    const trainerName = session.user.name ?? 'Tu entrenador'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gymbook.app'
    await sendWhatsApp(
      phone,
      `¡Hola ${targetUser.name ?? ''}! 👋\n\n` +
      `*${trainerName}* te ha añadido como cliente en GymBook NXT.\n\n` +
      `Ya puedes acceder a tu programa de entrenamiento y plan nutricional:\n${appUrl}\n\n` +
      `_GymBook NXT — Tu entrenamiento, organizado._`
    ).catch((err) => console.error('[WhatsApp] Error sending notification:', err))
  }

  return NextResponse.json({ ok: true, clientId: client.id })
}

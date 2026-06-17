'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─── List conversations for the current user ────────────────────────────────
export async function getConversations() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const userId = session.user.id
  const role   = session.user.role

  if (role === 'TRAINER') {
    return prisma.conversation.findMany({
      where: { trainerId: userId },
      include: {
        client: { include: { user: { select: { id: true, name: true, email: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // CLIENT
  const clientRecord = await prisma.client.findUnique({ where: { userId } })
  if (!clientRecord) return []

  return prisma.conversation.findMany({
    where: { clientId: clientRecord.id },
    include: {
      trainer: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// ─── Get or create a conversation ───────────────────────────────────────────
// Pass the OTHER party's userId.
// Trainer passes clientUserId → we look up Client record internally.
// Client passes trainerUserId → we use it directly as trainerId.
export async function getOrCreateConversation(otherUserId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const meId = session.user.id
  const role  = session.user.role

  let trainerId: string
  let clientId: string  // Client.id (not User.id)

  if (role === 'TRAINER') {
    trainerId = meId
    // otherUserId is the client's User.id
    const clientRecord = await prisma.client.findUnique({ where: { userId: otherUserId } })
    if (!clientRecord) throw new Error('Cliente no encontrado')
    clientId = clientRecord.id
  } else {
    trainerId = otherUserId
    const clientRecord = await prisma.client.findUnique({ where: { userId: meId } })
    if (!clientRecord) throw new Error('Registro de cliente no encontrado')
    clientId = clientRecord.id
  }

  const existing = await prisma.conversation.findUnique({
    where: { clientId_trainerId: { clientId, trainerId } },
  })
  if (existing) return existing

  const conv = await prisma.conversation.create({
    data: { clientId, trainerId },
  })

  if (role === 'TRAINER') {
    revalidatePath('/trainer/messages')
  } else {
    revalidatePath('/client/messages')
  }

  return conv
}

// ─── Get messages in a conversation ─────────────────────────────────────────
export async function getMessages(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  await assertConversationAccess(conversationId, session.user.id, session.user.role)

  return prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── Send a message ──────────────────────────────────────────────────────────
export async function sendMessage(conversationId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')
  if (!content.trim()) throw new Error('Mensaje vacío')

  await assertConversationAccess(conversationId, session.user.id, session.user.role)

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: content.trim(),
      type: 'TEXT',
    },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  })

  // Bump conversation updatedAt so it floats to top
  await prisma.conversation.update({
    where: { id: conversationId },
    data:  { updatedAt: new Date() },
  })

  if (session.user.role === 'TRAINER') {
    revalidatePath('/trainer/messages')
  } else {
    revalidatePath('/client/messages')
  }

  return message
}

// ─── Mark messages as read ───────────────────────────────────────────────────
export async function markAsRead(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  await assertConversationAccess(conversationId, session.user.id, session.user.role)

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      isRead: false,
    },
    data: { isRead: true },
  })

  if (session.user.role === 'TRAINER') {
    revalidatePath('/trainer/messages')
  } else {
    revalidatePath('/client/messages')
  }
}

// ─── Internal: verify user belongs to conversation ──────────────────────────
async function assertConversationAccess(
  conversationId: string,
  userId: string,
  role: string,
) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { client: { select: { userId: true } } },
  })

  if (!conv) throw new Error('Conversación no encontrada')

  const isTrainer = role === 'TRAINER' && conv.trainerId === userId
  const isClient  = role === 'CLIENT'  && conv.client.userId === userId

  if (!isTrainer && !isClient) throw new Error('Sin acceso a esta conversación')
}

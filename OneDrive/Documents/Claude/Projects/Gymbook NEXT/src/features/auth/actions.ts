'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { registerSchema, type RegisterInput } from './schemas'

// ─── Login ────────────────────────────────────
export async function loginAction(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: undefined,
    })
    return { success: true }
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case 'CredentialsSignin':
          return { error: 'Email o contraseña incorrectos' }
        default:
          return { error: 'Error al iniciar sesión' }
      }
    }
    throw err
  }
}

// ─── Register ─────────────────────────────────
export async function registerAction(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password, role, trainerCode } = parsed.data

  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Este email ya está registrado' }

  const hashedPw = await bcrypt.hash(password, 12)

  // Create user + org (trainer) or link to trainer (client)
  if (role === 'TRAINER') {
    // First trainer ever = Initial Owner
    const trainerCount = await prisma.user.count({ where: { role: 'TRAINER' } })
    const isOwner = trainerCount === 0

    // Create org for trainer
    const org = await prisma.organization.create({
      data: {
        name: `${name}'s Gym`,
        slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
      },
    })

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPw,
        role: 'TRAINER',
        isInitialOwner: isOwner,
        organizationId: org.id,
        trainerProfile: {
          create: {
            bio: '',
            specialties: [],
          },
        },
      },
    })
  } else {
    // CLIENT: find trainer by code (email prefix) or default to first trainer
    const trainer = trainerCode
      ? await prisma.user.findFirst({
          where: { role: 'TRAINER', email: { startsWith: trainerCode } },
        })
      : await prisma.user.findFirst({ where: { role: 'TRAINER' } })

    if (!trainer) return { error: 'No se encontró ningún trainer. Contacta con tu entrenador.' }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPw,
        role: 'CLIENT',
        organizationId: trainer.organizationId,
        clientProfile: {
          create: {
            fitnessGoal: 'GENERAL_FITNESS',
            fitnessLevel: 'BEGINNER',
            onboardingCompleted: false,
          },
        },
      },
    })

    // Link client to trainer via Client junction table
    await prisma.client.create({
      data: {
        trainerId: trainer.id,
        userId: user.id,
      },
    })

    return { success: true, userId: user.id, needsOnboarding: true }
  }

  return { success: true }
}

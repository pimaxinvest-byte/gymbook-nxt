# GymBook NXT — Progress Log

## Estado General
**Fase actual:** Macro Fase I — ✅ COMPLETADA  
**Siguiente:** Fase II (funcionalidades avanzadas, analytics, mobile PWA)  
**Repo:** https://github.com/pimaxinvest-byte/gymbook-nxt  
**Última actualización:** 2026-06-17

---

## ✅ Macro Fase I — Resumen Completado

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Fundación: Schema + Design System | ✅ Completada |
| 1 | Auth: NextAuth v5 + Onboarding | ✅ Completada |
| 2 | Gestión de Clientes + Créditos | ✅ Completada |
| 3 | Training Programs + Workouts | ✅ Completada |
| 4 | Nutrición + Generador Plan Semanal | ✅ Completada |
| 5 | Calendario + Dashboard mejorado | ✅ Completada |
| 6 | Deploy Railway + config producción | ✅ Completada |

---

## Decisiones de Arquitectura (Locked)

- **Roles:** Solo TRAINER y CLIENT. Sin Admin.
- **Initial Owner:** Primer trainer registrado = `isOwner: true`.
- **Arquitectura:** Monolith (Next.js App Router fullstack).
- **Auth:** NextAuth v5 (next-auth@beta) con JWT strategy + Credentials provider.
- **Forms:** react-hook-form + zod.
- **DB:** Prisma + PostgreSQL (Railway en producción).
- **Créditos:** Paquetes 1x1 (€25) / 5x5 (€110) / 10x10 (€200) / 20x20 (€360).
- **Design System:** Voltaic Nocturne — dark #0A0A0A, electric blue #3B82F6, gold #EAB308.
- **Deploy:** Railway (`railway.json` configurado, `npx prisma migrate deploy && npx next start`).

---

## ✅ Fase 0 — Fundación

**Design System Voltaic Nocturne:**
- `src/app/globals.css` — CSS variables + componentes: btn-*, card-*, badge-*, stat-card, input, nav-item
- `tailwind.config.ts` — paleta completa + animaciones
- `voltaic-nocturne-philosophy.md` + `voltaic-nocturne.png` — manifiesto + canvas renderizado

**Base:**
- `prisma/schema.prisma` — Schema unificado (Organization, User, TrainerProfile, ClientProfile, Credits, Training, Nutrition, Progress, Availability, Messaging)
- `prisma/seed.ts` — Seed realista con datos de ejemplo
- `src/lib/prisma.ts` — Prisma Client singleton
- `src/app/layout.tsx` — Root layout dark mode + Inter
- `src/app/(dashboard)/layout.tsx` — Sidebar + mobile overlay

---

## ✅ Fase 1 — Auth + Onboarding

- `src/auth.ts` — NextAuth v5 config (JWT, PrismaAdapter, Credentials, callbacks para role)
- `src/app/api/auth/[...nextauth]/route.ts` — Handlers GET/POST
- `src/middleware.ts` — Protección de rutas por rol + redirects
- `src/features/auth/schemas.ts` — Zod: loginSchema, registerSchema
- `src/features/auth/actions.ts` — loginAction, registerAction (Initial Owner pattern)
- `src/app/(auth)/login/page.tsx` — Login Voltaic Nocturne (dot-grid, glow, arc-top, logo)
- `src/app/(auth)/register/page.tsx` — Registro trainer/client + trainerCode
- `src/app/(dashboard)/client/onboarding/page.tsx` — 4-step onboarding (goal, level, measurements, diet)

---

## ✅ Fase 2 — Clientes + Créditos

- `src/features/users/actions.ts` — getMyClients, getClientById, assignCredits, deductCredit, saveOnboarding
- `src/app/(dashboard)/trainer/clients/page.tsx` — Grid de clientes con estado de créditos
- `src/app/(dashboard)/trainer/clients/[id]/page.tsx` — Detalle cliente (stats, historial, programas)
- `src/app/(dashboard)/trainer/clients/[id]/CreditAssignForm.tsx` — Asignación de paquetes de créditos

---

## ✅ Fase 3 — Training Programs

- `src/features/training/actions.ts` — createTrainingProgram, getMyPrograms, getProgramById, addWorkout, addExercise, logExercise
- `src/app/(dashboard)/trainer/training/page.tsx` — Lista de programas con workouts/días
- `src/app/(dashboard)/trainer/training/[id]/page.tsx` — Detalle: workouts + ejercicios
- `src/app/(dashboard)/trainer/training/new/page.tsx` — Formulario creación programa
- `src/app/(dashboard)/client/training/page.tsx` — Vista cliente: programa semanal + ejercicios por día

---

## ✅ Fase 4 — Nutrición + Plan Semanal

- `src/features/nutrition/actions.ts` — createNutritionPlan, getMyNutritionPlans, generateWeeklyPlan (7×4 meal grid), logDailyIntake
- `src/app/(dashboard)/trainer/nutrition/page.tsx` — Lista planes con macro grid
- `src/app/(dashboard)/trainer/nutrition/[id]/page.tsx` — Detalle: weekly grid 7 días × 4 comidas
- `src/app/(dashboard)/trainer/nutrition/[id]/GenerateWeeklyPlanBtn.tsx` — ⚡ Genera/regenera plan semanal
- `src/app/(dashboard)/trainer/nutrition/new/page.tsx` — Formulario creación plan con sliders de macros

---

## ✅ Fase 5 — Calendario + Dashboard

- `src/features/availability/actions.ts` — setAvailability, getMyAvailability, getTrainerAvailability, getUpcomingSessions, bookSession (atomic transaction)
- `src/app/(dashboard)/trainer/calendar/page.tsx` — Vista semanal 7 columnas + upcoming sessions
- `src/app/(dashboard)/trainer/calendar/AvailabilityEditor.tsx` — Editor interactivo de horarios
- `src/app/(dashboard)/trainer/page.tsx` — Dashboard con datos reales de Prisma (clientes, sesiones, actividad reciente)
- `src/app/(dashboard)/client/page.tsx` — Dashboard cliente con datos reales (sesiones, programa, nutrición, progreso, trainer)

---

## ✅ Fase 6 — Deploy Railway

- `railway.json` — Build config: NIXPACKS, `prisma migrate deploy && next start`
- `.env.example` — AUTH_SECRET, DATABASE_URL, NEXTAUTH_URL
- Dependencias a instalar: `npm install --legacy-peer-deps`

### Deploy en Railway:
```bash
# 1. Crear proyecto en railway.app
# 2. Conectar repo GitHub
# 3. Añadir PostgreSQL plugin
# 4. Variables de entorno:
#    DATABASE_URL (provista por Railway PostgreSQL)
#    AUTH_SECRET=$(openssl rand -base64 32)
#    NEXTAUTH_URL=https://tu-app.up.railway.app
# 5. Railway detecta railway.json y despliega automáticamente
```

---

## 🛠️ Setup Local

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Copiar env
cp .env.example .env
# → Editar .env con tu DATABASE_URL y AUTH_SECRET

# 3. Migraciones + seed
npx prisma migrate dev --name init
npx prisma db seed

# 4. Arrancar
npm run dev
# → http://localhost:3000
```

---

## Archivos críticos de auth

```bash
# TypeScript necesita types extendidos para NextAuth v5
# Ya incluidos en src/auth.ts (module augmentation)
# Session.user.{id, role} ← tipo extendido
# JWT.{id, role} ← tipo extendido
```

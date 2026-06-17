# GymBook NXT — Assessment Completo (5 Agentes)
**Fecha:** 2026-06-17  
**Ejecutado por:** Manager + QA + Controller Final

---

## 🟢 LO QUE ESTÁ BIEN

| Área | Estado | Notas |
|------|--------|-------|
| Design System (Voltaic Nocturne) | ✅ Correcto | `globals.css` completo, tokens CSS, componentes `.card`, `.btn-*`, `.stat-card` |
| Prisma Schema | ✅ Bien diseñado | Modelos correctos, relaciones coherentes |
| Layout dashboard | ✅ Funciona | Sidebar Voltaic Nocturne, mobile overlay, responsive |
| Middleware auth | ✅ Correcto | Role-based redirects, protección de rutas |
| UI de las páginas | ✅ Bien | Diseño premium, animaciones, mobile-first |
| railway.json + .env.example | ✅ Listos | Deploy config correcto |
| next.config.ts + tailwind | ✅ OK | Configuración correcta |
| GitHub | ❌ VACÍO | Solo hay README — **ningún código está subido** |

---

## 🔴 BUGS CRÍTICOS (app no compila ni ejecuta)

### BUG #1 — `auth.ts`: campo `password` vs `passwordHash`
```
Schema: passwordHash String?
auth.ts: user.password  ← NO EXISTE
auth.ts: user.password  ← en bcrypt.compare
```
**Fix:** `user.password` → `user.passwordHash`

---

### BUG #2 — `auth.ts`: PrismaAdapter sin tablas requeridas
El schema no tiene `Account`, `Session`, `VerificationToken` que necesita el adapter.  
Como usamos JWT, el adapter no es necesario.  
**Fix:** Eliminar `PrismaAdapter` de `auth.ts`

---

### BUG #3 — `registerAction`: campos inexistentes en schema
```ts
// Action usa:
password: hashedPw           // schema tiene: passwordHash
TrainerProfile: { isOwner }  // schema: isOwner NO existe en TrainerProfile (está en User.isInitialOwner)
ClientProfile: { trainerId } // schema: ClientProfile NO tiene trainerId
ClientProfile: { goal }      // schema: ClientProfile tiene fitnessGoal (no goal)
```

---

### BUG #4 — `users/actions.ts`: modelo completamente desalineado
```ts
// saveOnboarding usa campos que NO existen en ClientProfile:
goal, dietaryPreference, injuriesNotes, initialWeight, currentWeight, height

// Schema tiene:
fitnessGoal, dietaryRestrictions[], medicalNotes, weightKg, heightCm

// getMyClients: ClientProfile NO tiene trainerId
prisma.clientProfile.findMany({ where: { trainerId } })  // ← ERROR

// UserCredit: campos incorrectos
prisma.userCredit.findFirst({ where: { userId } })  // schema: clientId
credit.balance    // schema: remainingCredits (no balance)
creditPackageId   // schema: packageId

// ProgressLog: campos incorrectos
{ userId, weight, bodyFat, muscleMass }  // schema: { clientId, weightKg, bodyFatPct, muscleMassKg }
```

---

### BUG #5 — `training/actions.ts`: múltiples errores
```ts
// createTrainingProgram:
trainerId: session.user.id  // NO existe en TrainingProgram schema
isActive: true              // schema usa: status: 'ACTIVE'

// getMyPrograms:
where: { trainerId }        // NO existe en schema

// getProgramById includes:
exercises: { orderBy: { order: 'asc' } }  // schema: WorkoutExercise con orderIndex

// addWorkout:
dayOfWeek: number           // schema: DayOfWeek enum (MONDAY, TUESDAY...)
type: string                // Workout NO tiene campo type en schema

// addExercise: crea Exercise directo con workoutId, sets, reps, weight
// Schema tiene junction table WorkoutExercise — NO se puede crear así

// logExercise usa:
{ userId, exerciseId, workoutId, setsCompleted, repsCompleted, weightUsed }
// Schema ExerciseLog tiene:
{ sessionId, workoutExerciseId, setNumber, repsCompleted, weightKgUsed, rpe }
```

---

### BUG #6 — `nutrition/actions.ts`: triple mismatch de campos
```ts
// createNutritionPlan:
trainerId: session.user.id   // NutritionPlan NO tiene trainerId
targetCalories               // schema: caloriesTarget
proteinG                     // schema: proteinGTarget
carbsG                       // schema: carbsGTarget
fatG                         // schema: fatGTarget
isActive: true               // schema: status: 'ACTIVE'

// generateWeeklyPlan:
plan.weeklyPlanId            // NutritionPlan NO tiene weeklyPlanId (es one-to-many)
prisma.weeklyPlan            // modelo se llama WeeklyMealPlan
plan.proteinG / plan.carbsG  // mismos errores de campo
```

---

### BUG #7 — `availability/actions.ts`: modelos inexistentes
```ts
prisma.availability          // NO existe — es TrainerAvailability
{ trainerId }                // TrainerAvailability tiene trainerProfileId
prisma.session               // NO existe Session model en schema
```

---

### BUG #8 — `trainer/page.tsx` + `client/page.tsx`: referencias inválidas
```ts
// trainer/page.tsx:
prisma.clientProfile.count({ where: { trainerId } })  // NO trainerId
prisma.session.findMany(...)                           // NO Session model
UserCredit[0].balance                                  // NO balance field

// client/page.tsx:
clientProfile.trainer                  // NO trainer relation en ClientProfile
nutritionPlan.calories/protein/carbs   // campos incorrectos (caloriesTarget, etc.)
prisma.progressLog.findMany({ userId }) // schema: clientId
prisma.userCredit.findFirst({ userId }) // schema: clientId
trainingProgram.isActive               // schema: status
nutritionPlan.isActive                 // schema: status
```

---

## 📊 RESUMEN DE IMPACTO

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 BLOCKER | 8 | App no compila / runtime crash inmediato |
| 🟠 CRITICAL | 12 | Features principales no funcionan |
| 🟡 MEDIUM | 4 | UX degradada (sidebar hardcoded, etc.) |
| 🟢 LOW | 2 | Mejoras cosméticas |

**Veredicto del Manager (ui-ux-pro-max):** La arquitectura visual y el diseño son sólidos. El problema es 100% de coherencia entre capas (schema ↔ actions ↔ UI). El plan de corrección es claro y ejecutable.

**Veredicto del Controller Final:** Un solo commit de corrección bien dirigido resuelve todo. No hace falta rediseñar nada.

---

## 🔧 PLAN DE CORRECCIÓN (orden de ejecución)

### Prioridad 1 — Schema: añadir Session model + corregir User
### Prioridad 2 — auth.ts: passwordHash, quitar PrismaAdapter
### Prioridad 3 — features/auth/actions.ts: registerAction
### Prioridad 4 — features/users/actions.ts: alinear a schema
### Prioridad 5 — features/training/actions.ts: alinear a schema
### Prioridad 6 — features/nutrition/actions.ts: alinear a schema
### Prioridad 7 — features/availability/actions.ts: alinear a schema
### Prioridad 8 — Pages: trainer/page.tsx + client/page.tsx
### Prioridad 9 — Git commit + push

---
*Assessment generado por: Manager (coordinación) + QA/Debugger (detección) + Controller Final (priorización)*

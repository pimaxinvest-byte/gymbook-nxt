// ─── GymBook NXT — Shared Entity Types ───────────────────────
// Re-exports from Prisma + extended types for the app

export type {
  User,
  Client,
  TrainerProfile,
  ClientProfile,
  Organization,
  CreditPackage,
  UserCredit,
  TrainingProgram,
  Workout,
  Exercise,
  WorkoutExercise,
  WorkoutSession,
  ExerciseLog,
  NutritionPlan,
  WeeklyMealPlan,
  Recipe,
  DailyIntake,
  ProgressLog,
  TrainerAvailability,
  Conversation,
  Message,
} from '@prisma/client'

export { Role, FitnessGoal, FitnessLevel, Gender, DayOfWeek, MealType, ProgramStatus, CreditPackageType } from '@prisma/client'

// Extended types (with relations)
import type { User, Client, TrainerProfile, ClientProfile } from '@prisma/client'

export type TrainerWithProfile = User & { trainerProfile: TrainerProfile | null }
export type ClientWithProfile = User & { clientProfile: ClientProfile | null }
export type ClientWithRelations = Client & {
  user: User & { clientProfile: ClientProfile | null }
  trainer: User
}

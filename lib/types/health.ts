// ============================================================
//  Health OS — 类型定义 v3.1
//  MainChallenge 新增 no_appetite（没有食欲，瘦子增肌常见困扰）
// ============================================================

export type Gender = "male" | "female" | "other";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type ActivityLevel = "low" | "medium" | "high";
export type MainChallenge = "appetite" | "motivation" | "time" | "no_appetite";
export type LifestyleType =
  | "sedentary"
  | "light_active"
  | "moderate_active"
  | "very_active";
export type DietGoal =
  | "weight_loss"
  | "muscle_gain"
  | "maintain"
  | "endurance";
export type DietStyle = "budget" | "balanced" | "premium";

export type AIProvider =
  | "ollama"
  | "deepseek"
  | "openai"
  | "claude"
  | "gemini"
  | "qwen";

export interface UserProfile {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: DietGoal;
  lifestyleType: LifestyleType;
  activityLevel: ActivityLevel;
  fitnessLevel: FitnessLevel;
  sleepTime: string;
  wakeTime: string;
  weeklyBudget: number;
  availableMinutesPerDay: number;
  dietStyle: DietStyle;
  hasEquipment: boolean;
  equipmentList?: string;
  mainChallenge: MainChallenge;
  provider?: AIProvider;
  openaiApiKey?: string;
  modelName?: string;
}

export type ModuleStatus = "idle" | "loading" | "success" | "error";

export interface ModuleState<T> {
  status: ModuleStatus;
  data: T | null;
  error?: string;
  generatedAt?: string;
}

export interface Meal {
  name: string;
  foods: string[];
  calories: number;
  protein: number;
  notes?: string;
}

export interface DayMealPlan {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack?: Meal;
  totalCalories: number;
}

export interface NutritionPlan {
  dailyCalorieTarget: number;
  macroSplit: { protein: number; carbs: number; fat: number };
  weeklyPlan: DayMealPlan[];
  keyPrinciples: string[];
  personalizedNote: string;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  tip: string;
  muscleGroup: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
  durationMinutes: number;
}

export interface WorkoutPlan {
  overview: string;
  weeklySchedule: WorkoutDay[];
  progressionLogic: string;
  safetyNote: string;
  personalizedNote: string;
}

export interface FastingWindow {
  fastStart: string;
  fastEnd: string;
  eatStart: string;
  eatEnd: string;
  fastingHours: number;
}

export interface HourlyFastingSchedule {
  time: string;
  status: "fasting" | "eating";
  action: string;
}

export interface FastingPlan {
  recommendedProtocol: string;
  rationale: string;
  windows: FastingWindow;
  hourlyGuide: HourlyFastingSchedule[];
  fastingAllowed: string[];
  eatingWindowAdvice: string[];
  beginnerTips: string[];
  personalizedNote: string;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  estimatedCost: number;
  category: ShoppingCategory;
  tip?: string;
}

export type ShoppingCategory =
  | "protein"
  | "carbs"
  | "healthy_fats"
  | "vegetables_fruits"
  | "snacks"
  | "condiments";

export interface ShoppingPlan {
  totalEstimatedCost: number;
  budgetUsagePercent: number;
  items: ShoppingItem[];
  mealPrepTips: string[];
  budgetTip: string;
  personalizedNote: string;
}

export interface DailyMotivation {
  fatLossTip: string;
  quote: string;
  quoteAuthor?: string;
  dailyTask: string;
  morningRoutine: string[];
  mindsetShift: string;
  personalizedNote: string;
}

export interface HydrationEvent {
  time: string;
  amount: string;
  note: string;
}

export interface HydrationSleepPlan {
  dailyWaterTarget: number;
  hydrationSchedule: HydrationEvent[];
  eveningRoutine: string[];
  morningHabits: string[];
  sleepOptimizationTips: string[];
  scienceNote: string;
  personalizedNote: string;
}

export interface LifestyleHabit {
  category: "nutrition" | "activity" | "mindset" | "lifestyle";
  habit: string;
  frequency: string;
  howTo: string;
  whyItWorks: string;
}

export interface LifestylePlan {
  headline: string;
  habits: LifestyleHabit[];
  weeklyMilestones: string[];
  challengeStrategy: string;
  longTermVision: string;
  personalizedNote: string;
}

export interface HealthPlan {
  id: string;
  createdAt: string;
  profile: UserProfile;
  nutrition: ModuleState<NutritionPlan>;
  workout: ModuleState<WorkoutPlan>;
  fasting: ModuleState<FastingPlan>;
  shopping: ModuleState<ShoppingPlan>;
  motivation: ModuleState<DailyMotivation>;
  hydrationSleep: ModuleState<HydrationSleepPlan>;
  lifestyle: ModuleState<LifestylePlan>;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  profileSnapshot: Pick<
    UserProfile,
    "age" | "gender" | "goal" | "weightKg" | "heightCm"
  >;
  plan: HealthPlan;
}

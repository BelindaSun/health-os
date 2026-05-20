// ============================================================
//  Health OS — 类型定义 v3
//  AIProvider 扩展为五选一：ollama/deepseek/openai/claude/gemini/qwen
// ============================================================

// ─── 用户画像 ────────────────────────────────────────────────

export type Gender = "male" | "female" | "other";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type ActivityLevel = "low" | "medium" | "high";
export type MainChallenge = "appetite" | "motivation" | "time";
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
  // 基础生理
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;

  // 目标与生活方式
  goal: DietGoal;
  lifestyleType: LifestyleType;
  activityLevel: ActivityLevel;
  fitnessLevel: FitnessLevel;

  // 时间 & 财务
  sleepTime: string;
  wakeTime: string;
  weeklyBudget: number;
  availableMinutesPerDay: number;

  // 饮食风格
  dietStyle: DietStyle;

  // 器材 & 挑战
  hasEquipment: boolean;
  equipmentList?: string;
  mainChallenge: MainChallenge;

  // AI 配置
  provider?: AIProvider;
  openaiApiKey?: string; // 所有云端provider的Key都存这里
  modelName?: string;    // 本地Ollama用
}

// ─── 通用模块状态 ────────────────────────────────────────────

export type ModuleStatus = "idle" | "loading" | "success" | "error";

export interface ModuleState<T> {
  status: ModuleStatus;
  data: T | null;
  error?: string;
  generatedAt?: string;
}

// ─── 模块 1：营养计划 ────────────────────────────────────────

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

// ─── 模块 2：训练计划 ────────────────────────────────────────

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

// ─── 模块 3：断食指南 ────────────────────────────────────────

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

// ─── 模块 4：购物清单 ────────────────────────────────────────

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

// ─── 模块 5：每日动力 ────────────────────────────────────────

export interface DailyMotivation {
  fatLossTip: string;
  quote: string;
  quoteAuthor?: string;
  dailyTask: string;
  morningRoutine: string[];
  mindsetShift: string;
  personalizedNote: string;
}

// ─── 模块 6：水&睡眠 ────────────────────────────────────────

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

// ─── 模块 7：生活方式 ────────────────────────────────────────

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

// ─── 完整健康方案 ────────────────────────────────────────────

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

// ─── Store 类型 ──────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  createdAt: string;
  profileSnapshot: Pick<
    UserProfile,
    "age" | "gender" | "goal" | "weightKg" | "heightCm"
  >;
  plan: HealthPlan;
}

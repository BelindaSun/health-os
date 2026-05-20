// ============================================================
//  store/planStore.ts v2
//  完全对齐 health.ts v2 的类型，移除旧版 ALL_MODULES / HealthModule / ShoppingList
// ============================================================

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  HealthPlan,
  ModuleStatus,
  NutritionPlan,
  WorkoutPlan,
  FastingPlan,
  ShoppingPlan,
  DailyMotivation,
  HydrationSleepPlan,
  LifestylePlan,
  UserProfile,
} from "@/lib/types/health";

// ─── 模块 key 类型（替代旧版 ALL_MODULES 数组）──────────────

export type ModuleKey =
  | "nutrition"
  | "workout"
  | "fasting"
  | "shopping"
  | "motivation"
  | "hydrationSleep"
  | "lifestyle";

export const MODULE_KEYS: ModuleKey[] = [
  "nutrition",
  "workout",
  "fasting",
  "shopping",
  "motivation",
  "hydrationSleep",
  "lifestyle",
];

// ─── 模块数据联合类型（替代旧版 HealthModule）───────────────

export type ModuleData =
  | NutritionPlan
  | WorkoutPlan
  | FastingPlan
  | ShoppingPlan
  | DailyMotivation
  | HydrationSleepPlan
  | LifestylePlan;

// ─── 空方案工厂 ───────────────────────────────────────────────

function emptyModuleState() {
  return { status: "idle" as ModuleStatus, data: null };
}

function createEmptyPlan(profile: UserProfile): HealthPlan {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    profile,
    nutrition: emptyModuleState(),
    workout: emptyModuleState(),
    fasting: emptyModuleState(),
    shopping: emptyModuleState(),
    motivation: emptyModuleState(),
    hydrationSleep: emptyModuleState(),
    lifestyle: emptyModuleState(),
  };
}

// ─── Store 定义 ───────────────────────────────────────────────

interface PlanState {
  plan: HealthPlan | null;

  // 初始化（生成前调用，传入当前 profile）
  initPlan: (profile: UserProfile) => void;

  // 单模块状态变更
  setPlanLoading: (key: ModuleKey) => void;
  setPlanData: (key: ModuleKey, data: ModuleData) => void;
  setPlanError: (key: ModuleKey, error: string) => void;

  // 所有模块完成后固化方案（返回最终 plan 供 history 存档）
  finalizePlan: () => HealthPlan | null;

  // 清空
  resetPlan: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: null,

      initPlan: (profile) => {
        set({ plan: createEmptyPlan(profile) });
      },

      setPlanLoading: (key) => {
        set((s) => {
          if (!s.plan) return s;
          return {
            plan: {
              ...s.plan,
              [key]: { status: "loading" as ModuleStatus, data: null },
            },
          };
        });
      },

      setPlanData: (key, data) => {
        set((s) => {
          if (!s.plan) return s;
          return {
            plan: {
              ...s.plan,
              [key]: {
                status: "success" as ModuleStatus,
                data,
                generatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setPlanError: (key, error) => {
        set((s) => {
          if (!s.plan) return s;
          return {
            plan: {
              ...s.plan,
              [key]: { status: "error" as ModuleStatus, data: null, error },
            },
          };
        });
      },

      finalizePlan: () => {
        const plan = get().plan;
        if (!plan) return null;
        // 把 id 和 createdAt 固化为生成完成时间
        const finalized: HealthPlan = {
          ...plan,
          createdAt: new Date().toISOString(),
        };
        set({ plan: finalized });
        return finalized;
      },

      resetPlan: () => set({ plan: null }),
    }),
    {
      name: "health-os-plan",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

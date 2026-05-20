// ============================================================
// hooks/useHealthPlan.ts
// 连接 AI router ↔ Zustand stores 的核心 hook
// 在 page.tsx 里一行调用，替换现有的 fetch + useState 逻辑
// ============================================================

"use client";

import { useCallback } from "react";
import { useProfileStore, usePlanStore, useHistoryStore } from "@/store";
import { HealthModule } from "@/lib/types/health";
import {
  NutritionPlan,
  WorkoutPlan,
  FastingPlan,
  ShoppingList,
  DailyMotivation,
  HydrationSleepPlan,
  LifestylePlan,
} from "@/lib/types/health";

export function useHealthPlan() {
  const { profile } = useProfileStore();
  const {
    currentPlan,
    isGenerating,
    error,
    initPlan,
    finalizePlan,
    setError,
    setModuleStatus,
    setNutrition,
    setWorkout,
    setFasting,
    setShopping,
    setMotivation,
    setHydrationSleep,
    setLifestyle,
    isAllDone,
  } = usePlanStore();
  const { addEntry } = useHistoryStore();

  const generate = useCallback(async () => {
    const planId = initPlan(profile);

    try {
      // 调用 API route（服务端处理 Ollama 调用）
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, planId }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { result } = await response.json();

      // 逐个写入 store（触发每个模块卡片更新）
      if (result.nutrition) {
        setModuleStatus("nutrition", "loading");
        setNutrition(result.nutrition as NutritionPlan);
      } else {
        setModuleStatus("nutrition", "error");
      }

      if (result.workout) {
        setModuleStatus("workout", "loading");
        setWorkout(result.workout as WorkoutPlan);
      } else {
        setModuleStatus("workout", "error");
      }

      if (result.fasting) {
        setModuleStatus("fasting", "loading");
        setFasting(result.fasting as FastingPlan);
      } else {
        setModuleStatus("fasting", "error");
      }

      if (result.shopping) {
        setModuleStatus("shopping", "loading");
        setShopping(result.shopping as ShoppingList);
      } else {
        setModuleStatus("shopping", "error");
      }

      if (result.motivation) {
        setModuleStatus("motivation", "loading");
        setMotivation(result.motivation as DailyMotivation);
      } else {
        setModuleStatus("motivation", "error");
      }

      if (result.hydrationSleep) {
        setModuleStatus("hydrationSleep", "loading");
        setHydrationSleep(result.hydrationSleep as HydrationSleepPlan);
      } else {
        setModuleStatus("hydrationSleep", "error");
      }

      if (result.lifestyle) {
        setModuleStatus("lifestyle", "loading");
        setLifestyle(result.lifestyle as LifestylePlan);
      } else {
        setModuleStatus("lifestyle", "error");
      }

      finalizePlan();

      // 存入历史（只存完整或部分成功的方案）
      if (currentPlan) {
        addEntry({ ...currentPlan, id: planId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "生成失败，请重试";
      setError(msg);
    }
  }, [profile]);

  return {
    profile,
    currentPlan,
    isGenerating,
    error,
    generate,
    isAllDone: isAllDone(),
  };
}

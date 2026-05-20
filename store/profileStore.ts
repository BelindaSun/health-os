// ============================================================
//  profileStore v2 — 扩展用户画像持久化
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/types/health";

interface ProfileState {
  profile: UserProfile;
  setProfile: (partial: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 28,
  gender: "female",
  heightCm: 165,
  weightKg: 60,
  goal: "weight_loss",
  lifestyleType: "sedentary",
  activityLevel: "low",
  fitnessLevel: "beginner",
  sleepTime: "23:00",
  wakeTime: "07:00",
  weeklyBudget: 200,
  availableMinutesPerDay: 30,
  dietStyle: "budget",
  hasEquipment: false,
  equipmentList: "",
  mainChallenge: "motivation",
  provider: "ollama",
  modelName: "qwen2.5:3b",
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      setProfile: (partial) =>
        set((s) => ({ profile: { ...s.profile, ...partial } })),
      resetProfile: () => set({ profile: DEFAULT_PROFILE }),
    }),
    {
      name: "health-os-profile",
      // merge 策略：旧 localStorage 数据和新默认值合并，新字段不会丢失
      merge: (persisted, current) => ({
        ...current,
        profile: {
          ...DEFAULT_PROFILE,
          ...(persisted as ProfileState).profile,
        },
      }),
    }
  )
);

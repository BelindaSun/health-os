// store/historyStore.ts v2
// 对齐新版 HealthPlan 类型，移除旧版 weight/height 字段

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HealthPlan } from "@/lib/types/health";

const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  createdAt: string;
  planSnapshot: HealthPlan;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (plan: HealthPlan) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getById: (id: string) => HistoryEntry | undefined;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (plan) => {
        const entry: HistoryEntry = {
          id: plan.id,
          createdAt: plan.createdAt,
          planSnapshot: plan,
        };
        set((state) => {
          const filtered = state.entries.filter((e) => e.id !== plan.id);
          return { entries: [entry, ...filtered].slice(0, MAX_HISTORY) };
        });
      },

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearHistory: () => set({ entries: [] }),

      getById: (id) => get().entries.find((e) => e.id === id),
    }),
    {
      name: "health-os-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

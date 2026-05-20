"use client";

import { useState } from "react";
import Link from "next/link";
import { useHistoryStore } from "@/store/historyStore";
import { usePlanStore } from "@/store/planStore";
import type { HealthPlan } from "@/lib/types/health";

// ─── 工具函数 ────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MODULE_KEYS = [
  "nutrition",
  "workout",
  "fasting",
  "shopping",
  "motivation",
  "hydrationSleep",
  "lifestyle",
] as const;

const MODULE_LABELS: Record<typeof MODULE_KEYS[number], string> = {
  nutrition: "🥗 营养",
  workout: "💪 训练",
  fasting: "⏳ 断食",
  shopping: "🛒 购物",
  motivation: "🔥 动力",
  hydrationSleep: "💧 睡眠",
  lifestyle: "🌿 生活",
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "减脂瘦身",
  muscle_gain: "增肌塑形",
  maintain: "维持健康",
  endurance: "提升耐力",
};

// 统计成功模块数（兼容新版独立 status 字段）
function moduleSuccessCount(plan: HealthPlan): number {
  return MODULE_KEYS.filter((k) => plan[k]?.status === "success").length;
}

// ─── 历史卡片 ─────────────────────────────────────────────────

function HistoryCard({
  entry,
  onDelete,
  onRestore,
}: {
  entry: { id: string; createdAt: string; planSnapshot: HealthPlan };
  onDelete: (id: string) => void;
  onRestore: (plan: HealthPlan) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const plan = entry.planSnapshot;
  const successCount = moduleSuccessCount(plan);
  const profile = plan.profile;

  async function handleShare() {
    try {
      const { encodePlan } = await import("@/lib/share/codec");
      const url = `${window.location.origin}/share?p=${encodePlan(plan)}`;
      await navigator.clipboard.writeText(url);
      setShareMsg("已复制！");
      setTimeout(() => setShareMsg(""), 2000);
    } catch {
      setShareMsg("复制失败");
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:border-white/20 transition">
      {/* 标题区 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">{formatDate(entry.createdAt)}</p>
          <h3 className="text-lg font-bold">
            {GOAL_LABELS[profile.goal] ?? profile.goal}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {profile.age}岁 · {profile.weightKg}kg · {profile.heightCm}cm
          </p>
        </div>
        <div className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
          successCount === 7
            ? "bg-emerald-500/20 text-emerald-300"
            : successCount >= 4
            ? "bg-yellow-500/20 text-yellow-300"
            : "bg-red-500/20 text-red-300"
        }`}>
          {successCount}/7 模块
        </div>
      </div>

      {/* 模块状态 pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {MODULE_KEYS.map((key) => (
          <div
            key={key}
            className={`text-xs px-2.5 py-1 rounded-lg ${
              plan[key]?.status === "success"
                ? "bg-white/10 text-slate-200"
                : "bg-white/5 text-slate-600 line-through"
            }`}
          >
            {MODULE_LABELS[key]}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onRestore(plan)}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition"
        >
          载入此方案
        </button>

        <button
          onClick={handleShare}
          className="px-4 py-2.5 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-sm transition"
        >
          {shareMsg || "分享"}
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm transition"
          >
            删除
          </button>
        ) : (
          <button
            onClick={() => onDelete(entry.id)}
            className="px-4 py-2.5 rounded-2xl bg-red-500/20 text-red-300 text-sm font-semibold transition"
          >
            确认删除
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 空状态 ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-32">
      <div className="text-6xl mb-6">📭</div>
      <h3 className="text-2xl font-bold mb-3">还没有历史方案</h3>
      <p className="text-slate-400 mb-8">生成你的第一个健康方案后，会自动保存在这里。</p>
      <Link
        href="/"
        className="inline-block px-8 py-4 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
      >
        去生成健康方案
      </Link>
    </div>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────

export default function HistoryPage() {
  const { entries, removeEntry, clearHistory } = useHistoryStore();
  const { initPlan, setPlanData, setPlanError } = usePlanStore();

  const [confirmClear, setConfirmClear] = useState(false);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  function handleRestore(plan: HealthPlan) {
    // 用保存的 profile 初始化 store
    initPlan(plan.profile);

    // 把每个模块数据写回 planStore
    MODULE_KEYS.forEach((key) => {
      const module = plan[key];
      if (module?.status === "success" && module.data) {
        setPlanData(key, module.data as any);
      } else {
        setPlanError(key, "历史数据不可用");
      }
    });

    setRestoredId(plan.id);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* 导航 */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition text-sm text-slate-300"
          >
            ← 返回首页
          </Link>

          {entries.length > 0 && (
            !confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm transition"
              >
                清空历史
              </button>
            ) : (
              <button
                onClick={() => { clearHistory(); setConfirmClear(false); }}
                className="px-4 py-2 rounded-full bg-red-500/20 text-red-300 text-sm font-semibold transition"
              >
                确认清空
              </button>
            )
          )}
        </div>

        {/* 标题 */}
        <header className="mb-8">
          <h1 className="text-4xl font-black mb-2">历史方案</h1>
          <p className="text-slate-400">
            {entries.length > 0
              ? `共 ${entries.length} 个历史方案，最多保存 20 个`
              : "你的历史健康方案会自动保存在这里"}
          </p>
        </header>

        {/* 载入成功提示 */}
        {restoredId && (
          <div className="mb-6 flex items-center justify-between px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-emerald-300 text-sm">方案已载入，返回首页查看结果</span>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 transition"
            >
              去查看 →
            </Link>
          </div>
        )}

        {/* 内容区 */}
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onDelete={removeEntry}
                onRestore={handleRestore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

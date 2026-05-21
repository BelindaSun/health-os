"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodePlan } from "@/lib/share/codec";
import type {
  NutritionPlan,
  WorkoutPlan,
  FastingPlan,
  ShoppingPlan,
  DailyMotivation,
  HydrationSleepPlan,
  LifestylePlan,
  ShoppingCategory,
} from "@/lib/types/health";

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  protein: "🥩 蛋白质",
  carbs: "🌾 碳水化合物",
  healthy_fats: "🥑 健康脂肪",
  vegetables_fruits: "🥦 蔬菜水果",
  snacks: "🥜 零食",
  condiments: "🫙 调味料",
};

const MEAL_META = {
  breakfast: { label: "早餐", emoji: "🌅", accent: "text-amber-400" },
  lunch:     { label: "午餐", emoji: "☀️",  accent: "text-emerald-400" },
  dinner:    { label: "晚餐", emoji: "🌙", accent: "text-violet-400" },
  snack:     { label: "加餐", emoji: "🥜", accent: "text-sky-400" },
} as const;

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
      {children}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white/[0.03] border border-white/10 backdrop-blur overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

function PersonalizedNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 mt-3">
      <p className="text-xs text-slate-500 flex gap-1.5">
        <span>🌟</span>
        <span>{children}</span>
      </p>
    </div>
  );
}

function NutritionSection({ data }: { data: NutritionPlan }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = data.weeklyPlan?.[selectedDay];

  return (
    <SectionCard title="🥗 个人营养计划">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
          <p className="text-xs text-slate-500">每日目标热量</p>
          <p className="text-3xl font-black text-emerald-400 leading-none mt-0.5">
            {data.dailyCalorieTarget}
            <span className="text-sm font-normal text-slate-500 ml-1">kcal</span>
          </p>
          {data.macroSplit && (
            <div className="flex gap-3 mt-3">
              {[
                { label: "蛋白质", value: data.macroSplit.protein, color: "text-sky-400" },
                { label: "碳水",   value: data.macroSplit.carbs,   color: "text-amber-400" },
                { label: "脂肪",   value: data.macroSplit.fat,     color: "text-rose-400" },
              ].map((m) => (
                <div key={m.label} className="flex-1 text-center p-2 rounded-xl bg-white/5">
                  <p className={`text-sm font-black ${m.color}`}>{m.value}%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.keyPrinciples?.length > 0 && (
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-slate-500 mb-2">核心饮食原则</p>
            <ul className="space-y-1.5">
              {data.keyPrinciples.map((p, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2 items-start">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.weeklyPlan?.length > 0 && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {data.weeklyPlan.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedDay === i ? "bg-emerald-500 text-black" : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {d.day}
                </button>
              ))}
            </div>
            {day && (
              <div className="space-y-2">
                {(["breakfast", "lunch", "dinner", "snack"] as const).map((mealKey) => {
                  const m = day[mealKey];
                  if (!m) return null;
                  const meta = MEAL_META[mealKey];
                  return (
                    <div key={mealKey} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs text-slate-400 font-medium">
                          {meta.emoji} {meta.label} · {m.name}
                        </span>
                        <span className={`text-xs font-bold ${meta.accent}`}>{m.calories} kcal</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {m.foods?.map((f, fi) => <Tag key={fi}>{f}</Tag>)}
                      </div>
                      {m.notes && <p className="text-xs text-slate-500 mt-1.5 italic">💡 {m.notes}</p>}
                    </div>
                  );
                })}
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span>当日热量合计</span>
                  <span className="text-emerald-400 font-bold">{day.totalCalories} kcal</span>
                </div>
              </div>
            )}
          </>
        )}
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

function WorkoutSection({ data }: { data: WorkoutPlan }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = data.weeklySchedule?.[selectedDay];
  const isRest = day?.focus?.includes("休息");

  const muscleColor = (group: string) => {
    const g = group?.toLowerCase() ?? "";
    if (g.includes("胸")) return "bg-rose-500/20 text-rose-300 border-rose-500/20";
    if (g.includes("背")) return "bg-sky-500/20 text-sky-300 border-sky-500/20";
    if (g.includes("腿") || g.includes("臀")) return "bg-violet-500/20 text-violet-300 border-violet-500/20";
    if (g.includes("肩")) return "bg-amber-500/20 text-amber-300 border-amber-500/20";
    if (g.includes("腹") || g.includes("core")) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/20";
    return "bg-white/10 text-slate-300 border-white/10";
  };

  return (
    <SectionCard title="💪 居家训练计划">
      <div className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">{data.overview}</p>
        <div className="flex gap-1.5 flex-wrap">
          {data.weeklySchedule?.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedDay === i
                  ? d.focus?.includes("休息") ? "bg-slate-600 text-white" : "bg-emerald-500 text-black"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {d.day}{d.focus?.includes("休息") && " 🛌"}
            </button>
          ))}
        </div>
        {day && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <p className="text-sm font-bold text-emerald-400">{day.focus}</p>
              <p className="text-xs text-slate-500 mt-0.5">{day.durationMinutes} 分钟</p>
            </div>
            {isRest ? (
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 text-center">
                <p className="text-2xl mb-1">🛌</p>
                <p className="text-sm text-slate-300 font-medium">今天好好休息</p>
                <p className="text-xs text-slate-500 mt-1">肌肉在恢复中生长，休息日同样重要</p>
              </div>
            ) : (
              <>
                {day.warmup?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">🔥 热身</p>
                    <div className="flex flex-wrap gap-1.5">
                      {day.warmup.map((w, i) => <Tag key={i}>{w}</Tag>)}
                    </div>
                  </div>
                )}
                {day.exercises?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">💪 主体训练</p>
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-slate-100">{ex.name}</span>
                          <span className="text-xs text-emerald-400 font-bold shrink-0">
                            {ex.sets ? `${ex.sets}组` : ""} {ex.reps}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${muscleColor(ex.muscleGroup)}`}>
                            {ex.muscleGroup}
                          </span>
                          {ex.tip && <p className="text-xs text-slate-500 flex-1 text-right ml-2">💡 {ex.tip}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {day.cooldown?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">🧘 冷身拉伸</p>
                    <div className="flex flex-wrap gap-1.5">
                      {day.cooldown.map((c, i) => <Tag key={i}>{c}</Tag>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {data.progressionLogic && (
          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-semibold mb-1">📈 4周进阶逻辑</p>
            <p className="text-xs text-slate-400 leading-relaxed">{data.progressionLogic}</p>
          </div>
        )}
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

function FastingSection({ data }: { data: FastingPlan }) {
  return (
    <SectionCard title="⏳ 断食指南">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-3xl font-black text-amber-400">{data.recommendedProtocol}</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{data.rationale}</p>
          {data.windows && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500">断食开始</p>
                  <p className="text-sm font-bold text-amber-400">{data.windows.fastStart}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500">进食开始</p>
                  <p className="text-sm font-bold text-emerald-400">{data.windows.eatStart}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.fastingAllowed?.length > 0 && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <p className="text-xs text-slate-500 mb-1.5 font-semibold">断食期允许 ✓</p>
              <ul className="space-y-1">
                {data.fastingAllowed.map((item, i) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-1.5 items-start">
                    <span className="text-emerald-500 shrink-0">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.beginnerTips?.length > 0 && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <p className="text-xs text-slate-500 mb-1.5 font-semibold">新手技巧 💡</p>
              <ul className="space-y-1">
                {data.beginnerTips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-1.5 items-start">
                    <span className="text-amber-500 shrink-0">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

function ShoppingSection({ data }: { data: ShoppingPlan }) {
  const byCategory = data.items?.reduce<Record<string, typeof data.items>>(
    (acc, item) => {
      const cat = item.category ?? "protein";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );
  const budgetPct = Math.min(data.budgetUsagePercent ?? 0, 100);
  const budgetColor =
    budgetPct > 90 ? "from-rose-500 to-red-400"
    : budgetPct > 70 ? "from-amber-500 to-yellow-400"
    : "from-emerald-500 to-teal-400";

  return (
    <SectionCard title="🛒 购物清单">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-slate-500">本周总花费</p>
              <p className="text-3xl font-black text-white leading-none mt-0.5">¥{data.totalEstimatedCost}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">预算使用</p>
              <p className={`text-2xl font-black ${budgetPct > 90 ? "text-rose-400" : budgetPct > 70 ? "text-amber-400" : "text-emerald-400"}`}>
                {budgetPct}%
              </p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${budgetColor} transition-all duration-700`} style={{ width: `${budgetPct}%` }} />
          </div>
        </div>
        {byCategory && Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-slate-300">{CATEGORY_LABELS[cat as ShoppingCategory] ?? cat}</span>
              <span className="text-xs text-slate-500">({items.length}项)</span>
            </div>
            <div className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between p-2.5 rounded-xl bg-white/5">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.quantity}</span>
                    </div>
                    {item.tip && <p className="text-xs text-slate-600 mt-0.5 italic">💡 {item.tip}</p>}
                  </div>
                  <span className="text-sm text-emerald-400 font-bold ml-3 shrink-0">¥{item.estimatedCost}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

function MotivationSection({ data }: { data: DailyMotivation }) {
  return (
    <SectionCard title="🔥 每日动力">
      <div className="space-y-3">
        {data.quote && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <p className="text-sm text-violet-300 italic">&ldquo;{data.quote}&rdquo;</p>
            {data.quoteAuthor && <p className="text-xs text-slate-500 mt-1.5 text-right">— {data.quoteAuthor}</p>}
          </div>
        )}
        {data.dailyTask && (
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs text-orange-400 font-semibold mb-1">🎯 今日任务</p>
            <p className="text-sm text-slate-300">{data.dailyTask}</p>
          </div>
        )}
        {data.morningRoutine?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">☀️ 晨间三步走</p>
            <div className="space-y-1.5">
              {data.morningRoutine.map((h, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-300">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.mindsetShift && (
          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-semibold mb-1">🧠 思维转变</p>
            <p className="text-sm text-slate-300">{data.mindsetShift}</p>
          </div>
        )}
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

function HydrationSleepSection({ data }: { data: HydrationSleepPlan }) {
  const waterMl = Math.min(Math.max(data.dailyWaterTarget ?? 2000, 1200), 4000);
  return (
    <SectionCard title="💧 水 & 睡眠">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <span className="text-3xl">💧</span>
          <div>
            <p className="text-xs text-slate-500">每日饮水目标</p>
            <p className="text-2xl font-black text-sky-400">{(waterMl / 1000).toFixed(1)}L</p>
            <p className="text-xs text-slate-500">{waterMl} ml</p>
          </div>
        </div>
        {data.hydrationSchedule?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">饮水时间表</p>
            <div className="space-y-1.5">
              {data.hydrationSchedule.map((h, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <span className="text-xs text-slate-500 w-10 shrink-0">{h.time}</span>
                  <span className="text-xs text-sky-400 w-14 shrink-0">{h.amount}</span>
                  <span className="text-xs text-slate-400">{h.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.eveningRoutine?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">🌙 晚间睡眠习惯</p>
            <ul className="space-y-1">
              {data.eveningRoutine.map((r, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-violet-400">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.scienceNote && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400">🔬 {data.scienceNote}</p>
          </div>
        )}
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

function LifestyleSection({ data }: { data: LifestylePlan }) {
  const categoryIcon: Record<string, string> = {
    nutrition: "🥗", activity: "🏃", mindset: "🧠", lifestyle: "🌿",
  };
  return (
    <SectionCard title="🌿 生活方式计划">
      <div className="space-y-4">
        {data.headline && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <p className="text-base font-bold text-emerald-300 text-center">{data.headline}</p>
          </div>
        )}
        {data.habits?.length > 0 && (
          <div className="space-y-2">
            {data.habits.map((h, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white/5">
                <div className="flex gap-2 items-start">
                  <span className="text-lg">{categoryIcon[h.category] ?? "•"}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{h.habit}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{h.frequency} · {h.howTo}</p>
                    <p className="text-xs text-emerald-400/70 mt-0.5 italic">{h.whyItWorks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.weeklyMilestones?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">📅 4周里程碑</p>
            <div className="space-y-1.5">
              {data.weeklyMilestones.map((m, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-xs text-slate-300 pt-0.5">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.challengeStrategy && (
          <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/20">
            <p className="text-xs text-orange-400 font-semibold mb-1">⚡ 你的挑战应对策略</p>
            <p className="text-xs text-slate-400">{data.challengeStrategy}</p>
          </div>
        )}
        {data.personalizedNote && <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>}
      </div>
    </SectionCard>
  );
}

// ─── 加载占位 ─────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🌿</div>
        <p className="text-slate-400 text-sm">加载中...</p>
      </div>
    </div>
  );
}

// ─── 核心页面内容（需要 useSearchParams，必须包在 Suspense 里）──

function SharePageInner() {
  const searchParams = useSearchParams();
  const [decoded, setDecoded] = useState<ReturnType<typeof decodePlan> | null | "loading">("loading");

  useEffect(() => {
    const p = searchParams.get("p");
    if (!p) { setDecoded(null); return; }
    setDecoded(decodePlan(p));
  }, [searchParams]);

  if (decoded === "loading") return <LoadingScreen />;

  if (!decoded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-2xl font-bold mb-3">找不到这个方案</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
            链接可能已损坏或被截断。建议让对方导出 PDF 再分享。
          </p>
          <Link href="/" className="inline-block px-8 py-4 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
            生成我自己的健康方案 →
          </Link>
        </div>
      </div>
    );
  }

  const { profile, nutrition, workout, fasting, shopping, motivation, hydrationSleep, lifestyle } = decoded;
  const goalLabel: Record<string, string> = {
    weight_loss: "🔥 减脂瘦身",
    muscle_gain: "💪 增肌塑形",
    maintain:    "⚖️ 维持健康",
    endurance:   "🏃 提升耐力",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="pt-8 pb-4">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm text-slate-300">
            ← 返回首页
          </Link>
        </div>
        <div className="p-6 rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <p className="text-xs text-emerald-400/60 tracking-widest uppercase mb-2">AI Health OS · 个人健康方案</p>
          <h1 className="text-2xl font-black mb-3">{goalLabel[profile.goal] ?? profile.goal}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span>{profile.age} 岁</span>
            <span>·</span>
            <span>{profile.gender === "female" ? "女" : profile.gender === "male" ? "男" : "其他"}</span>
            <span>·</span>
            <span>{profile.weightKg} kg</span>
            <span>·</span>
            <span>{profile.heightCm} cm</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            生成于 {new Date(decoded.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="space-y-4">
          {nutrition?.data && <NutritionSection data={nutrition.data as NutritionPlan} />}
          {workout?.data    && <WorkoutSection  data={workout.data  as WorkoutPlan} />}
          {fasting?.data    && <FastingSection  data={fasting.data  as FastingPlan} />}
          {shopping?.data   && <ShoppingSection data={shopping.data as ShoppingPlan} />}
          {motivation?.data && <MotivationSection data={motivation.data as DailyMotivation} />}
          {hydrationSleep?.data && <HydrationSleepSection data={hydrationSleep.data as HydrationSleepPlan} />}
          {lifestyle?.data  && <LifestyleSection data={lifestyle.data as LifestylePlan} />}
        </div>
        <div className="mt-10 p-6 rounded-[28px] border border-white/10 bg-white/[0.03] text-center">
          <p className="text-slate-400 text-sm mb-4">想要生成属于你自己的 AI 健康方案？</p>
          <Link href="/" className="inline-block px-8 py-3 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
            免费生成我的健康方案 →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 默认导出：Suspense 包装 ──────────────────────────────────

export default function SharePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SharePageInner />
    </Suspense>
  );
}

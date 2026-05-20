"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodePlan } from "@/lib/share/codec";
import { toArray, toString } from "@/lib/ai/utils/normalize";

function BulletList({ items, dotColor }: { items: unknown[]; dotColor: string }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
          <div className="text-slate-300 text-sm leading-relaxed">
            {typeof item === "string" ? item : JSON.stringify(item)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SharedPlanView({ plan }: { plan: NonNullable<ReturnType<typeof decodePlan>> }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">

      {plan.nutrition && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6">
          <h3 className="text-2xl font-bold mb-4">🥗 营养计划</h3>
          {plan.nutrition.summary && (
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">{plan.nutrition.summary}</p>
          )}
          {plan.nutrition.dailyCalories && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { label: "每日热量", value: `${plan.nutrition.dailyCalories} kcal` },
                { label: "蛋白质", value: `${plan.nutrition.macros?.protein ?? "--"}g` },
                { label: "碳水", value: `${plan.nutrition.macros?.carbs ?? "--"}g` },
                { label: "脂肪", value: `${plan.nutrition.macros?.fat ?? "--"}g` },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center">
                  <div className="text-emerald-300 font-bold text-sm">{m.value}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          )}
          {toArray(plan.nutrition.days).slice(0, 7).map((day: any, i: number) => (
            <div key={i} className="mb-2 p-3 rounded-xl bg-white/5">
              <div className="text-emerald-400 text-xs font-semibold mb-1">{day.day}</div>
              <div className="text-slate-300 text-sm space-y-0.5">
                <div>早 · {toString(day.breakfast, "—")}</div>
                <div>午 · {toString(day.lunch, "—")}</div>
                <div>晚 · {toString(day.dinner, "—")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.workout && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6">
          <h3 className="text-2xl font-bold mb-4">💪 训练计划</h3>
          {plan.workout.summary && (
            <p className="text-slate-400 text-sm mb-3 leading-relaxed">{plan.workout.summary}</p>
          )}
          {plan.workout.weeklyProgress && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
              📈 {plan.workout.weeklyProgress}
            </div>
          )}
          {toArray(plan.workout.days).map((day: any, i: number) => (
            <div key={i} className="mb-2 p-3 rounded-xl bg-white/5">
              <div className="flex justify-between mb-1">
                <span className="text-cyan-400 text-xs font-semibold">{day.day}</span>
                <span className="text-slate-500 text-xs">{day.focus}</span>
              </div>
              {toArray(day.exercises).slice(0, 4).map((ex: any, j: number) => (
                <div key={j} className="flex gap-2 text-slate-300 text-sm">
                  <span className="text-slate-500">·</span>
                  <span>{toString(ex.name, JSON.stringify(ex))}</span>
                  {ex.sets && ex.reps && (
                    <span className="text-slate-500 ml-auto">{ex.sets}×{ex.reps}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {plan.fasting && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6">
          <h3 className="text-2xl font-bold mb-4">⏳ 断食指南</h3>
          <div className="flex gap-3 mb-4">
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-center">
              <div className="text-purple-300 font-black text-xl">{plan.fasting.protocol}</div>
              <div className="text-slate-500 text-xs mt-0.5">断食模式</div>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
              <div className="text-white font-bold text-sm">{plan.fasting.eatingWindow}</div>
              <div className="text-slate-500 text-xs mt-0.5">进食窗口</div>
            </div>
          </div>
          {toArray(plan.fasting.hourlySchedule).slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="flex gap-3 items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-purple-400 text-xs w-12 font-mono">{s.time}</span>
              <span className="text-slate-300 text-sm">{s.action}</span>
            </div>
          ))}
        </div>
      )}

      {plan.shopping && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6">
          <h3 className="text-2xl font-bold mb-4">🛒 购物清单</h3>
          {plan.shopping.estimatedTotal && (
            <div className="mb-4 text-sm text-slate-400">
              预计总价 <span className="text-white font-bold">¥{plan.shopping.estimatedTotal}</span>
            </div>
          )}
          {(["protein","carbs","fats","vegetables","snacks"] as const).map((cat) => {
            const items = toArray(plan.shopping![cat]);
            if (!items.length) return null;
            const labels = { protein:"蛋白质", carbs:"碳水", fats:"健康脂肪", vegetables:"蔬菜水果", snacks:"零食" };
            return (
              <div key={cat} className="mb-3">
                <div className="text-xs text-slate-500 mb-1.5">{labels[cat]}</div>
                <div className="flex flex-wrap gap-2">
                  {items.map((item: any, i: number) => (
                    <div key={i} className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs">
                      {toString(item.name, "")} · {toString(item.quantity, "")}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {plan.motivation && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6">
          <h3 className="text-2xl font-bold mb-4">🔥 今日动力</h3>
          {plan.motivation.quote && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 mb-3">
              <p className="text-white font-semibold leading-relaxed">"{plan.motivation.quote}"</p>
            </div>
          )}
          {plan.motivation.tip && (
            <div className="mb-2 px-4 py-3 rounded-xl bg-white/5 text-slate-300 text-sm">{plan.motivation.tip}</div>
          )}
          {plan.motivation.task && (
            <div className="px-4 py-3 rounded-xl bg-white/5 text-slate-300 text-sm">✅ {plan.motivation.task}</div>
          )}
        </div>
      )}

      {plan.hydrationSleep && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6">
          <h3 className="text-2xl font-bold mb-4">💧 水 & 睡眠</h3>
          {plan.hydrationSleep.dailyWaterTarget && (
            <div className="mb-4 text-center py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-cyan-300 font-black text-2xl">{plan.hydrationSleep.dailyWaterTarget}</span>
              <span className="text-slate-500 text-sm ml-2">每日目标饮水量</span>
            </div>
          )}
          {toArray(plan.hydrationSleep.hydrationSchedule).slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="flex gap-3 items-center py-1.5 border-b border-white/5 last:border-0">
              <span className="text-cyan-400 text-xs w-12 font-mono">{s.time}</span>
              <span className="text-slate-300 text-sm">{s.amount}</span>
            </div>
          ))}
          {toArray(plan.hydrationSleep.eveningRoutine).length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">晚间习惯</div>
              <BulletList items={toArray(plan.hydrationSleep.eveningRoutine)} dotColor="bg-indigo-400" />
            </div>
          )}
        </div>
      )}

      {plan.lifestyle && (
        <div className="rounded-3xl bg-black/30 border border-white/10 p-6 lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4">🌿 生活方式减脂计划</h3>
          {plan.lifestyle.nutritionStrategy && (
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">{plan.lifestyle.nutritionStrategy}</p>
          )}
          <div className="grid lg:grid-cols-2 gap-6">
            {toArray(plan.lifestyle.mindsetPillars).length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">心态支柱</div>
                <BulletList items={toArray(plan.lifestyle.mindsetPillars)} dotColor="bg-green-400" />
              </div>
            )}
            {toArray(plan.lifestyle.lifestyleHabits).length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">关键习惯</div>
                <BulletList items={toArray(plan.lifestyle.lifestyleHabits)} dotColor="bg-emerald-400" />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<ReturnType<typeof decodePlan>>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    const encoded = searchParams.get("p");
    if (!encoded) { setStatus("error"); return; }
    const decoded = decodePlan(encoded);
    if (!decoded) { setStatus("error"); return; }
    setPlan(decoded);
    setStatus("ok");
  }, [searchParams]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMsg("已复制！");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("复制失败");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">解析中…</div>
      </div>
    );
  }

  if (status === "error" || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-3xl font-bold mb-3">链接无效或已损坏</h2>
          <p className="text-slate-400 mb-8">请重新从 App 内生成分享链接。</p>
          <Link href="/" className="inline-block px-8 py-4 rounded-2xl bg-white text-black font-semibold hover:scale-105 transition">
            去生成我的健康系统
          </Link>
        </div>
      </div>
    );
  }

  const p = plan.profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition">
            <span>←</span>
            <span className="text-sm text-slate-300">返回首页</span>
          </Link>
          <button onClick={handleCopy} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 text-sm text-slate-300 transition">
            {copyMsg || "复制链接"}
          </button>
        </div>

        <header className="mb-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur mb-6">
            <span className="text-xl">🧠</span>
            <span className="text-sm tracking-wide text-slate-300">AI Personalized Health System</span>
          </div>
          <div className="rounded-[36px] border border-emerald-500/20 bg-emerald-500/10 backdrop-blur p-8 mb-6">
            <div className="text-emerald-300 text-sm mb-2">AI GENERATED HEALTH SYSTEM</div>
            <h1 className="text-4xl lg:text-5xl font-black mb-4">{p.goal} · 个人健康 OS</h1>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span>{p.age} 岁</span><span>·</span>
              <span>{p.weight} kg</span><span>·</span>
              <span>{p.height} cm</span><span>·</span>
              <span>目标：{p.goal}</span>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              生成于 {new Date(plan.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <SharedPlanView plan={plan} />

        <div className="mt-12 rounded-[36px] border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
          <p className="text-slate-400 mb-4">想要生成属于你自己的 AI 健康系统？</p>
          <Link href="/" className="inline-block px-8 py-4 rounded-2xl bg-white text-black font-semibold hover:scale-105 transition">
            免费生成我的健康系统 →
          </Link>
        </div>

      </div>
    </div>
  );
}

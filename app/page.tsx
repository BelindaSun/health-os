"use client";

// ============================================================
//  Health OS — 主页 v3
//  新增：PDF导出展开所有7天 / lz-string分享链接压缩
// ============================================================

import { useState, useEffect } from "react";
import { usePlanStore } from "@/store/planStore";
import { useProfileStore } from "@/store/profileStore";
import { useHistoryStore } from "@/store/historyStore";
import { encodePlan } from "@/lib/share/codec";
import type {
  UserProfile,
  Gender,
  FitnessLevel,
  ActivityLevel,
  MainChallenge,
  LifestyleType,
  DietGoal,
  DietStyle,
  NutritionPlan,
  WorkoutPlan,
  FastingPlan,
  ShoppingPlan,
  DailyMotivation,
  HydrationSleepPlan,
  LifestylePlan,
  ShoppingCategory,
} from "@/lib/types/health";

// ─── 打印/PDF 样式 ───────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  /* 隐藏不需要打印的元素 */
  nav, .no-print, button, input, select { display: none !important; }

  /* 隐藏今日追踪器（体积大，不适合打印） */
  .tracker-no-print { display: none !important; }

  /* 背景色打印 */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  body { background: #0f172a !important; color: white !important; }

  /* 每个模块卡片强制分页 */
  .module-card { break-inside: avoid; page-break-inside: avoid; margin-bottom: 24px; }

  /* 调整字号让内容更易读 */
  .text-xs { font-size: 11px !important; }
  .text-sm { font-size: 13px !important; }

  /* 页眉 */
  @page {
    margin: 15mm 10mm;
    size: A4;
  }
}
`;

// ─── 常量选项 ────────────────────────────────────────────────

const GOAL_OPTIONS: { value: DietGoal; label: string; emoji: string }[] = [
  { value: "weight_loss", label: "减脂瘦身", emoji: "🔥" },
  { value: "muscle_gain", label: "增肌塑形", emoji: "💪" },
  { value: "maintain", label: "维持健康", emoji: "⚖️" },
  { value: "endurance", label: "提升耐力", emoji: "🏃" },
];

const DIET_STYLE_OPTIONS: {
  value: DietStyle;
  label: string;
  emoji: string;
  desc: string;
  color: string;
}[] = [
  {
    value: "budget",
    label: "经济实惠",
    emoji: "🪙",
    desc: "鸡蛋豆腐鸡胸肉，省钱也能吃得好",
    color: "border-emerald-500 bg-emerald-500/10 text-emerald-300",
  },
  {
    value: "balanced",
    label: "均衡适中",
    emoji: "⚖️",
    desc: "牛肉三文鱼坚果，品质与预算兼顾",
    color: "border-sky-500 bg-sky-500/10 text-sky-300",
  },
  {
    value: "premium",
    label: "豪华任性",
    emoji: "👑",
    desc: "和牛帝王蟹松露，有钱就要吃最好",
    color: "border-amber-500 bg-amber-500/10 text-amber-300",
  },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "other", label: "其他" },
];

const FITNESS_OPTIONS: { value: FitnessLevel; label: string; desc: string }[] =
  [
    { value: "beginner", label: "初级", desc: "很少运动或刚开始" },
    { value: "intermediate", label: "中级", desc: "偶尔运动，有基础" },
    { value: "advanced", label: "高级", desc: "规律训练 1 年以上" },
  ];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "low", label: "低（久坐为主）" },
  { value: "medium", label: "中（轻度活动）" },
  { value: "high", label: "高（经常运动）" },
];

const CHALLENGE_OPTIONS: {
  value: MainChallenge;
  label: string;
  emoji: string;
}[] = [
  { value: "appetite", label: "食欲难控", emoji: "🍽️" },
  { value: "motivation", label: "缺乏动力", emoji: "😴" },
  { value: "time", label: "时间不够", emoji: "⏰" },
];

const LIFESTYLE_OPTIONS: { value: LifestyleType; label: string }[] = [
  { value: "sedentary", label: "久坐（办公室/学生）" },
  { value: "light_active", label: "轻度活跃" },
  { value: "moderate_active", label: "中度活跃" },
  { value: "very_active", label: "非常活跃" },
];

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  protein: "🥩 蛋白质",
  carbs: "🌾 碳水化合物",
  healthy_fats: "🥑 健康脂肪",
  vegetables_fruits: "🥦 蔬菜水果",
  snacks: "🥜 零食",
  condiments: "🫙 调味料",
};

// 餐食 meta，NutritionCard 和打印展开共用
const MEAL_META = {
  breakfast: {
    label: "早餐",
    emoji: "🌅",
    color: "from-amber-500/20 to-orange-500/10",
    accent: "text-amber-400",
  },
  lunch: {
    label: "午餐",
    emoji: "☀️",
    color: "from-emerald-500/20 to-teal-500/10",
    accent: "text-emerald-400",
  },
  dinner: {
    label: "晚餐",
    emoji: "🌙",
    color: "from-violet-500/20 to-purple-500/10",
    accent: "text-violet-400",
  },
  snack: {
    label: "加餐",
    emoji: "🥜",
    color: "from-sky-500/20 to-blue-500/10",
    accent: "text-sky-400",
  },
} as const;

// ─── 主组件 ──────────────────────────────────────────────────

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const plan = usePlanStore((s) => s.plan);
  const initPlan = usePlanStore((s) => s.initPlan);
  const setPlanLoading = usePlanStore((s) => s.setPlanLoading);
  const setPlanData = usePlanStore((s) => s.setPlanData);
  const setPlanError = usePlanStore((s) => s.setPlanError);
  const finalizePlan = usePlanStore((s) => s.finalizePlan);
  const addHistory = useHistoryStore((s) => s.addEntry);

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "results">("form");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // ── 新增：打印展开模式 ──
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ── 生成方案 ────────────────────────────────────────────────

  async function handleGenerate() {
    setIsGenerating(true);
    setActiveTab("results");
    setShareUrl(null);

    const modules = [
      "nutrition",
      "workout",
      "fasting",
      "shopping",
      "motivation",
      "hydrationSleep",
      "lifestyle",
    ] as const;

    initPlan(profile);
    modules.forEach((m) => setPlanLoading(m));

    const safeProfile = {
      age: profile.age || 28,
      gender: profile.gender || "female",
      heightCm: profile.heightCm || 165,
      weightKg: profile.weightKg || 60,
      goal: profile.goal || "weight_loss",
      lifestyleType: profile.lifestyleType || "sedentary",
      activityLevel: profile.activityLevel || "low",
      fitnessLevel: profile.fitnessLevel || "beginner",
      sleepTime: profile.sleepTime || "23:00",
      wakeTime: profile.wakeTime || "07:00",
      weeklyBudget: profile.weeklyBudget || 200,
      availableMinutesPerDay: profile.availableMinutesPerDay || 30,
      hasEquipment: profile.hasEquipment ?? false,
      equipmentList: profile.equipmentList || "",
      mainChallenge: profile.mainChallenge || "motivation",
      dietStyle: profile.dietStyle || "budget",
      provider: profile.provider || "deepseek",
      openaiApiKey: profile.openaiApiKey || "",
      modelName: profile.modelName || "qwen2.5:3b",
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: safeProfile }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[generate] API error:", res.status, errText);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      modules.forEach((m) => {
        if (data[m]?.error) {
          setPlanError(m, data[m].error);
        } else {
          setPlanData(m, data[m]);
        }
      });

      const finalPlan = finalizePlan();
      if (finalPlan) {
        addHistory(finalPlan);
        const url = `${window.location.origin}/share?p=${encodePlan(finalPlan)}`;
        setShareUrl(url);
      }
    } catch (e) {
      console.error("[generate] Error:", e);
      modules.forEach((m) => setPlanError(m, "生成失败，请重试"));
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── 导出PDF：展开所有天 → 打印 → 恢复 ──────────────────────
  async function handleExportPdf() {
    setIsPrinting(true);
    // 等 React 重渲染（所有天展开）
    await new Promise((r) => setTimeout(r, 350));
    window.print();
    // print() 是同步阻塞的，对话框关闭后才继续
    setIsPrinting(false);
  }

  // ── 渲染 ─────────────────────────────────────────────────────

  const allDone =
    plan &&
    [
      "nutrition",
      "workout",
      "fasting",
      "shopping",
      "motivation",
      "hydrationSleep",
      "lifestyle",
    every((m) => (plan[m as keyof typeof plan] as { status?: string })?.status !== "loading");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* 打印时显示的页眉（屏幕隐藏） */}
      <div className="hidden print:block px-6 mb-6 pb-4 border-b border-white/20">
        <p className="text-2xl font-black">🌿 Health OS — 个人健康方案</p>
        {plan?.profile && (
          <p className="text-sm text-slate-400 mt-1">
            {plan.profile.age}岁 ·{" "}
            {plan.profile.gender === "female" ? "女" : "男"} ·
            {plan.profile.weightKg}kg · {plan.profile.heightCm}cm
          </p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">
          生成时间：{new Date().toLocaleDateString("zh-CN")}
        </p>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-16 pb-8 text-center print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-xs tracking-[0.3em] text-emerald-400/60 uppercase mb-3">
            AI Health OS
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            你的专属
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              健康操作系统
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-md mx-auto">
            输入信息 → AI 并行生成 7 大健康模块 → 一键分享
          </p>
        </div>
      </section>

      {/* ── Tab 切换 ── */}
      <div className="flex justify-center gap-2 px-4 mb-8 print:hidden">
        {(["form", "results"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === t
                ? "bg-emerald-500 text-black"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {t === "form" ? "📝 填写信息" : "✨ 健康方案"}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* ════════════════════ 表单 ════════════════════ */}
        {activeTab === "form" && (
          <div className="space-y-6">
            {/* 基础信息 */}
            <FormSection title="基础信息" icon="👤">
              <div>
                <Label>性别</Label>
                <div className="flex gap-2 mt-1">
                  {GENDER_OPTIONS.map((o) => (
                    <SelectChip
                      key={o.value}
                      active={profile.gender === o.value}
                      onClick={() => setProfile({ gender: o.value })}
                    >
                      {o.label}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumberInput
                  label="年龄"
                  unit="岁"
                  value={profile.age}
                  onChange={(v) => setProfile({ age: v })}
                />
                <NumberInput
                  label="身高"
                  unit="cm"
                  value={profile.heightCm}
                  onChange={(v) => setProfile({ heightCm: v })}
                />
                <NumberInput
                  label="体重"
                  unit="kg"
                  value={profile.weightKg}
                  onChange={(v) => setProfile({ weightKg: v })}
                />
              </div>

              <BmiPreview
                heightCm={profile.heightCm}
                weightKg={profile.weightKg}
              />
            </FormSection>

            {/* 目标 */}
            <FormSection title="主要目标" icon="🎯">
              <div className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((o) => (
                  <SelectChip
                    key={o.value}
                    active={profile.goal === o.value}
                    onClick={() => setProfile({ goal: o.value })}
                    large
                  >
                    {o.emoji} {o.label}
                  </SelectChip>
                ))}
              </div>

              <CaloriePreview
                age={profile.age}
                gender={profile.gender}
                heightCm={profile.heightCm}
                weightKg={profile.weightKg}
                activityLevel={profile.activityLevel}
                goal={profile.goal}
              />

              <div>
                <Label>饮食风格</Label>
                <div className="flex flex-col gap-2 mt-1">
                  {DIET_STYLE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setProfile({ dietStyle: o.value })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        profile.dietStyle === o.value
                          ? o.color
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{o.emoji}</span>
                        <span className="font-semibold text-sm">{o.label}</span>
                        {profile.dietStyle === o.value && (
                          <span className="ml-auto text-xs opacity-70">
                            已选 ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-60 mt-0.5 ml-7">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>

            {/* 训练背景 */}
            <FormSection title="训练背景" icon="💪">
              <div>
                <Label>健身水平</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {FITNESS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setProfile({ fitnessLevel: o.value })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        profile.fitnessLevel === o.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <div className="font-semibold text-sm">{o.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="每天可用时间"
                  unit="分钟"
                  value={profile.availableMinutesPerDay}
                  onChange={(v) => setProfile({ availableMinutesPerDay: v })}
                />
                <NumberInput
                  label="每周饮食预算"
                  unit="¥"
                  value={profile.weeklyBudget}
                  onChange={(v) => setProfile({ weeklyBudget: v })}
                />
              </div>

              <div>
                <Label>训练场地 / 器材</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {[
                    { v: "none", l: "🏠 无器材居家" },
                    { v: "home", l: "🏋️ 家用器材" },
                    { v: "gym", l: "🏟️ 健身房" },
                  ].map((o) => (
                    <SelectChip
                      key={o.v}
                      active={(profile.equipmentList ?? "none") === o.v}
                      onClick={() =>
                        setProfile({
                          hasEquipment: o.v !== "none",
                          equipmentList: o.v,
                        })
                      }
                    >
                      {o.l}
                    </SelectChip>
                  ))}
                </div>
                {profile.equipmentList === "home" && (
                  <input
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    placeholder="器材列表，如：哑铃、弹力带、瑜伽垫"
                    value={profile.equipmentList ?? ""}
                    onChange={(e) =>
                      setProfile({ equipmentList: e.target.value })
                    }
                  />
                )}
              </div>
            </FormSection>

            {/* 时间 & 生活方式 */}
            <FormSection title="时间 & 生活方式" icon="⏰">
              <div className="grid grid-cols-2 gap-3">
                <TimeInput
                  label="入睡时间"
                  value={profile.sleepTime}
                  onChange={(v) => setProfile({ sleepTime: v })}
                />
                <TimeInput
                  label="起床时间"
                  value={profile.wakeTime}
                  onChange={(v) => setProfile({ wakeTime: v })}
                />
              </div>

              <div>
                <Label>日常活动水平</Label>
                <div className="flex flex-col gap-1.5 mt-1">
                  {ACTIVITY_OPTIONS.map((o) => (
                    <SelectChip
                      key={o.value}
                      active={profile.activityLevel === o.value}
                      onClick={() => setProfile({ activityLevel: o.value })}
                      large
                    >
                      {o.label}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div>
                <Label>生活方式类型</Label>
                <div className="flex flex-col gap-1.5 mt-1">
                  {LIFESTYLE_OPTIONS.map((o) => (
                    <SelectChip
                      key={o.value}
                      active={profile.lifestyleType === o.value}
                      onClick={() => setProfile({ lifestyleType: o.value })}
                      large
                    >
                      {o.label}
                    </SelectChip>
                  ))}
                </div>
              </div>
            </FormSection>

            {/* 最大挑战 */}
            <FormSection title="你最大的挑战是？" icon="🧠">
              <div className="grid grid-cols-3 gap-2">
                {CHALLENGE_OPTIONS.map((o) => (
                  <SelectChip
                    key={o.value}
                    active={profile.mainChallenge === o.value}
                    onClick={() => setProfile({ mainChallenge: o.value })}
                    large
                  >
                    <span className="block text-xl mb-1">{o.emoji}</span>
                    {o.label}
                  </SelectChip>
                ))}
              </div>
            </FormSection>

            {/* AI Provider */}
            <ProviderSettings
              provider={profile.provider ?? "ollama"}
              apiKey={profile.openaiApiKey ?? ""}
              onProviderChange={(v) => setProfile({ provider: v })}
              onApiKeyChange={(v) => setProfile({ openaiApiKey: v })}
            />

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-[28px] font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:from-emerald-400 hover:to-teal-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(52,211,153,0.3)]"
            >
              {isGenerating ? "⚡ AI 生成中..." : "✨ 生成我的健康方案"}
            </button>
          </div>
        )}

        {/* ════════════════════ 结果 ════════════════════ */}
        {activeTab === "results" && (
          <div className="space-y-4">
            {/* 分享栏 */}
            {shareUrl && (
              <div className="p-4 rounded-[20px] bg-emerald-500/10 border border-emerald-500/30 space-y-3 print:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">
                      方案已生成 🎉
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      分享给朋友，无需AI即可查看
                    </p>
                  </div>
                  <button
                    onClick={copyShareUrl}
                    className="px-4 py-2 rounded-full bg-emerald-500 text-black text-sm font-semibold shrink-0"
                  >
                    {copied ? "✓ 已复制" : "🔗 复制链接"}
                  </button>
                </div>
                {/* ── PDF导出：展开所有7天再打印 ── */}
                <button
                  onClick={handleExportPdf}
                  disabled={isPrinting}
                  className="w-full py-2.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>📄</span>
                  <span>
                    {isPrinting
                      ? "准备中，请稍候..."
                      : "导出 PDF — 包含完整7天方案"}
                  </span>
                </button>
              </div>
            )}

            {/* 7个模块卡片 */}
            <ModuleCard
              title="🥗 个人营养计划"
              subtitle="7天饮食方案"
              status={plan?.nutrition.status ?? "idle"}
            >
              {plan?.nutrition.data && (
                <NutritionCard
                  data={plan.nutrition.data as NutritionPlan}
                  isPrinting={isPrinting}
                />
              )}
            </ModuleCard>

            <ModuleCard
              title="💪 居家训练计划"
              subtitle="30天无器材方案"
              status={plan?.workout.status ?? "idle"}
            >
              {plan?.workout.data && (
                <WorkoutCard
                  data={plan.workout.data as WorkoutPlan}
                  isPrinting={isPrinting}
                />
              )}
            </ModuleCard>

            <ModuleCard
              title="⏳ 断食指南"
              subtitle="个性化断食方案"
              status={plan?.fasting.status ?? "idle"}
            >
              {plan?.fasting.data && (
                <FastingCard data={plan.fasting.data as FastingPlan} />
              )}
            </ModuleCard>

            <ModuleCard
              title="🛒 购物清单"
              subtitle="一周经济实惠采购"
              status={plan?.shopping.status ?? "idle"}
            >
              {plan?.shopping.data && (
                <ShoppingCard data={plan.shopping.data as ShoppingPlan} />
              )}
            </ModuleCard>

            <ModuleCard
              title="🔥 每日动力"
              subtitle="今日能量补给站"
              status={plan?.motivation.status ?? "idle"}
            >
              {plan?.motivation.data && (
                <MotivationCard
                  data={plan.motivation.data as DailyMotivation}
                />
              )}
            </ModuleCard>

            <ModuleCard
              title="💧 水 & 睡眠"
              subtitle="身体节律优化"
              status={plan?.hydrationSleep.status ?? "idle"}
            >
              {plan?.hydrationSleep.data && (
                <HydrationSleepCard
                  data={plan.hydrationSleep.data as HydrationSleepPlan}
                />
              )}
            </ModuleCard>

            <ModuleCard
              title="🌿 生活方式计划"
              subtitle="长期习惯改变方案"
              status={plan?.lifestyle.status ?? "idle"}
            >
              {plan?.lifestyle.data && (
                <LifestyleCard data={plan.lifestyle.data as LifestylePlan} />
              )}
            </ModuleCard>

            {allDone && (
              <button
                onClick={() => setActiveTab("form")}
                className="w-full py-3 rounded-[20px] text-sm text-slate-400 border border-white/10 hover:border-white/20 hover:text-white transition-all print:hidden"
              >
                ← 修改信息重新生成
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── 通用 UI 组件 ─────────────────────────────────────────────

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-[28px] bg-white/[0.03] border border-white/10 backdrop-blur space-y-4">
      <h2 className="text-base font-semibold text-slate-300 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 mb-0.5">{children}</p>;
}

function SelectChip({
  active,
  onClick,
  children,
  large,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${large ? "py-3 px-4" : "py-2 px-4"} rounded-2xl border text-base font-medium transition-all text-center ${
        active
          ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function NumberInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {unit}
        </span>
      </div>
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
      />
    </div>
  );
}

function ModuleCard({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="module-card rounded-[28px] bg-white/[0.03] border border-white/10 backdrop-blur overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="px-5 pb-5">
        {status === "loading" && <LoadingPulse />}
        {status === "error" && (
          <p className="text-red-400 text-sm py-2">⚠️ 生成失败，请重新尝试</p>
        )}
        {status === "success" && children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    idle: { label: "等待", cls: "bg-slate-700 text-slate-400" },
    loading: { label: "生成中", cls: "bg-yellow-500/20 text-yellow-400" },
    success: { label: "完成", cls: "bg-emerald-500/20 text-emerald-400" },
    error: { label: "失败", cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function LoadingPulse() {
  return (
    <div className="space-y-2 py-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-white/5 animate-pulse"
          style={{ width: `${90 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
      {children}
    </span>
  );
}

// ─── 模块结果卡片 ─────────────────────────────────────────────

function MacroDonut({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const total = protein + carbs + fat || 100;
  const r = 42;
  const circ = 2 * Math.PI * r;

  const segments = [
    { pct: protein / total, color: "#38bdf8", label: "蛋白质", value: protein },
    { pct: carbs / total, color: "#fbbf24", label: "碳水", value: carbs },
    { pct: fat / total, color: "#fb7185", label: "脂肪", value: fat },
  ];
  let cumulative = 0;

  return (
    <div className="flex items-center gap-4">
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        className="shrink-0 -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />
        {segments.map((s, i) => {
          const dash = s.pct * circ;
          const gap = circ - dash;
          const offset = circ - cumulative * circ;
          cumulative += s.pct;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: s.color }}>
              {s.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NutritionCard：支持 isPrinting 展开所有7天 ───────────────

function NutritionCard({
  data,
  isPrinting,
}: {
  data: NutritionPlan;
  isPrinting?: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = data.weeklyPlan?.[selectedDay];

  const maxMealCal = day
    ? Math.max(
        day.breakfast?.calories ?? 0,
        day.lunch?.calories ?? 0,
        day.dinner?.calories ?? 0,
        day.snack?.calories ?? 0,
      )
    : 1;

  // 单天餐食渲染（正常模式和打印模式共用）
  function renderMeals(
    dayData: typeof day,
    maxCal: number,
    showTracker = false,
  ) {
    if (!dayData) return null;
    return (
      <div className="space-y-2">
        {(["breakfast", "lunch", "dinner", "snack"] as const).map((mealKey) => {
          const m = dayData[mealKey];
          if (!m) return null;
          const meta = MEAL_META[mealKey];
          const barPct =
            maxCal > 0 ? Math.round((m.calories / maxCal) * 100) : 0;
          return (
            <div
              key={mealKey}
              className={`p-3 rounded-2xl bg-gradient-to-br ${meta.color} border border-white/5`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs text-slate-400 font-medium">
                  {meta.emoji} {meta.label} · {m.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">
                    蛋白 {m.protein}g
                  </span>
                  <span className={`text-xs font-bold ${meta.accent}`}>
                    {m.calories} kcal
                  </span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/10 mb-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barPct}%`,
                    background:
                      mealKey === "breakfast"
                        ? "#f59e0b"
                        : mealKey === "lunch"
                          ? "#10b981"
                          : mealKey === "dinner"
                            ? "#8b5cf6"
                            : "#38bdf8",
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {m.foods?.map((f, fi) => <Tag key={fi}>{f}</Tag>)}
              </div>
              {m.notes && (
                <p className="text-xs text-slate-500 mt-1.5 italic">
                  💡 {m.notes}
                </p>
              )}
            </div>
          );
        })}
        <div className="flex justify-between text-xs text-slate-500 pt-1">
          <span>当日热量合计</span>
          <span className="text-emerald-400 font-bold">
            {dayData.totalCalories} kcal
          </span>
        </div>
        {/* 追踪器仅在正常模式显示，打印时隐藏 */}
        {showTracker && (
          <DailyFoodTracker
            target={data.dailyCalorieTarget}
            recommendedMeals={[
              dayData.breakfast,
              dayData.lunch,
              dayData.dinner,
              ...(dayData.snack ? [dayData.snack] : []),
            ].filter(Boolean)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 每日热量 + 宏量甜甜圈 */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-slate-500">每日目标热量</p>
            <p className="text-3xl font-black text-emerald-400 leading-none mt-0.5">
              {data.dailyCalorieTarget}
              <span className="text-sm font-normal text-slate-500 ml-1">
                kcal
              </span>
            </p>
          </div>
        </div>
        {data.macroSplit && (
          <MacroDonut
            protein={data.macroSplit.protein}
            carbs={data.macroSplit.carbs}
            fat={data.macroSplit.fat}
          />
        )}
      </div>

      {/* 核心原则 */}
      {data.keyPrinciples?.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-xs text-slate-500 mb-2">核心饮食原则</p>
          <ul className="space-y-1.5">
            {data.keyPrinciples.map((p, i) => (
              <li
                key={i}
                className="text-xs text-slate-300 flex gap-2 items-start"
              >
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 7天内容 */}
      {data.weeklyPlan?.length > 0 && (
        <>
          {/* 正常模式：Tab选择器 + 单天内容 */}
          {!isPrinting && (
            <>
              <div className="flex gap-1.5 flex-wrap">
                {data.weeklyPlan.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedDay === i
                        ? "bg-emerald-500 text-black"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
              {renderMeals(day, maxMealCal, true)}
            </>
          )}

          {/* 打印模式：展开所有7天 */}
          {isPrinting &&
            data.weeklyPlan.map((dayData, dayIndex) => {
              const dayMaxCal = Math.max(
                dayData.breakfast?.calories ?? 0,
                dayData.lunch?.calories ?? 0,
                dayData.dinner?.calories ?? 0,
                dayData.snack?.calories ?? 0,
              );
              return (
                <div key={dayIndex}>
                  <p className="text-xs font-bold text-slate-300 pt-3 pb-1.5 border-t border-white/10">
                    📅 {dayData.day}
                  </p>
                  {renderMeals(dayData, dayMaxCal, false)}
                </div>
              );
            })}
        </>
      )}

      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

// ── WorkoutCard：支持 isPrinting 展开所有7天 ─────────────────

function WorkoutCard({
  data,
  isPrinting,
}: {
  data: WorkoutPlan;
  isPrinting?: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = data.weeklySchedule?.[selectedDay];

  const muscleColor = (group: string): string => {
    const g = group?.toLowerCase() ?? "";
    if (g.includes("胸") || g.includes("chest"))
      return "bg-rose-500/20 text-rose-300 border-rose-500/20";
    if (g.includes("背") || g.includes("back"))
      return "bg-sky-500/20 text-sky-300 border-sky-500/20";
    if (g.includes("腿") || g.includes("leg") || g.includes("臀"))
      return "bg-violet-500/20 text-violet-300 border-violet-500/20";
    if (g.includes("肩") || g.includes("shoulder"))
      return "bg-amber-500/20 text-amber-300 border-amber-500/20";
    if (g.includes("腹") || g.includes("core") || g.includes("abs"))
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/20";
    if (g.includes("手臂") || g.includes("二头") || g.includes("三头"))
      return "bg-orange-500/20 text-orange-300 border-orange-500/20";
    return "bg-white/10 text-slate-300 border-white/10";
  };

  const difficultyDots = (sets?: number, reps?: string): number => {
    const s = sets ?? 3;
    const hasTime = reps?.includes("秒") || reps?.includes("分");
    if (s >= 5 || (hasTime && parseInt(reps ?? "0") >= 60)) return 3;
    if (s >= 3) return 2;
    return 1;
  };

  // 单天训练渲染（正常和打印共用）
  function renderDayWorkout(dayData: typeof day) {
    if (!dayData) return null;
    const isRest = dayData.focus?.includes("休息");
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/8">
          <div>
            <p className="text-sm font-bold text-emerald-400">
              {dayData.focus}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {dayData.durationMinutes} 分钟
            </p>
          </div>
          {!isRest && (
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-slate-500">训练量</p>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <
                      (dayData.exercises?.length >= 5
                        ? 3
                        : dayData.exercises?.length >= 3
                          ? 2
                          : 1)
                        ? "bg-emerald-400"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {isRest ? (
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 text-center">
            <p className="text-2xl mb-1">🛌</p>
            <p className="text-sm text-slate-300 font-medium">今天好好休息</p>
            <p className="text-xs text-slate-500 mt-1">
              肌肉在恢复中生长，休息日同样重要
            </p>
          </div>
        ) : (
          <>
            {dayData.warmup?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">🔥 热身 (5分钟)</p>
                <div className="flex flex-wrap gap-1.5">
                  {dayData.warmup.map((w, i) => (
                    <Tag key={i}>{w}</Tag>
                  ))}
                </div>
              </div>
            )}
            {dayData.exercises?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">💪 主体训练</p>
                {dayData.exercises.map((ex, i) => {
                  const dots = difficultyDots(ex.sets, ex.reps);
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-100">
                          {ex.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 3 }).map((_, di) => (
                              <div
                                key={di}
                                className={`w-1.5 h-1.5 rounded-full ${di < dots ? "bg-amber-400" : "bg-white/10"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-emerald-400 font-bold">
                            {ex.sets ? `${ex.sets}组` : ""} {ex.reps}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${muscleColor(ex.muscleGroup)}`}
                        >
                          {ex.muscleGroup}
                        </span>
                        <p className="text-xs text-slate-500 flex-1 text-right ml-2">
                          💡 {ex.tip}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {dayData.cooldown?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">🧘 冷身拉伸</p>
                <div className="flex flex-wrap gap-1.5">
                  {dayData.cooldown.map((c, i) => (
                    <Tag key={i}>{c}</Tag>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">{data.overview}</p>

      {/* 正常模式：Tab选择器 + 单天 */}
      {!isPrinting && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {data.weeklySchedule?.map((d, i) => {
              const isRest = d.focus?.includes("休息");
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedDay === i
                      ? isRest
                        ? "bg-slate-600 text-white"
                        : "bg-emerald-500 text-black"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {d.day}
                  {isRest && " 🛌"}
                </button>
              );
            })}
          </div>
          {renderDayWorkout(day)}
        </>
      )}

      {/* 打印模式：展开所有天 */}
      {isPrinting &&
        data.weeklySchedule?.map((dayData, dayIndex) => (
          <div key={dayIndex}>
            <p className="text-xs font-bold text-slate-300 pt-3 pb-1.5 border-t border-white/10">
              📅 {dayData.day}
              {dayData.focus?.includes("休息") && " 🛌"}
            </p>
            {renderDayWorkout(dayData)}
          </div>
        ))}

      {data.progressionLogic && (
        <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-400 font-semibold mb-1">
            📈 4周进阶逻辑
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {data.progressionLogic}
          </p>
        </div>
      )}

      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

// ── 24小时断食圆环 ───────────────────────────────────────────

function FastingRing({
  fastStart,
  fastEnd,
  eatStart,
  eatEnd,
  fastingHours,
}: {
  fastStart: string;
  fastEnd: string;
  eatStart: string;
  eatEnd: string;
  fastingHours: number;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const cx = 70;
  const cy = 70;

  const toHour = (t: string) => {
    const [h, m] = (t ?? "00:00").split(":").map(Number);
    return h + m / 60;
  };

  const fastStartH = toHour(fastStart);
  const eatStartH = toHour(eatStart);

  let fastDuration = eatStartH - fastStartH;
  if (fastDuration < 0) fastDuration += 24;
  const fastPct = fastDuration / 24;
  const fastDash = fastPct * circ;
  const fastOffset = circ - (fastStartH / 24) * circ;

  const eatDuration = 24 - fastDuration;
  const eatPct = eatDuration / 24;
  const eatDash = eatPct * circ;
  const eatOffset = circ - (eatStartH / 24) * circ;

  const ticks = [
    { h: 0, label: "0" },
    { h: 6, label: "6" },
    { h: 12, label: "12" },
    { h: 18, label: "18" },
  ];

  const polarToXY = (hour: number, rad: number) => {
    const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + rad * Math.cos(angle), y: cy + rad * Math.sin(angle) };
  };

  return (
    <div className="flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="14"
          strokeDasharray={`${fastDash} ${circ - fastDash}`}
          strokeDashoffset={fastOffset}
          strokeLinecap="butt"
          style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.5))" }}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="14"
          strokeDasharray={`${eatDash} ${circ - eatDash}`}
          strokeDashoffset={eatOffset}
          strokeLinecap="butt"
          style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.4))" }}
        />
        {ticks.map(({ h, label }) => {
          const pos = polarToXY(h, r + 16);
          return (
            <text
              key={h}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fill="rgba(148,163,184,0.6)"
            >
              {label}
            </text>
          );
        })}
        {(() => {
          const pos = polarToXY(fastStartH, r);
          return (
            <circle
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill="#1e293b"
              stroke="#f59e0b"
              strokeWidth="2"
            />
          );
        })()}
        {(() => {
          const pos = polarToXY(eatStartH, r);
          return (
            <circle
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill="#1e293b"
              stroke="#10b981"
              strokeWidth="2"
            />
          );
        })()}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fill="#f59e0b"
        >
          {fastingHours}h
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize="8"
          fill="rgba(148,163,184,0.7)"
        >
          断食时长
        </text>
      </svg>
    </div>
  );
}

function FastingCard({ data }: { data: FastingPlan }) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-3xl font-black text-amber-400">
              {data.recommendedProtocol}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[180px] leading-relaxed">
              {data.rationale}
            </p>
          </div>
          {data.windows && (
            <FastingRing
              fastStart={data.windows.fastStart}
              fastEnd={data.windows.fastEnd}
              eatStart={data.windows.eatStart}
              eatEnd={data.windows.eatEnd}
              fastingHours={data.windows.fastingHours}
            />
          )}
        </div>
        {data.windows && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500">断食开始</p>
                <p className="text-sm font-bold text-amber-400">
                  {data.windows.fastStart}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500">进食开始</p>
                <p className="text-sm font-bold text-emerald-400">
                  {data.windows.eatStart}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {data.hourlyGuide?.length > 0 && (
        <div>
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <span>⏰ 一天时间轴</span>
            <span className="text-slate-600">
              {showGuide ? "收起 ↑" : "展开 ↓"}
            </span>
          </button>
          {showGuide && (
            <div className="space-y-1.5">
              {data.hourlyGuide.map((h, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-xs text-slate-500 w-10 shrink-0 pt-1.5 font-mono">
                    {h.time}
                  </span>
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex flex-col items-center shrink-0 mt-1.5">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${h.status === "fasting" ? "bg-amber-400" : "bg-emerald-400"}`}
                      />
                      {i < data.hourlyGuide.length - 1 && (
                        <div className="w-px h-4 bg-white/10 mt-0.5" />
                      )}
                    </div>
                    <div
                      className={`flex-1 p-2 rounded-xl text-xs mb-1 ${
                        h.status === "fasting"
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {h.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {data.fastingAllowed?.length > 0 && (
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8">
            <p className="text-xs text-slate-500 mb-1.5 font-semibold">
              断食期允许 ✓
            </p>
            <ul className="space-y-1">
              {data.fastingAllowed.map((item, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-300 flex gap-1.5 items-start"
                >
                  <span className="text-emerald-500 shrink-0">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.beginnerTips?.length > 0 && (
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8">
            <p className="text-xs text-slate-500 mb-1.5 font-semibold">
              新手技巧 💡
            </p>
            <ul className="space-y-1">
              {data.beginnerTips.map((tip, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-300 flex gap-1.5 items-start"
                >
                  <span className="text-amber-500 shrink-0">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {data.eatingWindowAdvice?.length > 0 && (
        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-semibold mb-1.5">
            🍽️ 进食窗口建议
          </p>
          <ul className="space-y-1">
            {data.eatingWindowAdvice.map((a, i) => (
              <li
                key={i}
                className="text-xs text-slate-300 flex gap-1.5 items-start"
              >
                <span className="text-emerald-500 shrink-0">→</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

function ShoppingCard({ data }: { data: ShoppingPlan }) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const byCategory = data.items?.reduce<Record<string, typeof data.items>>(
    (acc, item) => {
      const cat = item.category ?? "protein";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  const catTotal = (items: typeof data.items) =>
    items.reduce((s, it) => s + (it.estimatedCost ?? 0), 0).toFixed(2);

  const toggleCat = (cat: string) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const budgetPct = Math.min(data.budgetUsagePercent ?? 0, 100);
  const budgetColor =
    budgetPct > 90
      ? "from-rose-500 to-red-400"
      : budgetPct > 70
        ? "from-amber-500 to-yellow-400"
        : "from-emerald-500 to-teal-400";

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-xs text-slate-500">本周总花费</p>
            <p className="text-3xl font-black text-white leading-none mt-0.5">
              ¥{data.totalEstimatedCost}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">预算使用</p>
            <p
              className={`text-2xl font-black ${budgetPct > 90 ? "text-rose-400" : budgetPct > 70 ? "text-amber-400" : "text-emerald-400"}`}
            >
              {budgetPct}%
            </p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${budgetColor} transition-all duration-700`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>节省</span>
          <span>合理</span>
          <span>偏高</span>
        </div>
      </div>

      {byCategory &&
        Object.entries(byCategory).map(([cat, items]) => {
          const isOpen = openCats[cat] !== false;
          return (
            <div
              key={cat}
              className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden"
            >
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    {CATEGORY_LABELS[cat as ShoppingCategory] ?? cat}
                  </span>
                  <span className="text-xs text-slate-600">
                    ({items.length}项)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-semibold">
                    ¥{catTotal(items)}
                  </span>
                  <span className="text-slate-600 text-xs">
                    {isOpen ? "↑" : "↓"}
                  </span>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between p-2.5 rounded-xl bg-white/5"
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.quantity}
                          </span>
                        </div>
                        {item.tip && (
                          <p className="text-xs text-slate-600 mt-0.5 italic">
                            💡 {item.tip}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-emerald-400 font-bold ml-3 shrink-0">
                        ¥{item.estimatedCost}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {data.budgetTip && (
        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400">💡 {data.budgetTip}</p>
        </div>
      )}

      {data.mealPrepTips?.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-xs text-slate-500 font-semibold mb-1.5">
            🥡 备餐技巧
          </p>
          <ul className="space-y-1">
            {data.mealPrepTips.map((t, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                <span className="text-teal-500 shrink-0">•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

function MotivationCard({ data }: { data: DailyMotivation }) {
  return (
    <div className="space-y-3">
      {data.quote && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <p className="text-sm text-violet-300 italic">"{data.quote}"</p>
          {data.quoteAuthor && (
            <p className="text-xs text-slate-500 mt-1.5 text-right">
              — {data.quoteAuthor}
            </p>
          )}
        </div>
      )}
      {data.dailyTask && (
        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs text-orange-400 font-semibold mb-1">
            🎯 今日任务
          </p>
          <p className="text-sm text-slate-300">{data.dailyTask}</p>
        </div>
      )}
      {data.fatLossTip && (
        <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/20">
          <p className="text-xs text-red-400 font-semibold mb-1">
            🔥 今日健康贴士
          </p>
          <p className="text-sm text-slate-300">{data.fatLossTip}</p>
        </div>
      )}
      {data.morningRoutine?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1.5">☀️ 晨间三步走</p>
          <div className="space-y-1.5">
            {data.morningRoutine.map((h, i) => (
              <div key={i} className="flex gap-2.5 items-center">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.mindsetShift && (
        <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-400 font-semibold mb-1">
            🧠 思维转变
          </p>
          <p className="text-sm text-slate-300">{data.mindsetShift}</p>
        </div>
      )}
      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

function HydrationSleepCard({ data }: { data: HydrationSleepPlan }) {
  const waterMl = Math.min(Math.max(data.dailyWaterTarget ?? 2000, 1200), 4000);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
        <span className="text-3xl">💧</span>
        <div>
          <p className="text-xs text-slate-500">每日饮水目标</p>
          <p className="text-2xl font-black text-sky-400">
            {(waterMl / 1000).toFixed(1)}L
          </p>
          <p className="text-xs text-slate-500">{waterMl} ml</p>
        </div>
      </div>
      {data.hydrationSchedule?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">饮水时间表</p>
          <div className="space-y-1.5">
            {data.hydrationSchedule.map((h, i) => (
              <div key={i} className="flex gap-3 items-center">
                <span className="text-xs text-slate-500 w-10 shrink-0">
                  {h.time}
                </span>
                <span className="text-xs text-sky-400 w-14 shrink-0">
                  {h.amount}
                </span>
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
      {data.morningHabits?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1.5">☀️ 早晨活力习惯</p>
          <ul className="space-y-1">
            {data.morningHabits.map((h, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2">
                <span className="text-amber-400">•</span> {h}
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
      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

function LifestyleCard({ data }: { data: LifestylePlan }) {
  const categoryIcon: Record<string, string> = {
    nutrition: "🥗",
    activity: "🏃",
    mindset: "🧠",
    lifestyle: "🌿",
  };

  return (
    <div className="space-y-4">
      {data.headline && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <p className="text-base font-bold text-emerald-300 text-center">
            {data.headline}
          </p>
        </div>
      )}
      {data.habits?.length > 0 && (
        <div className="space-y-2">
          {data.habits.map((h, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 items-start flex-1">
                  <span className="text-lg">
                    {categoryIcon[h.category] ?? "•"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {h.habit}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.frequency} · {h.howTo}
                    </p>
                    <p className="text-xs text-emerald-400/70 mt-0.5 italic">
                      {h.whyItWorks}
                    </p>
                  </div>
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
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-slate-300 pt-0.5">{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.challengeStrategy && (
        <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/20">
          <p className="text-xs text-orange-400 font-semibold mb-1">
            ⚡ 你的挑战应对策略
          </p>
          <p className="text-xs text-slate-400">{data.challengeStrategy}</p>
        </div>
      )}
      {data.personalizedNote && (
        <PersonalizedNote>{data.personalizedNote}</PersonalizedNote>
      )}
    </div>
  );
}

function PersonalizedNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
      <p className="text-xs text-slate-500 flex gap-1.5">
        <span>🌟</span>
        <span>{children}</span>
      </p>
    </div>
  );
}

// ─── BMI 实时预览 ─────────────────────────────────────────────

function BmiPreview({
  heightCm,
  weightKg,
}: {
  heightCm: number;
  weightKg: number;
}) {
  if (!heightCm || !weightKg || heightCm < 100 || weightKg < 20) return null;

  const bmi = weightKg / (heightCm / 100) ** 2;
  const bmiRounded = bmi.toFixed(1);

  const { label, color, barColor, barWidth } = (() => {
    if (bmi < 18.5)
      return {
        label: "偏瘦",
        color: "text-sky-400",
        barColor: "bg-sky-400",
        barWidth: "15%",
      };
    if (bmi < 24)
      return {
        label: "正常",
        color: "text-emerald-400",
        barColor: "bg-emerald-400",
        barWidth: "40%",
      };
    if (bmi < 28)
      return {
        label: "偏重",
        color: "text-amber-400",
        barColor: "bg-amber-400",
        barWidth: "65%",
      };
    if (bmi < 32)
      return {
        label: "肥胖",
        color: "text-orange-400",
        barColor: "bg-orange-400",
        barWidth: "82%",
      };
    return {
      label: "重度肥胖",
      color: "text-red-400",
      barColor: "bg-red-400",
      barWidth: "95%",
    };
  })();

  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 mt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">BMI 体质指数</span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl font-black ${color}`}>{bmiRounded}</span>
          <span className={`text-xs font-semibold ${color}`}>{label}</span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden bg-gradient-to-r from-sky-500 via-emerald-500 via-amber-500 to-red-500 opacity-30"></div>
      <div className="relative h-2 rounded-full overflow-hidden -mt-2">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-emerald-500 via-amber-500 to-red-500 opacity-20" />
        <div
          className={`absolute top-0 h-2 w-0.5 ${barColor} transition-all duration-500`}
          style={{ left: barWidth }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>偏瘦 &lt;18.5</span>
        <span>正常 18.5-24</span>
        <span>偏重 24-28</span>
        <span>肥胖 &gt;28</span>
      </div>
    </div>
  );
}

// ─── 热量估算预览 ─────────────────────────────────────────────

function CaloriePreview({
  age,
  gender,
  heightCm,
  weightKg,
  activityLevel,
  goal,
}: {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: DietGoal;
}) {
  if (
    !age ||
    !heightCm ||
    !weightKg ||
    heightCm < 100 ||
    weightKg < 20 ||
    age < 10
  )
    return null;

  const bmr =
    gender === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const multiplier =
    activityLevel === "high" ? 1.55 : activityLevel === "medium" ? 1.375 : 1.2;
  const tdee = Math.round(bmr * multiplier);

  const { target, deltaLabel, deltaColor, advice } = (() => {
    if (goal === "weight_loss")
      return {
        target: tdee - 300,
        deltaLabel: "- 300",
        deltaColor: "text-rose-400",
        advice: "适度热量缺口，可持续减脂",
      };
    if (goal === "muscle_gain")
      return {
        target: tdee + 300,
        deltaLabel: "+ 300",
        deltaColor: "text-emerald-400",
        advice: "适度热量盈余，支持肌肉合成",
      };
    if (goal === "endurance")
      return {
        target: tdee + 100,
        deltaLabel: "+ 100",
        deltaColor: "text-sky-400",
        advice: "轻微盈余，保障运动表现",
      };
    return {
      target: tdee,
      deltaLabel: "± 0",
      deltaColor: "text-slate-400",
      advice: "维持当前体重的热量均衡",
    };
  })();

  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8">
      <p className="text-xs text-slate-500 mb-2.5">每日热量估算</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-slate-600 mb-0.5">基础代谢</p>
          <p className="text-base font-bold text-slate-300">
            {Math.round(bmr)}
          </p>
          <p className="text-[10px] text-slate-600">kcal</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-0.5">每日消耗</p>
          <p className="text-base font-bold text-slate-300">{tdee}</p>
          <p className="text-[10px] text-slate-600">kcal</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-0.5">目标摄入</p>
          <p className={`text-base font-bold ${deltaColor}`}>{target}</p>
          <p className={`text-[10px] ${deltaColor}`}>{deltaLabel} kcal</p>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2.5 text-center border-t border-white/5 pt-2">
        💡 {advice}
      </p>
    </div>
  );
}

// ─── 今日饮食追踪器 ───────────────────────────────────────────

interface TrackerFood {
  name: string;
  calories: number;
  protein: number;
  isRecommended?: boolean;
}

function DailyFoodTracker({
  target,
  recommendedMeals,
}: {
  target: number;
  recommendedMeals: Array<{
    name: string;
    foods: string[];
    calories: number;
    protein: number;
  }>;
}) {
  const [logged, setLogged] = useState<TrackerFood[]>([]);
  const [inputName, setInputName] = useState("");
  const [inputGrams, setInputGrams] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggleMeal = (meal: {
    name: string;
    calories: number;
    protein: number;
  }) => {
    const exists = logged.find((f) => f.name === meal.name && f.isRecommended);
    if (exists) {
      setLogged((prev) =>
        prev.filter((f) => !(f.name === meal.name && f.isRecommended)),
      );
    } else {
      setLogged((prev) => [
        ...prev,
        {
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          isRecommended: true,
        },
      ]);
    }
  };

  const isChecked = (name: string) =>
    logged.some((f) => f.name === name && f.isRecommended);

  async function estimateAndAdd() {
    if (!inputName.trim()) return;
    setIsEstimating(true);
    try {
      const prompt = `"${inputName.trim()}"每100克含多少热量(kcal)和蛋白质(g)？只返回JSON，不要任何其他内容：{"calories_per_100g":数字,"protein_per_100g":数字}`;
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const calPer100 = data.calories_per_100g ?? data.calories ?? 0;
      const proPer100 = data.protein_per_100g ?? data.protein ?? 0;
      const grams = parseFloat(inputGrams) || 100;
      const cal = Math.round((calPer100 * grams) / 100);
      const pro = Math.round((proPer100 * grams) / 100);
      if (cal > 0) {
        setLogged((prev) => [
          ...prev,
          {
            name: `${inputName.trim()}(${grams}g)`,
            calories: cal,
            protein: pro,
            isRecommended: false,
          },
        ]);
        setInputName("");
        setInputGrams("");
      }
    } catch {
      // 估算失败静默处理
    } finally {
      setIsEstimating(false);
    }
  }

  const totalCal = logged.reduce((s, f) => s + f.calories, 0);
  const totalPro = logged.reduce((s, f) => s + f.protein, 0);
  const pct = target > 0 ? Math.min((totalCal / target) * 100, 100) : 0;
  const remaining = target - totalCal;
  const ringColor = pct >= 100 ? "#fb7185" : pct >= 80 ? "#fbbf24" : "#10b981";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  // tracker-no-print：打印时通过CSS隐藏整个追踪器
  return (
    <div className="tracker-no-print mt-3 rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">
            📝 今日饮食记录
          </span>
          {logged.length > 0 && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              {totalCal} kcal 已记录
            </span>
          )}
        </div>
        <span className="text-slate-600 text-xs">
          {expanded ? "收起 ↑" : "展开 ↓"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-5">
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              className="shrink-0 -rotate-90"
            >
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
              />
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease",
                  filter: `drop-shadow(0 0 4px ${ringColor}80)`,
                }}
              />
            </svg>
            <div className="flex-1">
              <p className="text-2xl font-black" style={{ color: ringColor }}>
                {totalCal}
              </p>
              <p className="text-xs text-slate-500">已摄入 kcal</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-slate-400">
                  目标{" "}
                  <span className="text-white font-semibold">
                    {target} kcal
                  </span>
                </p>
                <p
                  className="text-xs"
                  style={{ color: remaining >= 0 ? "#10b981" : "#fb7185" }}
                >
                  {remaining >= 0
                    ? `还差 ${remaining} kcal`
                    : `超出 ${Math.abs(remaining)} kcal`}
                </p>
                <p className="text-xs text-slate-500">
                  蛋白质{" "}
                  <span className="text-sky-400 font-semibold">
                    {totalPro}g
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">勾选已吃的推荐餐</p>
            <div className="space-y-1.5">
              {recommendedMeals.map((meal, i) => (
                <button
                  key={i}
                  onClick={() => toggleMeal(meal)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                    isChecked(meal.name)
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-white/5 border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isChecked(meal.name)
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-600"
                      }`}
                    >
                      {isChecked(meal.name) && (
                        <span className="text-[9px] text-black font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-300">{meal.name}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold shrink-0">
                    {meal.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">手动添加其他食物</p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                placeholder="食物名称，如：米饭"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && estimateAndAdd()}
              />
              <input
                className="w-16 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                placeholder="克数"
                value={inputGrams}
                onChange={(e) => setInputGrams(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && estimateAndAdd()}
              />
              <button
                onClick={estimateAndAdd}
                disabled={isEstimating || !inputName.trim()}
                className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-40 shrink-0"
              >
                {isEstimating ? "..." : "AI估算"}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              AI 估算每100g热量，按克数换算。不填克数默认100g
            </p>
          </div>

          {logged.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">
                已记录 ({logged.length}项)
              </p>
              <div className="space-y-1">
                {logged.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${f.isRecommended ? "bg-emerald-400" : "bg-sky-400"}`}
                      />
                      <span className="text-xs text-slate-300">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        蛋白 {f.protein}g
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">
                        {f.calories} kcal
                      </span>
                      <button
                        onClick={() =>
                          setLogged((prev) => prev.filter((_, fi) => fi !== i))
                        }
                        className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Provider 设置 ─────────────────────────────────────────

const PROVIDER_OPTIONS = [
  {
    value: "deepseek" as const,
    label: "DeepSeek",
    emoji: "🌐",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    hint: "国内可用，便宜准确，推荐首选。",
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    value: "qwen" as const,
    label: "通义千问",
    emoji: "🔶",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    hint: "阿里云出品，国内网络流畅。",
    keyUrl: "https://dashscope.console.aliyun.com/apiKey",
  },
  {
    value: "openai" as const,
    label: "OpenAI",
    emoji: "⚡",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    hint: "GPT-4o，需要能访问 OpenAI 的网络。",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    value: "claude" as const,
    label: "Claude",
    emoji: "🤖",
    placeholder: "sk-ant-xxxxxxxxxxxxxxxx",
    hint: "Anthropic 出品，逻辑强，JSON稳定。",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    value: "gemini" as const,
    label: "Gemini",
    emoji: "✨",
    placeholder: "AIzaxxxxxxxxxxxxxxxx",
    hint: "Google 出品，免费额度较大。",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    value: "ollama" as const,
    label: "本地 Ollama",
    emoji: "🖥️",
    placeholder: "",
    hint: "本地运行，需先执行 ollama serve，无需 Key。",
    keyUrl: "",
  },
] as const;

function ProviderSettings({
  provider,
  apiKey,
  onProviderChange,
  onApiKeyChange,
}: {
  provider: string;
  apiKey: string;
  onProviderChange: (v: "ollama" | "deepseek" | "openai" | "claude" | "gemini" | "qwen") => void;
  onApiKeyChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const current = PROVIDER_OPTIONS.find((p) => p.value === provider) ?? PROVIDER_OPTIONS[0];

  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">⚙️ AI 模型设置</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
            {current.emoji} {current.label}
          </span>
        </div>
        <span className="text-slate-600 text-xs">
          {expanded ? "收起 ↑" : "展开 ↓"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
          {/* 五选一网格 */}
          <div className="grid grid-cols-3 gap-2">
            {PROVIDER_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => onProviderChange(p.value)}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  provider === p.value
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="text-lg mb-0.5">{p.emoji}</div>
                <div className="text-xs font-medium">{p.label}</div>
              </button>
            ))}
          </div>

          {/* Key 输入（Ollama不需要） */}
          {provider !== "ollama" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{current.label} API Key</Label>
                {current.keyUrl && (
                  <a
                    href={current.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-500 hover:text-emerald-400"
                  >
                    获取 Key →
                  </a>
                )}
              </div>
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                placeholder={current.placeholder}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
              />
              <p className="text-[10px] text-slate-600 mt-1">
                {current.hint} Key 仅存本地浏览器，不会上传。
              </p>
            </div>
          )}

          {provider === "ollama" && (
            <p className="text-xs text-slate-500">
              {current.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
